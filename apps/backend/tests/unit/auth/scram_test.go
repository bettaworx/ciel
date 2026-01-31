package auth_test

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"testing"

	"backend/internal/auth"

	"golang.org/x/crypto/pbkdf2"
)

func TestVerifyClientProof_RoundTrip(t *testing.T) {
	username := "alice"
	password := "password123"
	salt := []byte("0123456789abcdef")
	iterations := 1000

	storedKey, _ := auth.DeriveVerifier(password, salt, iterations)
	saltB64 := base64.StdEncoding.EncodeToString(salt)
	clientNonce := "cnonce"
	serverNonce := "snonce"
	clientFinalNonce := clientNonce + serverNonce
	authMessage := auth.BuildAuthMessage(username, clientNonce, serverNonce, saltB64, iterations, clientFinalNonce)

	proofB64 := computeClientProofB64ForTest(t, password, salt, iterations, storedKey, authMessage)

	ok, err := auth.VerifyClientProof(storedKey, authMessage, proofB64)
	if err != nil {
		t.Fatalf("VerifyClientProof returned error: %v", err)
	}
	if !ok {
		t.Fatalf("expected proof to verify")
	}
}

func TestVerifyClientProof_WrongProofFails(t *testing.T) {
	storedKey := make([]byte, sha256.Size)
	for i := range storedKey {
		storedKey[i] = byte(i)
	}
	badProof := base64.StdEncoding.EncodeToString(make([]byte, sha256.Size))
	ok, err := auth.VerifyClientProof(storedKey, "authMessage", badProof)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if ok {
		t.Fatalf("expected proof verification to fail")
	}
}

func TestVerifyClientProof_InvalidBase64(t *testing.T) {
	storedKey := make([]byte, sha256.Size)
	ok, err := auth.VerifyClientProof(storedKey, "authMessage", "!!!!")
	if err == nil {
		t.Fatalf("expected error")
	}
	if ok {
		t.Fatalf("expected ok=false")
	}
}

func TestVerifyClientProof_InvalidLength(t *testing.T) {
	storedKey := make([]byte, sha256.Size)
	short := base64.StdEncoding.EncodeToString([]byte{1, 2, 3})
	ok, err := auth.VerifyClientProof(storedKey, "authMessage", short)
	if err == nil {
		t.Fatalf("expected error")
	}
	if ok {
		t.Fatalf("expected ok=false")
	}
}

func computeClientProofB64ForTest(t *testing.T, password string, salt []byte, iterations int, storedKey []byte, authMessage string) string {
	t.Helper()

	saltedPassword := pbkdf2.Key([]byte(password), salt, iterations, 32, sha256.New)
	clientKey := hmacSHA256ForTest(saltedPassword, []byte("Client Key"))
	storedKeyCheckArr := sha256.Sum256(clientKey)
	if !hmac.Equal(storedKeyCheckArr[:], storedKey) {
		t.Fatalf("storedKey mismatch in test setup")
	}
	clientSignature := hmacSHA256ForTest(storedKey, []byte(authMessage))
	clientProof := xorBytesForTest(clientKey, clientSignature)
	return base64.StdEncoding.EncodeToString(clientProof)
}

func hmacSHA256ForTest(key []byte, msg []byte) []byte {
	h := hmac.New(sha256.New, key)
	_, _ = h.Write(msg)
	return h.Sum(nil)
}

func xorBytesForTest(a, b []byte) []byte {
	out := make([]byte, len(a))
	for i := 0; i < len(a) && i < len(b); i++ {
		out[i] = a[i] ^ b[i]
	}
	return out
}
