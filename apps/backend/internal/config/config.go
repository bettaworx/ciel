package config

import (
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	globalConfig   *Config
	globalConfigMu sync.RWMutex
)

// SetGlobalConfig sets the global configuration instance (for tests and initialization)
func SetGlobalConfig(cfg *Config) {
	globalConfigMu.Lock()
	defer globalConfigMu.Unlock()
	globalConfig = cfg
}

// GetGlobalConfig returns the global configuration instance
func GetGlobalConfig() *Config {
	globalConfigMu.RLock()
	defer globalConfigMu.RUnlock()
	return globalConfig
}

// Config represents the server configuration stored in config.yaml
type Config struct {
	Server ServerConfig `yaml:"server"`
	Auth   AuthConfig   `yaml:"auth"`
	Setup  SetupConfig  `yaml:"setup"`
	Media  MediaConfig  `yaml:"media"`
	Post   PostConfig   `yaml:"post"`
}

// PostConfig holds post content settings
type PostConfig struct {
	MaxContentLength int `yaml:"max_content_length"` // maximum Unicode characters per post
}

// Validate checks if the post configuration is valid
func (p *PostConfig) Validate() error {
	if p.MaxContentLength <= 0 {
		return fmt.Errorf("post.max_content_length must be positive, got %d", p.MaxContentLength)
	}
	if p.MaxContentLength > 10000 {
		return fmt.Errorf("post.max_content_length must be <= 10000, got %d", p.MaxContentLength)
	}
	return nil
}

// ServerConfig holds server metadata settings
type ServerConfig struct {
	Name          string     `yaml:"name"`
	Description   string     `yaml:"description"`
	IconMediaID   *uuid.UUID `yaml:"icon_media_id"`
	LastUpdatedAt int64      `yaml:"last_updated_at"` // Unix timestamp
}

// AuthConfig holds authentication and registration settings
type AuthConfig struct {
	InviteOnly bool `yaml:"invite_only"`
}

// SetupConfig holds setup completion status
type SetupConfig struct {
	Completed    bool `yaml:"completed"`
	PasswordUsed bool `yaml:"password_used"`
}

// MediaEncodingConfig controls which media types use FFmpeg encoding.
// When encoding is disabled for a type, images are validated and saved
// in their original format with metadata stripped (no FFmpeg required).
// Avatar and ServerIcon require encoding for crop/resize; disabling them
// will cause those uploads to return 503 Service Unavailable.
// When video encoding is disabled, videos are remuxed (stream-copy) into
// MP4 with metadata stripped — near-zero CPU cost but no re-encoding,
// resize, or codec conversion. ffprobe/ffmpeg are still required.
type MediaEncodingConfig struct {
	Post       bool `yaml:"post"`        // Encode post images to WebP (default: true)
	Avatar     bool `yaml:"avatar"`      // Encode avatars with crop+resize (default: true)
	Banner     bool `yaml:"banner"`      // Encode banners with crop+resize (default: true)
	ServerIcon bool `yaml:"server_icon"` // Encode server icons with crop+resize (default: true)
	Video      bool `yaml:"video"`       // Encode videos to MP4 H.264+AAC (default: true)
}

// MediaConfig holds media upload and processing settings
type MediaConfig struct {
	MaxUploadSize     int                   `yaml:"max_upload_size"`    // in MiB (for images)
	AllowedExtensions []string              `yaml:"allowed_extensions"` // without leading dot
	MaxInputWidth     int                   `yaml:"max_input_width"`    // maximum input image width
	MaxInputHeight    int                   `yaml:"max_input_height"`   // maximum input image height
	MaxInputPixels    int                   `yaml:"max_input_pixels"`   // maximum total pixels
	Encoding          MediaEncodingConfig   `yaml:"encoding"`           // per-type encoding toggles
	Post              MediaPostConfig       `yaml:"post"`
	Avatar            MediaAvatarConfig     `yaml:"avatar"`
	Banner            MediaBannerConfig     `yaml:"banner"`
	ServerIcon        MediaServerIconConfig `yaml:"server_icon"`
	Emoji             MediaEmojiConfig      `yaml:"emoji"`
	Video             MediaVideoConfig      `yaml:"video"`
}

// MediaPostConfig holds settings for post media uploads
type MediaPostConfig struct {
	Static MediaStaticConfig `yaml:"static"`
	Gif    MediaGifConfig    `yaml:"gif"`
}

// MediaAvatarConfig holds settings for avatar uploads
type MediaAvatarConfig struct {
	Static MediaAvatarStaticConfig `yaml:"static"`
	Gif    MediaAvatarGifConfig    `yaml:"gif"`
}

