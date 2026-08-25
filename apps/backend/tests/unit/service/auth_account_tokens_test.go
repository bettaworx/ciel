package service_test

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"database/sql"
	"encoding/base64"
	"net/http"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

// deviceKey stands in for the browser's non-extractable key pair.
type deviceKey struct {
	priv *ecdsa.PrivateKey
	spki []byte
}

func newDeviceKey(t *testing.T) deviceKey {
	t.Helper()
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("GenerateKey: %v", err)
	}
	spki, err := x509.MarshalPKIXPublicKey(&priv.PublicKey)
	if err != nil {
		t.Fatalf("MarshalPKIXPublicKey: %v", err)
	}
	return deviceKey{priv: priv, spki: spki}
}

// sign mimics SubtleCrypto.sign("ECDSA"), which emits raw r|s rather than DER.
func (d deviceKey) sign(t *testing.T, payload string) string {
	t.Helper()
	sum := sha256.Sum256([]byte(payload))
	r, s, err := ecdsa.Sign(rand.Reader, d.priv, sum[:])
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	raw := make([]byte, 64)
	r.FillBytes(raw[:32])
	s.FillBytes(raw[32:])
	return base64.StdEncoding.EncodeToString(raw)
}

func accountTokenRequest(t *testing.T, d deviceKey, token string, signedAt time.Time, activate bool) api.SessionExchangeRequest {
	t.Helper()
	const nonce = "0123456789abcdef0123"
	req := api.SessionExchangeRequest{
		Token:     token,
		Timestamp: signedAt.Unix(),
		Nonce:     nonce,
		Signature: d.sign(t, auth.DeviceSignaturePayload(token, signedAt.Unix(), nonce)),
	}
	if activate {
		req.Activate = &activate
	}
	return req
}

func accountTokenRows(userID uuid.UUID, spki []byte, revoked bool, expiresAt time.Time) *sqlmock.Rows {
	revokedAt := sql.NullTime{}
	if revoked {
		revokedAt = sql.NullTime{Time: time.Now().UTC(), Valid: true}
	}
	return sqlmock.NewRows([]string{"id", "user_id", "token_hash", "created_at", "expires_at", "revoked_at", "device_public_key"}).
		AddRow(uuid.New(), userID, []byte("hash"), time.Now().UTC(), expiresAt, revokedAt, spki)
}

func accountTokenUserRows(userID uuid.UUID) *sqlmock.Rows {
	return sqlmock.NewRows([]string{"id", "username", "display_name", "bio", "avatar_media_id", "banner_media_id", "created_at", "terms_version", "privacy_version", "terms_accepted_at", "privacy_accepted_at", "is_private", "avatar_ext", "banner_ext", "banner_blurhash"}).
		AddRow(userID, "alice", "Alice", sql.NullString{}, uuid.NullUUID{}, uuid.NullUUID{}, time.Now().UTC(), int32(1), int32(1), sql.NullTime{}, sql.NullTime{}, false, sql.NullString{}, sql.NullString{}, sql.NullString{})
}

func newAuthServiceWithMock(t *testing.T) (*service.AuthService, sqlmock.Sqlmock) {
	t.Helper()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	return service.NewAuthService(repository.NewStore(db), auth.NewTokenManager([]byte("secret"), time.Hour)), mock
}

