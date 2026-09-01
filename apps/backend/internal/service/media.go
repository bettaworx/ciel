package service

import (
	"context"
	"database/sql"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"math"
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

// expectedMimeByExt maps file extensions to their expected MIME types.
// See config.MediaConfig.IsExtensionAllowed for what is on the list and why.
var expectedMimeByExt = map[string]string{
	// Images
	".webp": "image/webp",
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".gif":  "image/gif",
	// Videos
	".webm": "video/webm",
	".mp4":  "video/mp4",
}

// allowedMIMESniff contains MIME types allowed after content sniffing
var allowedMIMESniff = map[string]struct{}{
	// Images
	"image/webp": {},
	"image/png":  {},
	"image/jpeg": {},
	"image/gif":  {},
	// Videos
	"video/webm": {},
	"video/mp4":  {},
}

// allowedImageFormats are the decoder-reported formats accepted for image
// uploads. Defence in depth: a file that survived MIME sniffing but decodes as
// something else — a PNG named .webp, say — is still rejected.
var allowedImageFormats = map[string]struct{}{
	"webp": {},
	"png":  {},
	"jpeg": {},
	"gif":  {},
}

// isVideoExt reports whether the extension names one of the accepted video
// containers, independent of any per-server configuration.
func isVideoExt(ext string) bool {
	_, ok := allowedVideoCodecs[strings.ToLower(ext)]
	return ok
}

// MaxVideoFrameRate bounds frames per second. Combined with the duration limit
// this bounds the total frame count, and so the work one upload can demand.
//
// ponytail: a constant rather than config, because it is a safety bound and not
// a taste. Move it into MediaConfig if a deployment ever needs to raise it.
const MaxVideoFrameRate = 60

// parseFrameRate reads ffprobe's "num/den" rational. An unreadable or zero
// denominator reports 0, leaving the judgement to the other checks.
func parseFrameRate(v string) float64 {
	num, den, ok := strings.Cut(v, "/")
	if !ok {
		return 0
	}
	n, err1 := strconv.ParseFloat(num, 64)
	d, err2 := strconv.ParseFloat(den, 64)
	if err1 != nil || err2 != nil || d == 0 {
		return 0
	}
	return n / d
}

// allowedVideoCodecs lists the codecs permitted inside each accepted container.
// Anything else — including a codec that is merely muxable but that the
// frontend never emits — is rejected.
var allowedVideoCodecs = map[string]map[string]struct{}{
	".webm": {"vp8": {}, "vp9": {}, "av1": {}},
	".mp4":  {"h264": {}, "hevc": {}, "av1": {}},
}

// allowedAudioCodecs mirrors allowedVideoCodecs for audio streams.
var allowedAudioCodecs = map[string]map[string]struct{}{
	".webm": {"opus": {}, "vorbis": {}},
	".mp4":  {"aac": {}, "opus": {}},
}

// expectedContainerName maps an extension to the ffprobe format_name token that
// must be present, so a renamed container cannot slip through.
var expectedContainerName = map[string]string{
	".webm": "webm",
	".mp4":  "mp4",
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

func (s *MediaService) UploadBannerFromRequest(w http.ResponseWriter, r *http.Request, user auth.User) (api.Media, error) {
	return s.uploadFromRequest(w, r, user, s.uploadBanner)
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
	if strings.TrimSpace(s.mediaDir) == "" {
		return api.Media{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "media storage not configured")
	}

	// Hard cap request size (use the largest limit across all media types;
	// the per-type size check runs later once the media type is known).
	r.Body = http.MaxBytesReader(w, r.Body, s.cfg.MaxRequestBytes())

	// 1 MiB in memory, the rest to the multipart reader's own temp files. There is
	// no point buffering more: every path copies to a temp file of its own next.
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		var mbe *http.MaxBytesError
		if errors.As(err, &mbe) {
			return api.Media{}, NewError(http.StatusRequestEntityTooLarge, "payload_too_large", "file too large")
		}
		slog.Warn("multipart form parse failed", "error", err, "content_type", r.Header.Get("Content-Type"), "content_length", r.ContentLength)
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "invalid multipart form")
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "file is required")
	}
	defer func() { _ = file.Close() }()

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
		s.serveEmojiImageFromMediaRoute(w, r, id)
		return
	}

	row, err := s.store.Q.GetMediaByID(r.Context(), id)
	if err != nil {
		s.serveEmojiImageFromMediaRoute(w, r, id)
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
		ViewerID:          viewerFromRequest(r),
	})
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if !isPublic.IsPublic.Valid || !isPublic.IsPublic.Bool {
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
	defer func() { _ = f.Close() }()

	// Get file info for http.ServeContent (enables Range Request support)
	stat, err := f.Stat()
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	// Set Content-Type and caching headers
	w.Header().Set("Content-Type", mimeForExt(ext))
	w.Header().Set("Cache-Control", mediaCacheControl(isPublic.IsRestricted))

	// Use http.ServeContent for Range Request support (efficient seeking)
	http.ServeContent(w, r, filename, stat.ModTime(), f)
}

func (s *MediaService) serveEmojiImageFromMediaRoute(w http.ResponseWriter, r *http.Request, id uuid.UUID) {
	p, ext, err := s.resolveStoredEmojiImagePath(id)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	f, err := os.Open(p)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer func() { _ = f.Close() }()

	stat, err := f.Stat()
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	filename := "image." + ext
	w.Header().Set("Content-Type", mimeForExt(ext))
	// Custom emojis are server assets with no owning account, so account privacy
	// never applies and the long immutable cache stands.
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	http.ServeContent(w, r, filename, stat.ModTime(), f)
}

