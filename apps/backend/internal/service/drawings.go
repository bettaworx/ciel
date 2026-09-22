package service

import (
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"golang.org/x/image/webp"
)

const drawingMultipartOverhead = 1 << 20

type DrawingService struct {
	store      *repository.Store
	drawingDir string
	storageErr error
}

func NewDrawingService(store *repository.Store, mediaDir string, mediaInitErr error) *DrawingService {
	dir := filepath.Join(mediaDir, "drawings")
	storageErr := mediaInitErr
	if storageErr == nil {
		storageErr = os.MkdirAll(dir, 0o755)
	}
	return &DrawingService{store: store, drawingDir: dir, storageErr: storageErr}
}

func (s *DrawingService) UploadFromRequest(w http.ResponseWriter, r *http.Request, user auth.User) (api.Drawing, error) {
	if s.store == nil {
		return api.Drawing{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if s.storageErr != nil || strings.TrimSpace(s.drawingDir) == "" {
		return api.Drawing{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "drawing storage not configured")
	}

	maxRequestBytes := int64(MaxDrawingInputBytes + MaxDrawingPreviewBytes + drawingMultipartOverhead)
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBytes)
	if err := r.ParseMultipartForm(maxRequestBytes); err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			return api.Drawing{}, NewError(http.StatusRequestEntityTooLarge, "drawing_too_large", "drawing upload exceeds its limit")
		}
		return api.Drawing{}, NewError(http.StatusBadRequest, "invalid_drawing", "invalid multipart drawing upload")
	}
	if r.MultipartForm != nil {
		defer func() { _ = r.MultipartForm.RemoveAll() }()
	}

	dataFile, dataHeader, err := r.FormFile("data")
	if err != nil {
		return api.Drawing{}, NewError(http.StatusBadRequest, "invalid_drawing", "data file required")
	}
	defer func() { _ = dataFile.Close() }()
	if dataHeader.Size > MaxDrawingInputBytes {
		return api.Drawing{}, NewError(http.StatusRequestEntityTooLarge, "drawing_too_large", "drawing data exceeds its limit")
	}
	doc, compressed, err := parseAndCompressDrawing(dataFile)
	if err != nil {
		if errors.Is(err, errDrawingTooLarge) {
			return api.Drawing{}, NewError(http.StatusRequestEntityTooLarge, "drawing_too_large", "drawing data exceeds its limit")
		}
		return api.Drawing{}, NewError(http.StatusBadRequest, "invalid_drawing", err.Error())
	}

	previewFile, previewHeader, err := r.FormFile("preview")
	if err != nil {
		return api.Drawing{}, NewError(http.StatusBadRequest, "invalid_drawing", "preview file required")
	}
	defer func() { _ = previewFile.Close() }()
	if previewHeader.Size > MaxDrawingPreviewBytes {
		return api.Drawing{}, NewError(http.StatusRequestEntityTooLarge, "drawing_too_large", "drawing preview exceeds its limit")
	}
	preview, err := io.ReadAll(io.LimitReader(previewFile, MaxDrawingPreviewBytes+1))
	if err != nil {
		return api.Drawing{}, err
	}
	if len(preview) > MaxDrawingPreviewBytes {
		return api.Drawing{}, NewError(http.StatusRequestEntityTooLarge, "drawing_too_large", "drawing preview exceeds its limit")
	}
	if err := validateDrawingPreview(preview); err != nil {
		return api.Drawing{}, NewError(http.StatusBadRequest, "invalid_drawing", err.Error())
	}

	id := uuid.New()
	tmpDir, err := os.MkdirTemp(s.drawingDir, ".upload-*")
	if err != nil {
		return api.Drawing{}, err
	}
	cleanupTmp := true
	defer func() {
		if cleanupTmp {
			_ = os.RemoveAll(tmpDir)
		}
	}()
	if err := os.WriteFile(filepath.Join(tmpDir, "strokes.json.gz"), compressed, 0o600); err != nil {
		return api.Drawing{}, err
	}
	if err := os.WriteFile(filepath.Join(tmpDir, "preview.webp"), preview, 0o600); err != nil {
		return api.Drawing{}, err
	}

	finalDir := filepath.Join(s.drawingDir, id.String())
	if err := os.Rename(tmpDir, finalDir); err != nil {
		return api.Drawing{}, err
	}
	cleanupTmp = false

	row, err := s.store.Q.CreateDrawing(r.Context(), sqlc.CreateDrawingParams{
		ID:              id,
		UserID:          user.ID,
		FormatVersion:   DrawingFormatVersion,
		BackgroundColor: doc.Background,
		Width:           DrawingWidth,
		Height:          DrawingHeight,
		DataBytes:       int32(len(compressed)),
		PreviewBytes:    int32(len(preview)),
	})
	if err != nil {
		_ = os.RemoveAll(finalDir)
		return api.Drawing{}, err
	}
	return mapDrawing(row), nil
}

