package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/db/sqlc"
	"backend/internal/logging"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

const (
	mfaSessionTTL      = 5 * time.Minute
	totpSetupTTL       = 10 * time.Minute
	webauthnSessionTTL = 5 * time.Minute
	totpIssuerDefault  = "Ciel"
)

// SetMFA wires MFA-related dependencies onto AuthService.
func (s *AuthService) SetMFA(
	box *auth.SecretBox,
	mfaSessions auth.MfaSessionStore,
	totpSetup auth.TotpSetupStore,
	wa *webauthn.WebAuthn,
	waSessions auth.WebAuthnSessionStore,
	issuer string,
) {
	s.secretBox = box
	s.mfaSessions = mfaSessions
	s.totpSetup = totpSetup
	s.webauthn = wa
	s.webauthnSessions = waSessions
	if issuer == "" {
		issuer = totpIssuerDefault
	}
	s.totpIssuer = issuer
}

func (s *AuthService) ensureMFAReady() error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	return nil
}

func (s *AuthService) ensureSecretBox() error {
	if s.secretBox == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "TOTP encryption not configured")
	}
	return nil
}

// ListMFAMethods returns enabled second-factor methods for a user.
func (s *AuthService) ListMFAMethods(ctx context.Context, userID uuid.UUID) ([]api.MfaMethod, error) {
	row, err := s.store.Q.UserHasMfa(ctx, userID)
	if err != nil {
		return nil, err
	}
	var methods []api.MfaMethod
	if row.HasTotp {
		methods = append(methods, api.Totp)
	}
	if row.HasWebauthn {
		methods = append(methods, api.Webauthn)
	}
	if (row.HasTotp || row.HasWebauthn) && row.BackupCodesRemaining > 0 {
		methods = append(methods, api.BackupCode)
	}
	return methods, nil
}

func (s *AuthService) issueMfaSession(userID uuid.UUID, username string, purpose auth.MfaPurpose, methods []api.MfaMethod) (token string, expiresIn int, err error) {
	if s.mfaSessions == nil {
		return "", 0, NewError(http.StatusServiceUnavailable, "service_unavailable", "MFA sessions not configured")
	}
	token, err = auth.RandomToken(24)
	if err != nil {
		return "", 0, err
	}
	methodStrs := make([]string, len(methods))
	for i, m := range methods {
		methodStrs[i] = string(m)
	}
	expires := s.now().UTC().Add(mfaSessionTTL)
	if err := s.mfaSessions.Put(auth.MfaSession{
		Token:        token,
		UserID:       userID.String(),
		Username:     username,
		Purpose:      purpose,
		Methods:      methodStrs,
		ExpiresAtUTC: expires,
	}); err != nil {
		return "", 0, err
	}
	return token, int(mfaSessionTTL.Seconds()), nil
}

func (s *AuthService) GetMfaStatus(ctx context.Context, user auth.User) (api.MfaStatus, error) {
	if err := s.ensureMFAReady(); err != nil {
		return api.MfaStatus{}, err
	}
	if user.ID == uuid.Nil {
		return api.MfaStatus{}, NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}

	row, err := s.store.Q.UserHasMfa(ctx, user.ID)
	if err != nil {
		return api.MfaStatus{}, err
	}

	var enabledAt *time.Time
	if row.HasTotp {
		totp, err := s.store.Q.GetTotpByUserID(ctx, user.ID)
		if err == nil {
			t := totp.EnabledAt
			enabledAt = &t
		}
	}

	creds, err := s.listWebAuthnAPI(ctx, user.ID)
	if err != nil {
		return api.MfaStatus{}, err
	}

	return api.MfaStatus{
		TotpEnabled:           row.HasTotp,
		TotpEnabledAt:         enabledAt,
		WebauthnCredentials:   creds,
		BackupCodesRemaining:  int(row.BackupCodesRemaining),
	}, nil
}

func (s *AuthService) TotpSetup(ctx context.Context, user auth.User) (api.TotpSetupResponse, error) {
	if err := s.ensureMFAReady(); err != nil {
		return api.TotpSetupResponse{}, err
	}
	if err := s.ensureSecretBox(); err != nil {
		return api.TotpSetupResponse{}, err
	}
	if user.ID == uuid.Nil {
		return api.TotpSetupResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}
	if s.totpSetup == nil {
		return api.TotpSetupResponse{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "TOTP setup store not configured")
	}

	if _, err := s.store.Q.GetTotpByUserID(ctx, user.ID); err == nil {
		return api.TotpSetupResponse{}, NewError(http.StatusConflict, "totp_already_enabled", "TOTP already enabled")
	} else if err != sql.ErrNoRows {
		return api.TotpSetupResponse{}, err
	}

	secret, err := auth.GenerateTotpSecret()
	if err != nil {
		return api.TotpSetupResponse{}, err
	}
	expires := s.now().UTC().Add(totpSetupTTL)
	if err := s.totpSetup.Put(auth.TotpPendingSetup{
		UserID:       user.ID.String(),
		Secret:       secret,
		ExpiresAtUTC: expires,
	}); err != nil {
		return api.TotpSetupResponse{}, err
	}

	auditMFA(ctx, "auth.mfa.totp.setup", "success", user, "")
	return api.TotpSetupResponse{
		Secret:           secret,
		OtpauthUrl:       auth.BuildOtpauthURL(s.totpIssuer, user.Username, secret),
		ExpiresInSeconds: int(totpSetupTTL.Seconds()),
	}, nil
}

