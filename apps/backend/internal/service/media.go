package service

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/config"
	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

const (
	// Upload size limit - hard cap to prevent DoS attacks via large file uploads
	maxUploadBytes = int64(12 << 20) // 12 MiB

	// Input validation limits - relaxed to accept larger images for automatic resizing
	// These limits prevent memory exhaustion and processing timeout attacks
	maxImageWidth  = 16384       // Maximum input width (16K resolution)
	maxImageHeight = 16384       // Maximum input height (16K resolution)
	maxImagePixels = 100_000_000 // Maximum total pixels (~100 megapixels, e.g., 10000x10000)

	// Output size limits - images automatically resized to these constraints
	maxOutputEdgePx    = 1920 // Maximum output edge for regular images (posts)
	avatarOutputPx     = 400  // Avatar output size (square crop)
	defaultWebPQuality = 80
)

var allowedExt = map[string]struct{}{
	".png":  {},
	".jpg":  {},
	".jpeg": {},
	".webp": {},
}

var expectedMimeByExt = map[string]string{
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
}

var allowedMIMESniff = map[string]struct{}{
	"image/png":  {},
	"image/jpeg": {},
	"image/webp": {},
}

type MediaService struct {
	store       *repository.Store
	mediaDir    string
	ffmpegPath  string
	ffprobePath string
	initErr     error // Initialization error (directory creation/permission issue)
}

const storedImageExt = "webp"

type imageConvertFunc func(ctx context.Context, inPath, outPath string) error
type imageUploadFunc func(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader) (api.Media, error)

func NewMediaService(store *repository.Store, mediaDir string, initErr error) *MediaService {
	ffmpegPath, _ := exec.LookPath("ffmpeg")
	ffprobePath, _ := exec.LookPath("ffprobe")
	return &MediaService{
		store:       store,
		mediaDir:    mediaDir,
		ffmpegPath:  ffmpegPath,
		ffprobePath: ffprobePath,
		initErr:     initErr,
	}
}

func (s *MediaService) UploadImageFromRequest(w http.ResponseWriter, r *http.Request, user auth.User) (api.Media, error) {
	return s.uploadFromRequest(w, r, user, s.uploadImage)
}

func (s *MediaService) UploadAvatarFromRequest(w http.ResponseWriter, r *http.Request, user auth.User) (api.Media, error) {
	return s.uploadFromRequest(w, r, user, s.uploadAvatar)
}

func (s *MediaService) uploadFromRequest(w http.ResponseWriter, r *http.Request, user auth.User, upload imageUploadFunc) (api.Media, error) {
	if s.initErr != nil {
		return api.Media{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "media storage not available")
	}
	if s.store == nil {
		return api.Media{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if s.ffmpegPath == "" || s.ffprobePath == "" {
		return api.Media{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "ffmpeg/ffprobe not available")
	}
	if strings.TrimSpace(s.mediaDir) == "" {
		return api.Media{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "media storage not configured")
	}

	// Hard cap request size.
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes)

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		var mbe *http.MaxBytesError
		if errors.As(err, &mbe) {
			return api.Media{}, NewError(http.StatusRequestEntityTooLarge, "payload_too_large", "file too large")
		}
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "invalid multipart form")
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "file is required")
	}
	defer file.Close()

	return upload(r.Context(), user, file, header)
}

func (s *MediaService) ServeImage(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "mediaId")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	// Check if media exists and get its metadata
	if s.store == nil {
		http.Error(w, "service unavailable", http.StatusServiceUnavailable)
		return
	}

	row, err := s.store.Q.GetMediaByID(r.Context(), id)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	// Access control: Media attached to posts or used as avatars is public.
	// Unattached media (drafts) requires authentication and ownership.
	// Server icon from config is also considered public.
	cfg := config.GetGlobalConfig()
	var serverIconMediaID uuid.NullUUID
	if cfg != nil && cfg.Server.IconMediaID != nil {
		serverIconMediaID = uuid.NullUUID{
			UUID:  *cfg.Server.IconMediaID,
			Valid: true,
		}
	}

	isPublic, err := s.store.Q.IsMediaPublic(r.Context(), sqlc.IsMediaPublicParams{
		MediaID:           id,
		ServerIconMediaID: serverIconMediaID,
	})
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if !isPublic.Valid || !isPublic.Bool {
		// Media not public - require authentication and ownership
		user, ok := auth.UserFromContext(r.Context())
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		if user.ID != row.UserID {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
	}

	// Determine stored extension
	ext := strings.TrimPrefix(strings.ToLower(strings.TrimSpace(row.Ext)), ".")
	if ext == "" {
		ext = storedImageExt
	}

	// Serve the file
	p := filepath.Join(s.mediaDir, id.String(), "image."+ext)
	f, err := os.Open(p)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()

	// Currently we store WebP only.
	w.Header().Set("Content-Type", "image/webp")
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	_, _ = io.Copy(w, f)
}

