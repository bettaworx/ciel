package service

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"testing"
)

func validDrawingDocument() DrawingDocument {
	return DrawingDocument{
		Version:    DrawingFormatVersion,
		Background: "#fefefe",
		Strokes: []DrawingStroke{{
			Color: "#0a1b2c",
			Size:  24,
			Points: [][4]int32{
				{0, 400, 800, 512},
				{8, 4, -2, 600},
			},
		}},
	}
}

func drawingJSON(t *testing.T, doc DrawingDocument) []byte {
	t.Helper()
	b, err := json.Marshal(doc)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func TestParseAndCompressDrawingRoundTrip(t *testing.T) {
	doc, compressed, err := parseAndCompressDrawing(bytes.NewReader(drawingJSON(t, validDrawingDocument())))
	if err != nil {
		t.Fatal(err)
	}
	if doc.Background != "#FEFEFE" || doc.Strokes[0].Color != "#0A1B2C" {
		t.Fatalf("colors were not normalized: %#v", doc)
	}

	zr, err := gzip.NewReader(bytes.NewReader(compressed))
	if err != nil {
		t.Fatal(err)
	}
	raw, err := io.ReadAll(zr)
	if err != nil {
		t.Fatal(err)
	}
	var got DrawingDocument
	if err := json.Unmarshal(raw, &got); err != nil {
		t.Fatal(err)
	}
	if got.Strokes[0].Points[1] != [4]int32{8, 4, -2, 600} {
		t.Fatalf("point changed during round trip: %#v", got.Strokes[0].Points[1])
	}
}

func TestParseAndCompressDrawingRejectsInvalidData(t *testing.T) {
	cases := map[string]func(*DrawingDocument){
		"version":    func(d *DrawingDocument) { d.Version = 2 },
		"background": func(d *DrawingDocument) { d.Background = "white" },
		"color":      func(d *DrawingDocument) { d.Strokes[0].Color = "#GG0000" },
		"size":       func(d *DrawingDocument) { d.Strokes[0].Size = 0 },
		"pressure":   func(d *DrawingDocument) { d.Strokes[0].Points[0][3] = 1025 },
		"delay":      func(d *DrawingDocument) { d.Strokes[0].Points[0][0] = 60001 },
		"bounds":     func(d *DrawingDocument) { d.Strokes[0].Points[1][1] = 5000 },
		"empty":      func(d *DrawingDocument) { d.Strokes[0].Points = nil },
	}
	for name, mutate := range cases {
		t.Run(name, func(t *testing.T) {
			doc := validDrawingDocument()
			mutate(&doc)
			if _, _, err := parseAndCompressDrawing(bytes.NewReader(drawingJSON(t, doc))); err == nil {
				t.Fatal("expected invalid drawing to be rejected")
			}
		})
	}
}

func TestParseAndCompressDrawingRejectsUnknownAndTrailingData(t *testing.T) {
	if _, _, err := parseAndCompressDrawing(strings.NewReader(`{"version":1,"background":"#FFFFFF","strokes":[],"extra":true}`)); err == nil {
		t.Fatal("expected unknown field to be rejected")
	}
	if _, _, err := parseAndCompressDrawing(strings.NewReader(`{"version":1,"background":"#FFFFFF","strokes":[]} {}`)); err == nil {
		t.Fatal("expected trailing data to be rejected")
	}
}

func TestParseAndCompressDrawingRejectsInputOverLimit(t *testing.T) {
	input := io.MultiReader(
		strings.NewReader(`{"version":1,"background":"#FFFFFF","strokes":[]}`),
		io.LimitReader(zeroReader{}, MaxDrawingInputBytes),
	)
	_, _, err := parseAndCompressDrawing(input)
	if !errors.Is(err, errDrawingTooLarge) {
		t.Fatalf("expected size error, got %v", err)
	}
}

type zeroReader struct{}

func (zeroReader) Read(p []byte) (int, error) {
	for i := range p {
		p[i] = 0
	}
	return len(p), nil
}

func BenchmarkDrawingEncoding(b *testing.B) {
	for _, points := range []int{10_000, 50_000, 100_000, 250_000} {
		doc := validDrawingDocument()
		doc.Strokes[0].Points = make([][4]int32, points)
		doc.Strokes[0].Points[0] = [4]int32{0, 2400, 1600, 512}
		for i := 1; i < points; i++ {
			doc.Strokes[0].Points[i] = [4]int32{8, int32(i%3 - 1), int32((i/3)%3 - 1), 512}
		}
		raw, err := json.Marshal(doc)
		if err != nil {
			b.Fatal(err)
		}
		b.Run(fmt.Sprintf("%d_points", points), func(b *testing.B) {
			for range b.N {
				_, compressed, err := parseAndCompressDrawing(bytes.NewReader(raw))
				if err != nil {
					b.Fatal(err)
				}
				b.ReportMetric(float64(len(compressed))/(1<<20), "MiB/file")
			}
		})
	}
}
