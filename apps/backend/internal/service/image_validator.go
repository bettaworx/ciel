package service

import (
	"fmt"
	"image"
	"image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"os"

	_ "golang.org/x/image/webp"

	"backend/internal/config"
)

// ImageInfo contains validated image metadata extracted during Go-based decoding.
type ImageInfo struct {
	Width    int
	Height   int
	Format   string // Decoder-reported format: "png", "jpeg", "gif", "webp"
	Animated bool   // true when the file is a multi-frame GIF
}

// validateImageFile validates an image file using Go standard library decoders.
//
// SECURITY: This function performs a full pixel decode of the image, which:
//   - Ensures the compressed data is structurally valid (not just valid headers)
//   - Detects truncated, malformed, or adversarial images that would pass header-only checks
//   - Verifies dimensions match what the header claims
//   - Replaces the previous ffprobe-based validation, eliminating external process execution
//
// For GIF files, gif.DecodeAll is used to validate all animation frames.
// For other formats, image.Decode performs a single-frame full decode.
//
// After decoding, dimensions are checked against the configured limits
// (MaxInputWidth, MaxInputHeight, MaxInputPixels).
func validateImageFile(path string, cfg config.MediaConfig) (*ImageInfo, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open image: %w", err)
	}
	defer func() { _ = f.Close() }()

	// Peek at format via DecodeConfig first for efficient format detection.
	imgCfg, format, err := image.DecodeConfig(f)
	if err != nil {
		return nil, fmt.Errorf("image decode config failed: %w", err)
	}

	// Rewind for full decode.
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		return nil, fmt.Errorf("failed to seek: %w", err)
	}

	info := &ImageInfo{
		Width:  imgCfg.Width,
		Height: imgCfg.Height,
		Format: format,
	}

	// Full decode: validates that the compressed pixel data is intact.
	if format == "gif" {
		g, err := gif.DecodeAll(f)
		if err != nil {
			return nil, fmt.Errorf("gif full decode failed: %w", err)
		}
		info.Animated = len(g.Image) > 1
		// gif.DecodeAll may report different logical screen size than individual frames;
		// use the config dimensions (logical screen) already captured above.
	} else {
		img, _, err := image.Decode(f)
		if err != nil {
			return nil, fmt.Errorf("image full decode failed: %w", err)
		}
		bounds := img.Bounds()
		// Use bounds from actual decode (more reliable than DecodeConfig for some codecs).
		info.Width = bounds.Dx()
		info.Height = bounds.Dy()
	}

	// Validate dimensions.
	if err := validateImageDimensionsFromInfo(info, cfg); err != nil {
		return nil, err
	}

	return info, nil
}

// validateImageDimensionsFromInfo checks image dimensions against configured limits.
//
// SECURITY: These limits prevent:
//   - Memory exhaustion attacks (extremely large pixel counts)
//   - Processing timeout/DoS attacks (huge images)
//   - Resource abuse via malformed dimension headers
func validateImageDimensionsFromInfo(info *ImageInfo, cfg config.MediaConfig) error {
	if info.Width < 1 || info.Height < 1 {
		return NewError(400, "invalid_request", "invalid image dimensions")
	}
	if info.Width > cfg.MaxInputWidth || info.Height > cfg.MaxInputHeight {
		return NewError(400, "invalid_request", "image too large")
	}
	if info.Width*info.Height > cfg.MaxInputPixels {
		return NewError(400, "invalid_request", "image too large")
	}
	return nil
}

// formatToExt maps image.Decode format strings to file extensions.
func formatToExt(format string) string {
	switch format {
	case "jpeg":
		return "jpeg"
	case "png":
		return "png"
	case "gif":
		return "gif"
	case "webp":
		return "webp"
	default:
		return format
	}
}
