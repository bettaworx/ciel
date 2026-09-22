package service

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
)

const (
	DrawingFormatVersion   = 1
	DrawingWidth           = 1200
	DrawingHeight          = 800
	DrawingCoordinateScale = 4
	MaxDrawingInputBytes   = 16 << 20
	MaxDrawingDataBytes    = 4 << 20
	MaxDrawingPreviewBytes = 2 << 20
	MaxDrawingStrokes      = 10_000
	MaxDrawingPoints       = 250_000
	maxDrawingBrushSize    = 1200
	maxDrawingPointDelayMS = 60_000
	maxDrawingPressure     = 1024
)

var errDrawingTooLarge = errors.New("drawing data exceeds its limit")

// DrawingDocument is the stable replay format. Point 0 stores
// [delayMs, xQ4, yQ4, pressure]; later points store coordinate deltas.
type DrawingDocument struct {
	Version    int             `json:"version"`
	Background string          `json:"background"`
	Strokes    []DrawingStroke `json:"strokes"`
}

type DrawingStroke struct {
	Tool   string     `json:"tool"`
	Brush  string     `json:"brush,omitempty"`
	Color  string     `json:"color,omitempty"`
	Size   int32      `json:"size"`
	Points [][4]int32 `json:"points"`
}

func parseAndCompressDrawing(src io.Reader) (DrawingDocument, []byte, error) {
	raw, err := io.ReadAll(io.LimitReader(src, MaxDrawingInputBytes+1))
	if err != nil {
		return DrawingDocument{}, nil, err
	}
	if len(raw) > MaxDrawingInputBytes {
		return DrawingDocument{}, nil, errDrawingTooLarge
	}

	var doc DrawingDocument
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&doc); err != nil {
		return DrawingDocument{}, nil, fmt.Errorf("invalid drawing json: %w", err)
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return DrawingDocument{}, nil, errors.New("invalid drawing json: trailing data")
	}
	if err := validateDrawingDocument(&doc); err != nil {
		return DrawingDocument{}, nil, err
	}

	var compressed bytes.Buffer
	zw := gzip.NewWriter(&compressed)
	encoder := json.NewEncoder(zw)
	encoder.SetEscapeHTML(false)
	if err := encoder.Encode(doc); err != nil {
		_ = zw.Close()
		return DrawingDocument{}, nil, err
	}
	if err := zw.Close(); err != nil {
		return DrawingDocument{}, nil, err
	}
	if compressed.Len() > MaxDrawingDataBytes {
		return DrawingDocument{}, nil, errDrawingTooLarge
	}
	return doc, compressed.Bytes(), nil
}

func validateDrawingDocument(doc *DrawingDocument) error {
	if doc.Version != DrawingFormatVersion {
		return fmt.Errorf("unsupported drawing version %d", doc.Version)
	}
	background, ok := normalizeDrawingColor(doc.Background)
	if !ok {
		return errors.New("invalid drawing background color")
	}
	doc.Background = background
	if len(doc.Strokes) > MaxDrawingStrokes {
		return errDrawingTooLarge
	}

	totalPoints := 0
	for strokeIndex := range doc.Strokes {
		stroke := &doc.Strokes[strokeIndex]
		switch stroke.Tool {
		case "pencil":
			switch stroke.Brush {
			case "", "round", "gpen", "marker", "pencil", "dot":
			default:
				return fmt.Errorf("stroke %d has an invalid brush", strokeIndex)
			}
			color, ok := normalizeDrawingColor(stroke.Color)
			if !ok {
				return fmt.Errorf("stroke %d has an invalid color", strokeIndex)
			}
			stroke.Color = color
		case "eraser":
			if stroke.Brush != "" {
				return fmt.Errorf("stroke %d eraser must not have a brush", strokeIndex)
			}
			if stroke.Color != "" {
				return fmt.Errorf("stroke %d eraser must not have a color", strokeIndex)
			}
		default:
			return fmt.Errorf("stroke %d has an invalid tool", strokeIndex)
		}
		if stroke.Size < 1 || stroke.Size > maxDrawingBrushSize {
			return fmt.Errorf("stroke %d has an invalid size", strokeIndex)
		}
		if len(stroke.Points) == 0 {
			return fmt.Errorf("stroke %d has no points", strokeIndex)
		}
		totalPoints += len(stroke.Points)
		if totalPoints > MaxDrawingPoints {
			return errDrawingTooLarge
		}

		var x, y int64
		for pointIndex, point := range stroke.Points {
			if point[0] < 0 || point[0] > maxDrawingPointDelayMS {
				return fmt.Errorf("stroke %d point %d has an invalid delay", strokeIndex, pointIndex)
			}
			if point[3] < 0 || point[3] > maxDrawingPressure {
				return fmt.Errorf("stroke %d point %d has an invalid pressure", strokeIndex, pointIndex)
			}
			if pointIndex == 0 {
				x, y = int64(point[1]), int64(point[2])
			} else {
				x += int64(point[1])
				y += int64(point[2])
			}
			if x < 0 || x > DrawingWidth*DrawingCoordinateScale || y < 0 || y > DrawingHeight*DrawingCoordinateScale {
				return fmt.Errorf("stroke %d point %d is outside the canvas", strokeIndex, pointIndex)
			}
		}
	}
	return nil
}

func normalizeDrawingColor(value string) (string, bool) {
	if len(value) != 7 || value[0] != '#' {
		return "", false
	}
	value = strings.ToUpper(value)
	for _, ch := range value[1:] {
		if (ch < '0' || ch > '9') && (ch < 'A' || ch > 'F') {
			return "", false
		}
	}
	return value, true
}
