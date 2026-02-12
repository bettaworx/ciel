package service

import (
	"bytes"
	"context"
	"encoding/binary"
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

// expectedMimeByExt maps file extensions to their expected MIME types
var expectedMimeByExt = map[string]string{
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".gif":  "image/gif",
}

// allowedMIMESniff contains MIME types allowed after content sniffing
var allowedMIMESniff = map[string]struct{}{
	"image/png":  {},
	"image/jpeg": {},
	"image/webp": {},
	"image/gif":  {},
}

type MediaService struct {
	store       *repository.Store
	mediaDir    string
	ffmpegPath  string
	ffprobePath string
	cfg         config.MediaConfig // Media configuration
	initErr     error              // Initialization error (directory creation/permission issue)
}

const storedImageExt = "webp"

type imageConvertFunc func(ctx context.Context, inPath, outPath string) error
type imageUploadFunc func(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader) (api.Media, error)

func NewMediaService(store *repository.Store, mediaDir string, cfg config.MediaConfig, initErr error) *MediaService {
	ffmpegPath, _ := exec.LookPath("ffmpeg")
	ffprobePath, _ := exec.LookPath("ffprobe")
	return &MediaService{
		store:       store,
		mediaDir:    mediaDir,
		ffmpegPath:  ffmpegPath,
		ffprobePath: ffprobePath,
		cfg:         cfg,
		initErr:     initErr,
	}
}

func (s *MediaService) UploadImageFromRequest(w http.ResponseWriter, r *http.Request, user auth.User) (api.Media, error) {
	return s.uploadFromRequest(w, r, user, s.uploadImage)
}

func (s *MediaService) UploadAvatarFromRequest(w http.ResponseWriter, r *http.Request, user auth.User) (api.Media, error) {
	return s.uploadFromRequest(w, r, user, s.uploadAvatar)
}

func (s *MediaService) UploadServerIconFromRequest(w http.ResponseWriter, r *http.Request, user auth.User) (api.Media, error) {
	return s.uploadFromRequest(w, r, user, s.uploadServerIcon)
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
	r.Body = http.MaxBytesReader(w, r.Body, s.cfg.MaxUploadBytes())

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

	// Determine which file to serve based on the request path
	// For server icons with GIF uploads, we have both image.webp (animated) and image_static.webp (first frame)
	requestPath := r.URL.Path
	filename := "image." + ext
	if strings.HasSuffix(requestPath, "image_static.png") || strings.HasSuffix(requestPath, "image_static.webp") {
		filename = "image_static." + ext
	}

	// Serve the file
	p := filepath.Join(s.mediaDir, id.String(), filename)
	f, err := os.Open(p)
	if err != nil {
		// If static version doesn't exist, fall back to regular version
		if strings.Contains(filename, "static") {
			p = filepath.Join(s.mediaDir, id.String(), "image."+ext)
			f, err = os.Open(p)
			if err != nil {
				http.NotFound(w, r)
				return
			}
		} else {
			http.NotFound(w, r)
			return
		}
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
	// Check if the file is a GIF - use animated WebP conversion
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == ".gif" {
		return s.uploadImageWithOptions(ctx, user, src, header, "image", s.convertToAnimatedWebP, 0)
	}

	// For static images (PNG/JPG/WebP), use static WebP conversion
	return s.uploadImageWithOptions(ctx, user, src, header, "image", s.convertToWebP, 0)
}

func (s *MediaService) uploadAvatar(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader) (api.Media, error) {
	// Check if the file is a GIF - use animated WebP conversion with square crop
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == ".gif" {
		return s.uploadImageWithOptions(ctx, user, src, header, "avatar", s.convertToWebPAvatarAnimated, s.cfg.Avatar.Static.Size)
	}

	// For static images (PNG/JPG/WebP), use static WebP conversion with square crop
	return s.uploadImageWithOptions(ctx, user, src, header, "avatar", s.convertToWebPAvatar, s.cfg.Avatar.Static.Size)
}

func (s *MediaService) uploadServerIcon(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader) (api.Media, error) {
	// Validate file metadata
	_, declaredCT, ext, err := s.validateUploadMetadata(header)
	if err != nil {
		return api.Media{}, err
	}

	// Check if file is a GIF
	isGif := ext == ".gif"

	if isGif {
		// For GIF: create both animated and static versions
		return s.uploadServerIconWithBothVersions(ctx, user, src, header, declaredCT, ext)
	} else {
		// For static images: use standard conversion
		return s.uploadImageWithOptions(ctx, user, src, header, "server_icon", s.convertToServerIconStatic, s.cfg.ServerIcon.Static.Size)
	}
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
	if totalSize > s.cfg.MaxUploadBytes() {
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
	if !s.cfg.IsExtensionAllowed(ext) {
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

// convertToServerIconStatic converts and center-crops an image to a square server icon (static images only)
func (s *MediaService) convertToServerIconStatic(ctx context.Context, inPath, outPath string) error {
	// Server icons are always square (512x512) and center-cropped
	size := s.cfg.ServerIcon.Static.Size
	quality := s.cfg.ServerIcon.Static.Quality

	// Filter: scale to fit within square, then crop to exact square from center
	// crop=w=out_w:h=out_h:x=(in_w-out_w)/2:y=(in_h-out_h)/2
	vf := fmt.Sprintf("scale=w=%d:h=%d:force_original_aspect_ratio=increase,crop=w=%d:h=%d:x=(in_w-%d)/2:y=(in_h-%d)/2",
		size, size, size, size, size, size)

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
		"-q:v", strconv.Itoa(quality),
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

		slog.Error("ffmpeg server icon conversion failed", "error", err, "stderr", msg)
		return fmt.Errorf("server icon conversion failed")
	}
	return nil
}

// convertToServerIconAnimated converts an animated GIF to animated WebP for server icon
// - Resizes to configured max edge while maintaining aspect ratio
// - Preserves frame timing, loop settings, and all animation frames
// - Strips metadata (EXIF/XMP/GPS)
func (s *MediaService) convertToServerIconAnimated(ctx context.Context, inPath, outPath string) error {
	maxSize := s.cfg.ServerIcon.Gif.MaxSize
	quality := s.cfg.ServerIcon.Gif.Quality

	vf := fmt.Sprintf("scale=w=min(%d\\,iw):h=min(%d\\,ih):force_original_aspect_ratio=decrease", maxSize, maxSize)

	args := []string{
		"-hide_banner",
		"-loglevel", "error",
		"-y",
		"-i", inPath,
		"-vf", vf,
		"-f", "webp",
		"-c:v", "libwebp",
		"-pix_fmt", "yuva420p",
		"-lossless", "0",
		"-q:v", strconv.Itoa(quality),
		"-loop", "0", // Preserve loop setting (0 = infinite)
		"-preset", "default", // Use default preset for better compatibility
		"-vsync", "0", // Preserve frame timing for animation
		"-an",                 // No audio
		"-map_metadata", "-1", // Strip metadata (EXIF/GPS)
		"-map_chapters", "-1", // Strip chapters
		outPath,
	}

	cmd := exec.CommandContext(ctx, s.ffmpegPath, args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		// Log full command for debugging
		cmdStr := s.ffmpegPath + " " + strings.Join(args, " ")
		slog.Error("ffmpeg server icon animated conversion failed", "error", err, "stderr", msg, "command", cmdStr)
		return fmt.Errorf("server icon animated conversion failed")
	}
	return nil
}

// extractFirstFrameStatic extracts the first frame of an animated GIF and converts it to a static square server icon
func (s *MediaService) extractFirstFrameStatic(ctx context.Context, inPath, outPath string) error {
	size := s.cfg.ServerIcon.Static.Size
	quality := s.cfg.ServerIcon.Static.Quality

	// Extract first frame and crop to square
	vf := fmt.Sprintf("scale=w=%d:h=%d:force_original_aspect_ratio=increase,crop=w=%d:h=%d:x=(in_w-%d)/2:y=(in_h-%d)/2",
		size, size, size, size, size, size)

	args := []string{
		"-hide_banner",
		"-loglevel", "error",
		"-y",
		"-i", inPath,
		"-frames:v", "1", // Extract only first frame
		"-map_metadata", "-1",
		"-map_chapters", "-1",
		"-vf", vf,
		"-f", "webp",
		"-c:v", "libwebp",
		"-q:v", strconv.Itoa(quality),
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

		slog.Error("ffmpeg first frame extraction failed", "error", err, "stderr", msg)
		return fmt.Errorf("failed to extract first frame")
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
// Valid images exceeding old limits (4096x4096, 12MP) will be automatically resized:
// - Static images (PNG/JPG/WebP): maxOutputEdgePx (2048px)
// - Animated GIFs: maxGifOutputEdgePx (1024px)
// Aspect ratio is always preserved.
func (s *MediaService) validateImageDimensions(ctx context.Context, imagePath string) error {
	w, h, err := s.probeDimensions(ctx, imagePath)
	if err != nil {
		return NewError(http.StatusBadRequest, "invalid_request", "invalid image")
	}
	if w < 1 || h < 1 {
		return NewError(http.StatusBadRequest, "invalid_request", "invalid image")
	}
	// Reject only extremely large images to prevent resource exhaustion
	if w > s.cfg.MaxInputWidth || h > s.cfg.MaxInputHeight || (w*h) > s.cfg.MaxInputPixels {
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
		slog.Error("failed to probe dimensions", "error", err, "path", outPath)
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "failed to read converted image")
	}
	// Validate output dimensions
	if wOut < 1 || hOut < 1 {
		cleanupOut()
		slog.Error("converted image has invalid dimensions", "width", wOut, "height", hOut, "path", outPath)
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "converted image has invalid dimensions")
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

// uploadServerIconWithBothVersions handles GIF uploads by creating both animated and static versions
func (s *MediaService) uploadServerIconWithBothVersions(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader, declaredCT, ext string) (api.Media, error) {
	// Write upload to temporary file with content validation
	inPath, totalSize, err := s.writeUploadToTemp(src, ext, declaredCT)
	if err != nil {
		return api.Media{}, err
	}
	defer os.Remove(inPath)

	// Verify file size
	if totalSize > s.cfg.MaxUploadBytes() {
		return api.Media{}, NewError(http.StatusRequestEntityTooLarge, "payload_too_large", "file too large")
	}

	// Validate image dimensions
	if err := s.validateImageDimensions(ctx, inPath); err != nil {
		return api.Media{}, err
	}

	// Generate UUID and create output directory
	id := uuid.New()
	outDir := filepath.Join(s.mediaDir, id.String())
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return api.Media{}, err
	}

	cleanupOut := func() { _ = os.RemoveAll(outDir) }

	// Path for animated version
	animatedTmpPath := filepath.Join(outDir, "image.tmp."+storedImageExt)
	animatedPath := filepath.Join(outDir, "image."+storedImageExt)

	// Path for static version (first frame only)
	staticTmpPath := filepath.Join(outDir, "image_static.tmp."+storedImageExt)
	staticPath := filepath.Join(outDir, "image_static."+storedImageExt)

	// Convert to animated WebP
	if err := s.convertToServerIconAnimated(ctx, inPath, animatedTmpPath); err != nil {
		cleanupOut()
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "failed to convert animated image")
	}

	// Extract first frame as static version
	if err := s.extractFirstFrameStatic(ctx, inPath, staticTmpPath); err != nil {
		cleanupOut()
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "failed to create static version")
	}

	// Rename temp files to final names
	if err := os.Rename(animatedTmpPath, animatedPath); err != nil {
		cleanupOut()
		return api.Media{}, err
	}

	if err := os.Rename(staticTmpPath, staticPath); err != nil {
		cleanupOut()
		return api.Media{}, err
	}

	// Verify converted dimensions (check animated version)
	wOut, hOut, err := s.probeDimensions(ctx, animatedPath)
	if err != nil {
		cleanupOut()
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "failed to read converted image")
	}

	// Create database record
	row, err := s.store.Q.CreateMedia(ctx, sqlc.CreateMediaParams{
		ID:     id,
		UserID: user.ID,
		Type:   "server_icon",
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
	if strings.EqualFold(filepath.Ext(path), ".webp") {
		w, h, err := probeWebPDimensions(path)
		if err == nil && w > 0 && h > 0 {
			return w, h, nil
		}
	}
	cmd := exec.CommandContext(ctx, s.ffprobePath,
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "stream=width,height",
		"-of", "csv=s=x:p=0",
		path,
	)
	out, err := cmd.Output()
	if err != nil {
		slog.Error("ffprobe failed", "error", err, "path", path)
		return 0, 0, err
	}
	line := strings.TrimSpace(string(out))
	if line == "" {
		slog.Error("ffprobe returned empty output", "path", path)
		return 0, 0, fmt.Errorf("ffprobe returned empty output")
	}
	parts := strings.Split(line, "x")
	if len(parts) != 2 {
		slog.Error("unexpected ffprobe output format", "output", line, "path", path)
		return 0, 0, fmt.Errorf("unexpected ffprobe output: %q", line)
	}
	w, err := strconv.Atoi(strings.TrimSpace(parts[0]))
	if err != nil {
		slog.Error("failed to parse width", "width", parts[0], "error", err, "path", path)
		return 0, 0, err
	}
	h, err := strconv.Atoi(strings.TrimSpace(parts[1]))
	if err != nil {
		slog.Error("failed to parse height", "height", parts[1], "error", err, "path", path)
		return 0, 0, err
	}
	return w, h, nil
}

func probeWebPDimensions(path string) (int, int, error) {
	f, err := os.Open(path)
	if err != nil {
		return 0, 0, err
	}
	defer f.Close()

	header := make([]byte, 12)
	if _, err := io.ReadFull(f, header); err != nil {
		return 0, 0, err
	}
	if string(header[0:4]) != "RIFF" || string(header[8:12]) != "WEBP" {
		return 0, 0, fmt.Errorf("not a webp file")
	}

	for {
		var chunkHeader [8]byte
		if _, err := io.ReadFull(f, chunkHeader[:]); err != nil {
			return 0, 0, err
		}
		chunkType := string(chunkHeader[0:4])
		chunkSize := binary.LittleEndian.Uint32(chunkHeader[4:8])

		switch chunkType {
		case "VP8X":
			if chunkSize < 10 {
				return 0, 0, fmt.Errorf("invalid VP8X chunk size")
			}
			data := make([]byte, 10)
			if _, err := io.ReadFull(f, data); err != nil {
				return 0, 0, err
			}
			w := 1 + int(uint32(data[4])|uint32(data[5])<<8|uint32(data[6])<<16)
			h := 1 + int(uint32(data[7])|uint32(data[8])<<8|uint32(data[9])<<16)
			if err := skipWebPChunk(f, chunkSize, 10); err != nil {
				return 0, 0, err
			}
			return w, h, nil
		case "VP8 ":
			if chunkSize < 10 {
				return 0, 0, fmt.Errorf("invalid VP8 chunk size")
			}
			data := make([]byte, 10)
			if _, err := io.ReadFull(f, data); err != nil {
				return 0, 0, err
			}
			w := int(binary.LittleEndian.Uint16(data[6:8]) & 0x3FFF)
			h := int(binary.LittleEndian.Uint16(data[8:10]) & 0x3FFF)
			if err := skipWebPChunk(f, chunkSize, 10); err != nil {
				return 0, 0, err
			}
			return w, h, nil
		case "VP8L":
			if chunkSize < 5 {
				return 0, 0, fmt.Errorf("invalid VP8L chunk size")
			}
			data := make([]byte, 5)
			if _, err := io.ReadFull(f, data); err != nil {
				return 0, 0, err
			}
			if data[0] != 0x2f {
				return 0, 0, fmt.Errorf("invalid VP8L signature")
			}
			v := binary.LittleEndian.Uint32(data[1:5])
			w := int((v & 0x3FFF) + 1)
			h := int(((v >> 14) & 0x3FFF) + 1)
			if err := skipWebPChunk(f, chunkSize, 5); err != nil {
				return 0, 0, err
			}
			return w, h, nil
		default:
			if err := skipWebPChunk(f, chunkSize, 0); err != nil {
				return 0, 0, err
			}
		}
	}
}

func skipWebPChunk(f *os.File, chunkSize uint32, alreadyRead uint32) error {
	if chunkSize < alreadyRead {
		return fmt.Errorf("invalid chunk size")
	}
	remaining := int64(chunkSize - alreadyRead)
	if remaining > 0 {
		if _, err := f.Seek(remaining, io.SeekCurrent); err != nil {
			return err
		}
	}
	if chunkSize%2 == 1 {
		if _, err := f.Seek(1, io.SeekCurrent); err != nil {
			return err
		}
	}
	return nil
}

func (s *MediaService) convertToWebPAvatar(ctx context.Context, inPath, outPath string) error {
	// Scale to cover and center-crop to a square avatar.
	avatarSize := s.cfg.Avatar.Static.Size
	vf := fmt.Sprintf("scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d", avatarSize, avatarSize, avatarSize, avatarSize)
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
		"-q:v", strconv.Itoa(s.cfg.Avatar.Static.Quality),
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

// convertToWebPAvatarAnimated converts an animated GIF to animated WebP avatar with square crop
// - Scales to cover the target square size
// - Center-crops to exact square dimensions
// - Preserves all animation frames
func (s *MediaService) convertToWebPAvatarAnimated(ctx context.Context, inPath, outPath string) error {
	avatarSize := s.cfg.Avatar.Static.Size
	quality := s.cfg.Avatar.Static.Quality

	// Scale to cover square, then crop to exact square
	// This ensures the avatar fills the entire square even if the source aspect ratio is different
	vf := fmt.Sprintf("scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d", avatarSize, avatarSize, avatarSize, avatarSize)

	args := []string{
		"-hide_banner",
		"-loglevel", "error",
		"-y",
		"-i", inPath,
		"-vf", vf,
		"-f", "webp",
		"-c:v", "libwebp",
		"-pix_fmt", "yuva420p",
		"-lossless", "0",
		"-q:v", strconv.Itoa(quality),
		"-loop", "0", // Preserve loop setting (0 = infinite)
		"-preset", "default", // Use default preset for better compatibility
		"-vsync", "0", // Preserve frame timing for animation
		"-an",                 // No audio
		"-map_metadata", "-1", // Strip metadata (EXIF/GPS)
		"-map_chapters", "-1", // Strip chapters
		outPath,
	}

	cmd := exec.CommandContext(ctx, s.ffmpegPath, args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		cmdStr := s.ffmpegPath + " " + strings.Join(args, " ")
		slog.Error("ffmpeg animated avatar conversion failed", "error", err, "stderr", msg, "command", cmdStr)
		return fmt.Errorf("animated avatar conversion failed")
	}
	return nil
}

func (s *MediaService) convertToWebP(ctx context.Context, inPath, outPath string) error {
	// SECURITY: Automatically resize images to configured max edge to:
	// - Limit output resolution and prevent storage exhaustion
	// - Strip metadata (EXIF/XMP/GPS) that may contain sensitive location/device info
	// - Preserve aspect ratio while fitting within maximum edge constraint
	// - Convert all formats to WebP for consistent, optimized output
	//
	// NOTE: Avoid quoting expressions here; Go exec passes quotes literally and ffmpeg filter parsing becomes brittle.
	// Also escape commas inside min() for ffmpeg expression parser.
	maxSize := s.cfg.Post.Static.MaxSize
	vf := fmt.Sprintf("scale=w=min(%d\\,iw):h=min(%d\\,ih):force_original_aspect_ratio=decrease", maxSize, maxSize)
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
		"-q:v", strconv.Itoa(s.cfg.Post.Static.Quality),
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

// convertToAnimatedWebP converts an animated GIF to animated WebP while preserving all frames.
// - Resizes to configured max edge while maintaining aspect ratio
// - Preserves frame timing, loop settings, and all animation frames
// - Strips metadata (EXIF/XMP/GPS)
// - Uses configured quality for optimized file size
func (s *MediaService) convertToAnimatedWebP(ctx context.Context, inPath, outPath string) error {
	// Scale to configured GIF max edge to keep animated WebP file size manageable
	maxSize := s.cfg.Post.Gif.MaxSize
	vf := fmt.Sprintf("scale=w=min(%d\\,iw):h=min(%d\\,ih):force_original_aspect_ratio=decrease", maxSize, maxSize)

	args := []string{
		"-hide_banner",
		"-loglevel", "error",
		"-y",
		"-i", inPath,
		"-vf", vf,
		"-f", "webp",
		"-c:v", "libwebp",
		"-pix_fmt", "yuva420p",
		"-lossless", "0",
		"-q:v", strconv.Itoa(s.cfg.Post.Gif.Quality),
		"-loop", "0", // Preserve loop setting (0 = infinite)
		"-preset", "default", // Use default preset for better compatibility
		"-vsync", "0", // Preserve frame timing for animation
		"-an",                 // No audio
		"-map_metadata", "-1", // Strip metadata (EXIF/GPS)
		"-map_chapters", "-1", // Strip chapters
		outPath,
	}

	cmd := exec.CommandContext(ctx, s.ffmpegPath, args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		// Log full command for debugging
		cmdStr := s.ffmpegPath + " " + strings.Join(args, " ")
		slog.Error("ffmpeg animated GIF conversion failed", "error", err, "stderr", msg, "command", cmdStr)
		return fmt.Errorf("animated media conversion failed")
	}
	return nil
}
