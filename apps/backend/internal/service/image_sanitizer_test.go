package service

import (
	"bytes"
	"encoding/binary"
	"image"
	"image/color"
	"image/gif"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"
	"testing"
)

// ---------------------------------------------------------------------------
// JPEG sanitizer tests
// ---------------------------------------------------------------------------

func TestSanitizeJPEG(t *testing.T) {
	// Build a JPEG with EXIF data by encoding normally (Go's jpeg encoder
	// produces a minimal file with no EXIF, but we can prepend an APP1 marker).
	inPath := filepath.Join(t.TempDir(), "in.jpg")
	outPath := filepath.Join(t.TempDir(), "out.jpg")

	// Encode a minimal JPEG to get valid compressed data.
	var buf bytes.Buffer
	img := image.NewRGBA(image.Rect(0, 0, 4, 4))
	img.Set(0, 0, color.RGBA{R: 255, A: 255})
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 90}); err != nil {
		t.Fatal(err)
	}
	raw := buf.Bytes()

	// Inject a fake APP1 (EXIF) segment after SOI.
	// SOI = FF D8 (2 bytes), then we inject APP1.
	var withExif bytes.Buffer
	withExif.Write(raw[:2]) // SOI
	// APP1 marker: FF E1 + 2-byte length (big-endian) + payload.
	fakeExif := []byte("Exif\x00\x00fake-exif-data-here")
	withExif.WriteByte(0xFF)
	withExif.WriteByte(0xE1)
	segLen := uint16(2 + len(fakeExif))
	withExif.WriteByte(byte(segLen >> 8))
	withExif.WriteByte(byte(segLen))
	withExif.Write(fakeExif)
	withExif.Write(raw[2:]) // Rest of original JPEG

	if err := os.WriteFile(inPath, withExif.Bytes(), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := sanitizeJPEG(inPath, outPath); err != nil {
		t.Fatalf("sanitizeJPEG failed: %v", err)
	}

	// Verify output is a valid JPEG.
	outData, err := os.ReadFile(outPath)
	if err != nil {
		t.Fatal(err)
	}
	if len(outData) < 2 || outData[0] != 0xFF || outData[1] != 0xD8 {
		t.Fatal("output is not a valid JPEG (bad SOI)")
	}

	// Verify EXIF segment was stripped.
	if bytes.Contains(outData, []byte("fake-exif-data-here")) {
		t.Error("EXIF data was not stripped from JPEG")
	}

	// Verify the image still decodes.
	f, err := os.Open(outPath)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	if _, err := jpeg.Decode(f); err != nil {
		t.Fatalf("sanitized JPEG does not decode: %v", err)
	}
}

