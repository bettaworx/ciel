// Package testutil contains cryptographic fixtures shared by authentication tests.
package testutil

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"testing"

	"github.com/fxamacker/cbor/v2"
	"github.com/google/uuid"
)

type Passkey struct {
	ID         []byte
	PublicKey  []byte
	privateKey *ecdsa.PrivateKey
}

func NewPasskey(t *testing.T) Passkey {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	publicKey, err := cbor.Marshal(map[int]interface{}{
		1: 2, 3: -7, -1: 1, -2: key.X.FillBytes(make([]byte, 32)), -3: key.Y.FillBytes(make([]byte, 32)),
	})
	if err != nil {
		t.Fatal(err)
	}
	id := make([]byte, 32)
	if _, err := rand.Read(id); err != nil {
		t.Fatal(err)
	}
	return Passkey{ID: id, PublicKey: publicKey, privateKey: key}
}

func (p Passkey) Registration(t *testing.T, options map[string]interface{}, origin, rpID string) map[string]interface{} {
	t.Helper()
	pk := options["publicKey"].(map[string]interface{})
	clientData, err := json.Marshal(map[string]interface{}{
		"type": "webauthn.create", "challenge": pk["challenge"], "origin": origin,
	})
	if err != nil {
		t.Fatal(err)
	}
	rpHash := sha256.Sum256([]byte(rpID))
	authData := append([]byte{}, rpHash[:]...)
	authData = append(authData, 0x45, 0, 0, 0, 0)
	authData = append(authData, make([]byte, 16)...)
	authData = binary.BigEndian.AppendUint16(authData, uint16(len(p.ID)))
	authData = append(authData, p.ID...)
	authData = append(authData, p.PublicKey...)
	attestation, err := cbor.Marshal(map[string]interface{}{
		"fmt": "none", "attStmt": map[string]interface{}{}, "authData": authData,
	})
	if err != nil {
		t.Fatal(err)
	}
	encode := base64.RawURLEncoding.EncodeToString
	return map[string]interface{}{
		"id": encode(p.ID), "rawId": encode(p.ID), "type": "public-key",
		"response": map[string]interface{}{
			"clientDataJSON": encode(clientData), "attestationObject": encode(attestation), "transports": []string{"internal"},
		},
	}
}

func (p Passkey) Assertion(t *testing.T, options map[string]interface{}, userID uuid.UUID, origin, rpID string, count uint32, flags byte) map[string]interface{} {
	t.Helper()
	pk := options["publicKey"].(map[string]interface{})
	clientData, err := json.Marshal(map[string]interface{}{
		"type": "webauthn.get", "challenge": pk["challenge"], "origin": origin,
	})
	if err != nil {
		t.Fatal(err)
	}
	rpHash := sha256.Sum256([]byte(rpID))
	authData := append([]byte{}, rpHash[:]...)
	authData = append(authData, flags, 0, 0, 0, 0)
	binary.BigEndian.PutUint32(authData[33:], count)
	clientHash := sha256.Sum256(clientData)
	signed := append(append([]byte{}, authData...), clientHash[:]...)
	digest := sha256.Sum256(signed)
	signature, err := ecdsa.SignASN1(rand.Reader, p.privateKey, digest[:])
	if err != nil {
		t.Fatal(err)
	}
	encode := base64.RawURLEncoding.EncodeToString
	return map[string]interface{}{
		"id": encode(p.ID), "rawId": encode(p.ID), "type": "public-key",
		"response": map[string]interface{}{
			"clientDataJSON": encode(clientData), "authenticatorData": encode(authData),
			"signature": encode(signature), "userHandle": encode(userID[:]),
		},
	}
}