// MediaBannerConfig holds settings for profile banner uploads.
type MediaBannerConfig struct {
	Static MediaBannerStaticConfig `yaml:"static"`
	Gif    MediaBannerGifConfig    `yaml:"gif"`
}

// MediaStaticConfig holds settings for static image posts
type MediaStaticConfig struct {
	MaxSize int `yaml:"max_size"` // maximum output size in pixels (longest edge)
	Quality int `yaml:"quality"`  // WebP quality (0-100)
}

// MediaGifConfig holds settings for animated GIF posts
type MediaGifConfig struct {
	MaxSize int `yaml:"max_size"` // maximum output size in pixels (longest edge)
	Quality int `yaml:"quality"`  // WebP quality (0-100)
}

// MediaAvatarStaticConfig holds settings for static avatar images
type MediaAvatarStaticConfig struct {
	Size    int `yaml:"size"`    // square output size in pixels
	Quality int `yaml:"quality"` // WebP quality (0-100)
}

// MediaAvatarGifConfig holds settings for GIF avatars (first frame only)
type MediaAvatarGifConfig struct {
	Size    int `yaml:"size"`    // square output size in pixels (first frame only)
	Quality int `yaml:"quality"` // WebP quality (0-100)
}

// MediaBannerStaticConfig holds settings for static banner images.
type MediaBannerStaticConfig struct {
	Width   int `yaml:"width"`   // output width in pixels
	Height  int `yaml:"height"`  // output height in pixels
	Quality int `yaml:"quality"` // WebP quality (0-100)
}

// MediaBannerGifConfig holds settings for animated banner images.
type MediaBannerGifConfig struct {
	Width   int `yaml:"width"`   // output width in pixels
	Height  int `yaml:"height"`  // output height in pixels
	Quality int `yaml:"quality"` // WebP quality (0-100)
}

// MediaServerIconConfig holds settings for server icon uploads
type MediaServerIconConfig struct {
	Static MediaServerIconStaticConfig `yaml:"static"`
	Gif    MediaServerIconGifConfig    `yaml:"gif"`
}

// MediaServerIconStaticConfig holds settings for static server icon images
type MediaServerIconStaticConfig struct {
	Size    int `yaml:"size"`    // square output size in pixels
	Quality int `yaml:"quality"` // WebP quality (0-100)
}

// MediaServerIconGifConfig holds settings for animated GIF server icons
type MediaServerIconGifConfig struct {
	MaxSize int `yaml:"max_size"` // maximum output size in pixels (longest edge)
	Quality int `yaml:"quality"`  // WebP quality (0-100)
}

// MediaEmojiConfig holds settings for custom emoji uploads
type MediaEmojiConfig struct {
	Static  MediaEmojiVariantConfig `yaml:"static"`
	Gif     MediaEmojiVariantConfig `yaml:"gif"`
	Height  int                     `yaml:"height,omitempty"`  // legacy fallback: output height in pixels
	Quality int                     `yaml:"quality,omitempty"` // legacy fallback: WebP quality (0-100)
}

// MediaEmojiVariantConfig holds settings for custom emoji uploads by source type.
type MediaEmojiVariantConfig struct {
	Height  int `yaml:"height"`  // output height in pixels (aspect ratio preserved)
	Quality int `yaml:"quality"` // WebP quality (0-100)
}

// MediaVideoConfig holds settings for video uploads
type MediaVideoConfig struct {
	MaxUploadSize int `yaml:"max_upload_size"` // maximum video file size in MiB
	MaxDuration   int `yaml:"max_duration"`    // maximum video duration in seconds
	MaxSize       int `yaml:"max_size"`        // maximum output size in pixels (longest edge)
	CRF           int `yaml:"crf"`             // H.264 CRF value (0-51, lower = better quality)
}

// MaxUploadBytes returns max upload size in bytes
func (m *MediaConfig) MaxUploadBytes() int64 {
	return int64(m.MaxUploadSize) << 20 // MiB to bytes
}

// MaxRequestBytes returns the largest upload limit across all media types.
// This is intended for http.MaxBytesReader, which must allow the largest
// possible upload through; per-type validation happens later in the pipeline.
func (m *MediaConfig) MaxRequestBytes() int64 {
	imageMax := int64(m.MaxUploadSize) << 20
	videoMax := int64(m.Video.MaxUploadSize) << 20
	if videoMax > imageMax {
		return videoMax
	}
	return imageMax
}

