package service

import (
	"context"
	"database/sql"
	"encoding/base64"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/config"
	"backend/internal/db/sqlc"
	"backend/internal/logging"
	"backend/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

// InviteServiceInterface defines the interface for invite code validation
type InviteServiceInterface interface {
	ValidateInviteCode(ctx context.Context, code string) (sqlc.InviteCode, error)
	UseInviteCode(ctx context.Context, inviteCodeID, userID uuid.UUID) error
}

type AuthService struct {
	store          *repository.Store
	sessions       auth.LoginSessionStore
	stepupSessions auth.StepupSessionStore
	tokens         *auth.TokenManager
	loginTTL       time.Duration
	now            func() time.Time
	configMgr      *config.Manager
	inviteSvc      InviteServiceInterface
}

func NewAuthService(store *repository.Store, tokens *auth.TokenManager) *AuthService {
	return NewAuthServiceWithOptions(store, tokens, AuthServiceOptions{})
}

type AuthServiceOptions struct {
	// LoginTTL controls the validity window of login challenges.
	// If zero, defaults to 60 seconds.
	LoginTTL time.Duration

	// Now is used to compute ExpiresAtUTC for issued login sessions.
	// If nil, defaults to time.Now.
	Now func() time.Time

	// LoginSessionStore is the session store implementation.
	// If nil, defaults to in-memory store.
	LoginSessionStore auth.LoginSessionStore

	// StepupSessionStore is the stepup session store implementation.
	// If nil, defaults to in-memory store.
	StepupSessionStore auth.StepupSessionStore
}

func NewAuthServiceWithOptions(store *repository.Store, tokens *auth.TokenManager, opts AuthServiceOptions) *AuthService {
	ttl := opts.LoginTTL
	if ttl == 0 {
		ttl = 60 * time.Second
	}
	now := opts.Now
	if now == nil {
		now = time.Now
	}
	loginSessions := opts.LoginSessionStore
	if loginSessions == nil {
		loginSessions = auth.NewMemoryLoginSessionStore()
	}
	stepupSessions := opts.StepupSessionStore
	if stepupSessions == nil {
		stepupSessions = auth.NewMemoryStepupSessionStore()
	}
	return &AuthService{
		store:          store,
		sessions:       loginSessions,
		stepupSessions: stepupSessions,
		tokens:         tokens,
		loginTTL:       ttl,
		now:            now,
		configMgr:      nil, // Will be set later via SetConfigManager
	}
}

// SetConfigManager sets the configuration manager (used for invite code validation)
func (s *AuthService) SetConfigManager(configMgr *config.Manager) {
	s.configMgr = configMgr
}

// SetInviteService sets the invite service (used for database invite code validation)
func (s *AuthService) SetInviteService(inviteSvc InviteServiceInterface) {
	s.inviteSvc = inviteSvc
}

// validateRegistrationInput validates username and password from registration request
func validateRegistrationInput(req api.RegisterRequest) (string, error) {
	username := strings.TrimSpace(string(req.Username))
	if err := auth.ValidateUsername(username); err != nil {
		return "", NewError(http.StatusBadRequest, "invalid_request", err.Error())
	}
	if err := auth.ValidatePassword(req.Password); err != nil {
		return "", NewError(http.StatusBadRequest, "invalid_request", err.Error())
	}
	return username, nil
}

// inviteCodeValidation holds the result of invite code configuration validation
type inviteCodeValidation struct {
	needsInviteCode    bool
	useDatabaseInvites bool
}

// validateInviteCodeConfig performs early validation of invite codes
func (s *AuthService) validateInviteCodeConfig(req api.RegisterRequest) (inviteCodeValidation, error) {
	var result inviteCodeValidation

	if s.configMgr != nil {
		cfg := s.configMgr.Get()
		result.needsInviteCode = cfg.Auth.InviteOnly
		result.useDatabaseInvites = s.inviteSvc != nil
	}

	if result.needsInviteCode {
		if req.InviteCode == nil || *req.InviteCode == "" {
			return result, NewError(http.StatusForbidden, "invite_required", "invite code required")
		}
		// Database-based invites are validated during transaction
		// If database invites are not configured, this is a server misconfiguration
		if !result.useDatabaseInvites {
			return result, NewError(http.StatusServiceUnavailable, "invite_system_unavailable", "invite code system not configured")
		}
	}

	return result, nil
}

// checkServerSettings validates that signup is enabled and agreement versions match
func (s *AuthService) checkServerSettings(ctx context.Context, req api.RegisterRequest) (sqlc.ServerSetting, error) {
	if err := s.store.Q.EnsureServerSettings(ctx); err != nil {
		return sqlc.ServerSetting{}, err
	}
	settings, err := s.store.Q.GetServerSettings(ctx)
	if err != nil {
		if err == sql.ErrNoRows {
			return sqlc.ServerSetting{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "server settings missing")
		}
		return sqlc.ServerSetting{}, err
	}

	// Validate agreement versions match current server versions
	if req.PrivacyVersion != int(settings.PrivacyVersion) {
		return sqlc.ServerSetting{}, NewError(http.StatusBadRequest, "invalid_request", "privacy version mismatch")
	}

	return settings, nil
}

// scramCredentials holds SCRAM-SHA-256 credential components
type scramCredentials struct {
	salt       []byte
	iterations int
	storedKey  []byte
	serverKey  []byte
}

// generateSCRAMCredentials creates salt and SCRAM verifier for password storage
func generateSCRAMCredentials(password string) (scramCredentials, error) {
	salt, err := auth.RandomBytes(16)
	if err != nil {
		return scramCredentials{}, err
	}
	iterations := auth.DefaultIterations
	storedKey, serverKey := auth.DeriveVerifier(password, salt, iterations)

	return scramCredentials{
		salt:       salt,
		iterations: iterations,
		storedKey:  storedKey,
		serverKey:  serverKey,
	}, nil
}

// createUserTransaction handles the database transaction for user creation
func (s *AuthService) createUserTransaction(
	ctx context.Context,
	username string,
	req api.RegisterRequest,
	creds scramCredentials,
	inviteValidation inviteCodeValidation,
) (sqlc.User, error) {
	var created sqlc.User
	var inviteCodeID uuid.UUID

	err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		// CRITICAL FIX: Validate and lock invite code within transaction to prevent TOCTOU race condition
		if inviteValidation.needsInviteCode && inviteValidation.useDatabaseInvites && req.InviteCode != nil {
			// Lock the invite code row for this transaction
			inviteCode, err := q.GetInviteCodeByCodeForUpdate(ctx, *req.InviteCode)
			if err != nil {
				if err == sql.ErrNoRows {
					return NewError(http.StatusForbidden, "invite_invalid", "invalid invite code")
				}
				return err
			}

			// Check expiration
			if inviteCode.ExpiresAt.Valid && inviteCode.ExpiresAt.Time.Before(s.now()) {
				return NewError(http.StatusForbidden, "invite_expired", "invite code has expired")
			}

			// Check usage limit
			if inviteCode.MaxUses.Valid && inviteCode.UseCount >= inviteCode.MaxUses.Int32 {
				return NewError(http.StatusForbidden, "invite_exhausted", "invite code has reached maximum uses")
			}

			// Save the invite code ID for later use (prevents TOCTOU)
			inviteCodeID = inviteCode.ID
		}

		// Initialize roles and permissions
		if err := q.EnsureRoles(ctx); err != nil {
			return err
		}
		if err := q.EnsurePermissions(ctx); err != nil {
			return err
		}
		if err := q.EnsureRolePermissions(ctx); err != nil {
			return err
		}

		// Create user with agreement acceptance
		now := s.now()
		u, err := q.CreateUser(ctx, sqlc.CreateUserParams{
			Username:          username,
			TermsVersion:      int32(req.TermsVersion),
			PrivacyVersion:    int32(req.PrivacyVersion),
			TermsAcceptedAt:   sql.NullTime{Time: now, Valid: true},
			PrivacyAcceptedAt: sql.NullTime{Time: now, Valid: true},
		})
		if err != nil {
			return err
		}
		created = u

		// Create auth credentials
		if err := q.CreateAuthCredential(ctx, sqlc.CreateAuthCredentialParams{
			UserID:     u.ID,
			Salt:       creds.salt,
			Iterations: int32(creds.iterations),
			StoredKey:  creds.storedKey,
			ServerKey:  creds.serverKey,
		}); err != nil {
			return err
		}

		// Add user role
		if err := q.AddUserRole(ctx, sqlc.AddUserRoleParams{UserID: u.ID, RoleID: "user"}); err != nil {
			return err
		}

		// Record invite code usage within the same transaction
		if inviteCodeID != uuid.Nil {
			_, err = q.RecordInviteCodeUse(ctx, sqlc.RecordInviteCodeUseParams{
				InviteCodeID: inviteCodeID,
				UserID:       u.ID,
			})
			if err != nil {
				return err
			}

			if err := q.UpdateInviteCodeUsage(ctx, inviteCodeID); err != nil {
				return err
			}
		}

		return nil
	})

	return created, err
}

