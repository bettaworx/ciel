package auth_test

import (
	"bytes"
	"encoding/base64"
	"testing"

	"backend/internal/auth"
)

func TestSecretBox_RoundTrip(t *testing.T) {
	key := make([]byte, 32)
	for i := range key {
		key[i] = byte(i)
	}
	box, err := auth.NewSecretBox(key)
	if err != nil {
		t.Fatal(err)
	}
	pt := []byte("super-secret-totp-key")
	sealed, err := box.Seal(pt)
	if err != nil {
		t.Fatal(err)
	}
	out, err := box.Open(sealed)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(out, pt) {
		t.Fatalf("got %q", out)
	}
}

func TestSecretBox_TamperFails(t *testing.T) {
	key := bytes.Repeat([]byte{7}, 32)
	box, err := auth.NewSecretBox(key)
	if err != nil {
		t.Fatal(err)
	}
	sealed, err := box.Seal([]byte("data"))
	if err != nil {
		t.Fatal(err)
	}
	sealed[len(sealed)-1] ^= 0xff
	if _, err := box.Open(sealed); err == nil {
		t.Fatal("expected open failure")
	}
}

func TestSecretBox_FromBase64(t *testing.T) {
	raw := bytes.Repeat([]byte{1}, 32)
	b64 := base64.StdEncoding.EncodeToString(raw)
	box, err := auth.NewSecretBoxFromBase64(b64)
	if err != nil {
		t.Fatal(err)
	}
	sealed, _ := box.Seal([]byte("x"))
	out, err := box.Open(sealed)
	if err != nil || string(out) != "x" {
		t.Fatalf("roundtrip failed: %v %q", err, out)
	}
}