// MaxUploadBytesForType returns max upload size in bytes for the given media type
func (m *MediaConfig) MaxUploadBytesForType(mediaType string) int64 {
	if mediaType == "video" {
		return int64(m.Video.MaxUploadSize) << 20 // MiB to bytes
	}
	return int64(m.MaxUploadSize) << 20 // MiB to bytes (for images)
}

// IsExtensionAllowed checks if file extension is allowed.
//
// SECURITY: knownFormats is a hard floor that allowed_extensions can only narrow,
// never widen. It is deliberately limited to the formats the frontend normalizer
// (lib/media/normalize.ts) produces:
//
//	webp       — every still image is re-encoded to WebP in the browser
//	gif        — passed through; browsers have no animated-WebP encoder
//	webm, mp4  — every video is re-encoded to WebM, or to MP4 on browsers with
//	             no VP8/VP9/AV1 encoder (Safari)
//
// Source formats such as png, jpeg, mov, avi, mkv, m4v, 3gp and ogv are rejected:
// a client that reaches this endpoint without normalizing is not a client we serve.
func (m *MediaConfig) IsExtensionAllowed(ext string) bool {
	// Remove leading dot if present
	ext = strings.TrimPrefix(ext, ".")
	ext = strings.ToLower(ext)

	knownFormats := map[string]bool{
		// Images
		"webp": true,
		"gif":  true,
		// Videos
		"webm": true,
		"mp4":  true,
	}

	// Check if extension is in allowed list AND is a known format
	for _, allowed := range m.AllowedExtensions {
		allowedLower := strings.ToLower(strings.TrimPrefix(allowed, "."))
		if allowedLower == ext && knownFormats[ext] {
			return true
		}
	}
	return false
}

// IsVideoExtension checks if the extension is a video format
func (m *MediaConfig) IsVideoExtension(ext string) bool {
	ext = strings.TrimPrefix(ext, ".")
	ext = strings.ToLower(ext)

	videoExts := map[string]bool{
		"webm": true,
		"mp4":  true,
	}

	return videoExts[ext]
}

// ClampQuality ensures all quality values are in 0-100 range
func (m *MediaConfig) ClampQuality() {
	m.Post.Static.Quality = clamp(m.Post.Static.Quality, 0, 100)
	m.Post.Gif.Quality = clamp(m.Post.Gif.Quality, 0, 100)
	m.Avatar.Static.Quality = clamp(m.Avatar.Static.Quality, 0, 100)
	m.Avatar.Gif.Quality = clamp(m.Avatar.Gif.Quality, 0, 100)
	m.Banner.Static.Quality = clamp(m.Banner.Static.Quality, 0, 100)
	m.Banner.Gif.Quality = clamp(m.Banner.Gif.Quality, 0, 100)
	m.ServerIcon.Static.Quality = clamp(m.ServerIcon.Static.Quality, 0, 100)
	m.ServerIcon.Gif.Quality = clamp(m.ServerIcon.Gif.Quality, 0, 100)
	m.Emoji.Static.Quality = clamp(m.Emoji.Static.Quality, 0, 100)
	m.Emoji.Gif.Quality = clamp(m.Emoji.Gif.Quality, 0, 100)
}

