package service

import (
	"image"
	"image/color"
	"image/gif"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"
	"testing"

	"backend/internal/config"
)

func testMediaConfig() config.MediaConfig {
	return config.DefaultConfig().Media
}

// writeTempPNG creates a minimal valid PNG file and returns its path.
func writeTempPNG(t *testing.T, w, h int) string {
	t.Helper()
	f, err := os.CreateTemp(t.TempDir(), "test-*.png")
	if err != nil {
		t.Fatal(err)
	}
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	img.Set(0, 0, color.RGBA{R: 255, A: 255})
	if err := png.Encode(f, img); err != nil {
		_ = f.Close()
		t.Fatal(err)
	}
	_ = f.Close()
	return f.Name()
}

// writeTempJPEG creates a minimal valid JPEG file and returns its path.
func writeTempJPEG(t *testing.T, w, h int) string {
	t.Helper()
	f, err := os.CreateTemp(t.TempDir(), "test-*.jpg")
	if err != nil {
		t.Fatal(err)
	}
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	if err := jpeg.Encode(f, img, &jpeg.Options{Quality: 90}); err != nil {
		_ = f.Close()
		t.Fatal(err)
	}
	_ = f.Close()
	return f.Name()
}

// writeTempGIF creates a minimal valid GIF file and returns its path.
// If frames > 1, it writes an animated GIF.
func writeTempGIF(t *testing.T, w, h, frames int) string {
	t.Helper()
	f, err := os.CreateTemp(t.TempDir(), "test-*.gif")
	if err != nil {
		t.Fatal(err)
	}

	g := &gif.GIF{}
	for i := 0; i < frames; i++ {
		img := image.NewPaletted(image.Rect(0, 0, w, h), color.Palette{color.White, color.Black})
		g.Image = append(g.Image, img)
		g.Delay = append(g.Delay, 10)
	}

	if err := gif.EncodeAll(f, g); err != nil {
		_ = f.Close()
		t.Fatal(err)
	}
	_ = f.Close()
	return f.Name()
}

func TestValidateImageFile_AcceptedFormats(t *testing.T) {
	cases := map[string]struct {
		path   string
		format string
	}{
		"png":  {writeTempPNG(t, 100, 80), "png"},
		"jpeg": {writeTempJPEG(t, 200, 150), "jpeg"},
	}

	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			info, err := validateImageFile(tc.path, testMediaConfig())
			if err != nil {
				t.Fatalf("expected %s to be accepted, got %v", name, err)
			}
			if info.Format != tc.format {
				t.Errorf("expected format=%s, got %q", tc.format, info.Format)
			}
			if info.Animated {
				t.Errorf("expected Animated=false for %s", name)
			}
		})
	}
}

// A valid file in a format outside the allowlist is still refused, so the
// accepted set stays exactly the one config declares.
func TestValidateImageFile_RejectsFormatsOutsideTheAllowlist(t *testing.T) {
	path := writeTempPNG(t, 8, 8)
	saved := allowedImageFormats
	allowedImageFormats = map[string]struct{}{"webp": {}}
	t.Cleanup(func() { allowedImageFormats = saved })

	if _, err := validateImageFile(path, testMediaConfig()); err == nil {
		t.Fatal("expected a format outside the allowlist to be rejected")
	}
}

// The budget is total decoded area, so it must let an ordinary animation past
// and only stop one whose frames add up to more than the cap. A byte-counting
// heuristic used to fail the first of these: 0x2C is common inside LZW data, so
// a 51-frame GIF looked like tens of thousands of frames.
func TestCheckGifFrameBudget(t *testing.T) {
	t.Run("ordinary animation passes", func(t *testing.T) {
		// 1280x720 x 51 frames is ~47 megapixels, well inside the cap, but has
		// enough compressed data to trip a naive separator-byte count.
		path := writeTempGIF(t, 1280, 720, 51)
		if err := checkGifFrameBudget(path); err != nil {
			t.Fatalf("expected a 51-frame 1280x720 gif to pass, got %v", err)
		}
	})

	t.Run("single frame passes", func(t *testing.T) {
		if err := checkGifFrameBudget(writeTempGIF(t, 64, 64, 1)); err != nil {
			t.Fatalf("expected a single-frame gif to pass, got %v", err)
		}
	})

	t.Run("oversized animation is rejected", func(t *testing.T) {
		// 4000x4000 x 32 frames is ~512 megapixels, past maxGifFramePixels.
		path := writeTempGIF(t, 4000, 4000, 32)
		if err := checkGifFrameBudget(path); err == nil {
			t.Fatal("expected a gif over the pixel budget to be rejected")
		}
	})

	t.Run("garbage does not hang or panic", func(t *testing.T) {
		f := filepath.Join(t.TempDir(), "junk.gif")
		if err := os.WriteFile(f, []byte("GIF89a not really a gif at all"), 0o600); err != nil {
			t.Fatal(err)
		}
		// Malformed input is the decoder's to reject; this must simply return.
		if err := checkGifFrameBudget(f); err != nil {
			t.Fatalf("expected malformed input to be left to the decoder, got %v", err)
		}
	})
}

