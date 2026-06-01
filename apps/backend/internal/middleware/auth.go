package middleware

import (
	"encoding/json"
	"log/slog"
	"net/http"
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