// Validate checks if the media configuration is valid
func (m *MediaConfig) Validate() error {
	if m.MaxUploadSize <= 0 {
		return fmt.Errorf("media.max_upload_size must be positive, got %d", m.MaxUploadSize)
	}
	if m.MaxUploadSize > 100 {
		return fmt.Errorf("media.max_upload_size must be <= 100 MiB, got %d", m.MaxUploadSize)
	}
	if m.MaxInputWidth <= 0 {
		return fmt.Errorf("media.max_input_width must be positive, got %d", m.MaxInputWidth)
	}
	if m.MaxInputHeight <= 0 {
		return fmt.Errorf("media.max_input_height must be positive, got %d", m.MaxInputHeight)
	}
	if m.MaxInputPixels <= 0 {
		return fmt.Errorf("media.max_input_pixels must be positive, got %d", m.MaxInputPixels)
	}
	if len(m.AllowedExtensions) == 0 {
		return fmt.Errorf("media.allowed_extensions cannot be empty")
	}

	// Validate post settings
	if m.Post.Static.MaxSize <= 0 {
		return fmt.Errorf("media.post.static.max_size must be positive, got %d", m.Post.Static.MaxSize)
	}
	if m.Post.Gif.MaxSize <= 0 {
		return fmt.Errorf("media.post.gif.max_size must be positive, got %d", m.Post.Gif.MaxSize)
	}

	// Validate avatar settings
	if m.Avatar.Static.Size <= 0 {
		return fmt.Errorf("media.avatar.static.size must be positive, got %d", m.Avatar.Static.Size)
	}
	if m.Avatar.Gif.Size <= 0 {
		return fmt.Errorf("media.avatar.gif.size must be positive, got %d", m.Avatar.Gif.Size)
	}

	// Validate banner settings
	if m.Banner.Static.Width <= 0 {
		return fmt.Errorf("media.banner.static.width must be positive, got %d", m.Banner.Static.Width)
	}
	if m.Banner.Static.Height <= 0 {
		return fmt.Errorf("media.banner.static.height must be positive, got %d", m.Banner.Static.Height)
	}
	if m.Banner.Gif.Width <= 0 {
		return fmt.Errorf("media.banner.gif.width must be positive, got %d", m.Banner.Gif.Width)
	}
	if m.Banner.Gif.Height <= 0 {
		return fmt.Errorf("media.banner.gif.height must be positive, got %d", m.Banner.Gif.Height)
	}

	// Validate server icon settings
	if m.ServerIcon.Static.Size <= 0 {
		return fmt.Errorf("media.server_icon.static.size must be positive, got %d", m.ServerIcon.Static.Size)
	}
	if m.ServerIcon.Gif.MaxSize <= 0 {
		return fmt.Errorf("media.server_icon.gif.max_size must be positive, got %d", m.ServerIcon.Gif.MaxSize)
	}

	// Validate emoji settings
	if m.Emoji.Static.Height <= 0 {
		return fmt.Errorf("media.emoji.static.height must be positive, got %d", m.Emoji.Static.Height)
	}
	if m.Emoji.Static.Height > 512 {
		return fmt.Errorf("media.emoji.static.height must be <= 512, got %d", m.Emoji.Static.Height)
	}
	if m.Emoji.Gif.Height <= 0 {
		return fmt.Errorf("media.emoji.gif.height must be positive, got %d", m.Emoji.Gif.Height)
	}
	if m.Emoji.Gif.Height > 512 {
		return fmt.Errorf("media.emoji.gif.height must be <= 512, got %d", m.Emoji.Gif.Height)
	}

	// Validate video settings
	if m.Video.MaxUploadSize <= 0 {
		return fmt.Errorf("media.video.max_upload_size must be positive, got %d", m.Video.MaxUploadSize)
	}
	if m.Video.MaxUploadSize > 500 {
		return fmt.Errorf("media.video.max_upload_size must be <= 500 MiB, got %d", m.Video.MaxUploadSize)
	}
	if m.Video.MaxDuration <= 0 {
		return fmt.Errorf("media.video.max_duration must be positive, got %d", m.Video.MaxDuration)
	}
	if m.Video.MaxDuration > 3600 {
		return fmt.Errorf("media.video.max_duration must be <= 3600 seconds (1 hour), got %d", m.Video.MaxDuration)
	}
	if m.Video.MaxSize <= 0 {
		return fmt.Errorf("media.video.max_size must be positive, got %d", m.Video.MaxSize)
	}
	if m.Video.CRF < 0 || m.Video.CRF > 51 {
		return fmt.Errorf("media.video.crf must be in range 0-51, got %d", m.Video.CRF)
	}

	// Quality values are auto-clamped, no validation needed

	return nil
}

