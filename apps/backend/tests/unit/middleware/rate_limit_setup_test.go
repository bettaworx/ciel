package middleware_test

import (
	"net/http"
	"testing"
)

// The setup passphrase check is unauthenticated and returns the token that
// creates the first admin, so unthrottled guessing would take over the instance.
func TestRateLimit_SetupVerifyPasswordIsCapped(t *testing.T) {
	code := exhaust(t, http.MethodPost, "/api/v1/setup/verify-password", "1.2.3.4:1234", 10)
	if code != http.StatusTooManyRequests {
		t.Fatalf("request 11 got %d, want 429", code)
	}
}
