package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"

	"golang.org/x/crypto/pbkdf2"
)

const DefaultIterations = 600_000

func RandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return nil, err
	}
	return b, nil
}

func RandomToken(nBytes int) (string, error) {
	b, err := RandomBytes(nBytes)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func DeriveVerifier(password string, salt []byte, iterations int) (storedKey []byte, serverKey []byte) {
	saltedPassword := pbkdf2.Key([]byte(password), salt, iterations, 32, sha256.New)
	clientKey := hmacSHA256(saltedPassword, []byte("Client Key"))
	stored := sha256.Sum256(clientKey)
	server := hmacSHA256(saltedPassword, []byte("Server Key"))
	return stored[:], server
}

func BuildAuthMessage(username, clientNonce, serverNonce, saltB64 string, iterations int, clientFinalNonce string) string {
	clientFirstBare := fmt.Sprintf("n=%s,r=%s", username, clientNonce)
	serverFirst := fmt.Sprintf("r=%s%s,s=%s,i=%d", clientNonce, serverNonce, saltB64, iterations)
	clientFinalWithoutProof := fmt.Sprintf("c=biws,r=%s", clientFinalNonce)
	return clientFirstBare + "," + serverFirst + "," + clientFinalWithoutProof
}

func VerifyClientProof(storedKey []byte, authMessage string, clientProofB64 string) (bool, error) {
	proofBytes, err := base64.StdEncoding.DecodeString(clientProofB64)
	if err != nil {
		return false, err
	}
	if len(proofBytes) != sha256.Size {
		return false, errors.New("invalid proof length")
	}

	clientSignature := hmacSHA256(storedKey, []byte(authMessage))
	clientKey := xorBytes(proofBytes, clientSignature)
	storedCheck := sha256.Sum256(clientKey)
	if !hmac.Equal(storedCheck[:], storedKey) {
		return false, nil
	}
	return true, nil
}

func hmacSHA256(key []byte, message []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(message)
	return h.Sum(nil)
}

func xorBytes(a, b []byte) []byte {
	out := make([]byte, len(a))
	for i := 0; i < len(a) && i < len(b); i++ {
		out[i] = a[i] ^ b[i]
	}
	return out
}
