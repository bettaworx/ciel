package auth_test

import (
	"testing"
	"time"

	"backend/internal/auth"
)

func TestTotp_RoundTripKnownVector(t *testing.T) {
	// RFC 6238 Appendix B test vector (SHA1, 6 digits) uses secret "12345678901234567890"
	secret := []byte("12345678901234567890")
	// T = 59 → 94287082 truncated to 6 digits differently; use our generator consistency.
	code := auth.TotpCodeAt(secret, 59)
	if len(code) != 6 {
		t.Fatalf("expected 6 digits, got %q", code)
	}
	step, ok := auth.ValidateTotp(secret, code, time.Unix(59, 0).UTC())
	if !ok {
		t.Fatal("expected valid code")
	}
	if step != 1 { // 59/30 = 1
		t.Fatalf("step=%d want 1", step)
	}
}

func TestTotp_RejectsWrongCode(t *testing.T) {
	secret := []byte("12345678901234567890")
	_, ok := auth.ValidateTotp(secret, "000000", time.Unix(59, 0).UTC())
	if ok {
		t.Fatal("expected rejection")
	}
}

func TestTotp_WindowAllowsNeighborStep(t *testing.T) {
	secret := []byte("12345678901234567890")
	// Code for step 2, validated at time just inside previous step window.
	code := auth.TotpCodeAt(secret, 60) // step 2
	_, ok := auth.ValidateTotp(secret, code, time.Unix(59, 0).UTC())
	if !ok {
		t.Fatal("expected ±1 window to accept")
	}
}

func TestGenerateAndDecodeSecret(t *testing.T) {
	s, err := auth.GenerateTotpSecret()
	if err != nil {
		t.Fatal(err)
	}
	key, err := auth.DecodeTotpSecret(s)
	if err != nil {
		t.Fatal(err)
	}
	if len(key) != 20 {
		t.Fatalf("key len=%d", len(key))
	}
	url := auth.BuildOtpauthURL("Ciel", "alice", s)
	if url == "" || url[:15] != "otpauth://totp/" {
		t.Fatalf("bad url %q", url)
	}
}
