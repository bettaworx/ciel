package realtime

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"os"
	"strings"
)

// Signer provides HMAC signing for realtime payloads.
type Signer struct {
	secret []byte
}

// NewSignerFromEnv returns a signer if REALTIME_SIGNING_SECRET is set.
func NewSignerFromEnv() *Signer {
	secret := strings.TrimSpace(os.Getenv("REALTIME_SIGNING_SECRET"))
	if secret == "" {
		return nil
	}
	return &Signer{secret: []byte(secret)}
}

// Sign returns a base64url HMAC of the payload.
func (s *Signer) Sign(payload []byte) string {
	mac := hmac.New(sha256.New, s.secret)
	_, _ = mac.Write(payload)
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

// Verify checks whether sig matches the payload HMAC.
func (s *Signer) Verify(payload []byte, sig string) bool {
	if s == nil {
		return false
	}
	raw, err := base64.RawURLEncoding.DecodeString(strings.TrimSpace(sig))
	if err != nil {
		return false
	}
	mac := hmac.New(sha256.New, s.secret)
	_, _ = mac.Write(payload)
	return hmac.Equal(raw, mac.Sum(nil))
}
