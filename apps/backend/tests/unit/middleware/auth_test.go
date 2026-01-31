package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"backend/internal/auth"
	"backend/internal/middleware"

	"github.com/google/uuid"
)

func TestOptionalAuth_NoHeader_PassesThrough(t *testing.T) {
	mw := middleware.OptionalAuth(auth.NewTokenManager([]byte("secret"), time.Minute))

	called := false
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if !called {
		t.Fatalf("expected handler to be called")
	}
}

func TestOptionalAuth_InvalidPrefix_Unauthorized(t *testing.T) {
	mw := middleware.OptionalAuth(auth.NewTokenManager([]byte("secret"), time.Minute))

	called := false
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req.Header.Set("Authorization", "Token abc")
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
	if called {
		t.Fatalf("expected handler not to be called")
	}
}

func TestOptionalAuth_InvalidToken_Unauthorized(t *testing.T) {
	mw := middleware.OptionalAuth(auth.NewTokenManager([]byte("secret"), time.Minute))

	called := false
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
	if called {
		t.Fatalf("expected handler not to be called")
	}
}

func TestOptionalAuth_ValidToken_SetsUser(t *testing.T) {
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	uid := uuid.New()
	token, _, err := tm.Issue(auth.User{ID: uid, Username: "alice"})
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}

	mw := middleware.OptionalAuth(tm)

	called := false
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		user, ok := auth.UserFromContext(r.Context())
		if !ok {
			t.Fatalf("expected user in context")
		}
		if user.ID != uid || user.Username != "alice" {
			t.Fatalf("unexpected user: %+v", user)
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if !called {
		t.Fatalf("expected handler to be called")
	}
}