func TestSanitizeJPEG_NoExif(t *testing.T) {
	// A JPEG with no metadata should pass through without error.
	inPath := filepath.Join(t.TempDir(), "in.jpg")
	outPath := filepath.Join(t.TempDir(), "out.jpg")

	var buf bytes.Buffer
	img := image.NewRGBA(image.Rect(0, 0, 2, 2))
	if err := jpeg.Encode(&buf, img, nil); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(inPath, buf.Bytes(), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := sanitizeJPEG(inPath, outPath); err != nil {
		t.Fatalf("sanitizeJPEG failed on clean JPEG: %v", err)
	}

	f, err := os.Open(outPath)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	if _, err := jpeg.Decode(f); err != nil {
		t.Fatalf("sanitized JPEG does not decode: %v", err)
	}
}

func TestSanitizeJPEG_InvalidFile(t *testing.T) {
	inPath := filepath.Join(t.TempDir(), "bad.jpg")
	outPath := filepath.Join(t.TempDir(), "out.jpg")
	if err := os.WriteFile(inPath, []byte("not a jpeg"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := sanitizeJPEG(inPath, outPath); err == nil {
		t.Fatal("expected error for invalid JPEG")
	}
}

// ---------------------------------------------------------------------------
// PNG sanitizer tests
// ---------------------------------------------------------------------------

func TestSanitizePNG(t *testing.T) {
	inPath := filepath.Join(t.TempDir(), "in.png")
	outPath := filepath.Join(t.TempDir(), "out.png")

	// Build a PNG with a tEXt chunk by encoding with Go's png encoder then
	// injecting a tEXt chunk before IEND.
	var buf bytes.Buffer
	img := image.NewRGBA(image.Rect(0, 0, 4, 4))
	img.Set(1, 1, color.RGBA{G: 255, A: 255})
	if err := png.Encode(&buf, img); err != nil {
		t.Fatal(err)
	}
	raw := buf.Bytes()

	// Find IEND position and inject a tEXt chunk before it.
	iendIdx := bytes.Index(raw, []byte("IEND"))
	if iendIdx < 4 {
		t.Fatal("could not find IEND chunk")
	}
	iendStart := iendIdx - 4 // 4 bytes for length field

	var withText bytes.Buffer
	withText.Write(raw[:iendStart])

	// tEXt chunk: length(4) + "tEXt"(4) + data + CRC(4)
	textPayload := []byte("Comment\x00secret GPS data here")
	chunkLen := uint32(len(textPayload))
	binary.Write(&withText, binary.BigEndian, chunkLen)
	withText.WriteString("tEXt")
	withText.Write(textPayload)
	crc := pngCRC32("tEXt", textPayload)
	binary.Write(&withText, binary.BigEndian, crc)

	withText.Write(raw[iendStart:]) // IEND and beyond

	if err := os.WriteFile(inPath, withText.Bytes(), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := sanitizePNG(inPath, outPath); err != nil {
		t.Fatalf("sanitizePNG failed: %v", err)
	}

	// Verify metadata stripped.
	outData, err := os.ReadFile(outPath)
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Contains(outData, []byte("secret GPS data here")) {
		t.Error("tEXt metadata was not stripped from PNG")
	}
	if bytes.Contains(outData, []byte("tEXt")) {
		t.Error("tEXt chunk type still present in output")
	}

	// Verify image still decodes.
	f, err := os.Open(outPath)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	if _, err := png.Decode(f); err != nil {
		t.Fatalf("sanitized PNG does not decode: %v", err)
	}
}

func TestSanitizePNG_Clean(t *testing.T) {
	inPath := filepath.Join(t.TempDir(), "in.png")
	outPath := filepath.Join(t.TempDir(), "out.png")

	var buf bytes.Buffer
	img := image.NewRGBA(image.Rect(0, 0, 2, 2))
	if err := png.Encode(&buf, img); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(inPath, buf.Bytes(), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := sanitizePNG(inPath, outPath); err != nil {
		t.Fatalf("sanitizePNG failed: %v", err)
	}

	f, err := os.Open(outPath)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	if _, err := png.Decode(f); err != nil {
		t.Fatalf("sanitized PNG does not decode: %v", err)
	}
}

func TestSanitizePNG_InvalidFile(t *testing.T) {
	inPath := filepath.Join(t.TempDir(), "bad.png")
	outPath := filepath.Join(t.TempDir(), "out.png")
	if err := os.WriteFile(inPath, []byte("not a png"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := sanitizePNG(inPath, outPath); err == nil {
		t.Fatal("expected error for invalid PNG")
	}
}

// ---------------------------------------------------------------------------
// GIF sanitizer tests
// ---------------------------------------------------------------------------

func TestSanitizeGIF(t *testing.T) {
	inPath := filepath.Join(t.TempDir(), "in.gif")
	outPath := filepath.Join(t.TempDir(), "out.gif")

	// Create a simple animated GIF.
	g := &gif.GIF{}
	for i := 0; i < 2; i++ {
		img := image.NewPaletted(image.Rect(0, 0, 4, 4), color.Palette{color.White, color.Black})
		g.Image = append(g.Image, img)
		g.Delay = append(g.Delay, 10)
	}

	f, err := os.Create(inPath)
	if err != nil {
		t.Fatal(err)
	}
	if err := gif.EncodeAll(f, g); err != nil {
		f.Close()
		t.Fatal(err)
	}
	f.Close()

	if err := sanitizeGIF(inPath, outPath); err != nil {
		t.Fatalf("sanitizeGIF failed: %v", err)
	}

	// Verify output decodes as a valid GIF.
	of, err := os.Open(outPath)
	if err != nil {
		t.Fatal(err)
	}
	defer of.Close()

	decoded, err := gif.DecodeAll(of)
	if err != nil {
		t.Fatalf("sanitized GIF does not decode: %v", err)
	}
	if len(decoded.Image) != 2 {
		t.Errorf("expected 2 frames, got %d", len(decoded.Image))
	}
}

func TestSanitizeGIF_Static(t *testing.T) {
	inPath := filepath.Join(t.TempDir(), "in.gif")
	outPath := filepath.Join(t.TempDir(), "out.gif")

	g := &gif.GIF{
		Image: []*image.Paletted{
			image.NewPaletted(image.Rect(0, 0, 8, 8), color.Palette{color.White}),
		},
		Delay: []int{0},
	}

	f, err := os.Create(inPath)
	if err != nil {
		t.Fatal(err)
	}
	if err := gif.EncodeAll(f, g); err != nil {
		f.Close()
		t.Fatal(err)
	}
	f.Close()

	if err := sanitizeGIF(inPath, outPath); err != nil {
		t.Fatalf("sanitizeGIF failed: %v", err)
	}

	of, err := os.Open(outPath)
	if err != nil {
		t.Fatal(err)
	}
	defer of.Close()
	if _, err := gif.DecodeAll(of); err != nil {
		t.Fatalf("sanitized static GIF does not decode: %v", err)
	}
}

func TestSanitizeGIF_InvalidFile(t *testing.T) {
	inPath := filepath.Join(t.TempDir(), "bad.gif")
	outPath := filepath.Join(t.TempDir(), "out.gif")
	if err := os.WriteFile(inPath, []byte("not a gif"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := sanitizeGIF(inPath, outPath); err == nil {
		t.Fatal("expected error for invalid GIF")
	}
}

// ---------------------------------------------------------------------------
// sanitizeImage dispatch tests
// ---------------------------------------------------------------------------

func TestSanitizeImage_UnsupportedFormat(t *testing.T) {
	if err := sanitizeImage("in.bmp", "out.bmp", "bmp"); err == nil {
		t.Fatal("expected error for unsupported format")
	}
}

func TestSanitizeImage_Dispatch(t *testing.T) {
	// Verify dispatch routes to the correct sanitizer by testing each format.
	tests := []struct {
		format   string
		writeIn  func(t *testing.T, path string)
		validate func(t *testing.T, path string)
	}{
		{
			format: "png",
			writeIn: func(t *testing.T, path string) {
				t.Helper()
				var buf bytes.Buffer
				img := image.NewRGBA(image.Rect(0, 0, 2, 2))
				png.Encode(&buf, img)
				os.WriteFile(path, buf.Bytes(), 0o644)
			},
			validate: func(t *testing.T, path string) {
				t.Helper()
				f, _ := os.Open(path)
				defer f.Close()
				if _, err := png.Decode(f); err != nil {
					t.Fatalf("output not valid PNG: %v", err)
				}
			},
		},
		{
			format: "jpeg",
			writeIn: func(t *testing.T, path string) {
				t.Helper()
				var buf bytes.Buffer
				img := image.NewRGBA(image.Rect(0, 0, 2, 2))
				jpeg.Encode(&buf, img, nil)
				os.WriteFile(path, buf.Bytes(), 0o644)
			},
			validate: func(t *testing.T, path string) {
				t.Helper()
				f, _ := os.Open(path)
				defer f.Close()
				if _, err := jpeg.Decode(f); err != nil {
					t.Fatalf("output not valid JPEG: %v", err)
				}
			},
		},
		{
			format: "gif",
			writeIn: func(t *testing.T, path string) {
				t.Helper()
				g := &gif.GIF{
					Image: []*image.Paletted{image.NewPaletted(image.Rect(0, 0, 2, 2), color.Palette{color.White})},
					Delay: []int{0},
				}
				f, _ := os.Create(path)
				gif.EncodeAll(f, g)
				f.Close()
			},
			validate: func(t *testing.T, path string) {
				t.Helper()
				f, _ := os.Open(path)
				defer f.Close()
				if _, err := gif.DecodeAll(f); err != nil {
					t.Fatalf("output not valid GIF: %v", err)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.format, func(t *testing.T) {
			inPath := filepath.Join(t.TempDir(), "in."+tt.format)
			outPath := filepath.Join(t.TempDir(), "out."+tt.format)

			tt.writeIn(t, inPath)

			if err := sanitizeImage(inPath, outPath, tt.format); err != nil {
				t.Fatalf("sanitizeImage(%q) failed: %v", tt.format, err)
			}

			tt.validate(t, outPath)
		})
	}
}

// ---------------------------------------------------------------------------
// writeFileAtomic tests
// ---------------------------------------------------------------------------

func TestWriteFileAtomic(t *testing.T) {
	outPath := filepath.Join(t.TempDir(), "atomic.bin")
	data := []byte("hello atomic write")

	if err := writeFileAtomic(outPath, data); err != nil {
		t.Fatalf("writeFileAtomic failed: %v", err)
	}

	got, err := os.ReadFile(outPath)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, data) {
		t.Errorf("data mismatch: got %q, want %q", got, data)
	}

	// Temp file should not exist.
	if _, err := os.Stat(outPath + ".tmp"); err == nil {
		t.Error("temp file was not cleaned up")
	}
}

// ---------------------------------------------------------------------------
// mimeForExt tests (from media.go)
// ---------------------------------------------------------------------------

func TestMimeForExt(t *testing.T) {
	tests := []struct {
		ext  string
		want string
	}{
		{"webp", "image/webp"},
		{".webp", "image/webp"},
		{"png", "image/png"},
		{"jpg", "image/jpeg"},
		{"jpeg", "image/jpeg"},
		{"gif", "image/gif"},
		{"bmp", "application/octet-stream"},
		{"", "application/octet-stream"},
	}
	for _, tt := range tests {
		if got := mimeForExt(tt.ext); got != tt.want {
			t.Errorf("mimeForExt(%q) = %q, want %q", tt.ext, got, tt.want)
		}
	}
}
