package middleware

import "net/http"

// NoStoreByDefault sets Cache-Control: no-store before the handler runs. A handler
// that serves a file replaces it with its own value, and anything else it returns
// (404, 403, ...) keeps no-store. Without it such an error goes out with no
// Cache-Control at all, and a CDN in front keeps it after the file is servable
// again: Cloudflare caches a 404 for a path ending in an image extension and gives
// the browser a 4-hour max-age.
//
// Unlike SecurityHeaders, it applies outside production too, since a staging
// server can sit behind a CDN as well.
func NoStoreByDefault(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(w, r)
	})
}
