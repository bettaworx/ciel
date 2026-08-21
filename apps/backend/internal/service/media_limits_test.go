package service

import (
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"hash/crc32"
	"mime/multipart"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"backend/internal/config"
)

// hugePNGHeader builds a PNG that declares enormous dimensions and then stops.
// DecodeConfig reads the size happily; decoding it would fail. Which error comes
// back therefore tells us whether the size was checked before the decode.
func hugePNGHeader(t *testing.T, width, height uint32) string {
	t.Helper()

	var ihdr bytes.Buffer
	_ = binary.Write(&ihdr, binary.BigEndian, width)
	_ = binary.Write(&ihdr, binary.BigEndian, height)
	ihdr.Write([]byte{8, 0, 0, 0, 0}) // 8-bit greyscale, no interlace

	var out bytes.Buffer
	out.Write([]byte("\x89PNG\r\n\x1a\n"))
	_ = binary.Write(&out, binary.BigEndian, uint32(ihdr.Len()))
	chunk := append([]byte("IHDR"), ihdr.Bytes()...)
	out.Write(chunk)
	_ = binary.Write(&out, binary.BigEndian, crc32.ChecksumIEEE(chunk))

	path := filepath.Join(t.TempDir(), "bomb.png")
	if err := os.WriteFile(path, out.Bytes(), 0o600); err != nil {
		t.Fatal(err)
	}
	return path
}

// SECURITY: a uniform 16384x16384 PNG compresses to a few hundred kilobytes, so
// it passes the upload size limit and then asks for a gigabyte. The dimensions
// have to be rejected from the header, before any pixel is decoded.
func TestValidateImageFile_RejectsOversizeBeforeDecoding(t *testing.T) {
	path := hugePNGHeader(t, 20000, 20000)

	stat, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if stat.Size() > 1024 {
		t.Fatalf("the point is that a bomb is tiny; this one is %d bytes", stat.Size())
	}

	_, err = validateImageFile(path, testMediaConfig())
	if err == nil {
		t.Fatal("expected a 20000x20000 image to be rejected")
	}

	// "image too large" comes from the dimension check; a decode failure would
	// report something else entirely, which is how we know the order is right.
	var svcErr *Error
	if !errors.As(err, &svcErr) || svcErr.Message != "image too large" {
		t.Fatalf("expected rejection on dimensions, got %v", err)
	}
}

func TestWriteUploadToTemp_RejectsOversizeBeforeCopying(t *testing.T) {
	svc := &MediaService{}
	const maxBytes = 1 << 20

	// A nil file is safe precisely because the size is settled before it is read.
	_, _, err := svc.writeUploadToTemp(nil, &multipart.FileHeader{Size: maxBytes + 1}, ".webp", "image/webp", maxBytes)

	var svcErr *Error
	if !errors.As(err, &svcErr) || svcErr.Status != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected 413 from the declared size alone, got %v", err)
	}
}

func TestParseFrameRate(t *testing.T) {
	cases := map[string]float64{
		"30/1":       30,
		"60000/1001": 59.94005994005994,
		"0/0":        0,
		"":           0,
		"garbage":    0,
		"120/1":      120,
	}
	for in, want := range cases {
		if got := parseFrameRate(in); got != want {
			t.Errorf("parseFrameRate(%q) = %v, want %v", in, got, want)
		}
	}
	if parseFrameRate("240/1") <= MaxVideoFrameRate {
		t.Error("240fps should read as over the cap")
	}
}

// ffmpegAvailable reports whether the encoders these fixtures need are present.
func ffmpegAvailable(t *testing.T) (string, string) {
	t.Helper()
	ffmpeg, err1 := exec.LookPath("ffmpeg")
	ffprobe, err2 := exec.LookPath("ffprobe")
	if err1 != nil || err2 != nil {
		t.Skip("ffmpeg/ffprobe not available")
	}
	return ffmpeg, ffprobe
}

func encodeWebM(t *testing.T, ffmpeg, path, size string) {
	t.Helper()
	cmd := exec.Command(ffmpeg, "-v", "error",
		"-f", "lavfi", "-i", "testsrc=size="+size+":rate=10:duration=1",
		"-c:v", "libvpx-vp9", "-y", path)
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Skipf("cannot build fixture (%v): %s", err, out)
	}
}

// SECURITY: VP8, VP9 and AV1 can change resolution part-way through a stream.
// ffprobe's stream header only describes the first frame, so a file can declare
// 320x240, pass every dimension check, and then hand the thumbnailer — and every
// viewer — something far larger.
func TestValidateVideoFile_RejectsMidStreamResolutionChange(t *testing.T) {
	ffmpeg, ffprobe := ffmpegAvailable(t)
	dir := t.TempDir()

	small := filepath.Join(dir, "small.webm")
	large := filepath.Join(dir, "large.webm")
	encodeWebM(t, ffmpeg, small, "320x240")
	encodeWebM(t, ffmpeg, large, "1280x720")

	list := filepath.Join(dir, "list.txt")
	if err := os.WriteFile(list, []byte("file '"+small+"'\nfile '"+large+"'\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	mixed := filepath.Join(dir, "mixed.webm")
	if out, err := exec.Command(ffmpeg, "-v", "error", "-f", "concat", "-safe", "0",
		"-i", list, "-c", "copy", "-y", mixed).CombinedOutput(); err != nil {
		t.Skipf("cannot build fixture (%v): %s", err, out)
	}

	svc := &MediaService{ffprobePath: ffprobe, cfg: config.DefaultConfig().Media}

	if _, err := svc.validateVideoFile(context.Background(), small, ".webm"); err != nil {
		t.Fatalf("a single-resolution webm should pass, got %v", err)
	}
	if _, err := svc.validateVideoFile(context.Background(), mixed, ".webm"); err == nil {
		t.Fatal("expected a webm that changes resolution mid-stream to be rejected")
	}
}
