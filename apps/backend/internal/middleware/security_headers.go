package middleware

import (
	"net/http"
	"strings"
)

// SecurityHeaders adds common security response headers to every request.
//
// In non-production environments (production == false) the middleware is a
// no-op so that development tooling is not affected.
//
// Headers applied in production:
//   - X-Content-Type-Options: nosniff        — prevent MIME-type sniffing
//   - X-Frame-Options: DENY                  — prevent clickjacking
//   - Referrer-Policy: strict-origin-when-cross-origin
//   - Permissions-Policy: deny all features  — restrict browser API access
//   - Cache-Control: no-store                — prevent caching of API responses
//
// Cache-Control is intentionally skipped for /media/* paths so that served
// media files can be cached by the browser (those handlers set their own
// Cache-Control values).
func SecurityHeaders(production bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		if !production {
			return next
		}
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := w.Header()

			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("X-Frame-Options", "DENY")
			h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
			h.Set("Permissions-Policy",
				"camera=(), microphone=(), geolocation=(), payment=(), usb=(), "+
					"magnetometer=(), gyroscope=(), accelerometer=()")

			// Skip Cache-Control for media routes — those set their own headers.
			if !strings.HasPrefix(r.URL.Path, "/media/") {
				h.Set("Cache-Control", "no-store")
			}

			next.ServeHTTP(w, r)
		})
	}
}