// ServeVideo serves a video file with Range Request support for progressive playback
func (s *MediaService) ServeVideo(w http.ResponseWriter, r *http.Request) {
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

	// Verify it's a video
	if row.Type != "video" {
		http.NotFound(w, r)
		return
	}

	// Access control (same logic as ServeImage)
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
		ViewerID:          viewerFromRequest(r),
	})
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if !isPublic.IsPublic.Valid || !isPublic.IsPublic.Bool {
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

	// Serve video file
	filename := "video." + row.Ext
	p := filepath.Join(s.mediaDir, id.String(), filename)
	f, err := os.Open(p)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer func() { _ = f.Close() }()

	stat, err := f.Stat()
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	// Set Content-Type and caching headers
	w.Header().Set("Content-Type", mimeForExt(row.Ext))
	w.Header().Set("Cache-Control", mediaCacheControl(isPublic.IsRestricted))

	// Use http.ServeContent for Range Request support (essential for video seeking)
	http.ServeContent(w, r, filename, stat.ModTime(), f)
}

// ServeThumbnail serves a video thumbnail (WebP image)
func (s *MediaService) ServeThumbnail(w http.ResponseWriter, r *http.Request) {
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

	// Verify it's a video
	if row.Type != "video" {
		http.NotFound(w, r)
		return
	}

	// Access control (same logic as ServeImage)
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
		ViewerID:          viewerFromRequest(r),
	})
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if !isPublic.IsPublic.Valid || !isPublic.IsPublic.Bool {
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

	// Serve thumbnail file
	filename := "thumbnail.webp"
	p := filepath.Join(s.mediaDir, id.String(), filename)
	f, err := os.Open(p)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer func() { _ = f.Close() }()

	stat, err := f.Stat()
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	// Set Content-Type and caching headers
	w.Header().Set("Content-Type", "image/webp")
	w.Header().Set("Cache-Control", mediaCacheControl(isPublic.IsRestricted))

	// Use http.ServeContent for consistency
	http.ServeContent(w, r, filename, stat.ModTime(), f)
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

// requireEncoding verifies that FFmpeg/FFprobe are available.
// Call this before any code path that needs encoding (convert/crop/resize).
func (s *MediaService) requireEncoding() error {
	if s.ffmpegPath == "" || s.ffprobePath == "" {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "ffmpeg/ffprobe not available")
	}
	return nil
}

// mimeForExt returns the Content-Type for a stored image extension.
// viewerFromRequest reads the optional authenticated user off the request.
// Media routes are reachable anonymously, and an absent user simply means the
// privacy gate answers with its strictest result.
func viewerFromRequest(r *http.Request) uuid.NullUUID {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		return uuid.NullUUID{}
	}
	return uuid.NullUUID{UUID: user.ID, Valid: true}
}

// mediaCacheControl keeps the year-long immutable cache for ordinary media and
// withholds it from anything owned by a private account.
//
// Without this, going private would leave images being served out of browser and
// CDN caches for up to a year afterwards, which is exactly the delayed-effect
// case this feature must not have. no-store also keeps Cloudflare from holding a
// shared copy that would be handed to users who cannot see the post.
//
// Known limit: a copy already cached by someone who fetched it while the account
// was public stays in that browser until it is evicted. Nothing short of
// rotating the media URL can reach it, and no new request will succeed.
func mediaCacheControl(restricted bool) string {
	if restricted {
		return "private, no-store"
	}
	return "public, max-age=31536000, immutable"
}

func mimeForExt(ext string) string {
	ext = strings.TrimPrefix(strings.ToLower(strings.TrimSpace(ext)), ".")
	switch ext {
	// Images
	case "jpeg", "jpg":
		return "image/jpeg"
	case "png":
		return "image/png"
	case "gif":
		return "image/gif"
	case "webp":
		return "image/webp"
	// Videos
	case "mp4":
		return "video/mp4"
	case "webm":
		return "video/webm"
	case "mov":
		return "video/quicktime"
	case "avi":
		return "video/x-msvideo"
	case "mkv":
		return "video/x-matroska"
	case "m4v":
		return "video/x-m4v"
	case "3gp":
		return "video/3gpp"
	case "ogv":
		return "video/ogg"
	default:
		return "application/octet-stream"
	}
}

func (s *MediaService) uploadImage(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader) (api.Media, error) {
	ext := strings.ToLower(filepath.Ext(header.Filename))

	// Route video uploads to video handler
	if s.cfg.IsVideoExtension(ext) {
		return s.uploadVideo(ctx, user, src, header)
	}

	if s.cfg.Encoding.Post {
		// Encoding enabled — FFmpeg path (convert to WebP).
		if err := s.requireEncoding(); err != nil {
			return api.Media{}, err
		}
		if ext == ".gif" {
			return s.uploadImageWithOptions(ctx, user, src, header, "image", s.convertToAnimatedWebP, 0)
		}
		return s.uploadImageWithOptions(ctx, user, src, header, "image", s.convertToWebP, 0)
	}

	// Encoding disabled — passthrough path (validate, strip metadata, save original format).
	return s.uploadImagePassthrough(ctx, user, src, header)
}

