package service

import (
	"bufio"
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

	info := &ImageInfo{
		Width:  imgCfg.Width,
		Height: imgCfg.Height,
		Format: format,
	}

	// Reject anything outside the allowlist, even if the byte-level MIME sniff
	// let it through.
	if _, ok := allowedImageFormats[format]; !ok {
		return nil, NewError(400, "unsupported_media_type", "unsupported image format")
	}

	// SECURITY: check the header's dimensions BEFORE decoding a single pixel.
	// A uniform 16384x16384 PNG compresses to a few hundred kilobytes, so it
	// sails past the upload size limit and then asks for a gigabyte. The header
	// is all it takes to know that, and it costs nothing.
	if err := validateImageDimensionsFromInfo(info, cfg); err != nil {
		return nil, err
	}

	// Rewind for full decode.
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		return nil, fmt.Errorf("failed to seek: %w", err)
	}

	// Full decode: validates that the compressed pixel data is intact.
	if format == "gif" {
		// Bound the animation before decoding it: gif.DecodeAll allocates every frame.
		if err := checkGifFrameBudget(path); err != nil {
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

	// And again on what actually came out, in case the header undersold it.
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

// checkGifFrameBudget rejects GIFs whose frames would decode to more than
// maxGifFramePixels in total, by walking the block structure without decoding
// any pixels.
//
// The walk has to be real. Counting 0x2C separator bytes in the raw file looks
// like a cheap upper bound but is useless: 0x2C is an ordinary byte inside LZW
// data, and a 1280x720 51-frame GIF contains around 40,000 of them.
func checkGifFrameBudget(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("failed to open image: %w", err)
	}
	defer func() { _ = f.Close() }()

	r := bufio.NewReader(f)

	// Header (6) + Logical Screen Descriptor (7); the packed byte says whether a
	// Global Color Table follows and how big it is.
	var head [13]byte
	if _, err := io.ReadFull(r, head[:]); err != nil {
		return NewError(400, "invalid_request", "invalid gif")
	}
	if err := skipColorTable(r, head[10]); err != nil {
		return err
	}

	totalPixels := 0
	for {
		introducer, err := r.ReadByte()
		if err != nil {
			// A truncated file is the decoder's problem to report, not ours.
			return nil
		}

		switch introducer {
		case 0x3B: // Trailer
			return nil

		case 0x21: // Extension: label, then data sub-blocks
			if _, err := r.ReadByte(); err != nil {
				return nil
			}
			if err := skipSubBlocks(r); err != nil {
				return nil
			}

		case 0x2C: // Image Descriptor: x, y, w, h, packed
			var desc [9]byte
			if _, err := io.ReadFull(r, desc[:]); err != nil {
				return nil
			}
			w := int(desc[4]) | int(desc[5])<<8
			h := int(desc[6]) | int(desc[7])<<8
			totalPixels += w * h
			if totalPixels > maxGifFramePixels {
				return NewError(400, "invalid_request", "gif animation too large")
			}
			if err := skipColorTable(r, desc[8]); err != nil {
				return err
			}
			if _, err := r.ReadByte(); err != nil { // LZW minimum code size
				return nil
			}
			if err := skipSubBlocks(r); err != nil {
				return nil
			}

		default:
			// Not a structure we recognise; leave the verdict to the decoder.
			return nil
		}
	}
}

// skipColorTable advances past a color table when the packed field announces one.
func skipColorTable(r *bufio.Reader, packed byte) error {
	if packed&0x80 == 0 {
		return nil
	}
	size := 3 * (1 << ((packed & 0x07) + 1))
	if _, err := io.CopyN(io.Discard, r, int64(size)); err != nil {
		return NewError(400, "invalid_request", "invalid gif")
	}
	return nil
}

// skipSubBlocks advances past a chain of length-prefixed data sub-blocks.
func skipSubBlocks(r *bufio.Reader) error {
	for {
		n, err := r.ReadByte()
		if err != nil {
			return err
		}
		if n == 0 {
			return nil
		}
		if _, err := io.CopyN(io.Discard, r, int64(n)); err != nil {
			return err
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
