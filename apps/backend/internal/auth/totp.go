package auth

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
	"fmt"
	"net/url"
	"strings"
	"time"
)

const (
	totpDigits     = 6
	totpPeriod     = 30
	totpSecretBytes = 20
)

// GenerateTotpSecret returns a random base32-encoded TOTP secret (no padding).
func GenerateTotpSecret() (string, error) {
	b, err := RandomBytes(totpSecretBytes)
	if err != nil {
		return "", err
	}
	return base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(b), nil
}

// DecodeTotpSecret decodes a base32 TOTP secret (padding optional).
func DecodeTotpSecret(secret string) ([]byte, error) {
	s := strings.ToUpper(strings.ReplaceAll(strings.TrimSpace(secret), " ", ""))
	// Try without padding first, then with.
	if key, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(s); err == nil {
		return key, nil
	}
	return base32.StdEncoding.DecodeString(s)
}

// TotpCodeAt returns the 6-digit TOTP for the given unix time step.
func TotpCodeAt(secret []byte, unix int64) string {
	step := unix / totpPeriod
	return hotp(secret, uint64(step), totpDigits)
}

// ValidateTotp checks code against the current window (±1 step).
// Returns the matched step on success so callers can enforce replay protection.
func ValidateTotp(secret []byte, code string, now time.Time) (step int64, ok bool) {
	code = strings.TrimSpace(code)
	if len(code) != totpDigits {
		return 0, false
	}
	unix := now.UTC().Unix()
	cur := unix / totpPeriod
	for _, delta := range []int64{-1, 0, 1} {
		s := cur + delta
		if subtleConstantTimeEqualString(hotp(secret, uint64(s), totpDigits), code) {
			return s, true
		}
	}
	return 0, false
}

// BuildOtpauthURL builds a standard otpauth://totp URI for authenticator apps.
func BuildOtpauthURL(issuer, accountName, secret string) string {
	label := url.PathEscape(issuer + ":" + accountName)
	q := url.Values{}
	q.Set("secret", secret)
	q.Set("issuer", issuer)
	q.Set("algorithm", "SHA1")
	q.Set("digits", fmt.Sprintf("%d", totpDigits))
	q.Set("period", fmt.Sprintf("%d", totpPeriod))
	return "otpauth://totp/" + label + "?" + q.Encode()
}

func hotp(key []byte, counter uint64, digits int) string {
	var buf [8]byte
	binary.BigEndian.PutUint64(buf[:], counter)
	mac := hmac.New(sha1.New, key)
	_, _ = mac.Write(buf[:])
	sum := mac.Sum(nil)
	offset := sum[len(sum)-1] & 0x0f
	truncated := binary.BigEndian.Uint32(sum[offset:offset+4]) & 0x7fffffff
	mod := uint32(1)
	for i := 0; i < digits; i++ {
		mod *= 10
	}
	return fmt.Sprintf("%0*d", digits, truncated%mod)
}

func subtleConstantTimeEqualString(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	var v byte
	for i := 0; i < len(a); i++ {
		v |= a[i] ^ b[i]
	}
	return v == 0
}