// A badge read must not rotate the token: several tabs ask at once.
func TestExchangeAccountToken_ReadDoesNotRotate(t *testing.T) {
	svc, mock := newAuthServiceWithMock(t)
	d := newDeviceKey(t)
	userID := uuid.New()
	now := time.Now().UTC()

	mock.ExpectQuery(`-- name: FindAccountToken`).
		WillReturnRows(accountTokenRows(userID, d.spki, false, now.Add(time.Hour)))
	mock.ExpectQuery(`-- name: GetUserByID`).WillReturnRows(accountTokenUserRows(userID))

	got, err := svc.ExchangeAccountToken(context.Background(), accountTokenRequest(t, d, "tok", now, false), now)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if got.AccessToken == "" {
		t.Fatalf("expected an access token")
	}
	if got.AccountToken != "" || got.CookieRefresh != "" {
		t.Fatalf("read must not mint replacements, got %+v", got)
	}
	if got.User.Username != "alice" {
		t.Fatalf("expected the token's owner, got %q", got.User.Username)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// Switching rotates the account token and mints a separate cookie refresh token,
// so a background /auth/refresh cannot revoke what the browser holds.
func TestExchangeAccountToken_ActivateRotatesAndIssuesCookieToken(t *testing.T) {
	svc, mock := newAuthServiceWithMock(t)
	d := newDeviceKey(t)
	userID := uuid.New()
	now := time.Now().UTC()

	mock.ExpectQuery(`-- name: FindAccountToken`).
		WillReturnRows(accountTokenRows(userID, d.spki, false, now.Add(time.Hour)))
	mock.ExpectQuery(`-- name: ConsumeAccountToken`).
		WillReturnRows(accountTokenRows(userID, d.spki, true, now.Add(time.Hour)))
	mock.ExpectQuery(`-- name: GetUserByID`).WillReturnRows(accountTokenUserRows(userID))
	mock.ExpectQuery(`-- name: CreateAccountToken`).
		WillReturnRows(accountTokenRows(userID, d.spki, false, now.Add(time.Hour)))
	mock.ExpectQuery(`-- name: CreateRefreshToken`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "token_hash", "created_at", "expires_at", "revoked_at"}).
			AddRow(uuid.New(), userID, []byte("hash"), now, now.Add(time.Hour), sql.NullTime{}))

	got, err := svc.ExchangeAccountToken(context.Background(), accountTokenRequest(t, d, "tok", now, true), now)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if got.AccountToken == "" || got.CookieRefresh == "" {
		t.Fatalf("expected both replacements, got %+v", got)
	}
	if got.AccountToken == got.CookieRefresh {
		t.Fatalf("the stored token and the cookie token must be different rows")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// The token is worthless without the device it was bound to.
func TestExchangeAccountToken_RejectsForeignSignature(t *testing.T) {
	svc, mock := newAuthServiceWithMock(t)
	bound := newDeviceKey(t)
	attacker := newDeviceKey(t)
	now := time.Now().UTC()

	mock.ExpectQuery(`-- name: FindAccountToken`).
		WillReturnRows(accountTokenRows(uuid.New(), bound.spki, false, now.Add(time.Hour)))

	_, err := svc.ExchangeAccountToken(context.Background(), accountTokenRequest(t, attacker, "tok", now, true), now)
	assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// A captured request cannot be replayed once its window has passed.
func TestExchangeAccountToken_RejectsStaleTimestamp(t *testing.T) {
	svc, _ := newAuthServiceWithMock(t)
	d := newDeviceKey(t)
	now := time.Now().UTC()

	// No query expectations: a stale request must never reach the database.
	req := accountTokenRequest(t, d, "tok", now.Add(-10*time.Minute), false)
	_, err := svc.ExchangeAccountToken(context.Background(), req, now)
	assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
}

// Presenting a spent token means someone copied it: cut the whole user back to
// a password login.
func TestExchangeAccountToken_ReuseRevokesEverything(t *testing.T) {
	svc, mock := newAuthServiceWithMock(t)
	d := newDeviceKey(t)
	userID := uuid.New()
	now := time.Now().UTC()

	mock.ExpectQuery(`-- name: FindAccountToken`).
		WillReturnRows(accountTokenRows(userID, d.spki, true, now.Add(time.Hour)))
	mock.ExpectExec(`-- name: RevokeAllUserRefreshTokens`).
		WithArgs(userID).
		WillReturnResult(sqlmock.NewResult(0, 2))

	_, err := svc.ExchangeAccountToken(context.Background(), accountTokenRequest(t, d, "tok", now, true), now)
	assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestExchangeAccountToken_RejectsExpired(t *testing.T) {
	svc, mock := newAuthServiceWithMock(t)
	d := newDeviceKey(t)
	now := time.Now().UTC()

	mock.ExpectQuery(`-- name: FindAccountToken`).
		WillReturnRows(accountTokenRows(uuid.New(), d.spki, false, now.Add(-time.Minute)))

	_, err := svc.ExchangeAccountToken(context.Background(), accountTokenRequest(t, d, "tok", now, false), now)
	assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
}

func TestParseDevicePublicKey(t *testing.T) {
	d := newDeviceKey(t)
	if _, err := auth.ParseDevicePublicKey(base64.StdEncoding.EncodeToString(d.spki)); err != nil {
		t.Fatalf("expected a P-256 SPKI to parse, got %v", err)
	}
	for name, input := range map[string]string{
		"not base64": "!!!",
		"empty":      "",
		"not a key":  base64.StdEncoding.EncodeToString([]byte("hello")),
	} {
		if _, err := auth.ParseDevicePublicKey(input); err == nil {
			t.Fatalf("expected %s to be rejected", name)
		}
	}
}
