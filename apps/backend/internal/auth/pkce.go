package auth

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
)

// PKCEMethodS256 is the only code challenge method this server accepts.
//
// RFC 7636 also defines "plain", where the challenge is the verifier. That
// defends against nothing: anyone who can intercept the code from the redirect
// can read the challenge out of the authorization request just as easily. It is
// in the RFC for clients that cannot compute SHA-256, which in practice means
// none, so it is not implemented rather than implemented and discouraged.
const PKCEMethodS256 = "S256"

// hashToken returns the hex SHA-256 of a raw token, for use as a lookup key.
//
// Hex rather than raw bytes because these become Redis keys; the digest is the
// same one HashRefreshToken produces for the database.
func hashToken(raw string) string {
	return hex.EncodeToString(HashRefreshToken(raw))
}

// VerifyPKCE reports whether verifier matches challenge under S256.
//
// RFC 7636 §4.6: the challenge is BASE64URL(SHA256(ASCII(verifier))) with no
// padding. Compared in constant time — the challenge is not secret, but the
// comparison sits directly in front of token issuance and there is no reason to
// leak timing about it.
func VerifyPKCE(verifier, challenge string) bool {
	if verifier == "" || challenge == "" {
		return false
	}
	if !ValidPKCEVerifier(verifier) {
		return false
	}
	sum := sha256.Sum256([]byte(verifier))
	want := base64.RawURLEncoding.EncodeToString(sum[:])
	return subtle.ConstantTimeCompare([]byte(want), []byte(challenge)) == 1
}

// ValidPKCEVerifier checks the verifier against the grammar in RFC 7636 §4.1:
// 43 to 128 characters of [A-Za-z0-9-._~].
//
// Enforced rather than assumed because the length is what carries the entropy.
// A one-character verifier would hash and compare perfectly well while being
// trivially brute-forced from the challenge.
func ValidPKCEVerifier(verifier string) bool {
	if len(verifier) < 43 || len(verifier) > 128 {
		return false
	}
	for i := 0; i < len(verifier); i++ {
		c := verifier[i]
		switch {
		case c >= 'A' && c <= 'Z',
			c >= 'a' && c <= 'z',
			c >= '0' && c <= '9',
			c == '-', c == '.', c == '_', c == '~':
		default:
			return false
		}
	}
	return true
}

// ValidPKCEChallenge checks the challenge is a well-formed unpadded base64url
// SHA-256 digest, which is always 43 characters.
func ValidPKCEChallenge(challenge string) bool {
	if len(challenge) != 43 {
		return false
	}
	decoded, err := base64.RawURLEncoding.DecodeString(challenge)
	return err == nil && len(decoded) == sha256.Size
}