func (s *AuthService) TotpConfirm(ctx context.Context, user auth.User, req api.TotpConfirmRequest) (api.TotpConfirmResponse, error) {
	if err := s.ensureMFAReady(); err != nil {
		return api.TotpConfirmResponse{}, err
	}
	if err := s.ensureSecretBox(); err != nil {
		return api.TotpConfirmResponse{}, err
	}
	if user.ID == uuid.Nil {
		return api.TotpConfirmResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}
	if s.totpSetup == nil {
		return api.TotpConfirmResponse{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "TOTP setup store not configured")
	}

	pending, ok := s.totpSetup.Consume(user.ID.String())
	if !ok {
		auditMFA(ctx, "auth.mfa.totp.confirm", "failure", user, "no_pending")
		return api.TotpConfirmResponse{}, NewError(http.StatusBadRequest, "invalid_request", "no pending TOTP setup")
	}

	key, err := auth.DecodeTotpSecret(pending.Secret)
	if err != nil {
		return api.TotpConfirmResponse{}, NewError(http.StatusBadRequest, "invalid_request", "invalid pending secret")
	}
	step, ok := auth.ValidateTotp(key, req.Code, s.now())
	if !ok {
		// Re-store pending so the user can retry within TTL.
		_ = s.totpSetup.Put(pending)
		auditMFA(ctx, "auth.mfa.totp.confirm", "failure", user, "invalid_code")
		return api.TotpConfirmResponse{}, NewError(http.StatusBadRequest, "invalid_code", "invalid code")
	}

	enc, err := s.secretBox.Seal(key)
	if err != nil {
		return api.TotpConfirmResponse{}, err
	}

	// First factor? Generate backup codes.
	mfaRow, err := s.store.Q.UserHasMfa(ctx, user.ID)
	if err != nil {
		return api.TotpConfirmResponse{}, err
	}
	firstFactor := !mfaRow.HasTotp && !mfaRow.HasWebauthn

	var plainCodes []string
	err = s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if err := q.UpsertTotp(ctx, sqlc.UpsertTotpParams{
			UserID:    user.ID,
			SecretEnc: enc,
		}); err != nil {
			return err
		}
		// Record used step to prevent immediate replay.
		if _, err := q.UpdateTotpLastUsedStep(ctx, sqlc.UpdateTotpLastUsedStepParams{
			UserID:       user.ID,
			LastUsedStep: sql.NullInt64{Int64: step, Valid: true},
		}); err != nil {
			return err
		}
		if firstFactor {
			plain, hashes, err := auth.GenerateBackupCodes(auth.BackupCodeCount)
			if err != nil {
				return err
			}
			plainCodes = plain
			if err := q.DeleteBackupCodesByUserID(ctx, user.ID); err != nil {
				return err
			}
			for _, h := range hashes {
				if err := q.InsertBackupCode(ctx, sqlc.InsertBackupCodeParams{
					UserID:   user.ID,
					CodeHash: h,
				}); err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		auditMFA(ctx, "auth.mfa.totp.confirm", "failure", user, "internal")
		return api.TotpConfirmResponse{}, err
	}

	auditMFA(ctx, "auth.mfa.totp.confirm", "success", user, "")
	return api.TotpConfirmResponse{BackupCodes: plainCodes}, nil
}

func (s *AuthService) TotpDisable(ctx context.Context, user auth.User) error {
	if err := s.ensureMFAReady(); err != nil {
		return err
	}
	if user.ID == uuid.Nil {
		return NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}
	if _, err := s.store.Q.GetTotpByUserID(ctx, user.ID); err != nil {
		if err == sql.ErrNoRows {
			return NewError(http.StatusNotFound, "not_found", "TOTP not enabled")
		}
		return err
	}

	err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if err := q.DeleteTotpByUserID(ctx, user.ID); err != nil {
			return err
		}
		return s.cleanupBackupIfNoFactors(ctx, q, user.ID)
	})
	if err != nil {
		auditMFA(ctx, "auth.mfa.totp.disable", "failure", user, "internal")
		return err
	}
	auditMFA(ctx, "auth.mfa.totp.disable", "success", user, "")
	return nil
}

func (s *AuthService) cleanupBackupIfNoFactors(ctx context.Context, q *sqlc.Queries, userID uuid.UUID) error {
	n, err := q.CountWebAuthnCredentialsByUserID(ctx, userID)
	if err != nil {
		return err
	}
	if _, err := q.GetTotpByUserID(ctx, userID); err == nil {
		return nil // still has totp
	} else if err != sql.ErrNoRows {
		return err
	}
	if n == 0 {
		return q.DeleteBackupCodesByUserID(ctx, userID)
	}
	return nil
}

