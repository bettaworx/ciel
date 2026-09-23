package service

import (
	"bytes"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"math"
	"strconv"
)

const maxDrawingPreviewWork = 64 << 20

type previewPoint struct {
	x, y     float64
	pressure int32
}

func renderDrawingPreview(doc DrawingDocument) ([]byte, error) {
	background := drawingColor(doc.Background, 0xff)
	canvas := image.NewRGBA(image.Rect(0, 0, DrawingWidth, DrawingHeight))
	draw.Draw(canvas, canvas.Bounds(), image.NewUniform(background), image.Point{}, draw.Src)
	ink := drawingColor(doc.Color, 0xff)
	work := int64(0)

	for _, stroke := range doc.Strokes {
		points := decodePreviewPoints(stroke)
		source := ink
		if stroke.Brush == "pencil" {
			source.A = 148
		}
		if stroke.Tool == "eraser" {
			source = background
		}

		if len(points) == 1 {
			if err := paintPreviewCapsule(canvas, points[0], points[0], previewLineWidth(stroke, points[0].pressure)/2, source, &work); err != nil {
				return nil, err
			}
			continue
		}
		for index := 1; index < len(points); index++ {
			from, to := points[index-1], points[index]
			width := (previewLineWidth(stroke, from.pressure) + previewLineWidth(stroke, to.pressure)) / 2
			if err := paintPreviewCapsule(canvas, from, to, width/2, source, &work); err != nil {
				return nil, err
			}
		}
	}

	var output bytes.Buffer
	if err := png.Encode(&output, canvas); err != nil {
		return nil, err
	}
	if output.Len() > MaxDrawingPreviewBytes {
		return nil, errDrawingTooLarge
	}
	return output.Bytes(), nil
}

func decodePreviewPoints(stroke DrawingStroke) []previewPoint {
	points := make([]previewPoint, len(stroke.Points))
	var x, y int64
	for index, point := range stroke.Points {
		if index == 0 {
			x, y = int64(point[1]), int64(point[2])
		} else {
			x += int64(point[1])
			y += int64(point[2])
		}
		points[index] = previewPoint{
			x:        float64(x) / DrawingCoordinateScale,
			y:        float64(y) / DrawingCoordinateScale,
			pressure: point[3],
		}
	}
	return points
}

func previewLineWidth(stroke DrawingStroke, pressure int32) float64 {
	size := float64(stroke.Size) / DrawingCoordinateScale
	normalizedPressure := float64(pressure) / maxDrawingPressure
	switch stroke.Brush {
	case "round":
		return size
	case "pencil":
		return size * 0.75 * (0.35 + 0.65*normalizedPressure)
	default:
		return size * (0.2 + 0.8*normalizedPressure)
	}
}

func paintPreviewCapsule(canvas *image.RGBA, from, to previewPoint, radius float64, source color.NRGBA, work *int64) error {
	dx, dy := to.x-from.x, to.y-from.y
	lengthSquared := dx*dx + dy*dy
	if lengthSquared == 0 {
		return paintPreviewCircle(canvas, from.x, from.y, radius, source, work)
	}

	padding := radius + 1
	if math.Abs(dx) >= math.Abs(dy) {
		start := max(int(math.Floor(math.Min(from.x, to.x)-padding)), 0)
		end := min(int(math.Ceil(math.Max(from.x, to.x)+padding)), DrawingWidth)
		scanRadius := padding * math.Sqrt(lengthSquared) / math.Abs(dx)
		for x := start; x < end; x++ {
			t := min(max((float64(x)+0.5-from.x)/dx, 0), 1)
			center := from.y + t*dy
			yStart := max(int(math.Floor(center-scanRadius)), 0)
			yEnd := min(int(math.Ceil(center+scanRadius)), DrawingHeight)
			for y := yStart; y < yEnd; y++ {
				if err := paintPreviewPixel(canvas, x, y, from, dx, dy, lengthSquared, radius, source, work); err != nil {
					return err
				}
			}
		}
		return nil
	}

	start := max(int(math.Floor(math.Min(from.y, to.y)-padding)), 0)
	end := min(int(math.Ceil(math.Max(from.y, to.y)+padding)), DrawingHeight)
	scanRadius := padding * math.Sqrt(lengthSquared) / math.Abs(dy)
	for y := start; y < end; y++ {
		t := min(max((float64(y)+0.5-from.y)/dy, 0), 1)
		center := from.x + t*dx
		xStart := max(int(math.Floor(center-scanRadius)), 0)
		xEnd := min(int(math.Ceil(center+scanRadius)), DrawingWidth)
		for x := xStart; x < xEnd; x++ {
			if err := paintPreviewPixel(canvas, x, y, from, dx, dy, lengthSquared, radius, source, work); err != nil {
				return err
			}
		}
	}
	return nil
}

func paintPreviewCircle(canvas *image.RGBA, x, y, radius float64, source color.NRGBA, work *int64) error {
	padding := radius + 1
	for py := max(int(math.Floor(y-padding)), 0); py < min(int(math.Ceil(y+padding)), DrawingHeight); py++ {
		for px := max(int(math.Floor(x-padding)), 0); px < min(int(math.Ceil(x+padding)), DrawingWidth); px++ {
			if err := addPreviewWork(work); err != nil {
				return err
			}
			blendPreviewPixel(canvas, px, py, radius+0.5-math.Hypot(float64(px)+0.5-x, float64(py)+0.5-y), source)
		}
	}
	return nil
}

func paintPreviewPixel(canvas *image.RGBA, x, y int, from previewPoint, dx, dy, lengthSquared, radius float64, source color.NRGBA, work *int64) error {
	if err := addPreviewWork(work); err != nil {
		return err
	}
	px, py := float64(x)+0.5, float64(y)+0.5
	t := min(max(((px-from.x)*dx+(py-from.y)*dy)/lengthSquared, 0), 1)
	distance := math.Hypot(px-(from.x+t*dx), py-(from.y+t*dy))
	blendPreviewPixel(canvas, x, y, radius+0.5-distance, source)
	return nil
}

func addPreviewWork(work *int64) error {
	(*work)++
	if *work > maxDrawingPreviewWork {
		return errDrawingTooLarge
	}
	return nil
}

func blendPreviewPixel(canvas *image.RGBA, x, y int, coverage float64, source color.NRGBA) {
	coverage = min(max(coverage, 0), 1) * float64(source.A) / 255
	if coverage == 0 {
		return
	}
	offset := canvas.PixOffset(x, y)
	inverse := 1 - coverage
	canvas.Pix[offset] = uint8(math.Round(float64(source.R)*coverage + float64(canvas.Pix[offset])*inverse))
	canvas.Pix[offset+1] = uint8(math.Round(float64(source.G)*coverage + float64(canvas.Pix[offset+1])*inverse))
	canvas.Pix[offset+2] = uint8(math.Round(float64(source.B)*coverage + float64(canvas.Pix[offset+2])*inverse))
	canvas.Pix[offset+3] = 0xff
}

func drawingColor(value string, alpha uint8) color.NRGBA {
	rgb, _ := strconv.ParseUint(value[1:], 16, 24)
	return color.NRGBA{R: uint8(rgb >> 16), G: uint8(rgb >> 8), B: uint8(rgb), A: alpha}
}
