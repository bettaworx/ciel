package service

import (
	"bytes"
	"encoding/binary"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"backend/internal/db/sqlc"

	"github.com/google/uuid"
)

func TestValidateDrawingPreview(t *testing.T) {
	ffmpeg, err := exec.LookPath("ffmpeg")
	if err != nil {
		t.Skip("ffmpeg not available")
	}
	makePreview := func(t *testing.T, size string) []byte {
		t.Helper()
		path := filepath.Join(t.TempDir(), "preview.webp")
		cmd := exec.Command(ffmpeg, "-v", "error", "-f", "lavfi", "-i", "color=white:size="+size, "-frames:v", "1", "-y", path)
		if out, err := cmd.CombinedOutput(); err != nil {
			t.Skipf("cannot create WebP fixture: %v: %s", err, out)
		}
		data, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		return data
	}

	if err := validateDrawingPreview(makePreview(t, "1200x800")); err != nil {
		t.Fatalf("valid preview rejected: %v", err)
	}
	if err := validateDrawingPreview(makePreview(t, "600x400")); err == nil || !strings.Contains(err.Error(), "1200x800") {
		t.Fatalf("wrong dimensions should be rejected, got %v", err)
	}
}

func TestValidateDrawingPreviewRejectsAnimationBeforeDecode(t *testing.T) {
	var data bytes.Buffer
	data.WriteString("RIFF")
	_ = binary.Write(&data, binary.LittleEndian, uint32(12))
	data.WriteString("WEBP")
	data.WriteString("ANIM")
	_ = binary.Write(&data, binary.LittleEndian, uint32(0))
	if err := validateDrawingPreview(data.Bytes()); err == nil || !strings.Contains(err.Error(), "static") {
		t.Fatalf("animated preview should be rejected, got %v", err)
	}
}

func TestMapDrawing(t *testing.T) {
	id := uuid.New()
	created := time.Now().UTC()
	got := mapDrawing(sqlc.Drawing{
		ID:              id,
		FormatVersion:   1,
		BackgroundColor: "#FFFFFF",
		Width:           1200,
		Height:          800,
		DataBytes:       100,
		PreviewBytes:    200,
		CreatedAt:       created,
	})
	if got.Id != id || got.BackgroundColor != "#FFFFFF" || got.CreatedAt != created {
		t.Fatalf("unexpected drawing mapping: %#v", got)
	}
	if !strings.Contains(got.PreviewUrl, id.String()) || !strings.Contains(got.ReplayUrl, id.String()) {
		t.Fatalf("drawing URLs do not contain id: %#v", got)
	}
}