func (s *MediaService) DeleteMedia(ctx context.Context, userID uuid.UUID, mediaID uuid.UUID) error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	// Verify media exists and check ownership
	media, err := s.store.Q.GetMediaByID(ctx, mediaID)
	if err != nil {
		return NewError(http.StatusNotFound, "not_found", "media not found")
	}

	if media.UserID != userID {
		return NewError(http.StatusForbidden, "forbidden", "not the owner")
	}

	if err := s.store.Q.DeleteMediaByID(ctx, mediaID); err != nil {
		return err
	}
	if strings.TrimSpace(s.mediaDir) == "" {
		return nil
	}
	_ = os.RemoveAll(filepath.Join(s.mediaDir, mediaID.String()))
	return nil
}

func (s *MediaService) uploadImage(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader) (api.Media, error) {
	return s.uploadImageWithOptions(ctx, user, src, header, "image", s.convertToWebP, 0)
}

func (s *MediaService) uploadAvatar(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader) (api.Media, error) {
	return s.uploadImageWithOptions(ctx, user, src, header, "avatar", s.convertToWebPAvatar, avatarOutputPx)
}

func (s *MediaService) uploadImageWithOptions(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader, mediaType string, convert imageConvertFunc, expectedSize int) (api.Media, error) {
	// Validate file metadata
	_, declaredCT, ext, err := s.validateUploadMetadata(header)
	if err != nil {
		return api.Media{}, err
	}

	// Write upload to temporary file with content validation
	inPath, totalSize, err := s.writeUploadToTemp(src, ext, declaredCT)
	if err != nil {
		return api.Media{}, err
	}
	defer os.Remove(inPath)

	// Verify file size
	if totalSize > maxUploadBytes {
		return api.Media{}, NewError(http.StatusRequestEntityTooLarge, "payload_too_large", "file too large")
	}

	// Validate image dimensions
	if err := s.validateImageDimensions(ctx, inPath); err != nil {
		return api.Media{}, err
	}

	// Convert, save, and create database record
	return s.convertAndSaveImage(ctx, user, inPath, mediaType, convert, expectedSize)
}

// validateUploadMetadata validates file metadata (filename, extension, MIME type)
func (s *MediaService) validateUploadMetadata(header *multipart.FileHeader) (filename, declaredCT, ext string, err error) {
	if header == nil {
		return "", "", "", NewError(http.StatusBadRequest, "invalid_request", "file header is required")
	}

	filename = header.Filename
	declaredCT = strings.TrimSpace(header.Header.Get("Content-Type"))

	if filename == "" {
		return "", "", "", NewError(http.StatusBadRequest, "invalid_request", "filename is required")
	}

	ext = strings.ToLower(filepath.Ext(filename))
	if _, ok := allowedExt[ext]; !ok {
		return "", "", "", NewError(http.StatusUnsupportedMediaType, "unsupported_media_type", "unsupported file extension")
	}

	return filename, declaredCT, ext, nil
}

// writeUploadToTemp writes uploaded file to a temporary location while validating content
func (s *MediaService) writeUploadToTemp(src multipart.File, ext, declaredCT string) (string, int64, error) {
	inTmp, err := os.CreateTemp("", "ciel-upload-*")
	if err != nil {
		return "", 0, err
	}
	inPath := inTmp.Name()

	// Read first 512 bytes for MIME sniffing
	buf := make([]byte, 512)
	n, readErr := io.ReadFull(src, buf)
	if readErr != nil && !errors.Is(readErr, io.ErrUnexpectedEOF) && !errors.Is(readErr, io.EOF) {
		_ = inTmp.Close()
		_ = os.Remove(inPath)
		return "", 0, NewError(http.StatusBadRequest, "invalid_request", "failed to read file")
	}
	if n == 0 {
		_ = inTmp.Close()
		_ = os.Remove(inPath)
		return "", 0, NewError(http.StatusBadRequest, "invalid_request", "empty file")
	}

	// Validate MIME type
	if err := validateMIMEType(buf[:n], ext, declaredCT); err != nil {
		_ = inTmp.Close()
		_ = os.Remove(inPath)
		return "", 0, err
	}

	// Write to temp file
	if _, err := inTmp.Write(buf[:n]); err != nil {
		_ = inTmp.Close()
		_ = os.Remove(inPath)
		return "", 0, err
	}

	written, err := io.Copy(inTmp, src)
	if err != nil {
		_ = inTmp.Close()
		_ = os.Remove(inPath)
		return "", 0, NewError(http.StatusBadRequest, "invalid_request", "failed to receive upload")
	}

	if err := inTmp.Close(); err != nil {
		_ = os.Remove(inPath)
		return "", 0, err
	}

	// written does not include the first n bytes
	totalSize := int64(n) + written
	return inPath, totalSize, nil
}

