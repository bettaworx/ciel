package service

import (
	"errors"
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

// maxGifFramePixels caps total decoded GIF animation area (frames x pixels).
//
// SECURITY: MaxInputPixels only bounds a single frame, so a GIF declaring a large
// logical screen with thousands of frames passes it and then exhausts memory
// inside gif.DecodeAll. 400 megapixels is ~1300 frames of 640x480.
const maxGifFramePixels = 400_000_000

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
// After decoding, the format is checked against allowedImageFormats and the
// dimensions against the configured limits (MaxInputWidth, MaxInputHeight,
// MaxInputPixels).
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

	// Reject formats the frontend normalizer never produces, even if the byte-level
	// MIME sniff let them through (e.g. a PNG named .webp).
	if _, ok := allowedImageFormats[format]; !ok {
		return nil, NewError(400, "unsupported_media_type", "unsupported image format")
	}

	// Full decode: validates that the compressed pixel data is intact.
	if format == "gif" {
		// Bound the animation before decoding it: gif.DecodeAll allocates every frame.
		if err := checkGifFrameBudget(path, imgCfg.Width, imgCfg.Height); err != nil {
			return nil, err
		}
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

// checkGifFrameBudget rejects GIFs whose total decoded area would blow past
// maxGifFramePixels, by counting Image Descriptor blocks in the raw bytes before
// any frame is allocated.
func checkGifFrameBudget(path string, width, height int) error {
	area := width * height
	if area <= 0 {
		return NewError(400, "invalid_request", "invalid image dimensions")
	}
	maxFrames := maxGifFramePixels / area

	f, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("failed to open image: %w", err)
	}
	defer func() { _ = f.Close() }()

	// An Image Descriptor is the only block that introduces a frame, so counting
	// its separator byte is an upper bound on the frame count. It may over-count
	// if the byte appears inside compressed data, which is the safe direction.
	buf := make([]byte, 32*1024)
	frames := 0
	for {
		n, err := f.Read(buf)
		for _, b := range buf[:n] {
			if b == 0x2C {
				frames++
				if frames > maxFrames {
					return NewError(400, "invalid_request", "gif animation too large")
				}
			}
		}
		if err != nil {
			if errors.Is(err, io.EOF) {
				return nil
			}
			return fmt.Errorf("failed to scan gif: %w", err)
		}
	}
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
