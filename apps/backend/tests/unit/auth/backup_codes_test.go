package auth_test

import (
	"bytes"
	"testing"

	"backend/internal/auth"
)

func testBox(t *testing.T, seed byte) *auth.SecretBox {
	t.Helper()
	key := make([]byte, 32)
	for i := range key {
		key[i] = seed + byte(i)
	}
	box, err := auth.NewSecretBox(key)
	if err != nil {
		t.Fatal(err)
	}
	return box
}

func TestGenerateBackupCodes_UniqueAndHash(t *testing.T) {
	box := testBox(t, 1)
	plain, hashes, err := auth.GenerateBackupCodes(box, 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(plain) != 10 || len(hashes) != 10 {
		t.Fatalf("len plain=%d hashes=%d", len(plain), len(hashes))
	}
	seen := map[string]struct{}{}
	for i, c := range plain {
		if len(c) != 9 || c[4] != '-' {
			t.Fatalf("format %q", c)
		}
		if _, ok := seen[c]; ok {
			t.Fatalf("duplicate %q", c)
		}
		seen[c] = struct{}{}
		h := box.BackupCodeHash(c)
		if !bytes.Equal(h, hashes[i]) {
			t.Fatalf("hash mismatch at %d", i)
		}
		// Normalization ignores dashes/case
		h2 := box.BackupCodeHash(auth.NormalizeBackupCode(c))
		if !bytes.Equal(h, h2) {
			t.Fatal("normalized hash mismatch")
		}
	}
}

// Backup codes carry 32 bits, so a hash that anyone with the database can
// recompute lets them recover every code. The stored hash must depend on the
// server key.
func TestBackupCodeHash_IsKeyed(t *testing.T) {
	code := "ABCD-EF01"
	a := testBox(t, 1).BackupCodeHash(code)
	if bytes.Equal(a, auth.HashBackupCode(code)) {
		t.Fatal("keyed hash equals the unkeyed SHA-256")
	}
	if bytes.Equal(a, testBox(t, 2).BackupCodeHash(code)) {
		t.Fatal("different keys gave the same hash")
	}
}

func TestBackupCodeHash_NilBoxFallsBackToUnkeyed(t *testing.T) {
	var box *auth.SecretBox
	if !bytes.Equal(box.BackupCodeHash("abcd-ef01"), auth.HashBackupCode("ABCDEF01")) {
		t.Fatal("nil box did not fall back to the unkeyed hash")
	}
	_, hashes, err := auth.GenerateBackupCodes(nil, 1)
	if err != nil || len(hashes) != 1 {
		t.Fatalf("GenerateBackupCodes(nil): %v", err)
	}
}
