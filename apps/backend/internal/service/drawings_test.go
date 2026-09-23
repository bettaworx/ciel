package service

import (
	"bytes"
	"image/png"
	"strings"
	"testing"
	"time"

	"backend/internal/db/sqlc"

	"github.com/google/uuid"
)

func TestRenderDrawingPreview(t *testing.T) {
	doc := validDrawingDocument()
	doc.Background = "#FFFFFF"
	doc.Color = "#000000"
	doc.Strokes[0].Brush = "round"
	doc.Strokes[0].Size = 40
	doc.Strokes[0].Points = []DrawingPoint{{0, 400, 800, 1024}, {8, 400, 0, 1024}}

	data, err := renderDrawingPreview(doc)
	if err != nil {
		t.Fatal(err)
	}
	preview, err := png.Decode(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("generated preview is not PNG: %v", err)
	}
	if preview.Bounds().Dx() != DrawingWidth || preview.Bounds().Dy() != DrawingHeight {
		t.Fatalf("unexpected preview dimensions: %v", preview.Bounds())
	}
	r, g, b, _ := preview.At(150, 200).RGBA()
	if r != 0 || g != 0 || b != 0 {
		t.Fatalf("stroke was not rendered at its point: %04x %04x %04x", r, g, b)
	}
}

func TestRenderDrawingPreviewAppliesEraser(t *testing.T) {
	doc := validDrawingDocument()
	doc.Background = "#FFFFFF"
	doc.Color = "#000000"
	doc.Strokes = []DrawingStroke{
		{Tool: "pencil", Brush: "round", Size: 40, Points: []DrawingPoint{{0, 400, 800, 1024}}},
		{Tool: "eraser", Size: 40, Points: []DrawingPoint{{0, 400, 800, 1024}}},
	}

	data, err := renderDrawingPreview(doc)
	if err != nil {
		t.Fatal(err)
	}
	preview, err := png.Decode(bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}
	r, g, b, _ := preview.At(100, 200).RGBA()
	if r != 0xffff || g != 0xffff || b != 0xffff {
		t.Fatalf("eraser did not restore the background: %04x %04x %04x", r, g, b)
	}

	work := int64(maxDrawingPreviewWork)
	if err := addPreviewWork(&work); err == nil {
		t.Fatal("expected excessive preview work to be rejected")
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
	if !strings.HasSuffix(got.PreviewUrl, "/preview.png") {
		t.Fatalf("drawing preview URL is not server-generated PNG: %s", got.PreviewUrl)
	}
}