func (s *AuthService) DisableAllMFA(ctx context.Context, user auth.User) error {
	if err := s.ensureMFAReady(); err != nil {
		return err
	}
	if user.ID == uuid.Nil {
		return NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}
	err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if err := q.DeleteTotpByUserID(ctx, user.ID); err != nil {
			return err
		}
		if err := q.DeleteWebAuthnCredentialsByUserID(ctx, user.ID); err != nil {
			return err
		}
		return q.DeleteBackupCodesByUserID(ctx, user.ID)
	})
	if err != nil {
		auditMFA(ctx, "auth.mfa.disable", "failure", user, "internal")
		return err
	}
	auditMFA(ctx, "auth.mfa.disable", "success", user, "")
	return nil
}

func (s *AuthService) RegenerateBackupCodes(ctx context.Context, user auth.User) (api.BackupCodesRegenerateResponse, error) {
	if err := s.ensureMFAReady(); err != nil {
		return api.BackupCodesRegenerateResponse{}, err
	}
	if user.ID == uuid.Nil {
		return api.BackupCodesRegenerateResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}
	methods, err := s.ListMFAMethods(ctx, user.ID)
	if err != nil {
		return api.BackupCodesRegenerateResponse{}, err
	}
	hasFactor := false
	for _, m := range methods {
		if m == api.Totp || m == api.Webauthn {
			hasFactor = true
			break
		}
	}
	if !hasFactor {
		return api.BackupCodesRegenerateResponse{}, NewError(http.StatusBadRequest, "mfa_not_enabled", "enable a second factor first")
	}

	plain, hashes, err := auth.GenerateBackupCodes(auth.BackupCodeCount)
	if err != nil {
		return api.BackupCodesRegenerateResponse{}, err
	}
	err = s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if err := q.DeleteBackupCodesByUserID(ctx, user.ID); err != nil {
			return err
		}
		for _, h := range hashes {
			if err := q.InsertBackupCode(ctx, sqlc.InsertBackupCodeParams{
				UserID:   user.ID,
				CodeHash: h,
			}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		auditMFA(ctx, "auth.mfa.backup.regenerate", "failure", user, "internal")
		return api.BackupCodesRegenerateResponse{}, err
	}
	auditMFA(ctx, "auth.mfa.backup.regenerate", "success", user, "")
	return api.BackupCodesRegenerateResponse{BackupCodes: plain}, nil
}

// VerifyMfaCode completes login or step-up MFA using TOTP or backup code.
// For login purpose returns LoginAuthenticated + refresh token.
// For stepup purpose returns StepupAuthenticated (refresh empty).
func (s *AuthService) VerifyMfaCode(ctx context.Context, req api.MfaCodeVerifyRequest, expect auth.MfaPurpose) (
	login api.LoginAuthenticated,
	stepup api.StepupAuthenticated,
	refresh string,
	err error,
) {
	if err := s.ensureMFAReady(); err != nil {
		return login, stepup, "", err
	}
	if s.mfaSessions == nil {
		return login, stepup, "", NewError(http.StatusServiceUnavailable, "service_unavailable", "MFA sessions not configured")
	}
	if strings.TrimSpace(req.MfaToken) == "" || strings.TrimSpace(req.Code) == "" {
		return login, stepup, "", NewError(http.StatusBadRequest, "invalid_request", "mfaToken and code required")
	}

	// Peek first to validate purpose without consuming on wrong purpose.
	sess, ok := s.mfaSessions.Get(req.MfaToken)
	if !ok {
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid or expired mfa token")
	}
	if sess.Purpose != expect {
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid mfa token")
	}

	userID, err := uuid.Parse(sess.UserID)
	if err != nil {
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid mfa token")
	}

	methodHint := ""
	if req.Method != nil {
		methodHint = string(*req.Method)
	}

	verified, verifyErr := s.verifyCodeForUser(ctx, userID, req.Code, methodHint)
	if verifyErr != nil || !verified {
		auditMFA(ctx, "auth.mfa.verify", "failure", auth.User{ID: userID, Username: sess.Username}, "invalid_code")
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid code")
	}

	// Consume session only after successful verification.
	if _, ok := s.mfaSessions.Consume(req.MfaToken); !ok {
		// Race: another request consumed it.
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid or expired mfa token")
	}

	auditMFA(ctx, "auth.mfa.verify", "success", auth.User{ID: userID, Username: sess.Username}, "")

	if expect == auth.MfaPurposeStepup {
		token, expiresIn, err := s.tokens.IssueStepup(auth.User{ID: userID, Username: sess.Username})
		if err != nil {
			return login, stepup, "", err
		}
		stepup = api.StepupAuthenticated{
			Status:           api.StepupAuthenticatedStatusAuthenticated,
			StepupToken:      token,
			TokenType:        api.Stepup,
			ExpiresInSeconds: expiresIn,
		}
		return login, stepup, "", nil
	}

	return s.completeLogin(ctx, userID, sess.Username)
}

func (s *AuthService) verifyCodeForUser(ctx context.Context, userID uuid.UUID, code, methodHint string) (bool, error) {
	tryTotp := methodHint == "" || methodHint == string(api.Totp)
	tryBackup := methodHint == "" || methodHint == string(api.BackupCode)

	if tryTotp {
		ok, err := s.verifyTotpCode(ctx, userID, code)
		if err != nil {
			return false, err
		}
		if ok {
			return true, nil
		}
		if methodHint == string(api.Totp) {
			return false, nil
		}
	}
	if tryBackup {
		ok, err := s.consumeBackupCode(ctx, userID, code)
		if err != nil {
			return false, err
		}
		return ok, nil
	}
	return false, nil
}

func (s *AuthService) verifyTotpCode(ctx context.Context, userID uuid.UUID, code string) (bool, error) {
	if s.secretBox == nil {
		return false, NewError(http.StatusServiceUnavailable, "service_unavailable", "TOTP encryption not configured")
	}
	row, err := s.store.Q.GetTotpByUserID(ctx, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	key, err := s.secretBox.Open(row.SecretEnc)
	if err != nil {
		return false, NewError(http.StatusServiceUnavailable, "service_unavailable", "failed to decrypt TOTP secret")
	}
	step, ok := auth.ValidateTotp(key, code, s.now())
	if !ok {
		return false, nil
	}
	// Replay protection: only accept if step is strictly greater than last used.
	n, err := s.store.Q.UpdateTotpLastUsedStep(ctx, sqlc.UpdateTotpLastUsedStepParams{
		UserID:       userID,
		LastUsedStep: sql.NullInt64{Int64: step, Valid: true},
	})
	if err != nil {
		return false, err
	}
	if n == 0 {
		return false, nil // reused step
	}
	return true, nil
}

func (s *AuthService) consumeBackupCode(ctx context.Context, userID uuid.UUID, code string) (bool, error) {
	hash := auth.HashBackupCode(code)
	_, err := s.store.Q.ConsumeBackupCode(ctx, sqlc.ConsumeBackupCodeParams{
		UserID:   userID,
		CodeHash: hash,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (s *AuthService) completeLogin(ctx context.Context, userID uuid.UUID, username string) (api.LoginAuthenticated, api.StepupAuthenticated, string, error) {
	token, expiresIn, err := s.tokens.Issue(auth.User{ID: userID, Username: username})
	if err != nil {
		return api.LoginAuthenticated{}, api.StepupAuthenticated{}, "", err
	}
	rawRefresh, err := s.issueRefreshToken(ctx, userID)
	if err != nil {
		return api.LoginAuthenticated{}, api.StepupAuthenticated{}, "", err
	}
	row, err := s.store.Q.GetAuthByUserID(ctx, userID)
	if err != nil {
		return api.LoginAuthenticated{}, api.StepupAuthenticated{}, "", err
	}
	user := mapUserWithProfile(row.UserID, row.Username, row.CreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, row.BannerMediaID, row.BannerExt, row.BannerBlurhash, row.TermsVersion, row.PrivacyVersion, row.TermsAcceptedAt, row.PrivacyAcceptedAt, false)
	return api.LoginAuthenticated{
		Status:           api.LoginAuthenticatedStatusAuthenticated,
		AccessToken:      token,
		TokenType:        api.Bearer,
		ExpiresInSeconds: expiresIn,
		User:             user,
	}, api.StepupAuthenticated{}, rawRefresh, nil
}

// ResetUserMFA is the admin path: wipe all factors and revoke sessions.
func (s *AuthService) ResetUserMFA(ctx context.Context, actor auth.User, targetUserID uuid.UUID) error {
	if err := s.ensureMFAReady(); err != nil {
		return err
	}
	if _, err := s.store.Q.GetUserByID(ctx, targetUserID); err != nil {
		if err == sql.ErrNoRows {
			return NewError(http.StatusNotFound, "not_found", "user not found")
		}
		return err
	}
	err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if err := q.DeleteTotpByUserID(ctx, targetUserID); err != nil {
			return err
		}
		if err := q.DeleteWebAuthnCredentialsByUserID(ctx, targetUserID); err != nil {
			return err
		}
		return q.DeleteBackupCodesByUserID(ctx, targetUserID)
	})
	if err != nil {
		return err
	}
	if err := s.tokens.InvalidateUserTokens(ctx, targetUserID.String()); err != nil {
		slog.Warn("failed to invalidate tokens after MFA reset", "error", err, "user_id", targetUserID.String())
	}
	if err := s.store.Q.RevokeAllUserRefreshTokens(ctx, targetUserID); err != nil {
		slog.Warn("failed to revoke refresh tokens after MFA reset", "error", err, "user_id", targetUserID.String())
	}
	attrs := []slog.Attr{
		slog.String("actor_user_id", actor.ID.String()),
		slog.String("target_user_id", targetUserID.String()),
	}
	attrs = append(attrs, logging.RequestAttrs(ctx)...)
	logging.Audit(ctx, "admin.mfa.reset", "success", attrs...)
	return nil
}

func (s *AuthService) listWebAuthnAPI(ctx context.Context, userID uuid.UUID) ([]api.WebAuthnCredential, error) {
	rows, err := s.store.Q.ListWebAuthnCredentialsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]api.WebAuthnCredential, 0, len(rows))
	for _, r := range rows {
		out = append(out, mapWebAuthnCredential(r))
	}
	return out, nil
}

func mapWebAuthnCredential(r sqlc.AuthWebauthnCredential) api.WebAuthnCredential {
	var lastUsed *time.Time
	if r.LastUsedAt.Valid {
		t := r.LastUsedAt.Time
		lastUsed = &t
	}
	transports := make([]string, 0, len(r.Transports))
	for _, t := range r.Transports {
		transports = append(transports, t)
	}
	return api.WebAuthnCredential{
		Id:         openapi_types.UUID(r.ID),
		Name:       r.Name,
		CreatedAt:  r.CreatedAt,
		LastUsedAt: lastUsed,
		Transports: &transports,
	}
}

// --- WebAuthn registration / assertion ---

func (s *AuthService) webauthnUser(ctx context.Context, userID uuid.UUID, username string) (*auth.WebAuthnUser, error) {
	rows, err := s.store.Q.ListWebAuthnCredentialsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	creds := make([]webauthn.Credential, 0, len(rows))
	for _, r := range rows {
		var transports []protocol.AuthenticatorTransport
		for _, t := range r.Transports {
			transports = append(transports, protocol.AuthenticatorTransport(t))
		}
		var aaguid []byte
		if r.Aaguid != nil {
			aaguid = r.Aaguid
		}
		creds = append(creds, webauthn.Credential{
			ID:              r.CredentialID,
			PublicKey:       r.PublicKey,
			AttestationType: r.AttestationType,
			Transport:       transports,
			Flags: webauthn.CredentialFlags{
				BackupEligible: r.BackupEligible,
				BackupState:    r.BackupState,
			},
			Authenticator: webauthn.Authenticator{
				AAGUID:    aaguid,
				SignCount: uint32(r.SignCount),
			},
		})
	}
	return &auth.WebAuthnUser{
		ID:          userID,
		Name:        username,
		DisplayName: username,
		Credentials: creds,
	}, nil
}

func (s *AuthService) WebAuthnRegisterOptions(ctx context.Context, user auth.User) (api.WebAuthnRegisterOptionsResponse, error) {
	if err := s.ensureMFAReady(); err != nil {
		return api.WebAuthnRegisterOptionsResponse{}, err
	}
	if s.webauthn == nil || s.webauthnSessions == nil {
		return api.WebAuthnRegisterOptionsResponse{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "WebAuthn not configured")
	}
	if user.ID == uuid.Nil {
		return api.WebAuthnRegisterOptionsResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}

	waUser, err := s.webauthnUser(ctx, user.ID, user.Username)
	if err != nil {
		return api.WebAuthnRegisterOptionsResponse{}, err
	}
	creation, sessionData, err := s.webauthn.BeginRegistration(waUser)
	if err != nil {
		return api.WebAuthnRegisterOptionsResponse{}, NewError(http.StatusBadRequest, "invalid_request", "failed to begin registration")
	}
	sessionID, err := auth.RandomToken(18)
	if err != nil {
		return api.WebAuthnRegisterOptionsResponse{}, err
	}
	if err := s.webauthnSessions.Put(auth.WebAuthnSessionData{
		SessionID:    sessionID,
		UserID:       user.ID.String(),
		Purpose:      "register",
		SessionData:  *sessionData,
		ExpiresAtUTC: s.now().UTC().Add(webauthnSessionTTL),
	}); err != nil {
		return api.WebAuthnRegisterOptionsResponse{}, err
	}

	optsJSON, err := json.Marshal(creation)
	if err != nil {
		return api.WebAuthnRegisterOptionsResponse{}, err
	}
	var opts map[string]interface{}
	if err := json.Unmarshal(optsJSON, &opts); err != nil {
		return api.WebAuthnRegisterOptionsResponse{}, err
	}
	return api.WebAuthnRegisterOptionsResponse{
		SessionId: sessionID,
		Options:   opts,
	}, nil
}

func (s *AuthService) WebAuthnRegisterVerify(ctx context.Context, user auth.User, req api.WebAuthnRegisterVerifyRequest) (api.WebAuthnRegisterVerifyResponse, error) {
	if err := s.ensureMFAReady(); err != nil {
		return api.WebAuthnRegisterVerifyResponse{}, err
	}
	if s.webauthn == nil || s.webauthnSessions == nil {
		return api.WebAuthnRegisterVerifyResponse{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "WebAuthn not configured")
	}
	if user.ID == uuid.Nil {
		return api.WebAuthnRegisterVerifyResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}

	sess, ok := s.webauthnSessions.Consume(req.SessionId)
	if !ok || sess.Purpose != "register" || sess.UserID != user.ID.String() {
		return api.WebAuthnRegisterVerifyResponse{}, NewError(http.StatusBadRequest, "invalid_request", "invalid or expired registration session")
	}

	waUser, err := s.webauthnUser(ctx, user.ID, user.Username)
	if err != nil {
		return api.WebAuthnRegisterVerifyResponse{}, err
	}

	credJSON, err := json.Marshal(req.Credential)
	if err != nil {
		return api.WebAuthnRegisterVerifyResponse{}, NewError(http.StatusBadRequest, "invalid_request", "invalid credential")
	}
	parsed, err := protocol.ParseCredentialCreationResponseBytes(credJSON)
	if err != nil {
		return api.WebAuthnRegisterVerifyResponse{}, NewError(http.StatusBadRequest, "invalid_request", "invalid credential")
	}
	credential, err := s.webauthn.CreateCredential(waUser, sess.SessionData, parsed)
	if err != nil {
		auditMFA(ctx, "auth.webauthn.register", "failure", user, "invalid_attestation")
		return api.WebAuthnRegisterVerifyResponse{}, NewError(http.StatusBadRequest, "invalid_request", "invalid attestation")
	}

	mfaRow, err := s.store.Q.UserHasMfa(ctx, user.ID)
	if err != nil {
		return api.WebAuthnRegisterVerifyResponse{}, err
	}
	firstFactor := !mfaRow.HasTotp && !mfaRow.HasWebauthn

	transports := make([]string, 0, len(credential.Transport))
	for _, t := range credential.Transport {
		transports = append(transports, string(t))
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		name = "Passkey"
	}

	var plainCodes []string
	var stored sqlc.AuthWebauthnCredential
	err = s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		var aaguid []byte
		if len(credential.Authenticator.AAGUID) > 0 {
			aaguid = credential.Authenticator.AAGUID
		}
		row, err := q.InsertWebAuthnCredential(ctx, sqlc.InsertWebAuthnCredentialParams{
			UserID:          user.ID,
			CredentialID:    credential.ID,
			PublicKey:       credential.PublicKey,
			AttestationType: credential.AttestationType,
			Aaguid:          aaguid,
			SignCount:       int64(credential.Authenticator.SignCount),
			Transports:      transports,
			Name:            name,
			BackupEligible:  credential.Flags.BackupEligible,
			BackupState:     credential.Flags.BackupState,
		})
		if err != nil {
			return err
		}
		stored = row
		if firstFactor {
			plain, hashes, err := auth.GenerateBackupCodes(auth.BackupCodeCount)
			if err != nil {
				return err
			}
			plainCodes = plain
			if err := q.DeleteBackupCodesByUserID(ctx, user.ID); err != nil {
				return err
			}
			for _, h := range hashes {
				if err := q.InsertBackupCode(ctx, sqlc.InsertBackupCodeParams{
					UserID:   user.ID,
					CodeHash: h,
				}); err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		auditMFA(ctx, "auth.webauthn.register", "failure", user, "internal")
		return api.WebAuthnRegisterVerifyResponse{}, err
	}

	auditMFA(ctx, "auth.webauthn.register", "success", user, "")
	if plainCodes == nil {
		plainCodes = []string{}
	}
	return api.WebAuthnRegisterVerifyResponse{
		Credential:  mapWebAuthnCredential(stored),
		BackupCodes: plainCodes,
	}, nil
}

func (s *AuthService) ListWebAuthnCredentials(ctx context.Context, user auth.User) ([]api.WebAuthnCredential, error) {
	if err := s.ensureMFAReady(); err != nil {
		return nil, err
	}
	if user.ID == uuid.Nil {
		return nil, NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}
	return s.listWebAuthnAPI(ctx, user.ID)
}

func (s *AuthService) RenameWebAuthnCredential(ctx context.Context, user auth.User, credID uuid.UUID, name string) (api.WebAuthnCredential, error) {
	if err := s.ensureMFAReady(); err != nil {
		return api.WebAuthnCredential{}, err
	}
	if user.ID == uuid.Nil {
		return api.WebAuthnCredential{}, NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}
	name = strings.TrimSpace(name)
	if name == "" {
		return api.WebAuthnCredential{}, NewError(http.StatusBadRequest, "invalid_request", "name required")
	}
	row, err := s.store.Q.UpdateWebAuthnCredentialName(ctx, sqlc.UpdateWebAuthnCredentialNameParams{
		ID:     credID,
		Name:   name,
		UserID: user.ID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return api.WebAuthnCredential{}, NewError(http.StatusNotFound, "not_found", "credential not found")
		}
		return api.WebAuthnCredential{}, err
	}
	return mapWebAuthnCredential(row), nil
}

func (s *AuthService) DeleteWebAuthnCredential(ctx context.Context, user auth.User, credID uuid.UUID) error {
	if err := s.ensureMFAReady(); err != nil {
		return err
	}
	if user.ID == uuid.Nil {
		return NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}
	err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		n, err := q.DeleteWebAuthnCredential(ctx, sqlc.DeleteWebAuthnCredentialParams{
			ID:     credID,
			UserID: user.ID,
		})
		if err != nil {
			return err
		}
		if n == 0 {
			return NewError(http.StatusNotFound, "not_found", "credential not found")
		}
		return s.cleanupBackupIfNoFactors(ctx, q, user.ID)
	})
	if err != nil {
		return err
	}
	auditMFA(ctx, "auth.webauthn.delete", "success", user, "")
	return nil
}