// uploadImagePassthrough validates an image with pure Go decoders, strips metadata
// at the byte level, and saves the file in its original format (no FFmpeg needed).
//
// SECURITY: The image is fully decoded (all pixel data validated) before saving.
// Metadata (EXIF/GPS/XMP/IPTC/ICC) is stripped at the byte level without
// re-encoding, preserving original quality exactly.
func (s *MediaService) uploadImagePassthrough(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader) (api.Media, error) {
	// Validate file metadata (filename, extension, MIME).
	_, declaredCT, ext, err := s.validateUploadMetadata(header)
	if err != nil {
		return api.Media{}, err
	}

	// Write upload to temporary file with content validation (MIME sniffing).
	inPath, _, err := s.writeUploadToTemp(src, header, ext, declaredCT, s.cfg.MaxUploadBytes())
	if err != nil {
		return api.Media{}, err
	}
	defer func() { _ = os.Remove(inPath) }()

	// Full image validation using Go decoders (replaces ffprobe).
	info, err := validateImageFile(inPath, s.cfg)
	if err != nil {
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "invalid image")
	}

	// Determine storage extension from the decoded format.
	storeExt := formatToExt(info.Format)

	// Create output directory.
	id := uuid.New()
	outDir := filepath.Join(s.mediaDir, id.String())
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return api.Media{}, err
	}
	cleanupOut := func() { _ = os.RemoveAll(outDir) }

	// Sanitize (strip metadata) and save in original format.
	outPath := filepath.Join(outDir, "image."+storeExt)
	if err := sanitizeImage(inPath, outPath, info.Format); err != nil {
		cleanupOut()
		slog.Error("image sanitization failed", "error", err, "format", info.Format)
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "failed to process image")
	}

	// Compute BlurHash placeholder from the saved image. Failure is non-fatal.
	blurhashStr := computeBlurhashForImage(outPath)

	// Create database record with original dimensions and format.
	row, err := s.store.Q.CreateMedia(ctx, sqlc.CreateMediaParams{
		ID:       id,
		UserID:   user.ID,
		Type:     "image",
		Ext:      storeExt,
		Width:    int32(info.Width),
		Height:   int32(info.Height),
		Blurhash: nullStringFromString(blurhashStr),
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
		Blurhash:  nullStringToPtr(row.Blurhash),
		CreatedAt: row.CreatedAt,
	}, nil
}

// uploadVideo validates and processes video uploads, converting to MP4 (H.264+AAC)
// and generating a WebP thumbnail from the first frame.
// When video encoding is disabled, the video is remuxed (stream-copy) to strip
// metadata without CPU-intensive re-encoding.
func (s *MediaService) uploadVideo(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader) (api.Media, error) {
	// Even passthrough mode requires ffprobe for validation + ffmpeg for
	// lightweight remux / thumbnail, so encoding tools must be available.
	if err := s.requireEncoding(); err != nil {
		return api.Media{}, err
	}

	// Validate file metadata (filename, extension, MIME).
	_, declaredCT, ext, err := s.validateUploadMetadata(header)
	if err != nil {
		return api.Media{}, err
	}

	// Write upload to temporary file with content validation (MIME sniffing).
	inPath, _, err := s.writeUploadToTemp(src, header, ext, declaredCT, s.cfg.MaxUploadBytesForType("video"))
	if err != nil {
		return api.Media{}, err
	}
	defer func() { _ = os.Remove(inPath) }()

	// Validate video file (streams, duration, dimensions)
	videoInfo, err := s.validateVideoFile(ctx, inPath, ext)
	if err != nil {
		// These are all "this file is not acceptable", so say so rather than
		// letting the handler report an internal error.
		slog.Info("video rejected", "error", err, "ext", ext)
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", err.Error())
	}

	// Check duration limit
	if videoInfo.Duration > float64(s.cfg.Video.MaxDuration) {
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request",
			fmt.Sprintf("video duration exceeds maximum of %d seconds", s.cfg.Video.MaxDuration))
	}

	// Create output directory
	id := uuid.New()
	outDir := filepath.Join(s.mediaDir, id.String())
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return api.Media{}, err
	}
	cleanupOut := func() { _ = os.RemoveAll(outDir) }

	var outputWidth, outputHeight int
	var storeExt string

	if s.cfg.Encoding.Video {
		// Full encode: convert to MP4 (H.264 + AAC)
		storeExt = "mp4"
		videoPath := filepath.Join(outDir, "video."+storeExt)
		outputWidth, outputHeight, err = s.convertToMP4(ctx, inPath, videoPath, videoInfo)
		if err != nil {
			cleanupOut()
			return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "video conversion failed")
		}
	} else {
		// Passthrough: remux with stream-copy (no re-encoding, near-zero CPU),
		// keeping the container the client sent. Forcing MP4 here used to produce
		// files holding VP9 and Opus — ffmpeg muxes them happily, but Safari
		// cannot play the result and the .mp4 extension hides that.
		storeExt = strings.TrimPrefix(strings.ToLower(ext), ".")
		videoPath := filepath.Join(outDir, "video."+storeExt)
		if err := s.remuxVideo(ctx, inPath, videoPath, storeExt); err != nil {
			// Remux failed — store the already-validated original as-is.
			if cpErr := copyFile(inPath, videoPath); cpErr != nil {
				cleanupOut()
				return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "video processing failed")
			}
		}
		outputWidth = videoInfo.Width
		outputHeight = videoInfo.Height
	}

	// Generate thumbnail from first frame
	videoPath := filepath.Join(outDir, "video."+storeExt)
	thumbnailPath := filepath.Join(outDir, "thumbnail.webp")
	if err := s.generateThumbnail(ctx, videoPath, thumbnailPath); err != nil {
		cleanupOut()
		return api.Media{}, NewError(http.StatusInternalServerError, "internal_error", "thumbnail generation failed")
	}

	// Compute BlurHash placeholder from the thumbnail. Failure is non-fatal.
	blurhashStr := computeBlurhashForImage(thumbnailPath)

	// Save to database
	duration := sql.NullFloat64{Float64: videoInfo.Duration, Valid: true}
	row, err := s.store.Q.CreateMedia(ctx, sqlc.CreateMediaParams{
		ID:       id,
		UserID:   user.ID,
		Type:     "video",
		Ext:      storeExt,
		Width:    int32(outputWidth),
		Height:   int32(outputHeight),
		Duration: duration,
		Blurhash: nullStringFromString(blurhashStr),
	})
	if err != nil {
		cleanupOut()
		return api.Media{}, err
	}

	durationPtr := (*float32)(nil)
	if row.Duration.Valid {
		f32 := float32(row.Duration.Float64)
		durationPtr = &f32
	}

	thumbnailURL := mediaThumbnailURL(row.ID)

	return api.Media{
		Id:           row.ID,
		Type:         api.MediaType("video"),
		Url:          mediaVideoURL(row.ID, row.Ext),
		Width:        int(row.Width),
		Height:       int(row.Height),
		Duration:     durationPtr,
		ThumbnailUrl: &thumbnailURL,
		Blurhash:     nullStringToPtr(row.Blurhash),
		CreatedAt:    row.CreatedAt,
	}, nil
}

