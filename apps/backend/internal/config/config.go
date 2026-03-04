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
// Video encoding is always required and cannot be disabled.
type MediaEncodingConfig struct {
	Post       bool `yaml:"post"`        // Encode post images to WebP (default: true)
	Avatar     bool `yaml:"avatar"`      // Encode avatars with crop+resize (default: true)
	ServerIcon bool `yaml:"server_icon"` // Encode server icons with crop+resize (default: true)
	Video      bool `yaml:"video"`       // Encode videos to MP4 (default: true, required)
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
	ServerIcon        MediaServerIconConfig `yaml:"server_icon"`
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

// MaxUploadBytesForType returns max upload size in bytes for the given media type
func (m *MediaConfig) MaxUploadBytesForType(mediaType string) int64 {
	if mediaType == "video" {
		return int64(m.Video.MaxUploadSize) << 20 // MiB to bytes
	}
	return int64(m.MaxUploadSize) << 20 // MiB to bytes (for images)
}

// IsExtensionAllowed checks if file extension is allowed
// Known image formats: png, jpg, jpeg, webp, gif
// Known video formats: mp4, webm, mov, avi, mkv, m4v, 3gp, ogv
func (m *MediaConfig) IsExtensionAllowed(ext string) bool {
	// Remove leading dot if present
	ext = strings.TrimPrefix(ext, ".")
	ext = strings.ToLower(ext)

	// Only allow known formats for security
	knownFormats := map[string]bool{
		// Images
		"png":  true,
		"jpg":  true,
		"jpeg": true,
		"webp": true,
		"gif":  true,
		// Videos
		"mp4":  true,
		"webm": true,
		"mov":  true,
		"avi":  true,
		"mkv":  true,
		"m4v":  true,
		"3gp":  true,
		"ogv":  true,
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
		"mp4":  true,
		"webm": true,
		"mov":  true,
		"avi":  true,
		"mkv":  true,
		"m4v":  true,
		"3gp":  true,
		"ogv":  true,
	}

	return videoExts[ext]
}

// ClampQuality ensures all quality values are in 0-100 range
func (m *MediaConfig) ClampQuality() {
	m.Post.Static.Quality = clamp(m.Post.Static.Quality, 0, 100)
	m.Post.Gif.Quality = clamp(m.Post.Gif.Quality, 0, 100)
	m.Avatar.Static.Quality = clamp(m.Avatar.Static.Quality, 0, 100)
	m.Avatar.Gif.Quality = clamp(m.Avatar.Gif.Quality, 0, 100)
	m.ServerIcon.Static.Quality = clamp(m.ServerIcon.Static.Quality, 0, 100)
	m.ServerIcon.Gif.Quality = clamp(m.ServerIcon.Gif.Quality, 0, 100)
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

	// Validate server icon settings
	if m.ServerIcon.Static.Size <= 0 {
		return fmt.Errorf("media.server_icon.static.size must be positive, got %d", m.ServerIcon.Static.Size)
	}
	if m.ServerIcon.Gif.MaxSize <= 0 {
		return fmt.Errorf("media.server_icon.gif.max_size must be positive, got %d", m.ServerIcon.Gif.MaxSize)
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
		Media: MediaConfig{
			MaxUploadSize:     15,
			AllowedExtensions: []string{"png", "jpg", "jpeg", "webp", "gif", "mp4", "webm", "mov", "avi", "mkv", "m4v", "3gp", "ogv"},
			MaxInputWidth:     16384,
			MaxInputHeight:    16384,
			MaxInputPixels:    100_000_000,
			Encoding: MediaEncodingConfig{
				Post:       true,
				Avatar:     true,
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