// validateMIMEType validates MIME type from content sniffing and declared headers
func validateMIMEType(buf []byte, ext, declaredCT string) error {
	expectedMime := expectedMimeByExt[ext]

	// Validate sniffed MIME type
	sniff := http.DetectContentType(buf)
	if _, ok := allowedMIMESniff[sniff]; !ok {
		return NewError(http.StatusUnsupportedMediaType, "unsupported_media_type", "unsupported mime type")
	}
	if expectedMime != "" && sniff != expectedMime {
		return NewError(http.StatusUnsupportedMediaType, "unsupported_media_type", "file extension and content-type mismatch")
	}

	// Validate declared content type if present
	if declaredCT != "" && declaredCT != "application/octet-stream" {
		if _, ok := allowedMIMESniff[declaredCT]; !ok {
			return NewError(http.StatusUnsupportedMediaType, "unsupported_media_type", "unsupported content-type")
		}
		if expectedMime != "" && declaredCT != expectedMime {
			return NewError(http.StatusUnsupportedMediaType, "unsupported_media_type", "file extension and declared content-type mismatch")
		}
	}

	return nil
}

// validateImageDimensions validates image dimensions using ffprobe
//
// SECURITY: These limits prevent:
// - Memory exhaustion attacks (extremely large pixel counts)
// - Processing timeout/DoS attacks (computationally expensive operations on huge images)
// - ffmpeg exploitation via malformed image dimensions
//
// Valid images exceeding old limits (4096x4096, 12MP) will be automatically resized
// to maxOutputEdgePx (1920px) by convertToWebP, preserving aspect ratio.
func (s *MediaService) validateImageDimensions(ctx context.Context, imagePath string) error {
	w, h, err := s.probeDimensions(ctx, imagePath)
	if err != nil {
		return NewError(http.StatusBadRequest, "invalid_request", "invalid image")
	}
	if w < 1 || h < 1 {
		return NewError(http.StatusBadRequest, "invalid_request", "invalid image")
	}
	// Reject only extremely large images to prevent resource exhaustion
	if w > maxImageWidth || h > maxImageHeight || (w*h) > maxImagePixels {
		return NewError(http.StatusBadRequest, "invalid_request", "image too large")
	}
	return nil
}

// convertAndSaveImage converts the image, saves it, and creates a database record
func (s *MediaService) convertAndSaveImage(ctx context.Context, user auth.User, inPath, mediaType string, convert imageConvertFunc, expectedSize int) (api.Media, error) {
	id := uuid.New()
	outDir := filepath.Join(s.mediaDir, id.String())
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return api.Media{}, err
	}

	outTmp := filepath.Join(outDir, "image.tmp."+storedImageExt)
	outPath := filepath.Join(outDir, "image."+storedImageExt)
	cleanupOut := func() { _ = os.RemoveAll(outDir) }

	// Convert image
	if err := convert(ctx, inPath, outTmp); err != nil {
		cleanupOut()
		reason := strings.TrimSpace(err.Error())
		if reason != "" {
			if len(reason) > 240 {
				reason = reason[:240] + "..."
			}
			return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "failed to convert image: "+reason)
		}
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "failed to convert image")
	}

	if err := os.Rename(outTmp, outPath); err != nil {
		cleanupOut()
		return api.Media{}, err
	}

	// Verify converted dimensions
	wOut, hOut, err := s.probeDimensions(ctx, outPath)
	if err != nil {
		cleanupOut()
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "failed to read converted image")
	}
	if expectedSize > 0 && (wOut != expectedSize || hOut != expectedSize) {
		cleanupOut()
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "failed to convert image")
	}

	// Create database record
	row, err := s.store.Q.CreateMedia(ctx, sqlc.CreateMediaParams{
		ID:     id,
		UserID: user.ID,
		Type:   mediaType,
		Ext:    storedImageExt,
		Width:  int32(wOut),
		Height: int32(hOut),
	})
	if err != nil {
		cleanupOut()
		return api.Media{}, err
	}

	return api.Media{
		Id:        row.ID,
		Type:      api.MediaType("image"),
		Url:       mediaImageURL(row.ID, row.Ext),
		Width:     int(row.Width),
		Height:    int(row.Height),
		CreatedAt: row.CreatedAt,
	}, nil
}

