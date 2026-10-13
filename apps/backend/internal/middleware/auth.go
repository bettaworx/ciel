package middleware

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"backend/internal/auth"
)

// OAuthAccessTokenPrefix marks a bearer token as an opaque OAuth2 access token
// rather than a session JWT.
//
// The prefix exists so the two can be told apart before either is validated. A
// "try to parse it as a JWT, fall back to a database lookup" scheme would turn
// every malformed Authorization header on the internet into a Postgres round
// trip; this costs one string comparison. It also means a JWT can never be
// mistaken for an OAuth token or the reverse, whatever either happens to
// contain.
const OAuthAccessTokenPrefix = "ciel_at_"

// OAuthVerifier resolves an opaque OAuth2 access token into the user it acts
// for and the scopes it carries. Implemented by the OAuth service; nil when the
// server is running without OAuth support.
type OAuthVerifier interface {
	VerifyAccessToken(ctx context.Context, raw string) (auth.User, error)
}

// The OAuth branch below is reachable only from the Authorization header. The
// session cookie is never routed to it: if it were, planting a stolen access
// token in ciel_auth would upgrade it into a full first-party session, since
// everything downstream keys off auth.UserFromContext and a cookie session is
// not scope limited.

func OptionalAuth(tokenManager *auth.TokenManager, verifier OAuthVerifier) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// /media/ used to skip auth entirely. It cannot any more: media
			// attached to a private user's post is only served to their accepted
			// followers, and that decision needs to know who is asking. Auth here
			// is still optional — an anonymous request simply gets the strictest
			// answer, exactly as before for everything that is public.
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

			// An OAuth access token, but only from the header — see
			// resolveToken's note on why the cookie must never reach here.
			if !isCookieAuth && strings.HasPrefix(token, OAuthAccessTokenPrefix) {
				if verifier == nil {
					logUnauthorized(r, "oauth_not_configured", "bearer", nil)
					writeInvalidToken(w)
					return
				}
				user, err := verifier.VerifyAccessToken(r.Context(), token)
				if err != nil {
					logUnauthorized(r, "oauth_token_invalid", "bearer", err)
					writeInvalidToken(w)
					return
				}
				r = r.WithContext(auth.WithUser(r.Context(), user))
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

			// This path is only reached when OptionalAuth did not run, and the
			// only mount is RequireAdminAccess, which is closed to OAuth tokens
			// anyway. Refusing here rather than verifying keeps that true even
			// if the middleware is ever mounted somewhere else.
			if strings.HasPrefix(token, OAuthAccessTokenPrefix) {
				logUnauthorized(r, "oauth_token_on_first_party_route", "bearer", nil)
				writeInvalidToken(w)
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

// writeInvalidToken answers a bearer token that did not validate, with the
// challenge RFC 6750 §3 asks for. The session paths keep their bare 401: they
// are consumed by this app's own client, which has never read the header.
func writeInvalidToken(w http.ResponseWriter) {
	w.Header().Set("WWW-Authenticate", `Bearer realm="ciel", error="invalid_token"`)
	writeUnauthorized(w)
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
