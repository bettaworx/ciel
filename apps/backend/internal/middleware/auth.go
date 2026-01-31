package middleware

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"backend/internal/auth"
)

func OptionalAuth(tokenManager *auth.TokenManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip auth for public media endpoints
			if strings.HasPrefix(r.URL.Path, "/media/") {
				next.ServeHTTP(w, r)
				return
			}

			// Try to get token from cookie first
			var token string
			var isCookieAuth bool
			if cookie, err := r.Cookie("ciel_auth"); err == nil && cookie.Value != "" {
				token = cookie.Value
				isCookieAuth = true
			} else {
				// Fallback to Authorization header
				authz := r.Header.Get("Authorization")
				if authz == "" {
					next.ServeHTTP(w, r)
					return
				}
				if !strings.HasPrefix(authz, "Bearer ") {
					logUnauthorized(r, "invalid_auth_header", "bearer", nil)
					writeUnauthorized(w)
					return
				}
				token = strings.TrimSpace(strings.TrimPrefix(authz, "Bearer "))
			}

			if token == "" {
				next.ServeHTTP(w, r)
				return
			}

			user, err := tokenManager.Parse(token)
			if err != nil {
				authSource := "bearer"
				if isCookieAuth {
					authSource = "cookie"
				}
				logUnauthorized(r, "token_parse_failed", authSource, err)
				writeUnauthorized(w)
				return
			}

			// Refresh cookie to extend session (only for cookie-based auth)
			if isCookieAuth {
				refreshAuthCookie(w, r, user, tokenManager)
			}

			r = r.WithContext(auth.WithUser(r.Context(), user))
			next.ServeHTTP(w, r)
		})
	}
}

func RequireAuth(tokenManager *auth.TokenManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if tokenManager == nil {
				logUnauthorized(r, "token_manager_missing", "", nil)
				writeUnauthorized(w)
				return
			}
			if user, ok := auth.UserFromContext(r.Context()); ok {
				r = r.WithContext(auth.WithUser(r.Context(), user))
				next.ServeHTTP(w, r)
				return
			}

			// Try to get token from cookie first
			var token string
			var isCookieAuth bool
			if cookie, err := r.Cookie("ciel_auth"); err == nil && cookie.Value != "" {
				token = cookie.Value
				isCookieAuth = true
			} else {
				// Fallback to Authorization header
				authz := r.Header.Get("Authorization")
				if authz == "" {
					logUnauthorized(r, "missing_cookie_and_header", "", nil)
					writeUnauthorized(w)
					return
				}
				if !strings.HasPrefix(authz, "Bearer ") {
					logUnauthorized(r, "invalid_auth_header", "bearer", nil)
					writeUnauthorized(w)
					return
				}
				token = strings.TrimSpace(strings.TrimPrefix(authz, "Bearer "))
			}

			if token == "" {
				authSource := "bearer"
				if isCookieAuth {
					authSource = "cookie"
				}
				logUnauthorized(r, "empty_token", authSource, nil)
				writeUnauthorized(w)
				return
			}

			user, err := tokenManager.Parse(token)
			if err != nil {
				authSource := "bearer"
				if isCookieAuth {
					authSource = "cookie"
				}
				logUnauthorized(r, "token_parse_failed", authSource, err)
				writeUnauthorized(w)
				return
			}

			// Refresh cookie to extend session (only for cookie-based auth)
			if isCookieAuth {
				refreshAuthCookie(w, r, user, tokenManager)
			}

			r = r.WithContext(auth.WithUser(r.Context(), user))
			next.ServeHTTP(w, r)
		})
	}
}

func writeUnauthorized(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"code":    "unauthorized",
		"message": "unauthorized",
	})
}

func logUnauthorized(r *http.Request, reason string, authSource string, err error) {
	attrs := []any{
		slog.String("reason", reason),
		slog.String("path", r.URL.Path),
		slog.String("method", r.Method),
		slog.String("remote", r.RemoteAddr),
	}
	if ua := r.UserAgent(); ua != "" {
		attrs = append(attrs, slog.String("user_agent", ua))
	}
	if authSource != "" {
		attrs = append(attrs, slog.String("auth_source", authSource))
	}
	if err != nil {
		attrs = append(attrs, slog.String("error", err.Error()))
	}
	slog.Warn("unauthorized request", attrs...)
}

// refreshAuthCookie generates a new JWT token and updates the authentication cookie
// This extends the user's session automatically on each authenticated request
func refreshAuthCookie(w http.ResponseWriter, r *http.Request, user auth.User, tokenManager *auth.TokenManager) {
	// Skip cookie refresh for logout endpoint to prevent re-issuing auth cookie
	if r.URL.Path == "/api/v1/auth/logout" {
		return
	}

	// Generate new access token with extended expiration
	newToken, expiresInSeconds, err := tokenManager.Issue(user)
	if err != nil {
		// Log error but don't fail the request
		// The old token is still valid
		return
	}

	// Set new cookie with updated token
	setAuthCookie(w, r, newToken, expiresInSeconds)
}

// setAuthCookie creates and sets a secure authentication cookie with proper security attributes
func setAuthCookie(w http.ResponseWriter, r *http.Request, token string, maxAge int) {
	// Determine if connection is secure
	// Check multiple headers for HTTPS detection behind reverse proxies
	isSecure := r.TLS != nil ||
		r.Header.Get("X-Forwarded-Proto") == "https" ||
		r.Header.Get("X-Forwarded-Ssl") == "on" ||
		r.Header.Get("X-Forwarded-Scheme") == "https"

	// Get cookie domain from environment (should be set in production)
	// Examples: "example.com" or ".example.com" (with dot for subdomains)
	cookieDomain := os.Getenv("COOKIE_DOMAIN")

	cookie := &http.Cookie{
		Name:     "ciel_auth",
		Value:    token,
		Path:     "/",
		Domain:   cookieDomain,
		MaxAge:   maxAge,
		HttpOnly: true,                    // Prevent JavaScript access
		Secure:   isSecure,                // Only send over HTTPS
		SameSite: http.SameSiteStrictMode, // CSRF protection
	}

	http.SetCookie(w, cookie)
}