func (s *AuthService) WebAuthnAssertionOptions(ctx context.Context, mfaToken string, expect auth.MfaPurpose) (api.WebAuthnAssertionOptionsResponse, error) {
	if err := s.ensureMFAReady(); err != nil {
		return api.WebAuthnAssertionOptionsResponse{}, err
	}
	if s.webauthn == nil || s.webauthnSessions == nil || s.mfaSessions == nil {
		return api.WebAuthnAssertionOptionsResponse{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "WebAuthn not configured")
	}
	sess, ok := s.mfaSessions.Get(mfaToken)
	if !ok || sess.Purpose != expect {
		return api.WebAuthnAssertionOptionsResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid or expired mfa token")
	}
	userID, err := uuid.Parse(sess.UserID)
	if err != nil {
		return api.WebAuthnAssertionOptionsResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid mfa token")
	}
	waUser, err := s.webauthnUser(ctx, userID, sess.Username)
	if err != nil {
		return api.WebAuthnAssertionOptionsResponse{}, err
	}
	if len(waUser.Credentials) == 0 {
		return api.WebAuthnAssertionOptionsResponse{}, NewError(http.StatusBadRequest, "invalid_request", "no webauthn credentials")
	}
	assertion, sessionData, err := s.webauthn.BeginLogin(waUser)
	if err != nil {
		return api.WebAuthnAssertionOptionsResponse{}, NewError(http.StatusBadRequest, "invalid_request", "failed to begin assertion")
	}
	// The MFA verify request carries only mfaToken + credential (no sessionId),
	// so the assertion ceremony is keyed by the mfaToken itself. Re-calling
	// options overwrites any previous in-flight ceremony for the same token.
	if err := s.webauthnSessions.Put(auth.WebAuthnSessionData{
		SessionID:    mfaToken,
		UserID:       userID.String(),
		Purpose:      "assert",
		MfaToken:     mfaToken,
		SessionData:  *sessionData,
		ExpiresAtUTC: s.now().UTC().Add(webauthnSessionTTL),
	}); err != nil {
		return api.WebAuthnAssertionOptionsResponse{}, err
	}
	optsJSON, err := json.Marshal(assertion)
	if err != nil {
		return api.WebAuthnAssertionOptionsResponse{}, err
	}
	var opts map[string]interface{}
	if err := json.Unmarshal(optsJSON, &opts); err != nil {
		return api.WebAuthnAssertionOptionsResponse{}, err
	}
	return api.WebAuthnAssertionOptionsResponse{
		SessionId: mfaToken,
		Options:   opts,
	}, nil
}

