package handlers

import (
	"net/http"

	"backend/internal/api"
	"backend/internal/config"
	"backend/internal/service"
)

// GetServerInfo returns public server information (name, description, icon, signup status)
// This is a public endpoint that does not require authentication.
func (h API) GetServerInfo(w http.ResponseWriter, r *http.Request) {
	// Get current config
	cfg := config.GetGlobalConfig()
	if cfg == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{
			Code:    "service_unavailable",
			Message: "server configuration not loaded",
		})
		return
	}

	// Build response
	response := api.ServerInfo{
		ServerName:        stringPtr(cfg.Server.Name),
		ServerDescription: stringPtr(cfg.Server.Description),
		ServerIconUrl:     nil, // Will be set below if icon exists
		SignupEnabled:     !cfg.Auth.InviteOnly,
		ConfigVersion:     cfg.Server.LastUpdatedAt,
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
		},
	}

	// If server has an icon, resolve the URL
	if cfg.Server.IconMediaID != nil && h.Setup != nil {
		mediaID := *cfg.Server.IconMediaID

		// Query media from database to get the extension
		store := h.Setup.GetStore()
		if store != nil {
			media, err := store.Q.GetMediaByID(r.Context(), mediaID)
			if err == nil {
				// Build the public URL for the icon
				iconURL := service.MediaImageURL(mediaID, media.Ext)
				response.ServerIconUrl = &iconURL
			}
			// If media not found or error, just leave icon as nil
		}
	}

	writeJSON(w, http.StatusOK, response)
}

// stringPtr is a helper to convert string to *string for nullable fields
func stringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
