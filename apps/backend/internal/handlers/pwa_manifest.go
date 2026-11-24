package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/internal/config"
	"backend/internal/service"
)

// Colours match the --background CSS variable in the frontend's globals.css:
// oklch(0.97 0 0) in light mode.
const (
	manifestBackgroundColor = "#f7f7f7"
	manifestFallbackName    = "Ciel"
	manifestFallbackDesc    = "A minimal SNS application"
)

// manifestIcon is one entry of the Web App Manifest icons array.
type manifestIcon struct {
	Src     string `json:"src"`
	Sizes   string `json:"sizes"`
	Type    string `json:"type"`
	Purpose string `json:"purpose"`
}

type webAppManifest struct {
	Name            string         `json:"name"`
	ShortName       string         `json:"short_name"`
	Description     string         `json:"description"`
	StartURL        string         `json:"start_url"`
	Display         string         `json:"display"`
	BackgroundColor string         `json:"background_color"`
	ThemeColor      string         `json:"theme_color"`
	Orientation     string         `json:"orientation"`
	Icons           []manifestIcon `json:"icons"`
	Categories      []string       `json:"categories"`
	Lang            string         `json:"lang"`
}

// GetPwaManifest serves the Web App Manifest.
//
// It lives on the backend because the instance name and icon come from server
// config, and the frontend is a static bundle. The frontend's own web server
// proxies /pwa/manifest.json here so the browser still sees it same-origin,
// which is what keeps the relative start_url inside the app's scope.
func (h API) GetPwaManifest(w http.ResponseWriter, r *http.Request) {
	name := manifestFallbackName
	description := manifestFallbackDesc

	// Shipped defaults, always present so the install prompt has a correctly
	// sized icon even on an instance that never configured one. Relative, so
	// they resolve against the frontend origin serving this manifest.
	icons := []manifestIcon{
		{Src: "/icon-192.png", Sizes: "192x192", Type: "image/png", Purpose: "any"},
		{Src: "/icon-512.png", Sizes: "512x512", Type: "image/png", Purpose: "any"},
		{Src: "/icon-512.png", Sizes: "512x512", Type: "image/png", Purpose: "maskable"},
	}

	if cfg := config.GetGlobalConfig(); cfg != nil {
		if cfg.Server.Name != "" {
			name = cfg.Server.Name
		}
		if cfg.Server.Description != "" {
			description = cfg.Server.Description
		}

		// The instance icon is listed first and declared as "any" size: it is
		// served at whatever size it was uploaded, and nothing here resizes it.
		if icon, ok := h.serverIconManifestEntry(r, cfg); ok {
			icons = append([]manifestIcon{icon}, icons...)
		}
	}

	manifest := webAppManifest{
		Name:            name,
		ShortName:       name,
		Description:     description,
		StartURL:        "/",
		Display:         "standalone",
		BackgroundColor: manifestBackgroundColor,
		ThemeColor:      manifestBackgroundColor,
		Orientation:     "portrait-primary",
		Icons:           icons,
		Categories:      []string{"social", "lifestyle"},
		Lang:            "ja",
	}

	w.Header().Set("Content-Type", "application/manifest+json")
	// SecurityHeaders stamps no-store outside /media/, so set a real value.
	w.Header().Set("Cache-Control", "public, max-age=300")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(manifest)
}

// serverIconManifestEntry resolves the configured instance icon, preferring the
// static variant so an animated icon does not animate in the launcher.
func (h API) serverIconManifestEntry(r *http.Request, cfg *config.Config) (manifestIcon, bool) {
	if cfg.Server.IconMediaID == nil || h.Setup == nil {
		return manifestIcon{}, false
	}

	store := h.Setup.GetStore()
	if store == nil {
		return manifestIcon{}, false
	}

	media, err := store.Q.GetMediaByID(r.Context(), *cfg.Server.IconMediaID)
	if err != nil {
		return manifestIcon{}, false
	}

	iconURL := service.MediaImageURL(*cfg.Server.IconMediaID, media.Ext)
	staticURL := strings.Replace(iconURL, "/image."+media.Ext, "/image_static."+media.Ext, 1)

	return manifestIcon{
		Src:     staticURL,
		Sizes:   "any",
		Type:    manifestMimeType(media.Ext),
		Purpose: "any",
	}, true
}

func manifestMimeType(ext string) string {
	switch strings.ToLower(ext) {
	case "png":
		return "image/png"
	case "jpg", "jpeg":
		return "image/jpeg"
	case "gif":
		return "image/gif"
	default:
		return "image/webp"
	}
}
