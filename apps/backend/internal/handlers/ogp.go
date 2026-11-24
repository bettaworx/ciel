package handlers

import (
	"io"
	"log/slog"
	"net/http"

	"backend/internal/api"
	"backend/internal/ogp"
)

// SecurityHeaders stamps Cache-Control: no-store on everything outside
// /media/, so these handlers set their own value after it. Link previews are
// safe to cache for a long time: the remote page rarely changes, and a stale
// preview is cheaper than re-scraping on every render.
const (
	ogpCacheControl      = "public, max-age=86400"
	ogpImageCacheControl = "public, max-age=604800, immutable"
)

// GetOgp returns Open Graph metadata for the requested URL.
func (h API) GetOgp(w http.ResponseWriter, r *http.Request, params api.GetOgpParams) {
	result, err := h.OGP.Get(r.Context(), params.Url)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	w.Header().Set("Cache-Control", ogpCacheControl)
	writeJSON(w, http.StatusOK, result)
}

// GetOgpImage streams a third-party preview thumbnail through the server so
// the viewer's browser never contacts the remote origin directly.
func (h API) GetOgpImage(w http.ResponseWriter, r *http.Request, params api.GetOgpImageParams) {
	image, err := h.OGP.ProxyImage(r.Context(), params.Url)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	defer func() { _ = image.Body.Close() }()

	w.Header().Set("Content-Type", image.ContentType)
	w.Header().Set("Cache-Control", ogpImageCacheControl)
	// The body is a third-party file; never let a browser sniff it into
	// something executable.
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(http.StatusOK)

	// The body is already size-capped by the fetcher, so stream it rather than
	// buffering a 5 MiB image per in-flight request.
	if _, err := io.Copy(w, image.Body); err != nil {
		// The status line is already sent, so all we can do is record it.
		slog.Debug("ogp image stream interrupted",
			"error", err, "url", ogp.SanitizeURL(params.Url))
	}
}
