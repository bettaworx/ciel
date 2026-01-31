package auth_test

import (
	"testing"
	"time"

	"backend/internal/auth"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
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