func TestValidateImageFile_GIF_Static(t *testing.T) {
	path := writeTempGIF(t, 64, 64, 1)

	info, err := validateImageFile(path, testMediaConfig())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if info.Format != "gif" {
		t.Errorf("expected format=gif, got %q", info.Format)
	}
	if info.Animated {
		t.Error("expected Animated=false for single-frame GIF")
	}
}

func TestValidateImageFile_GIF_Animated(t *testing.T) {
	path := writeTempGIF(t, 64, 64, 3)

	info, err := validateImageFile(path, testMediaConfig())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if info.Format != "gif" {
		t.Errorf("expected format=gif, got %q", info.Format)
	}
	if !info.Animated {
		t.Error("expected Animated=true for multi-frame GIF")
	}
}

func TestValidateImageFile_TooLarge(t *testing.T) {
	cfg := testMediaConfig()
	cfg.MaxInputWidth = 50
	cfg.MaxInputHeight = 50
	cfg.MaxInputPixels = 2500

	path := writeTempPNG(t, 100, 100)

	_, err := validateImageFile(path, cfg)
	if err == nil {
		t.Fatal("expected error for oversized image, got nil")
	}
}

func TestValidateImageFile_TooManyPixels(t *testing.T) {
	cfg := testMediaConfig()
	cfg.MaxInputWidth = 16384
	cfg.MaxInputHeight = 16384
	cfg.MaxInputPixels = 100 // Very low pixel limit

	path := writeTempPNG(t, 20, 20) // 400 pixels > 100

	_, err := validateImageFile(path, cfg)
	if err == nil {
		t.Fatal("expected error for too many pixels, got nil")
	}
}

func TestValidateImageFile_InvalidFile(t *testing.T) {
	// Write garbage data.
	path := filepath.Join(t.TempDir(), "garbage.png")
	if err := os.WriteFile(path, []byte("this is not an image"), 0o644); err != nil {
		t.Fatal(err)
	}

	_, err := validateImageFile(path, testMediaConfig())
	if err == nil {
		t.Fatal("expected error for invalid file, got nil")
	}
}

func TestValidateImageFile_EmptyFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "empty.png")
	if err := os.WriteFile(path, []byte{}, 0o644); err != nil {
		t.Fatal(err)
	}

	_, err := validateImageFile(path, testMediaConfig())
	if err == nil {
		t.Fatal("expected error for empty file, got nil")
	}
}

func TestValidateImageFile_NonExistent(t *testing.T) {
	_, err := validateImageFile("/nonexistent/path.png", testMediaConfig())
	if err == nil {
		t.Fatal("expected error for non-existent file, got nil")
	}
}

func TestFormatToExt(t *testing.T) {
	tests := []struct {
		format string
		want   string
	}{
		{"jpeg", "jpeg"},
		{"png", "png"},
		{"gif", "gif"},
		{"webp", "webp"},
		{"bmp", "bmp"}, // Unknown falls through.
	}
	for _, tt := range tests {
		if got := formatToExt(tt.format); got != tt.want {
			t.Errorf("formatToExt(%q) = %q, want %q", tt.format, got, tt.want)
		}
	}
}

func TestValidateImageDimensionsFromInfo(t *testing.T) {
	cfg := testMediaConfig()

	// Valid dimensions.
	info := &ImageInfo{Width: 100, Height: 100, Format: "png"}
	if err := validateImageDimensionsFromInfo(info, cfg); err != nil {
		t.Errorf("unexpected error for valid dimensions: %v", err)
	}

	// Zero width.
	info = &ImageInfo{Width: 0, Height: 100, Format: "png"}
	if err := validateImageDimensionsFromInfo(info, cfg); err == nil {
		t.Error("expected error for zero width")
	}

	// Exceeds max width.
	info = &ImageInfo{Width: cfg.MaxInputWidth + 1, Height: 100, Format: "png"}
	if err := validateImageDimensionsFromInfo(info, cfg); err == nil {
		t.Error("expected error for exceeding max width")
	}
}
