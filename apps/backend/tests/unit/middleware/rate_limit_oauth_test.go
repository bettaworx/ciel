package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"backend/internal/middleware"

	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

// The OAuth endpoints take credentials and say whether they were right, which
// is an online guessing oracle unless it is capped. These assert that each one
// is actually classified — an endpoint missing from classifyOAuthRoute is not a
// visible failure, it just silently has no limit.

// exhaust sends n requests and reports the status of the one after them.
func exhaust(t *testing.T, method, path, remoteAddr string, n int) int {
	t.Helper()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	now := time.Unix(1_700_000_000, 0)
	mw := middleware.RateLimit(rdb, middleware.RateLimitOptions{Now: func() time.Time { return now }})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	send := func() int {
		req := httptest.NewRequest(method, path, nil)
		req.RemoteAddr = remoteAddr
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		return rr.Code
	}

	for i := 0; i < n; i++ {
		if code := send(); code != http.StatusOK {
			t.Fatalf("%s %s: request %d was already limited (%d)", method, path, i+1, code)
		}
	}
	return send()
}

func TestRateLimit_OAuthEndpointsAreCapped(t *testing.T) {
	cases := []struct {
		name   string
		method string
		path   string
		limit  int
	}{
		// The one that matters most: it takes a client secret and a PKCE
		// verifier and reports whether they were correct.
		{"token", http.MethodPost, "/api/v1/oauth/token", 30},
		{"revoke", http.MethodPost, "/api/v1/oauth/revoke", 30},
		{"authorize", http.MethodPost, "/api/v1/oauth/authorize", 60},
		// Public and unauthenticated, and it looks clients up by client_id.
		{"authorize info", http.MethodGet, "/api/v1/oauth/authorize/info", 60},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			code := exhaust(t, tc.method, tc.path, "1.2.3.4:1234", tc.limit)
			if code != http.StatusTooManyRequests {
				t.Errorf("%s %s: request %d got %d, want 429 — is it in classifyOAuthRoute?",
					tc.method, tc.path, tc.limit+1, code)
			}
		})
	}
}

// Registering apps is permanent for the server and cheap for the caller, so it
// is capped per hour rather than per minute.
func TestRateLimit_OAuthClientCreateIsCapped(t *testing.T) {
	code := exhaust(t, http.MethodPost, "/api/v1/me/oauth/clients", "1.2.3.4:1234", 10)
	if code != http.StatusTooManyRequests {
		t.Errorf("request 11 got %d, want 429", code)
	}
}

// The limits key on the caller, so one client running into its cap must not
// lock everyone else out of the token endpoint.
func TestRateLimit_OAuthTokenIsPerIP(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	now := time.Unix(1_700_000_000, 0)
	mw := middleware.RateLimit(rdb, middleware.RateLimitOptions{Now: func() time.Time { return now }})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	send := func(addr string) int {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/oauth/token", nil)
		req.RemoteAddr = addr
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		return rr.Code
	}

	for i := 0; i < 31; i++ {
		send("1.2.3.4:1234")
	}
	if code := send("1.2.3.4:1234"); code != http.StatusTooManyRequests {
		t.Fatalf("the exhausted caller got %d, want 429", code)
	}
	if code := send("5.6.7.8:1234"); code != http.StatusOK {
		t.Errorf("a different caller got %d, want 200", code)
	}
}