func (s *MediaService) probeDimensions(ctx context.Context, path string) (int, int, error) {
	cmd := exec.CommandContext(ctx, s.ffprobePath,
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "stream=width,height",
		"-of", "csv=s=x:p=0",
		path,
	)
	out, err := cmd.Output()
	if err != nil {
		return 0, 0, err
	}
	line := strings.TrimSpace(string(out))
	parts := strings.Split(line, "x")
	if len(parts) != 2 {
		return 0, 0, fmt.Errorf("unexpected ffprobe output: %q", line)
	}
	w, err := strconv.Atoi(strings.TrimSpace(parts[0]))
	if err != nil {
		return 0, 0, err
	}
	h, err := strconv.Atoi(strings.TrimSpace(parts[1]))
	if err != nil {
		return 0, 0, err
	}
	return w, h, nil
}

func (s *MediaService) convertToWebPAvatar(ctx context.Context, inPath, outPath string) error {
	// Scale to cover and center-crop to a square avatar.
	vf := fmt.Sprintf("scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d", avatarOutputPx, avatarOutputPx, avatarOutputPx, avatarOutputPx)
	args := []string{
		"-hide_banner",
		"-loglevel", "error",
		"-y",
		"-i", inPath,
		"-frames:v", "1",
		"-map_metadata", "-1",
		"-map_chapters", "-1",
		"-vf", vf,
		"-f", "webp",
		"-c:v", "libwebp",
		"-q:v", strconv.Itoa(defaultWebPQuality),
		"-an",
		outPath,
	}

	cmd := exec.CommandContext(ctx, s.ffmpegPath, args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		msg = strings.ReplaceAll(msg, inPath, "<input>")
		msg = strings.ReplaceAll(msg, outPath, "<output>")

		// SECURITY: Log detailed error server-side, return generic error to client
		slog.Error("ffmpeg conversion failed", "error", err, "stderr", msg)
		return fmt.Errorf("media conversion failed")
	}
	return nil
}

func (s *MediaService) convertToWebP(ctx context.Context, inPath, outPath string) error {
	// SECURITY: Automatically resize images to maxOutputEdgePx (1920px) to:
	// - Limit output resolution and prevent storage exhaustion
	// - Strip metadata (EXIF/XMP/GPS) that may contain sensitive location/device info
	// - Preserve aspect ratio while fitting within maximum edge constraint
	// - Convert all formats to WebP for consistent, optimized output
	//
	// NOTE: Avoid quoting expressions here; Go exec passes quotes literally and ffmpeg filter parsing becomes brittle.
	// Also escape commas inside min() for ffmpeg expression parser.
	vf := fmt.Sprintf("scale=w=min(%d\\,iw):h=min(%d\\,ih):force_original_aspect_ratio=decrease", maxOutputEdgePx, maxOutputEdgePx)
	args := []string{
		"-hide_banner",
		"-loglevel", "error",
		"-y",
		"-i", inPath,
		"-frames:v", "1",
		"-map_metadata", "-1",
		"-map_chapters", "-1",
		"-vf", vf,
		"-f", "webp",
		"-c:v", "libwebp",
		"-q:v", strconv.Itoa(defaultWebPQuality),
		"-an",
		outPath,
	}

	cmd := exec.CommandContext(ctx, s.ffmpegPath, args...)
	// Capture stderr for diagnostics.
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		// Best-effort sanitize: avoid leaking local temp paths.
		msg = strings.ReplaceAll(msg, inPath, "<input>")
		msg = strings.ReplaceAll(msg, outPath, "<output>")

		// SECURITY: Log detailed error server-side, return generic error to client
		slog.Error("ffmpeg conversion failed", "error", err, "stderr", msg)
		return fmt.Errorf("media conversion failed")
	}
	return nil
}
