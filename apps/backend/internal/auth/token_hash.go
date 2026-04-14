package auth

import "crypto/sha256"

// HashRefreshToken returns the SHA-256 digest of a raw refresh token.
// Always use this before storing or querying the database.
func HashRefreshToken(raw string) []byte {
	h := sha256.Sum256([]byte(raw))
	return h[:]
}
