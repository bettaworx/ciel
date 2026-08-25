package service

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/db/sqlc"
	"backend/internal/logging"

	"github.com/google/uuid"
)

// deviceSignatureWindow is how far the client's clock may drift from ours
// before a signature is refused.
const deviceSignatureWindow = 60 * time.Second

// AccountSession is the result of presenting an account token.
//
// AccountToken and CookieRefresh are only filled for an activating exchange —
// and they are deliberately two different tokens: the cookie session rotates on
// its own schedule via /auth/refresh, and if it shared a row with the token the
// browser keeps, that background rotation would silently revoke the account.
type AccountSession struct {
	User             api.User
	AccessToken      string
	ExpiresInSeconds int
	AccountToken     string
	CookieRefresh    string
}

// IssueAccountToken mints a device-bound token for an already-authenticated
// user, so their browser can come back to this account without the password.
func (s *AuthService) IssueAccountToken(ctx context.Context, userID uuid.UUID, devicePublicKey []byte) (string, error) {
	if s.store == nil {
		return "", NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	raw, err := auth.RandomToken(32)
	if err != nil {
		return "", err
	}
	if _, err := s.store.Q.CreateAccountToken(ctx, sqlc.CreateAccountTokenParams{
		UserID:          userID,
		TokenHash:       auth.HashRefreshToken(raw),
		ExpiresAt:       time.Now().UTC().Add(refreshTokenTTL),
		DevicePublicKey: devicePublicKey,
	}); err != nil {
		return "", err
	}
	return raw, nil
}

// ExchangeAccountToken turns an account token into an access token for the
// account it belongs to, and — when activate is set — into a full session.
//
// Reads (the unread badge on the account list) do NOT rotate the token: several
// tabs can ask at once, and a rotation race there would revoke a perfectly good
// account. Only the deliberate, single act of switching rotates.
func (s *AuthService) ExchangeAccountToken(ctx context.Context, req api.SessionExchangeRequest, now time.Time) (AccountSession, error) {
	if s.store == nil {
		return AccountSession{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if req.Token == "" || req.Signature == "" || len(req.Nonce) < 16 {
		return AccountSession{}, errAccountToken()
	}
	if drift := now.Unix() - req.Timestamp; drift > int64(deviceSignatureWindow.Seconds()) || drift < -int64(deviceSignatureWindow.Seconds()) {
		return AccountSession{}, errAccountToken()
	}

	hash := auth.HashRefreshToken(req.Token)
	row, err := s.store.Q.FindAccountToken(ctx, hash)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return AccountSession{}, errAccountToken()
		}
		return AccountSession{}, err
	}

	// Signature first: everything below reveals or changes state, and none of it
	// should happen for a caller who cannot prove they hold the device key.
	payload := auth.DeviceSignaturePayload(req.Token, req.Timestamp, req.Nonce)
	if !auth.VerifyDeviceSignature(row.DevicePublicKey, req.Signature, payload) {
		return AccountSession{}, errAccountToken()
	}

	// A token that was already spent is presented either by an attacker who
	// copied it before the legitimate rotation, or by the legitimate client
	// after an attacker rotated it. There is no way to tell which, so the whole
	// user is cut back to a password login.
	if row.RevokedAt.Valid {
		logging.Audit(ctx, "auth.account_token.reuse", "failure",
			slog.String("actor_user_id", row.UserID.String()))
		if err := s.store.Q.RevokeAllUserRefreshTokens(ctx, row.UserID); err != nil {
			return AccountSession{}, err
		}
		return AccountSession{}, errAccountToken()
	}
	if !row.ExpiresAt.After(now) {
		return AccountSession{}, errAccountToken()
	}

	activate := req.Activate != nil && *req.Activate
	if activate {
		// Atomic consume: two concurrent switches must not both succeed.
		if _, err := s.store.Q.ConsumeAccountToken(ctx, hash); err != nil {
			return AccountSession{}, errAccountToken()
		}
	}

	userRow, err := s.store.Q.GetUserByID(ctx, row.UserID)
	if err != nil {
		return AccountSession{}, err
	}
	accessToken, expiresIn, err := s.tokens.Issue(auth.User{ID: row.UserID, Username: userRow.Username})
	if err != nil {
		return AccountSession{}, err
	}

	out := AccountSession{
		User: mapUserWithProfile(userRow.ID, userRow.Username, userRow.CreatedAt, userRow.DisplayName, userRow.Bio,
			userRow.AvatarMediaID, userRow.AvatarExt, userRow.BannerMediaID, userRow.BannerExt, userRow.BannerBlurhash,
			userRow.TermsVersion, userRow.PrivacyVersion, userRow.TermsAcceptedAt, userRow.PrivacyAcceptedAt, userRow.IsPrivate),
		AccessToken:      accessToken,
		ExpiresInSeconds: expiresIn,
	}
	if !activate {
		return out, nil
	}

	if out.AccountToken, err = s.IssueAccountToken(ctx, row.UserID, row.DevicePublicKey); err != nil {
		return AccountSession{}, err
	}
	if out.CookieRefresh, err = s.issueRefreshToken(ctx, row.UserID); err != nil {
		return AccountSession{}, err
	}
	return out, nil
}

// Every rejection is the same 401: which of the checks failed is not the
// caller's business.
func errAccountToken() error {
	return NewError(http.StatusUnauthorized, "unauthorized", "invalid account token")
}