func (s *MediaService) uploadAvatar(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader) (api.Media, error) {
	// Avatars require encoding (crop + resize) — reject if disabled.
	if !s.cfg.Encoding.Avatar {
		return api.Media{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "avatar encoding is disabled")
	}
	if err := s.requireEncoding(); err != nil {
		return api.Media{}, err
	}

	// Check if the file is a GIF - use animated WebP conversion with square crop
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == ".gif" {
		return s.uploadImageWithOptions(ctx, user, src, header, "avatar", s.convertToWebPAvatarAnimated, s.cfg.Avatar.Static.Size)
	}

	// For static images (PNG/JPG/WebP), use static WebP conversion with square crop
	return s.uploadImageWithOptions(ctx, user, src, header, "avatar", s.convertToWebPAvatar, s.cfg.Avatar.Static.Size)
}

func (s *MediaService) uploadBanner(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader) (api.Media, error) {
	if !s.cfg.Encoding.Banner {
		return api.Media{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "banner encoding is disabled")
	}
	if err := s.requireEncoding(); err != nil {
		return api.Media{}, err
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == ".gif" {
		return s.uploadImageWithOptions(ctx, user, src, header, "banner", s.convertToWebPBannerAnimated, 0)
	}

	return s.uploadImageWithOptions(ctx, user, src, header, "banner", s.convertToWebPBanner, 0)
}

func (s *MediaService) uploadServerIcon(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader) (api.Media, error) {
	// Server icons require encoding (crop + resize) — reject if disabled.
	if !s.cfg.Encoding.ServerIcon {
		return api.Media{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "server icon encoding is disabled")
	}
	if err := s.requireEncoding(); err != nil {
		return api.Media{}, err
	}

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
	inPath, _, err := s.writeUploadToTemp(src, header, ext, declaredCT, s.cfg.MaxUploadBytes())
	if err != nil {
		return api.Media{}, err
	}
	defer func() { _ = os.Remove(inPath) }()

	// Validate image using pure Go decoders (replaces ffprobe-based validation).
	if _, err := validateImageFile(inPath, s.cfg); err != nil {
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "invalid image")
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
func (s *MediaService) writeUploadToTemp(src multipart.File, header *multipart.FileHeader, ext, declaredCT string, maxBytes int64) (string, int64, error) {
	// The multipart reader knows the size up front, and MaxBytesReader is set to
	// the largest limit across every media type — so without this an image would
	// be written to disk in full before being turned away for being over a limit
	// six times smaller.
	if header != nil && header.Size > maxBytes {
		return "", 0, NewError(http.StatusRequestEntityTooLarge, "payload_too_large", "file too large")
	}

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

	// One byte past the limit is enough to know it is over, and stops a lying
	// Content-Length from writing an unbounded file.
	written, err := io.Copy(inTmp, io.LimitReader(src, maxBytes-int64(n)+1))
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
	if totalSize > maxBytes {
		_ = os.Remove(inPath)
		return "", 0, NewError(http.StatusRequestEntityTooLarge, "payload_too_large", "file too large")
	}
	return inPath, totalSize, nil
}

// validateMIMEType validates MIME type from content sniffing and declared headers
func validateMIMEType(buf []byte, ext, declaredCT string) error {
	expectedMime := expectedMimeByExt[ext]

	// Validate sniffed MIME type
	sniff := http.DetectContentType(buf)
	if _, ok := allowedMIMESniff[sniff]; !ok {
		// Go's sniffer only recognises MP4 whose ftyp box lists an "mp4*" brand,
		// so perfectly good files come back as octet-stream. For video that is
		// not worth rejecting on: ffprobe checks the container and every codec
		// straight after, which is a far stronger test than four magic bytes.
		if !(sniff == "application/octet-stream" && isVideoExt(ext)) {
			return NewError(http.StatusUnsupportedMediaType, "unsupported_media_type", "unsupported mime type")
		}
	} else if expectedMime != "" && sniff != expectedMime {
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

	if err := s.runFFmpeg(ctx, args...); err != nil {
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

	if err := s.runFFmpeg(ctx, args...); err != nil {
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

	if err := s.runFFmpeg(ctx, args...); err != nil {
		return fmt.Errorf("failed to extract first frame")
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
	if mediaType == "banner" {
		expectedW := s.cfg.Banner.Static.Width
		expectedH := s.cfg.Banner.Static.Height
		if wOut != expectedW || hOut != expectedH {
			cleanupOut()
			return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "failed to convert image")
		}
	}

	// Compute BlurHash placeholder from the converted output. Failure is non-fatal.
	blurhashStr := computeBlurhashForImage(outPath)

	if wOut > math.MaxInt32 || hOut > math.MaxInt32 {
		cleanupOut()
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "converted image dimensions are out of range")
	}

	// Create database record
	row, err := s.store.Q.CreateMedia(ctx, sqlc.CreateMediaParams{
		ID:       id,
		UserID:   user.ID,
		Type:     mediaType,
		Ext:      storedImageExt,
		Width:    int32(wOut),
		Height:   int32(hOut),
		Blurhash: nullStringFromString(blurhashStr),
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
		Blurhash:  nullStringToPtr(row.Blurhash),
		CreatedAt: row.CreatedAt,
	}, nil
}

// uploadServerIconWithBothVersions handles GIF uploads by creating both animated and static versions
func (s *MediaService) uploadServerIconWithBothVersions(ctx context.Context, user auth.User, src multipart.File, header *multipart.FileHeader, declaredCT, ext string) (api.Media, error) {
	// Write upload to temporary file with content validation
	inPath, _, err := s.writeUploadToTemp(src, header, ext, declaredCT, s.cfg.MaxUploadBytes())
	if err != nil {
		return api.Media{}, err
	}
	defer func() { _ = os.Remove(inPath) }()

	// Validate image using pure Go decoders (replaces ffprobe-based validation).
	if _, err := validateImageFile(inPath, s.cfg); err != nil {
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "invalid image")
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
	if wOut <= 0 || hOut <= 0 || wOut > math.MaxInt32 || hOut > math.MaxInt32 {
		cleanupOut()
		return api.Media{}, NewError(http.StatusBadRequest, "invalid_request", "invalid converted image dimensions")
	}

	// Compute BlurHash placeholder from the static (single-frame) version.
	// Animated WebP cannot be decoded by the standard Go image package.
	blurhashStr := computeBlurhashForImage(staticPath)

	// Create database record
	row, err := s.store.Q.CreateMedia(ctx, sqlc.CreateMediaParams{
		ID:       id,
		UserID:   user.ID,
		Type:     "server_icon",
		Ext:      storedImageExt,
		Width:    int32(wOut),
		Height:   int32(hOut),
		Blurhash: nullStringFromString(blurhashStr),
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
		Blurhash:  nullStringToPtr(row.Blurhash),
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
	out, err := s.runFFprobe(ctx,
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "stream=width,height",
		"-of", "csv=s=x:p=0",
		path,
	)
	if err != nil {
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
	w64, err := strconv.ParseInt(strings.TrimSpace(parts[0]), 10, 32)
	if err != nil {
		slog.Error("failed to parse width", "width", parts[0], "error", err, "path", path)
		return 0, 0, err
	}
	h64, err := strconv.ParseInt(strings.TrimSpace(parts[1]), 10, 32)
	if err != nil {
		slog.Error("failed to parse height", "height", parts[1], "error", err, "path", path)
		return 0, 0, err
	}
	return int(w64), int(h64), nil
}

func probeWebPDimensions(path string) (int, int, error) {
	f, err := os.Open(path)
	if err != nil {
		return 0, 0, err
	}
	defer func() { _ = f.Close() }()

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

	if err := s.runFFmpeg(ctx, args...); err != nil {
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

	if err := s.runFFmpeg(ctx, args...); err != nil {
		return fmt.Errorf("animated avatar conversion failed")
	}
	return nil
}

func (s *MediaService) convertToWebPBanner(ctx context.Context, inPath, outPath string) error {
	width := s.cfg.Banner.Static.Width
	height := s.cfg.Banner.Static.Height
	vf := fmt.Sprintf("scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d", width, height, width, height)
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
		"-q:v", strconv.Itoa(s.cfg.Banner.Static.Quality),
		"-an",
		outPath,
	}

	if err := s.runFFmpeg(ctx, args...); err != nil {
		return fmt.Errorf("banner conversion failed")
	}
	return nil
}

func (s *MediaService) convertToWebPBannerAnimated(ctx context.Context, inPath, outPath string) error {
	width := s.cfg.Banner.Gif.Width
	height := s.cfg.Banner.Gif.Height
	vf := fmt.Sprintf("scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d", width, height, width, height)

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
		"-q:v", strconv.Itoa(s.cfg.Banner.Gif.Quality),
		"-loop", "0",
		"-preset", "default",
		"-vsync", "0",
		"-an",
		"-map_metadata", "-1",
		"-map_chapters", "-1",
		outPath,
	}

	if err := s.runFFmpeg(ctx, args...); err != nil {
		return fmt.Errorf("animated banner conversion failed")
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

	if err := s.runFFmpeg(ctx, args...); err != nil {
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

	if err := s.runFFmpeg(ctx, args...); err != nil {
		return fmt.Errorf("animated media conversion failed")
	}
	return nil
}

// videoInfo holds metadata about a video file
type videoInfo struct {
	Duration float64 // duration in seconds
	Width    int
	Height   int
	HasVideo bool
	HasAudio bool
}

// validateVideoFile validates a video file using ffprobe.
//
// SECURITY: beyond dimensions and duration, this pins the container and the
// codecs inside it to what the frontend normalizer emits (see allowedVideoCodecs).
// Without a codec check, any codec ffmpeg can mux — including ones no browser can
// play, and ones with a history of decoder CVEs — would be accepted purely because
// the file was named .webm.
func (s *MediaService) validateVideoFile(ctx context.Context, inPath, ext string) (*videoInfo, error) {
	// Use ffprobe to get video metadata in JSON format
	args := []string{
		"-v", "error",
		"-show_entries", "stream=codec_type,codec_name,width,height,duration,avg_frame_rate",
		"-show_entries", "format=format_name,duration",
		"-of", "json",
		inPath,
	}

	stdout, err := s.runFFprobe(ctx, args...)
	if err != nil {
		return nil, fmt.Errorf("video validation failed")
	}

	// Parse ffprobe JSON output
	var probeResult struct {
		Streams []struct {
			CodecType    string `json:"codec_type"`
			CodecName    string `json:"codec_name"`
			Width        int    `json:"width"`
			Height       int    `json:"height"`
			Duration     string `json:"duration"`
			AvgFrameRate string `json:"avg_frame_rate"`
		} `json:"streams"`
		Format struct {
			FormatName string `json:"format_name"`
			Duration   string `json:"duration"`
		} `json:"format"`
	}

	if err := json.Unmarshal(stdout, &probeResult); err != nil {
		return nil, fmt.Errorf("failed to parse ffprobe output")
	}

	ext = strings.ToLower(ext)
	videoCodecs, ok := allowedVideoCodecs[ext]
	if !ok {
		return nil, fmt.Errorf("unsupported video container: %s", ext)
	}
	audioCodecs := allowedAudioCodecs[ext]

	// The declared extension must match what ffprobe actually demuxed.
	if want := expectedContainerName[ext]; !strings.Contains(probeResult.Format.FormatName, want) {
		return nil, fmt.Errorf("file is a %s container, not %s", probeResult.Format.FormatName, want)
	}

	// Extract video info
	info := &videoInfo{}
	videoStreams, audioStreams := 0, 0

	for _, stream := range probeResult.Streams {
		switch stream.CodecType {
		case "video":
			videoStreams++
			if _, ok := videoCodecs[stream.CodecName]; !ok {
				return nil, fmt.Errorf("%s video is not allowed in a%s file", stream.CodecName, ext)
			}
			if fps := parseFrameRate(stream.AvgFrameRate); fps > MaxVideoFrameRate {
				return nil, fmt.Errorf("frame rate %.0f exceeds the maximum of %d", fps, MaxVideoFrameRate)
			}
			info.HasVideo = true
			info.Width = stream.Width
			info.Height = stream.Height
		case "audio":
			audioStreams++
			if _, ok := audioCodecs[stream.CodecName]; !ok {
				return nil, fmt.Errorf("%s audio is not allowed in a%s file", stream.CodecName, ext)
			}
			info.HasAudio = true
		default:
			// Subtitles, attachments, data and cover-art streams are never emitted
			// by the normalizer and can carry arbitrary payloads.
			return nil, fmt.Errorf("disallowed stream type: %s", stream.CodecType)
		}
	}

	if videoStreams != 1 {
		return nil, fmt.Errorf("expected exactly one video stream, got %d", videoStreams)
	}
	if audioStreams > 1 {
		return nil, fmt.Errorf("expected at most one audio stream, got %d", audioStreams)
	}

	// Parse duration (try stream duration first, fall back to format duration)
	durationStr := ""
	if len(probeResult.Streams) > 0 && probeResult.Streams[0].Duration != "" {
		durationStr = probeResult.Streams[0].Duration
	} else if probeResult.Format.Duration != "" {
		durationStr = probeResult.Format.Duration
	}

	if durationStr != "" {
		duration, err := strconv.ParseFloat(durationStr, 64)
		if err == nil {
			info.Duration = duration
		}
	}

	// A file with no readable duration is malformed, not a zero-length video.
	if info.Duration <= 0 {
		return nil, fmt.Errorf("invalid or missing video duration")
	}

	// Validate dimensions
	if info.Width <= 0 || info.Height <= 0 {
		return nil, fmt.Errorf("invalid video dimensions: %dx%d", info.Width, info.Height)
	}
	if info.Width > s.cfg.MaxInputWidth || info.Height > s.cfg.MaxInputHeight {
		return nil, fmt.Errorf("video dimensions exceed maximum: %dx%d", info.Width, info.Height)
	}

	totalPixels := info.Width * info.Height
	if totalPixels > s.cfg.MaxInputPixels {
		return nil, fmt.Errorf("video pixel count exceeds maximum: %d", totalPixels)
	}

	// The header only describes the first frame. VP8, VP9 and AV1 can all change
	// resolution part-way through a stream, so a file can declare 320x240 and
	// switch to something enormous later — passing every check above, then being
	// stream-copied to storage and decoded for a thumbnail.
	if err := s.checkConstantResolution(ctx, inPath, info.Width, info.Height); err != nil {
		return nil, err
	}

	return info, nil
}

// checkConstantResolution rejects a video whose frames are not all the size the
// stream header declares.
//
// Decoding keyframes only keeps this far cheaper than a full scan, and it is
// where a resolution change is signalled in practice. Nothing legitimate posted
// to a feed changes size mid-stream — the browser normalizer certainly does not
// — so any variation is refused rather than accommodated.
func (s *MediaService) checkConstantResolution(ctx context.Context, path string, width, height int) error {
	out, err := s.runFFprobe(ctx,
		"-v", "error",
		"-select_streams", "v:0",
		"-skip_frame", "nokey",
		"-show_entries", "frame=width,height",
		"-of", "csv=p=0",
		path,
	)
	if err != nil {
		return fmt.Errorf("video frame scan failed")
	}

	want := fmt.Sprintf("%d,%d", width, height)
	for _, line := range strings.Split(string(out), "\n") {
		// ffprobe pads CSV rows with a trailing separator for absent fields.
		got := strings.TrimRight(strings.TrimSpace(line), ",")
		if got == "" || got == want {
			continue
		}
		return fmt.Errorf("video changes resolution mid-stream (%s then %s)", want, got)
	}

	return nil
}

// convertToMP4 converts a video to MP4 (H.264 + AAC) with resizing if needed
// Returns the output width and height after conversion
func (s *MediaService) convertToMP4(ctx context.Context, inPath, outPath string, info *videoInfo) (int, int, error) {
	// Calculate output dimensions (preserve aspect ratio, constrain to maxSize)
	maxSize := s.cfg.Video.MaxSize
	outputWidth := info.Width
	outputHeight := info.Height

	if outputWidth > maxSize || outputHeight > maxSize {
		if outputWidth > outputHeight {
			outputHeight = (outputHeight * maxSize) / outputWidth
			outputWidth = maxSize
		} else {
			outputWidth = (outputWidth * maxSize) / outputHeight
			outputHeight = maxSize
		}
		// Ensure dimensions are even (required for H.264)
		outputWidth = (outputWidth / 2) * 2
		outputHeight = (outputHeight / 2) * 2
	}

	// Build ffmpeg command
	args := []string{
		"-i", inPath,
		"-c:v", "libx264", // H.264 video codec
		"-preset", "medium", // Encoding preset (balance speed/quality)
		"-crf", strconv.Itoa(s.cfg.Video.CRF), // Constant Rate Factor (quality)
		"-pix_fmt", "yuv420p", // Pixel format (widest compatibility)
		"-movflags", "+faststart", // Enable fast start for progressive playback
		"-vf", fmt.Sprintf("scale=%d:%d", outputWidth, outputHeight), // Resize
		"-map_metadata", "-1", // Strip metadata
		"-map_chapters", "-1", // Strip chapters
	}

	// Handle audio: convert to AAC if present, otherwise no audio
	if info.HasAudio {
		args = append(args,
			"-c:a", "aac", // AAC audio codec
			"-b:a", "128k", // Audio bitrate
		)
	} else {
		args = append(args, "-an") // No audio
	}

	args = append(args, outPath)

	if err := s.runFFmpeg(ctx, args...); err != nil {
		return 0, 0, fmt.Errorf("video conversion failed")
	}

	return outputWidth, outputHeight, nil
}

// remuxVideo re-wraps the input video into a fresh container of the same kind
// using stream-copy (no re-encoding). This strips metadata at near-zero CPU
// cost. The container is kept as-is so codecs never end up in a container that
// cannot carry them for every browser.
func (s *MediaService) remuxVideo(ctx context.Context, inPath, outPath, ext string) error {
	args := []string{
		"-i", inPath,
		"-c", "copy", // Stream-copy all tracks (no re-encoding)
		"-map_metadata", "-1", // Strip metadata
		"-map_chapters", "-1", // Strip chapters
	}
	if ext == "mp4" {
		// Muxer-private option: the matroska muxer rejects it outright.
		args = append(args, "-movflags", "+faststart") // Enable progressive playback
	}
	args = append(args, outPath)

	if err := s.runFFmpeg(ctx, args...); err != nil {
		return fmt.Errorf("remux failed")
	}

	return nil
}

// copyFile copies a file from src to dst.
func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer func() { _ = in.Close() }()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer func() { _ = out.Close() }()

	if _, err := io.Copy(out, in); err != nil {
		return err
	}
	return out.Close()
}

// generateThumbnail generates a WebP thumbnail from the first frame of a video
func (s *MediaService) generateThumbnail(ctx context.Context, videoPath, thumbnailPath string) error {
	// Extract first frame and convert to WebP
	args := []string{
		"-i", videoPath,
		"-vframes", "1", // Extract only first frame
		"-vf", "scale='min(640,iw)':'min(640,ih)':force_original_aspect_ratio=decrease", // Resize to max 640px
		"-q:v", "75", // WebP quality
		"-map_metadata", "-1", // Strip metadata
		thumbnailPath,
	}

	if err := s.runFFmpeg(ctx, args...); err != nil {
		return fmt.Errorf("thumbnail generation failed")
	}

	return nil
}

// UploadEmojiImage processes an uploaded image for use as a custom emoji.
// Static images are converted to WebP, while GIF uploads are validated and
// stored as-is to preserve animation during the current transition period.
// Returns the output dimensions (width, height).
func (s *MediaService) UploadEmojiImage(ctx context.Context, src multipart.File, header *multipart.FileHeader, emojiID uuid.UUID) (int, int, error) {
	if strings.TrimSpace(s.mediaDir) == "" {
		return 0, 0, NewError(http.StatusServiceUnavailable, "service_unavailable", "media storage not configured")
	}

	_, declaredCT, ext, err := s.validateUploadMetadata(header)
	if err != nil {
		return 0, 0, err
	}
	if s.ffmpegPath == "" && ext != ".gif" {
		return 0, 0, NewError(http.StatusServiceUnavailable, "service_unavailable", "media encoding not available")
	}
	if s.cfg.IsVideoExtension(ext) {
		return 0, 0, NewError(http.StatusUnsupportedMediaType, "unsupported_media_type", "video files are not allowed for emoji")
	}

	const maxEmojiBytes = int64(15) << 20
	inPath, _, err := s.writeUploadToTemp(src, header, ext, declaredCT, maxEmojiBytes)
	if err != nil {
		return 0, 0, err
	}
	defer func() { _ = os.Remove(inPath) }()

	info, err := validateImageFile(inPath, s.cfg)
	if err != nil {
		return 0, 0, err
	}

	outDir := filepath.Join(s.mediaDir, emojiID.String())
	if err := os.RemoveAll(outDir); err != nil {
		slog.Error("failed to reset emoji output directory", "error", err)
		return 0, 0, fmt.Errorf("failed to prepare output directory")
	}
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		slog.Error("failed to create emoji output directory", "error", err)
		return 0, 0, fmt.Errorf("failed to create output directory")
	}

	if ext == ".gif" {
		outPath := filepath.Join(outDir, "image.gif")
		if err := copyFile(inPath, outPath); err != nil {
			_ = os.RemoveAll(outDir)
			return 0, 0, fmt.Errorf("failed to store emoji image")
		}
		return info.Width, info.Height, nil
	}

	outPath := filepath.Join(outDir, "image.webp")
	if err := s.convertToWebPEmoji(ctx, inPath, outPath, false); err != nil {
		_ = os.RemoveAll(outDir)
		return 0, 0, err
	}

	w, h, err := s.probeDimensions(ctx, outPath)
	if err != nil {
		_ = os.RemoveAll(outDir)
		return 0, 0, fmt.Errorf("failed to probe emoji dimensions")
	}
	return w, h, nil
}

// convertToWebPEmoji converts any image to WebP, using different settings for
// static images and animated GIFs while preserving aspect ratio.
func (s *MediaService) convertToWebPEmoji(ctx context.Context, inPath, outPath string, isGif bool) error {
	var variant config.MediaEmojiVariantConfig
	if isGif {
		variant = s.cfg.Emoji.Gif
	} else {
		variant = s.cfg.Emoji.Static
	}

	targetHeight := variant.Height
	if targetHeight <= 0 {
		targetHeight = 128
	}
	quality := variant.Quality
	if quality <= 0 || quality > 100 {
		quality = 80
	}

	// scale=-1:H keeps aspect ratio, forcing exact height H.
	// Using trunc(-1/2)*2 pattern ensures even dimensions for codec compatibility.
	vf := fmt.Sprintf("scale=trunc(oh*a/2)*2:%d", targetHeight)

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
		"-loop", "0", // Preserve animation (0 = infinite loop)
		"-preset", "default",
		"-vsync", "0", // Preserve frame timing
		"-an",                 // No audio
		"-map_metadata", "-1", // Strip metadata
		"-map_chapters", "-1",
		outPath,
	}

	if err := s.runFFmpeg(ctx, args...); err != nil {
		return fmt.Errorf("emoji image conversion failed")
	}
	return nil
}

// DeleteEmojiImage removes the stored image files for a custom emoji.
func (s *MediaService) DeleteEmojiImage(emojiID uuid.UUID) {
	_ = os.RemoveAll(filepath.Join(s.mediaDir, emojiID.String()))
}

func (s *MediaService) resolveStoredEmojiImagePath(id uuid.UUID) (string, string, error) {
	dir := filepath.Join(s.mediaDir, id.String())
	exts := []string{"webp", "gif", "png", "jpeg", "jpg"}
	for _, ext := range exts {
		p := filepath.Join(dir, "image."+ext)
		if _, err := os.Stat(p); err == nil {
			return p, ext, nil
		}
	}
	return "", "", os.ErrNotExist
}

// ServeEmojiImage serves the stored image for a custom emoji.
// This endpoint is public (no authentication required).
func (s *MediaService) ServeEmojiImage(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "emojiId")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	p, ext, err := s.resolveStoredEmojiImagePath(id)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	f, err := os.Open(p)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer func() { _ = f.Close() }()

	fi, err := f.Stat()
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", mimeForExt(ext))
	w.Header().Set("Cache-Control", "public, max-age=86400")
	http.ServeContent(w, r, "image."+ext, fi.ModTime(), f)
}