func validateDrawingPreview(data []byte) error {
	if len(data) < 12 || string(data[:4]) != "RIFF" || string(data[8:12]) != "WEBP" {
		return errors.New("preview must be a WebP image")
	}
	for offset := 12; offset+8 <= len(data); {
		chunkType := string(data[offset : offset+4])
		chunkSize := int(binary.LittleEndian.Uint32(data[offset+4 : offset+8]))
		if chunkType == "ANIM" || chunkType == "ANMF" {
			return errors.New("preview must be a static WebP image")
		}
		offset += 8 + chunkSize + chunkSize%2
		if offset > len(data) {
			return errors.New("invalid WebP preview")
		}
	}
	config, err := webp.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return errors.New("invalid WebP preview")
	}
	if config.Width != DrawingWidth || config.Height != DrawingHeight {
		return fmt.Errorf("preview must be %dx%d", DrawingWidth, DrawingHeight)
	}
	return nil
}

func (s *DrawingService) ServePreview(w http.ResponseWriter, r *http.Request) {
	s.serveFile(w, r, "preview.webp", "image/webp", false)
}

func (s *DrawingService) ServeReplay(w http.ResponseWriter, r *http.Request) {
	s.serveFile(w, r, "strokes.json.gz", "application/vnd.ciel.drawing+json", true)
}

func (s *DrawingService) serveFile(w http.ResponseWriter, r *http.Request, filename, contentType string, gzipEncoded bool) {
	id, err := uuid.Parse(chi.URLParam(r, "drawingId"))
	if err != nil || s.store == nil {
		http.NotFound(w, r)
		return
	}
	drawing, err := s.store.Q.GetDrawingByID(r.Context(), id)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	access, err := s.store.Q.IsDrawingPublic(r.Context(), sqlc.IsDrawingPublicParams{
		DrawingID: id,
		ViewerID:  viewerFromRequest(r),
	})
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	if !access.IsPublic {
		user, ok := auth.UserFromContext(r.Context())
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		if user.ID != drawing.UserID {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
	}

	file, err := os.Open(filepath.Join(s.drawingDir, id.String(), filename))
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer func() { _ = file.Close() }()
	stat, err := file.Stat()
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", mediaCacheControl(access.IsRestricted))
	if gzipEncoded {
		w.Header().Set("Content-Encoding", "gzip")
	}
	http.ServeContent(w, r, filename, stat.ModTime(), file)
}

func mapDrawing(row sqlc.Drawing) api.Drawing {
	return api.Drawing{
		Id:              row.ID,
		FormatVersion:   api.DrawingFormatVersion(row.FormatVersion),
		BackgroundColor: row.BackgroundColor,
		Width:           api.DrawingWidth(row.Width),
		Height:          api.DrawingHeight(row.Height),
		DataBytes:       int(row.DataBytes),
		PreviewBytes:    int(row.PreviewBytes),
		PreviewUrl:      drawingPreviewURL(row.ID),
		ReplayUrl:       drawingReplayURL(row.ID),
		CreatedAt:       row.CreatedAt,
	}
}

func drawingPreviewURL(id uuid.UUID) string {
	return publicBaseURL() + "/drawings/" + id.String() + "/preview.webp"
}

func drawingReplayURL(id uuid.UUID) string {
	return publicBaseURL() + "/drawings/" + id.String() + "/replay.json"
}

func (s *DrawingService) Delete(ctx context.Context, id uuid.UUID) error {
	if s.store == nil {
		return nil
	}
	if err := s.store.Q.DeleteDrawingByID(ctx, id); err != nil {
		return err
	}
	return os.RemoveAll(filepath.Join(s.drawingDir, id.String()))
}