func (s *AuthService) WebAuthnAssertionVerify(ctx context.Context, mfaToken string, credential map[string]interface{}, expect auth.MfaPurpose) (
	login api.LoginAuthenticated,
	stepup api.StepupAuthenticated,
	refresh string,
	err error,
) {
	if err := s.ensureMFAReady(); err != nil {
		return login, stepup, "", err
	}
	if s.webauthn == nil || s.webauthnSessions == nil || s.mfaSessions == nil {
		return login, stepup, "", NewError(http.StatusServiceUnavailable, "service_unavailable", "WebAuthn not configured")
	}

	// Find matching webauthn session by scanning is awkward; client sends credential
	// but sessionId is inside options flow. We require credential only + mfaToken;
	// look up by consuming webauthn sessions is done via embedding session in...
	// Actually OpenAPI MfaWebAuthnVerifyRequest only has mfaToken + credential.
	// We store MfaToken on the webauthn session and the client must have called options first.
	// Problem: we don't get sessionId in verify request for MFA path.
	// Fix: put the latest assert session keyed also by mfaToken.
	// Simpler approach: require sessionId in credential path via reusing register verify shape.
	// Our OpenAPI has only mfaToken+credential. We'll look up by parsing and matching credential id.

	mfaSess, ok := s.mfaSessions.Get(mfaToken)
	if !ok || mfaSess.Purpose != expect {
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid or expired mfa token")
	}
	userID, err := uuid.Parse(mfaSess.UserID)
	if err != nil {
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid mfa token")
	}

	// The assertion ceremony was stored keyed by mfaToken (see AssertionOptions).
	waSess, ok := s.webauthnSessions.Consume(mfaToken)
	if !ok || waSess.Purpose != "assert" || waSess.UserID != userID.String() {
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid or expired assertion session")
	}

	waUser, err := s.webauthnUser(ctx, userID, mfaSess.Username)
	if err != nil {
		return login, stepup, "", err
	}
	credJSON, err := json.Marshal(credential)
	if err != nil {
		return login, stepup, "", NewError(http.StatusBadRequest, "invalid_request", "invalid credential")
	}
	parsed, err := protocol.ParseCredentialRequestResponseBytes(credJSON)
	if err != nil {
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid credential")
	}
	updated, err := s.webauthn.ValidateLogin(waUser, waSess.SessionData, parsed)
	if err != nil {
		auditMFA(ctx, "auth.webauthn.verify", "failure", auth.User{ID: userID, Username: mfaSess.Username}, "invalid_assertion")
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid credential")
	}

	// Update sign count
	dbCred, err := s.store.Q.GetWebAuthnCredentialByCredentialID(ctx, updated.ID)
	if err != nil {
		return login, stepup, "", err
	}
	if int64(updated.Authenticator.SignCount) > 0 && int64(updated.Authenticator.SignCount) < dbCred.SignCount {
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid credential")
	}
	if err := s.store.Q.UpdateWebAuthnCredentialSignCount(ctx, sqlc.UpdateWebAuthnCredentialSignCountParams{
		ID:          dbCred.ID,
		SignCount:   int64(updated.Authenticator.SignCount),
		BackupState: updated.Flags.BackupState,
	}); err != nil {
		return login, stepup, "", err
	}

	if _, ok := s.mfaSessions.Consume(mfaToken); !ok {
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid or expired mfa token")
	}

	auditMFA(ctx, "auth.webauthn.verify", "success", auth.User{ID: userID, Username: mfaSess.Username}, "")

	if expect == auth.MfaPurposeStepup {
		token, expiresIn, err := s.tokens.IssueStepup(auth.User{ID: userID, Username: mfaSess.Username})
		if err != nil {
			return login, stepup, "", err
		}
		stepup = api.StepupAuthenticated{
			Status:           api.StepupAuthenticatedStatusAuthenticated,
			StepupToken:      token,
			TokenType:        api.Stepup,
			ExpiresInSeconds: expiresIn,
		}
		return login, stepup, "", nil
	}
	return s.completeLogin(ctx, userID, mfaSess.Username)
}

