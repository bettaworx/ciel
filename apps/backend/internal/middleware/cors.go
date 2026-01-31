package middleware

import (
	"net/http"
	"os"
	"strings"
)

// CORS adds Cross-Origin Resource Sharing headers with exact origin matching.
//
// Allowed origins are determined by the ALLOWED_ORIGINS environment variable
// (comma-separated list). If not set, defaults to common localhost origins
// for development.
//
// In production with same-origin setup (e.g., Nginx reverse proxy), CORS headers
// are not needed since the frontend and backend share the same origin.
func CORS() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Check if origin is allowed (exact match only)
			if isAllowedOrigin(origin) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Stepup-Token")
				w.Header().Set("Access-Control-Max-Age", "3600")
			}

			// Handle preflight OPTIONS requests
			if r.Method == "OPTIONS" && origin != "" {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// getAllowedOrigins returns the list of allowed CORS origins.
// Reads from ALLOWED_ORIGINS environment variable (comma-separated).
// Falls back to default localhost origins for development if not set.
func getAllowedOrigins() []string {
	if customOrigins := os.Getenv("ALLOWED_ORIGINS"); customOrigins != "" {
		origins := strings.Split(customOrigins, ",")
		// Trim whitespace from each origin
		for i, origin := range origins {
			origins[i] = strings.TrimSpace(origin)
		}
		return origins
	}

	// Default: allow common localhost origins for development
	return []string{
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"https://localhost:3000",
		"https://127.0.0.1:3000",
	}
}

// isAllowedOrigin checks if the given origin is in the allowed list.
// Uses exact string matching (not prefix matching) to prevent bypass attacks.
func isAllowedOrigin(origin string) bool {
	if origin == "" {
		return false
	}

	allowedOrigins := getAllowedOrigins()
	for _, allowed := range allowedOrigins {
		// Exact match only (prevents attacks like "http://localhost:3000.attacker.com")
		if allowed == origin {
			return true
		}
	}
	return false
}
