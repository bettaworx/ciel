package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/internal/middleware"
)

func TestCORSDeniesUntrustedCookieWrites(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://app.example.test")
	h := middleware.CORS()(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	cases := []struct {
		name, origin, fetchSite, cookie string
		want                            int
	}{
		{"sibling origin", "https://evil.example.test", "same-site", "ciel_auth=session", http.StatusForbidden},
		{"allowed frontend", "https://app.example.test", "same-site", "ciel_auth=session", http.StatusOK},
		{"same origin", "https://api.example.test", "same-origin", "ciel_auth=session", http.StatusOK},
		{"missing origin from sibling", "", "same-site", "ciel_auth=session", http.StatusForbidden},
		{"refresh cookie", "https://evil.example.test", "same-site", "ciel_refresh=token", http.StatusForbidden},
		{"bearer request", "https://evil.example.test", "same-site", "", http.StatusOK},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "https://api.example.test/api/v1/posts", nil)
			req.Header.Set("X-Forwarded-Proto", "https")
			if tc.origin != "" {
				req.Header.Set("Origin", tc.origin)
			}
			if tc.fetchSite != "" {
				req.Header.Set("Sec-Fetch-Site", tc.fetchSite)
			}
			if tc.cookie != "" {
				req.Header.Set("Cookie", tc.cookie)
			}
			rr := httptest.NewRecorder()
			h.ServeHTTP(rr, req)
			if rr.Code != tc.want {
				t.Fatalf("status = %d, want %d", rr.Code, tc.want)
			}
		})
	}
}