// VerifyMfaCodeBoundUser is VerifyMfaCode for authenticated callers (step-up):
// it additionally asserts the mfaToken belongs to the calling user.
func (s *AuthService) VerifyMfaCodeBoundUser(ctx context.Context, req api.MfaCodeVerifyRequest, expect auth.MfaPurpose, userID uuid.UUID) (
	login api.LoginAuthenticated,
	stepup api.StepupAuthenticated,
	refresh string,
	err error,
) {
	if sess, ok := s.mfaSessions.Get(req.MfaToken); !ok || sess.UserID != userID.String() {
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid or expired mfa token")
	}
	return s.VerifyMfaCode(ctx, req, expect)
}

// WebAuthnAssertionOptionsBoundUser validates ownership of the mfaToken first.
func (s *AuthService) WebAuthnAssertionOptionsBoundUser(ctx context.Context, mfaToken string, expect auth.MfaPurpose, userID uuid.UUID) (api.WebAuthnAssertionOptionsResponse, error) {
	if sess, ok := s.mfaSessions.Get(mfaToken); !ok || sess.UserID != userID.String() {
		return api.WebAuthnAssertionOptionsResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid or expired mfa token")
	}
	return s.WebAuthnAssertionOptions(ctx, mfaToken, expect)
}

// WebAuthnAssertionVerifyBoundUser validates ownership of the mfaToken first.
func (s *AuthService) WebAuthnAssertionVerifyBoundUser(ctx context.Context, mfaToken string, credential map[string]interface{}, expect auth.MfaPurpose, userID uuid.UUID) (
	login api.LoginAuthenticated,
	stepup api.StepupAuthenticated,
	refresh string,
	err error,
) {
	if sess, ok := s.mfaSessions.Get(mfaToken); !ok || sess.UserID != userID.String() {
		return login, stepup, "", NewError(http.StatusUnauthorized, "unauthorized", "invalid or expired mfa token")
	}
	return s.WebAuthnAssertionVerify(ctx, mfaToken, credential, expect)
}

func auditMFA(ctx context.Context, event, outcome string, user auth.User, reason string) {
	attrs := make([]slog.Attr, 0, 4)
	if user.ID != uuid.Nil {
		attrs = append(attrs, slog.String("actor_user_id", user.ID.String()))
	}
	if reason != "" {
		attrs = append(attrs, slog.String("reason", reason))
	}
	attrs = append(attrs, logging.RequestAttrs(ctx)...)
	logging.Audit(ctx, event, outcome, attrs...)
}
