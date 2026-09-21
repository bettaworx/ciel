package handlers

import (
	"net/http"

	"backend/internal/api"
	"backend/internal/config"
	"backend/internal/service"
	"backend/internal/version"
)

// GetServerInfo returns public server information (name, description, icon, version, stats).
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
	versionStr := version.CommitOrDev()
	branchStr := version.BranchOrDev()
	semVer := version.Version
	// Advertised so clients can hide their search entry points rather than
	// offering a link that only ever answers 503.
	searchEnabled := h.Search != nil && h.Search.Enabled()
	response := api.ServerInfo{
		ServerName:        stringPtr(cfg.Server.Name),
		ServerDescription: stringPtr(cfg.Server.Description),
		ServerIconUrl:     nil, // Will be set below if icon exists
		Commit:            &versionStr,
		Branch:            &branchStr,
		Version:           &semVer,
		SearchEnabled:     &searchEnabled,
		Stats:             api.ServerStats{},
	}

	// If server has an icon or stats are needed, access the store
	if h.Setup != nil {
		store := h.Setup.GetStore()
		if store != nil {
			// Fetch stats
			stats, err := store.Q.GetDashboardStats(r.Context())
			if err == nil {
				response.Stats = api.ServerStats{
					UserCount: stats.TotalUsers,
					PostCount: stats.TotalPosts,
				}
			}

			// Resolve server icon URL
			if cfg.Server.IconMediaID != nil {
				media, err := store.Q.GetMediaByID(r.Context(), *cfg.Server.IconMediaID)
				if err == nil {
					iconURL := service.MediaImageURL(*cfg.Server.IconMediaID, media.Ext)
					response.ServerIconUrl = &iconURL
				}
			}
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
