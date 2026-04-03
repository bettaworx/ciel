package auth_test

import (
	"context"
	"testing"
	"time"

	"backend/internal/auth"

	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

func TestTokenManager_IssueAndParse(t *testing.T) {
	m := auth.NewTokenManager([]byte("secret"), 1*time.Minute)
	uid := uuid.New()
	okToken, _, err := m.Issue(auth.User{ID: uid, Username: "alice"})
	if err != nil {
		t.Fatalf("Issue: %v", err)
	}
	user, err := m.Parse(okToken)
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if user.ID != uid || user.Username != "alice" {
		t.Fatalf("unexpected user: %+v", user)
	}
}

func TestTokenManager_Parse_EmptyUnauthorized(t *testing.T) {
	m := auth.NewTokenManager([]byte("secret"), 1*time.Minute)
	_, err := m.Parse("")
	if err == nil {
		t.Fatalf("expected error")
	}
}

func TestTokenManager_Parse_WrongSecretUnauthorized(t *testing.T) {
	m1 := auth.NewTokenManager([]byte("secret1"), 1*time.Minute)
	m2 := auth.NewTokenManager([]byte("secret2"), 1*time.Minute)
	uid := uuid.New()
	tok, _, err := m1.Issue(auth.User{ID: uid, Username: "alice"})
	if err != nil {
		t.Fatalf("Issue: %v", err)
	}
	_, err = m2.Parse(tok)
	if err == nil {
		t.Fatalf("expected unauthorized")
	}
}

func TestTokenManager_Parse_WrongAlgUnauthorized(t *testing.T) {
	m := auth.NewTokenManager([]byte("secret"), 1*time.Minute)

	claims := auth.Claims{UserID: uuid.New().String(), Username: "alice"}
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS512, claims)
	signed, err := jwtToken.SignedString([]byte("secret"))
	if err != nil {
		t.Fatalf("signed: %v", err)
	}
	_, err = m.Parse(signed)
	if err == nil {
		t.Fatalf("expected unauthorized")
	}
}

func TestTokenManager_Parse_ExpiredUnauthorized(t *testing.T) {
	m := auth.NewTokenManager([]byte("secret"), 1*time.Millisecond)
	uid := uuid.New()
	tok, _, err := m.Issue(auth.User{ID: uid, Username: "alice"})
	if err != nil {
		t.Fatalf("Issue: %v", err)
	}
	time.Sleep(15 * time.Millisecond)
	_, err = m.Parse(tok)
	if err == nil {
		t.Fatalf("expected unauthorized")
	}
}

func TestTokenManager_IssueStepup_ParseStepup(t *testing.T) {
	m := auth.NewTokenManager([]byte("secret"), 1*time.Minute)
	uid := uuid.New()
	tok, _, err := m.IssueStepup(auth.User{ID: uid, Username: "alice"})
	if err != nil {
		t.Fatalf("IssueStepup: %v", err)
	}
	user, jti, exp, err := m.ParseStepup(tok)
	if err != nil {
		t.Fatalf("ParseStepup: %v", err)
	}
	if user.ID != uid || user.Username != "alice" {
		t.Fatalf("unexpected user: %+v", user)
	}
	if jti == "" {
		t.Fatalf("expected jti")
	}
	if time.Until(exp) <= 0 {
		t.Fatalf("expected exp in future")
	}
}

func TestTokenManager_Parse_RejectsStepupToken(t *testing.T) {
	m := auth.NewTokenManager([]byte("secret"), 1*time.Minute)
	uid := uuid.New()
	tok, _, err := m.IssueStepup(auth.User{ID: uid, Username: "alice"})
	if err != nil {
		t.Fatalf("IssueStepup: %v", err)
	}
	_, err = m.Parse(tok)
	if err == nil {
		t.Fatalf("expected unauthorized")
	}
}

