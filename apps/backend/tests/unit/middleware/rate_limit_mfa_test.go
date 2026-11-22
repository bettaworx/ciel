package middleware_test

import (
	"net/http"
	"testing"
)

// The second-factor checks for login and step-up all say whether a guessed
// code or assertion was right, so each must be classified and capped per IP.
func TestRateLimit_MfaVerifyEndpointsAreCapped(t *testing.T) {
	for _, path := range []string{
		"/api/v1/auth/mfa/verify",
		"/api/v1/auth/mfa/webauthn/verify",
		"/api/v1/auth/stepup/mfa/verify",
		"/api/v1/auth/stepup/mfa/webauthn/verify",
	} {
		code := exhaust(t, http.MethodPost, path, "1.2.3.4:1234", 10)
		if code != http.StatusTooManyRequests {
			t.Errorf("POST %s: request 11 got %d, want 429", path, code)
		}
	}
}
