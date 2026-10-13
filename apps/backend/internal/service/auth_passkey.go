package service

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/db/sqlc"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
)

func (s *AuthService) SetPasskeyLogin(ctx context.Context, user auth.User, enabled bool) error {
	if user.ID == uuid.Nil {
		return NewError(http.StatusUnauthorized, "unauthorized", "unauthorized")
	}
	if err := s.ensureMFAReady(); err != nil {
		return err
	}
	err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if _, err := q.LockPasskeyLoginUser(ctx, user.ID); err != nil {
			return err
		}
		if !enabled {
			return q.DisablePasskeyLogin(ctx, user.ID)
		}
		n, err := q.EnablePasskeyLogin(ctx, user.ID)
		if err != nil {
			return err
		}
		if n == 0 {
			return NewError(http.StatusBadRequest, "passkey_required", "a registered passkey is required")
		}
		return nil
	})
	if err == nil {
		auditMFA(ctx, "auth.passkey.preference", "success", user, "")
	}
	return err
}

func (s *AuthService) PasskeyLoginOptions() (api.WebAuthnAssertionOptionsResponse, error) {
	if s.webauthn == nil || s.webauthnSessions == nil {
		return api.WebAuthnAssertionOptionsResponse{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "WebAuthn not configured")
	}
	assertion, session, err := s.webauthn.BeginDiscoverableLogin(webauthn.WithUserVerification(protocol.VerificationRequired))
	if err != nil {
		return api.WebAuthnAssertionOptionsResponse{}, err
	}
	id, err := auth.RandomToken(24)
	if err != nil {
		return api.WebAuthnAssertionOptionsResponse{}, err
	}
	if err = s.webauthnSessions.Put(auth.WebAuthnSessionData{
		SessionID: id, Purpose: "passkey_login", SessionData: *session,
		ExpiresAtUTC: s.now().UTC().Add(webauthnSessionTTL),
	}); err != nil {
		return api.WebAuthnAssertionOptionsResponse{}, err
	}
	data, err := json.Marshal(assertion)
	if err != nil {
		return api.WebAuthnAssertionOptionsResponse{}, err
	}
	var options map[string]interface{}
	if err = json.Unmarshal(data, &options); err != nil {
		return api.WebAuthnAssertionOptionsResponse{}, err
	}
	return api.WebAuthnAssertionOptionsResponse{SessionId: id, Options: options}, nil
}

func (s *AuthService) PasskeyLoginVerify(ctx context.Context, req api.PasskeyLoginVerifyRequest) (api.LoginAuthenticated, string, error) {
	failed := func() (api.LoginAuthenticated, string, error) {
		return api.LoginAuthenticated{}, "", NewError(http.StatusUnauthorized, "unauthorized", "passkey login failed")
	}
	if s.webauthn == nil || s.webauthnSessions == nil || s.store == nil {
		return failed()
	}
	session, ok := s.webauthnSessions.Consume(req.SessionId)
	if !ok || session.Purpose != "passkey_login" {
		return failed()
	}
	data, err := json.Marshal(req.Credential)
	if err != nil {
		return failed()
	}
	parsed, err := protocol.ParseCredentialRequestResponseBytes(data)
	if err != nil {
		return failed()
	}

	var stored sqlc.AuthWebauthnCredential
	// Resolve ownership without reading the private preference. An invalid signature
	// must follow the same path regardless of whether the owner opted in.
	_, updated, err := s.webauthn.ValidatePasskeyLogin(func(rawID, handle []byte) (webauthn.User, error) {
		var lookupErr error
		stored, lookupErr = s.store.Q.GetWebAuthnCredentialByCredentialID(ctx, rawID)
		if lookupErr != nil {
			return nil, lookupErr
		}
		if !bytes.Equal(stored.UserID[:], handle) {
			return nil, NewError(http.StatusUnauthorized, "unauthorized", "invalid credential")
		}
		return s.webauthnUser(ctx, stored.UserID, "")
	}, session.SessionData, parsed)
	if err != nil || updated.Authenticator.CloneWarning {
		return failed()
	}

	var username string
	err = s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		var err error
		if username, err = q.LockPasskeyLoginUser(ctx, stored.UserID); err != nil {
			return err
		}
		enabled, err := q.PasskeyLoginEnabled(ctx, stored.UserID)
		if err != nil {
			return err
		}
		if !enabled {
			return NewError(http.StatusUnauthorized, "unauthorized", "passkey login failed")
		}
		n, err := q.AdvancePasskeyLoginCredential(ctx, sqlc.AdvancePasskeyLoginCredentialParams{
			ID: stored.ID, NewSignCount: int64(updated.Authenticator.SignCount),
			BackupState: updated.Flags.BackupState, PreviousSignCount: stored.SignCount,
		})
		if err != nil {
			return err
		}
		if n != 1 {
			return NewError(http.StatusUnauthorized, "unauthorized", "passkey login failed")
		}
		return nil
	})
	if err != nil {
		return failed()
	}
	login, _, refresh, err := s.completeLogin(ctx, stored.UserID, username)
	if err != nil {
		return api.LoginAuthenticated{}, "", err
	}
	auditMFA(ctx, "auth.passkey.login", "success", auth.User{ID: stored.UserID, Username: username}, "")
	return login, refresh, nil
}