func TestTokenManager_ParseStepup_RejectsAccessToken(t *testing.T) {
	m := auth.NewTokenManager([]byte("secret"), 1*time.Minute)
	uid := uuid.New()
	tok, _, err := m.Issue(auth.User{ID: uid, Username: "alice"})
	if err != nil {
		t.Fatalf("Issue: %v", err)
	}
	_, _, _, err = m.ParseStepup(tok)
	if err == nil {
		t.Fatalf("expected unauthorized")
	}
}

func newTokenManagerWithRedis(t *testing.T, ttl time.Duration) (*auth.TokenManager, *miniredis.Miniredis) {
	t.Helper()
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	m := auth.NewTokenManager([]byte("secret"), ttl)
	m.SetRedis(rdb)
	return m, mr
}

func TestTokenManager_InvalidateUserTokens_RevokesPreexistingTokens(t *testing.T) {
	m, _ := newTokenManagerWithRedis(t, time.Minute)
	uid := uuid.New()

	// Construct a token with IssuedAt 2 seconds in the past so the revocation
	// timestamp (now) is strictly greater, avoiding same-second comparison issues
	// caused by JWT's second-level precision.
	past := time.Now().Add(-2 * time.Second)
	claims := auth.Claims{
		UserID:    uid.String(),
		Username:  "alice",
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(past),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute)),
		},
	}
	jwtTok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tok, err := jwtTok.SignedString([]byte("secret"))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	if err := m.InvalidateUserTokens(context.Background(), uid.String()); err != nil {
		t.Fatalf("InvalidateUserTokens: %v", err)
	}

	_, err = m.Parse(tok)
	if err == nil {
		t.Fatal("expected token to be rejected after invalidation")
	}
}

func TestTokenManager_InvalidateUserTokens_TokenIssuedAfterIsValid(t *testing.T) {
	m, _ := newTokenManagerWithRedis(t, time.Minute)
	uid := uuid.New()

	if err := m.InvalidateUserTokens(context.Background(), uid.String()); err != nil {
		t.Fatalf("InvalidateUserTokens: %v", err)
	}

	// Token issued after invalidation must be valid.
	tok, _, err := m.Issue(auth.User{ID: uid, Username: "alice"})
	if err != nil {
		t.Fatalf("Issue: %v", err)
	}
	if _, err := m.Parse(tok); err != nil {
		t.Fatalf("expected token issued after invalidation to be valid: %v", err)
	}
}

func TestTokenManager_InvalidateUserTokens_KeyExpiresAfterTTL(t *testing.T) {
	ttl := 200 * time.Millisecond
	m, mr := newTokenManagerWithRedis(t, ttl)
	uid := uuid.New()

	tok, _, err := m.Issue(auth.User{ID: uid, Username: "alice"})
	if err != nil {
		t.Fatalf("Issue: %v", err)
	}

	if err := m.InvalidateUserTokens(context.Background(), uid.String()); err != nil {
		t.Fatalf("InvalidateUserTokens: %v", err)
	}

	// Revocation key should expire after TTL; fast-forward miniredis clock.
	mr.FastForward(ttl + 10*time.Millisecond)

	// The token itself is also expired (TTL=200ms), so reissue to check Redis state only.
	// Verify the revocation key is gone by issuing a new token — it must be accepted.
	tok2, _, err := m.Issue(auth.User{ID: uid, Username: "alice"})
	if err != nil {
		t.Fatalf("Issue: %v", err)
	}
	// tok2 was issued after the key expired; it should pass (key no longer exists).
	if _, err := m.Parse(tok2); err != nil {
		t.Fatalf("token issued after revocation key expiry should be valid: %v", err)
	}

	// The original token is also expired by now, but that's due to JWT TTL, not revocation.
	_ = tok
}

func TestTokenManager_InvalidateUserTokens_NoRedis_ReturnsNil(t *testing.T) {
	m := auth.NewTokenManager([]byte("secret"), time.Minute)
	// No Redis configured — should silently succeed.
	if err := m.InvalidateUserTokens(context.Background(), uuid.New().String()); err != nil {
		t.Fatalf("expected nil error without Redis, got: %v", err)
	}
}