// LogClampedQuality logs warnings if quality values were clamped
func (m *MediaConfig) LogClampedQuality(original *MediaConfig) {
	if m.Post.Static.Quality != original.Post.Static.Quality {
		slog.Warn("media config quality clamped to valid range",
			"field", "post.static.quality",
			"original", original.Post.Static.Quality,
			"clamped", m.Post.Static.Quality)
	}
	if m.Post.Gif.Quality != original.Post.Gif.Quality {
		slog.Warn("media config quality clamped to valid range",
			"field", "post.gif.quality",
			"original", original.Post.Gif.Quality,
			"clamped", m.Post.Gif.Quality)
	}
	if m.Avatar.Static.Quality != original.Avatar.Static.Quality {
		slog.Warn("media config quality clamped to valid range",
			"field", "avatar.static.quality",
			"original", original.Avatar.Static.Quality,
			"clamped", m.Avatar.Static.Quality)
	}
	if m.Avatar.Gif.Quality != original.Avatar.Gif.Quality {
		slog.Warn("media config quality clamped to valid range",
			"field", "avatar.gif.quality",
			"original", original.Avatar.Gif.Quality,
			"clamped", m.Avatar.Gif.Quality)
	}
	if m.Banner.Static.Quality != original.Banner.Static.Quality {
		slog.Warn("media config quality clamped to valid range",
			"field", "banner.static.quality",
			"original", original.Banner.Static.Quality,
			"clamped", m.Banner.Static.Quality)
	}
	if m.Banner.Gif.Quality != original.Banner.Gif.Quality {
		slog.Warn("media config quality clamped to valid range",
			"field", "banner.gif.quality",
			"original", original.Banner.Gif.Quality,
			"clamped", m.Banner.Gif.Quality)
	}
	if m.ServerIcon.Static.Quality != original.ServerIcon.Static.Quality {
		slog.Warn("media config quality clamped to valid range",
			"field", "server_icon.static.quality",
			"original", original.ServerIcon.Static.Quality,
			"clamped", m.ServerIcon.Static.Quality)
	}
	if m.ServerIcon.Gif.Quality != original.ServerIcon.Gif.Quality {
		slog.Warn("media config quality clamped to valid range",
			"field", "server_icon.gif.quality",
			"original", original.ServerIcon.Gif.Quality,
			"clamped", m.ServerIcon.Gif.Quality)
	}
	if m.Emoji.Static.Quality != original.Emoji.Static.Quality {
		slog.Warn("media config quality clamped to valid range",
			"field", "emoji.static.quality",
			"original", original.Emoji.Static.Quality,
			"clamped", m.Emoji.Static.Quality)
	}
	if m.Emoji.Gif.Quality != original.Emoji.Gif.Quality {
		slog.Warn("media config quality clamped to valid range",
			"field", "emoji.gif.quality",
			"original", original.Emoji.Gif.Quality,
			"clamped", m.Emoji.Gif.Quality)
	}
}

// clamp ensures value is within [min, max] range
func clamp(value, min, max int) int {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

// DefaultConfig returns a new Config with default values
func DefaultConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Name:          "Ciel",
			Description:   "",
			IconMediaID:   nil,
			LastUpdatedAt: time.Now().Unix(),
		},
		Auth: AuthConfig{
			InviteOnly: true, // Default to invite-only for security
		},
		Setup: SetupConfig{
			Completed:    false,
			PasswordUsed: false,
		},
		Post: PostConfig{
			MaxContentLength: 1000,
		},
		Media: MediaConfig{
			MaxUploadSize:     15,
			AllowedExtensions: []string{"webp", "gif", "webm", "mp4"},
			MaxInputWidth:     16384,
			MaxInputHeight:    16384,
			MaxInputPixels:    100_000_000,
			Encoding: MediaEncodingConfig{
				Post:       true,
				Avatar:     true,
				Banner:     true,
				ServerIcon: true,
				Video:      true,
			},
			Post: MediaPostConfig{
				Static: MediaStaticConfig{
					MaxSize: 2048,
					Quality: 50,
				},
				Gif: MediaGifConfig{
					MaxSize: 1024,
					Quality: 50,
				},
			},
			Avatar: MediaAvatarConfig{
				Static: MediaAvatarStaticConfig{
					Size:    400,
					Quality: 50,
				},
				Gif: MediaAvatarGifConfig{
					Size:    400,
					Quality: 50,
				},
			},
			Banner: MediaBannerConfig{
				Static: MediaBannerStaticConfig{
					Width:   1500,
					Height:  500,
					Quality: 50,
				},
				Gif: MediaBannerGifConfig{
					Width:   1500,
					Height:  500,
					Quality: 50,
				},
			},
			ServerIcon: MediaServerIconConfig{
				Static: MediaServerIconStaticConfig{
					Size:    512,
					Quality: 50,
				},
				Gif: MediaServerIconGifConfig{
					MaxSize: 512,
					Quality: 50,
				},
			},
			Emoji: MediaEmojiConfig{
				Static: MediaEmojiVariantConfig{
					Height:  128,
					Quality: 80,
				},
				Gif: MediaEmojiVariantConfig{
					Height:  128,
					Quality: 80,
				},
			},
			Video: MediaVideoConfig{
				MaxUploadSize: 100,  // 100 MiB
				MaxDuration:   300,  // 5 minutes
				MaxSize:       1920, // 1920px longest edge
				CRF:           23,   // H.264 CRF (18-28 is good range, 23 is default)
			},
		},
	}
}

// UpdateTimestamp sets the current Unix timestamp for LastUpdatedAt
func (c *Config) UpdateTimestamp() {
	c.Server.LastUpdatedAt = time.Now().Unix()
}
