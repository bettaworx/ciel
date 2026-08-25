package auth_test

import (
	"bytes"
	"testing"

	"backend/internal/auth"
)

func TestGenerateBackupCodes_UniqueAndHash(t *testing.T) {
	plain, hashes, err := auth.GenerateBackupCodes(10)
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
		h := auth.HashBackupCode(c)
		if !bytes.Equal(h, hashes[i]) {
			t.Fatalf("hash mismatch at %d", i)
		}
		// Normalization ignores dashes/case
		h2 := auth.HashBackupCode(auth.NormalizeBackupCode(c))
		if !bytes.Equal(h, h2) {
			t.Fatal("normalized hash mismatch")
		}
	}
}
