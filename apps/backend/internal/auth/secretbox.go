package auth

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
)

var (
	ErrSecretBoxKey    = errors.New("encryption key not configured")
	ErrSecretBoxOpen   = errors.New("failed to decrypt")
	ErrSecretBoxSealed = errors.New("invalid ciphertext")
)

// SecretBox encrypts small secrets with AES-256-GCM and keys hashes of
// low-entropy secrets (backup codes) with a subkey of the same key.
type SecretBox struct {
	gcm    cipher.AEAD
	macKey []byte
}

// NewSecretBoxFromBase64 builds a SecretBox from a base64-encoded 32-byte key.
func NewSecretBoxFromBase64(keyB64 string) (*SecretBox, error) {
	if keyB64 == "" {
		return nil, ErrSecretBoxKey
	}
	key, err := base64.StdEncoding.DecodeString(keyB64)
	if err != nil {
		// Also accept raw URL encoding used elsewhere in the project.
		key, err = base64.RawURLEncoding.DecodeString(keyB64)
		if err != nil {
			return nil, fmt.Errorf("%w: invalid base64", ErrSecretBoxKey)
		}
	}
	return NewSecretBox(key)
}

// NewSecretBox builds a SecretBox from a raw 32-byte key.
func NewSecretBox(key []byte) (*SecretBox, error) {
	if len(key) != 32 {
		return nil, fmt.Errorf("%w: key must be 32 bytes", ErrSecretBoxKey)
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	// A separate subkey, so the MAC never uses the AES key directly.
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte("ciel/backup-codes/v1"))
	return &SecretBox{gcm: gcm, macKey: mac.Sum(nil)}, nil
}

// BackupCodeHash returns HMAC-SHA256 of the normalized code under the box's
// subkey. Backup codes carry only 32 bits, so an unkeyed hash read from the
// database can be inverted by trying every code. Without a box (no
// TOTP_ENCRYPTION_KEY) it falls back to the unkeyed HashBackupCode.
func (b *SecretBox) BackupCodeHash(code string) []byte {
	if b == nil || b.macKey == nil {
		return HashBackupCode(code)
	}
	mac := hmac.New(sha256.New, b.macKey)
	mac.Write([]byte(NormalizeBackupCode(code)))
	return mac.Sum(nil)
}

// Seal encrypts plaintext. Output is nonce || ciphertext.
func (b *SecretBox) Seal(plaintext []byte) ([]byte, error) {
	if b == nil || b.gcm == nil {
		return nil, ErrSecretBoxKey
	}
	nonce := make([]byte, b.gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}
	return b.gcm.Seal(nonce, nonce, plaintext, nil), nil
}

// Open decrypts ciphertext produced by Seal.
func (b *SecretBox) Open(sealed []byte) ([]byte, error) {
	if b == nil || b.gcm == nil {
		return nil, ErrSecretBoxKey
	}
	ns := b.gcm.NonceSize()
	if len(sealed) < ns {
		return nil, ErrSecretBoxSealed
	}
	nonce, ct := sealed[:ns], sealed[ns:]
	pt, err := b.gcm.Open(nil, nonce, ct, nil)
	if err != nil {
		return nil, ErrSecretBoxOpen
	}
	return pt, nil
}
