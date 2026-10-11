package service

import (
	"database/sql"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"log/slog"
	"os"

	_ "golang.org/x/image/webp"

	"github.com/buckket/go-blurhash"
)

// BlurHash component counts. Recommended ranges per the spec are 1-9, with
// 4x3 producing a good balance of fidelity vs. encoded length (~28 chars).
const (
	blurhashComponentsX = 4
	blurhashComponentsY = 3
)

// computeBlurhashForImage decodes the image at path and returns its BlurHash
// representation. Errors are logged and an empty string is returned so callers
// can persist NULL without aborting the upload.
func computeBlurhashForImage(path string) string {
	f, err := os.Open(path)
	if err != nil {
		slog.Warn("blurhash: failed to open image", "error", err, "path", path)
		return ""
	}
	defer func() { _ = f.Close() }()

	img, _, err := image.Decode(f)
	if err != nil {
		slog.Warn("blurhash: failed to decode image", "error", err, "path", path)
		return ""
	}

	hash, err := blurhash.Encode(blurhashComponentsX, blurhashComponentsY, img)
	if err != nil {
		slog.Warn("blurhash: encode failed", "error", err, "path", path)
		return ""
	}
	return hash
}

// nullStringFromString wraps a Go string into a sql.NullString. An empty
// string is treated as NULL so callers can use the helper to persist an
// optional column without a separate branch.
func nullStringFromString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}

// nullStringToPtr converts a sql.NullString into a *string suitable for
// JSON-encoded API responses (omitempty + nullable).
func nullStringToPtr(n sql.NullString) *string {
	if !n.Valid {
		return nil
	}
	v := n.String
	return &v
}