func (s *AuthService) Register(ctx context.Context, req api.RegisterRequest) (api.User, error) {
	if s.store == nil {
		return api.User{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	// Step 1: Validate input (username, password)
	username, err := validateRegistrationInput(req)
	if err != nil {
		return api.User{}, err
	}

	// Step 2: Validate invite code (config-based early validation)
	inviteValidation, err := s.validateInviteCodeConfig(req)
	if err != nil {
		return api.User{}, err
	}

	// Step 3: Check server settings (signup enabled, agreement versions)
	_, err = s.checkServerSettings(ctx, req)
	if err != nil {
		return api.User{}, err
	}

	// Step 4: Generate SCRAM credentials
	creds, err := generateSCRAMCredentials(req.Password)
	if err != nil {
		return api.User{}, err
	}

	// Step 5: Create user in database transaction
	created, err := s.createUserTransaction(ctx, username, req, creds, inviteValidation)
	if err != nil {
		var pgErr *pgconn.PgError
		if errorsAs(err, &pgErr) && pgErr.Code == "23505" {
			return api.User{}, NewError(http.StatusConflict, "username_taken", "username already exists")
		}
		return api.User{}, err
	}

	return mapUserWithProfile(created.ID, created.Username, created.CreatedAt, created.DisplayName, created.Bio, created.AvatarMediaID, sql.NullString{}, created.TermsVersion, created.PrivacyVersion, created.TermsAcceptedAt, created.PrivacyAcceptedAt), nil
}

func (s *AuthService) LoginStart(ctx context.Context, req api.LoginStartRequest) (api.LoginStartResponse, error) {
	if s.store == nil {
		return api.LoginStartResponse{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	username := strings.TrimSpace(string(req.Username))
	if username == "" || strings.TrimSpace(req.ClientNonce) == "" {
		return api.LoginStartResponse{}, NewError(http.StatusBadRequest, "invalid_request", "username and clientNonce required")
	}

	row, err := s.store.Q.GetAuthByUsername(ctx, username)
	if err != nil {
		if err == sql.ErrNoRows {
			return api.LoginStartResponse{}, NewError(http.StatusNotFound, "not_found", "user not found")
		}
		return api.LoginStartResponse{}, err
	}

	sessionID, err := auth.RandomToken(18)
	if err != nil {
		return api.LoginStartResponse{}, err
	}
	serverNonce, err := auth.RandomToken(18)
	if err != nil {
		return api.LoginStartResponse{}, err
	}
	expiresAt := s.now().UTC().Add(s.loginTTL)
	iterations := int(row.Iterations)
	saltB64 := base64.StdEncoding.EncodeToString(row.Salt)

	s.sessions.Put(auth.LoginSession{
		SessionID:    sessionID,
		Username:     username,
		ClientNonce:  req.ClientNonce,
		ServerNonce:  serverNonce,
		SaltB64:      saltB64,
		Iterations:   iterations,
		ExpiresAtUTC: expiresAt,
	})

	return api.LoginStartResponse{
		LoginSessionId:   sessionID,
		Salt:             saltB64,
		Iterations:       iterations,
		ServerNonce:      serverNonce,
		ExpiresInSeconds: int(s.loginTTL.Seconds()),
	}, nil
}

func (s *AuthService) LoginFinish(ctx context.Context, req api.LoginFinishRequest) (api.LoginFinishResponse, error) {
	if s.store == nil {
		return api.LoginFinishResponse{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if strings.TrimSpace(req.LoginSessionId) == "" || strings.TrimSpace(req.ClientFinalNonce) == "" || strings.TrimSpace(req.ClientProof) == "" {
		return api.LoginFinishResponse{}, NewError(http.StatusBadRequest, "invalid_request", "missing fields")
	}

	sess, ok := s.sessions.Get(req.LoginSessionId)
	// One-time use: delete regardless of outcome.
	s.sessions.Delete(req.LoginSessionId)
	if !ok {
		return api.LoginFinishResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid or expired login session")
	}

	expectedFinalNonce := sess.ClientNonce + sess.ServerNonce
	if req.ClientFinalNonce != expectedFinalNonce {
		return api.LoginFinishResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid nonce")
	}

	row, err := s.store.Q.GetAuthByUsername(ctx, sess.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			return api.LoginFinishResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid credentials")
		}
		return api.LoginFinishResponse{}, err
	}

	authMessage := auth.BuildAuthMessage(sess.Username, sess.ClientNonce, sess.ServerNonce, sess.SaltB64, sess.Iterations, req.ClientFinalNonce)
	okProof, err := auth.VerifyClientProof(row.StoredKey, authMessage, req.ClientProof)
	if err != nil || !okProof {
		return api.LoginFinishResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid proof")
	}

	token, expiresIn, err := s.tokens.Issue(auth.User{ID: row.UserID, Username: row.Username})
	if err != nil {
		return api.LoginFinishResponse{}, err
	}

	return api.LoginFinishResponse{
		AccessToken:      token,
		TokenType:        api.LoginFinishResponseTokenType("Bearer"),
		ExpiresInSeconds: expiresIn,
		User:             mapUserWithProfile(row.UserID, row.Username, row.CreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, row.TermsVersion, row.PrivacyVersion, row.TermsAcceptedAt, row.PrivacyAcceptedAt),
	}, nil
}

func (s *AuthService) StepUpStart(ctx context.Context, user auth.User, req api.StepupStartRequest) (api.StepupStartResponse, error) {
	if s.store == nil {
		auditStepup(ctx, "auth.stepup.start", "failure", user, "service_unavailable")
		return api.StepupStartResponse{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if user.ID == uuid.Nil {
		auditStepup(ctx, "auth.stepup.start", "failure", user, "unauthorized")
		return api.StepupStartResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}
	if strings.TrimSpace(req.ClientNonce) == "" {
		auditStepup(ctx, "auth.stepup.start", "failure", user, "invalid_request")
		return api.StepupStartResponse{}, NewError(http.StatusBadRequest, "invalid_request", "clientNonce required")
	}

	row, err := s.store.Q.GetAuthByUserID(ctx, user.ID)
	if err != nil {
		if err == sql.ErrNoRows {
			auditStepup(ctx, "auth.stepup.start", "failure", user, "unauthorized")
			return api.StepupStartResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid credentials")
		}
		auditStepup(ctx, "auth.stepup.start", "failure", user, "internal")
		return api.StepupStartResponse{}, err
	}

	sessionID, err := auth.RandomToken(18)
	if err != nil {
		return api.StepupStartResponse{}, err
	}
	serverNonce, err := auth.RandomToken(18)
	if err != nil {
		return api.StepupStartResponse{}, err
	}
	expiresAt := s.now().UTC().Add(s.loginTTL)
	iterations := int(row.Iterations)
	saltB64 := base64.StdEncoding.EncodeToString(row.Salt)

	s.stepupSessions.Put(auth.StepupSession{
		SessionID:    sessionID,
		UserID:       user.ID.String(),
		Username:     row.Username,
		ClientNonce:  req.ClientNonce,
		ServerNonce:  serverNonce,
		SaltB64:      saltB64,
		Iterations:   iterations,
		ExpiresAtUTC: expiresAt,
	})

	resp := api.StepupStartResponse{
		StepupSessionId:  sessionID,
		Salt:             saltB64,
		Iterations:       iterations,
		ServerNonce:      serverNonce,
		ExpiresInSeconds: int(s.loginTTL.Seconds()),
	}
	auditStepup(ctx, "auth.stepup.start", "success", user, "")
	return resp, nil
}

func (s *AuthService) StepUpFinish(ctx context.Context, user auth.User, req api.StepupFinishRequest) (api.StepupFinishResponse, error) {
	if s.store == nil {
		auditStepup(ctx, "auth.stepup.finish", "failure", user, "service_unavailable")
		return api.StepupFinishResponse{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if user.ID == uuid.Nil {
		auditStepup(ctx, "auth.stepup.finish", "failure", user, "unauthorized")
		return api.StepupFinishResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}
	if strings.TrimSpace(req.StepupSessionId) == "" || strings.TrimSpace(req.ClientFinalNonce) == "" || strings.TrimSpace(req.ClientProof) == "" {
		auditStepup(ctx, "auth.stepup.finish", "failure", user, "invalid_request")
		return api.StepupFinishResponse{}, NewError(http.StatusBadRequest, "invalid_request", "missing fields")
	}

	sess, ok := s.stepupSessions.Get(req.StepupSessionId)
	// One-time use: delete regardless of outcome.
	s.stepupSessions.Delete(req.StepupSessionId)
	if !ok {
		auditStepup(ctx, "auth.stepup.finish", "failure", user, "invalid_session")
		return api.StepupFinishResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid or expired stepup session")
	}
	if sess.UserID != user.ID.String() {
		auditStepup(ctx, "auth.stepup.finish", "failure", user, "session_mismatch")
		return api.StepupFinishResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid stepup session")
	}

	expectedFinalNonce := sess.ClientNonce + sess.ServerNonce
	if req.ClientFinalNonce != expectedFinalNonce {
		auditStepup(ctx, "auth.stepup.finish", "failure", user, "invalid_nonce")
		return api.StepupFinishResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid nonce")
	}

	row, err := s.store.Q.GetAuthByUserID(ctx, user.ID)
	if err != nil {
		if err == sql.ErrNoRows {
			auditStepup(ctx, "auth.stepup.finish", "failure", user, "unauthorized")
			return api.StepupFinishResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid credentials")
		}
		auditStepup(ctx, "auth.stepup.finish", "failure", user, "internal")
		return api.StepupFinishResponse{}, err
	}

	authMessage := auth.BuildAuthMessage(sess.Username, sess.ClientNonce, sess.ServerNonce, sess.SaltB64, sess.Iterations, req.ClientFinalNonce)
	okProof, err := auth.VerifyClientProof(row.StoredKey, authMessage, req.ClientProof)
	if err != nil || !okProof {
		auditStepup(ctx, "auth.stepup.finish", "failure", user, "invalid_proof")
		return api.StepupFinishResponse{}, NewError(http.StatusUnauthorized, "unauthorized", "invalid proof")
	}

	token, expiresIn, err := s.tokens.IssueStepup(auth.User{ID: row.UserID, Username: row.Username})
	if err != nil {
		auditStepup(ctx, "auth.stepup.finish", "failure", user, "internal")
		return api.StepupFinishResponse{}, err
	}

	resp := api.StepupFinishResponse{
		StepupToken:      token,
		TokenType:        api.StepupFinishResponseTokenType("Stepup"),
		ExpiresInSeconds: expiresIn,
	}
	auditStepup(ctx, "auth.stepup.finish", "success", user, "")
	return resp, nil
}

func (s *AuthService) ChangePassword(ctx context.Context, user auth.User, req api.PasswordChangeRequest) error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if user.ID == uuid.Nil {
		return NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}
	if err := auth.ValidatePassword(req.NewPassword); err != nil {
		return NewError(http.StatusBadRequest, "invalid_request", err.Error())
	}

	salt, err := auth.RandomBytes(16)
	if err != nil {
		return err
	}
	iterations := auth.DefaultIterations
	storedKey, serverKey := auth.DeriveVerifier(req.NewPassword, salt, iterations)

	err = s.store.Q.UpdateAuthCredential(ctx, sqlc.UpdateAuthCredentialParams{
		UserID:     user.ID,
		Salt:       salt,
		Iterations: int32(iterations),
		StoredKey:  storedKey,
		ServerKey:  serverKey,
	})
	if err != nil {
		return err
	}

	// Invalidate all existing tokens for this user
	if err := s.tokens.InvalidateUserTokens(ctx, user.ID.String()); err != nil {
		slog.Warn("failed to invalidate user tokens after password change", "error", err, "user_id", user.ID.String())
		// Don't fail the password change if token invalidation fails
	}

	return nil
}

func (s *AuthService) DeleteAccount(ctx context.Context, user auth.User) error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if user.ID == uuid.Nil {
		return NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}

	// Invalidate all existing tokens before deleting the account
	if err := s.tokens.InvalidateUserTokens(ctx, user.ID.String()); err != nil {
		slog.Warn("failed to invalidate user tokens before account deletion", "error", err, "user_id", user.ID.String())
		// Continue with account deletion even if token invalidation fails
	}

	return s.store.Q.DeleteUserByID(ctx, user.ID)
}

func auditStepup(ctx context.Context, event, outcome string, user auth.User, reason string) {
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

// errorsAs is a tiny wrapper to avoid importing errors in every file; keeps style consistent.
func errorsAs(err error, target interface{}) bool {
	// inline import pattern avoided; implemented in util.go
	return errorsAsImpl(err, target)
}
