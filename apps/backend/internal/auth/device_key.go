package auth

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"errors"
	"fmt"
	"math/big"
	"strconv"
)

// Account tokens are bound to a key pair the browser generates with
// non-extractable private material: the token alone is not a credential, it is
// only accepted alongside a signature this device could have produced. An
// attacker who exfiltrates the stored token (or the whole IndexedDB) cannot use
// it anywhere else, because the private key cannot leave the browser that made
// it.

// MaxDevicePublicKeyBytes caps what will be parsed as an SPKI blob. A P-256
// SPKI is 91 bytes; the slack is for encoders that pad.
const MaxDevicePublicKeyBytes = 256

// ParseDevicePublicKey decodes a base64 SPKI public key and rejects anything
// that is not an ECDSA P-256 key, so only keys we can verify get stored.
func ParseDevicePublicKey(encoded string) ([]byte, error) {
	raw, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil, errors.New("public key is not valid base64")
	}
	if len(raw) == 0 || len(raw) > MaxDevicePublicKeyBytes {
		return nil, errors.New("public key has an implausible length")
	}
	if _, err := parseP256(raw); err != nil {
		return nil, err
	}
	return raw, nil
}

func parseP256(spki []byte) (*ecdsa.PublicKey, error) {
	parsed, err := x509.ParsePKIXPublicKey(spki)
	if err != nil {
		return nil, fmt.Errorf("public key is not a valid SPKI: %w", err)
	}
	pub, ok := parsed.(*ecdsa.PublicKey)
	if !ok || pub.Curve != elliptic.P256() {
		return nil, errors.New("public key is not ECDSA P-256")
	}
	return pub, nil
}

// DeviceSignaturePayload is the exact string the browser signs. Keep it in sync
// with buildSignPayload in apps/frontend/lib/auth/account-tokens.ts.
func DeviceSignaturePayload(token string, timestamp int64, nonce string) string {
	return token + "." + strconv.FormatInt(timestamp, 10) + "." + nonce
}

// VerifyDeviceSignature checks a signature made by SubtleCrypto.sign('ECDSA').
//
// WebCrypto emits the raw r‖s form (IEEE P1363), NOT the ASN.1 DER that
// ecdsa.VerifyASN1 expects, so the two halves are split by hand.
func VerifyDeviceSignature(spki []byte, signatureB64 string, payload string) bool {
	pub, err := parseP256(spki)
	if err != nil {
		return false
	}
	sig, err := base64.StdEncoding.DecodeString(signatureB64)
	if err != nil || len(sig) != 64 {
		return false
	}
	sum := sha256.Sum256([]byte(payload))
	r := new(big.Int).SetBytes(sig[:32])
	s := new(big.Int).SetBytes(sig[32:])
	return ecdsa.Verify(pub, sum[:], r, s)
}
