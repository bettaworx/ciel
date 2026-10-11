package middleware_test

import (
	"net/http/httptest"
	"testing"

	"backend/internal/middleware"
)

func TestClientIPIgnoresClientSuppliedForwardedPrefix(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	req.RemoteAddr = "192.0.2.20:1234"
	req.Header.Set("X-Forwarded-For", "203.0.113.7, 198.51.100.8")
	if got := middleware.ClientIP(req, true); got != "198.51.100.8" {
		t.Fatalf("trusted proxy IP = %q, want 198.51.100.8", got)
	}
	if got := middleware.ClientIP(req, false); got != "192.0.2.20" {
		t.Fatalf("direct IP = %q, want 192.0.2.20", got)
	}
	req.Header.Set("X-Forwarded-For", "203.0.113.7, invalid")
	if got := middleware.ClientIP(req, true); got != "192.0.2.20" {
		t.Fatalf("invalid proxy IP = %q, want remote address", got)
	}
}
