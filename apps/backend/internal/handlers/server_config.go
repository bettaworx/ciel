package handlers

import (
	"net/http"

	"backend/internal/api"
	"backend/internal/config"
)

// GetServerConfig returns public server configuration (signup settings, media limits).
// This is a public endpoint that does not require authentication.
func (h API) GetServerConfig(w http.ResponseWriter, r *http.Request) {
	cfg := config.GetGlobalConfig()
	if cfg == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{
			Code:    "service_unavailable",
			Message: "server configuration not loaded",
		})
		return
	}

	response := api.ServerConfig{
		SignupEnabled: !cfg.Auth.InviteOnly,
		ConfigVersion: cfg.Server.LastUpdatedAt,
		MediaLimits: api.MediaLimits{
			MaxUploadSizeMB:   cfg.Media.MaxUploadSize,
			AllowedExtensions: cfg.Media.AllowedExtensions,
			Post: api.MediaPostLimits{
				Static: struct {
					MaxSize int `json:"maxSize"`
				}{
					MaxSize: cfg.Media.Post.Static.MaxSize,
				},
				Gif: struct {
					MaxSize int `json:"maxSize"`
				}{
					MaxSize: cfg.Media.Post.Gif.MaxSize,
				},
			},
			Avatar: api.MediaAvatarLimits{
				Size: cfg.Media.Avatar.Static.Size,
			},
			Banner: api.MediaBannerLimits{
				Static: struct {
					Height int `json:"height"`
					Width  int `json:"width"`
				}{
					Width:  cfg.Media.Banner.Static.Width,
					Height: cfg.Media.Banner.Static.Height,
				},
				Gif: struct {
					Height int `json:"height"`
					Width  int `json:"width"`
				}{
					Width:  cfg.Media.Banner.Gif.Width,
					Height: cfg.Media.Banner.Gif.Height,
				},
			},
			ServerIcon: api.MediaServerIconLimits{
				Static: struct {
					Size int `json:"size"`
				}{
					Size: cfg.Media.ServerIcon.Static.Size,
				},
				Gif: struct {
					MaxSize int `json:"maxSize"`
				}{
					MaxSize: cfg.Media.ServerIcon.Gif.MaxSize,
				},
			},
			Video: api.MediaVideoLimits{
				MaxUploadSizeMB:    cfg.Media.Video.MaxUploadSize,
				MaxDurationSeconds: cfg.Media.Video.MaxDuration,
				MaxSize:            cfg.Media.Video.MaxSize,
			},
		},
	}

	writeJSON(w, http.StatusOK, response)
}
