package auth

import (
	"crypto/sha256"
	"fmt"
	"strings"
)

const (
	BackupCodeCount = 10
	backupCodeBytes = 4 // 8 hex chars → XXXX-XXXX
)

// GenerateBackupCodes returns plaintext backup codes and their SHA-256 hashes.
// Plaintext format: uppercase hex groups "ABCD-EF01".
func GenerateBackupCodes(n int) (plain []string, hashes [][]byte, err error) {
	if n <= 0 {
		n = BackupCodeCount
	}
	plain = make([]string, 0, n)
	hashes = make([][]byte, 0, n)
	seen := make(map[string]struct{}, n)
	for len(plain) < n {
		b, err := RandomBytes(backupCodeBytes)
		if err != nil {
			return nil, nil, err
		}
		raw := fmt.Sprintf("%X", b)
		code := raw[:4] + "-" + raw[4:]
		if _, ok := seen[code]; ok {
			continue
		}
		seen[code] = struct{}{}
		plain = append(plain, code)
		hashes = append(hashes, HashBackupCode(code))
	}
	return plain, hashes, nil
}

// NormalizeBackupCode strips separators/spaces and uppercases.
func NormalizeBackupCode(code string) string {
	s := strings.ToUpper(strings.TrimSpace(code))
	s = strings.ReplaceAll(s, "-", "")
	s = strings.ReplaceAll(s, " ", "")
	return s
}

// HashBackupCode returns SHA-256 of the normalized code.
func HashBackupCode(code string) []byte {
	norm := NormalizeBackupCode(code)
	sum := sha256.Sum256([]byte(norm))
	return sum[:]
}

// FormatBackupCodeFromNormalized turns "ABCDEF01" into "ABCD-EF01".
func FormatBackupCodeFromNormalized(norm string) string {
	norm = NormalizeBackupCode(norm)
	if len(norm) != 8 {
		return norm
	}
	return norm[:4] + "-" + norm[4:]
}
