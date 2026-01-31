package handlers

import (
	"errors"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/middleware"
	"backend/internal/realtime"

	"github.com/gorilla/websocket"
)

const (
	defaultMaxConnections      = 1000
	defaultMaxConnectionsPerIP = 50
)

// WebSocketOptions configures realtime WebSocket behavior.
type WebSocketOptions struct {
	TrustProxy          bool
	MaxConnections      int
	MaxConnectionsPerIP int
}

// NewTimelineWebSocketHandler serves realtime timeline events.
// Authentication is optional - unauthenticated users can receive public timeline events.
func NewTimelineWebSocketHandler(hub *realtime.Hub, tokenManager *auth.TokenManager, opts WebSocketOptions) http.HandlerFunc {
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     allowOrigin,
	}
	maxTotal := resolveLimit(opts.MaxConnections, "REALTIME_WS_MAX_CONNECTIONS", defaultMaxConnections)
	maxPerIP := resolveLimit(opts.MaxConnectionsPerIP, "REALTIME_WS_MAX_CONNECTIONS_PER_IP", defaultMaxConnectionsPerIP)
	limiter := newWSLimiter(maxTotal, maxPerIP)
	return func(w http.ResponseWriter, r *http.Request) {
		if hub == nil {
			writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "realtime not configured"})
			return
		}

		// Authentication via httpOnly cookie only (no query parameter support for security)
		// Query parameter authentication removed to prevent token leakage in logs, browser history, and referer headers
		var authenticated bool
		var userID string
		var username string

		if cookie, err := r.Cookie("ciel_auth"); err == nil && cookie.Value != "" {
			user, err := tokenManager.Parse(cookie.Value)
			if err == nil {
				authenticated = true
				userID = user.ID.String()
				username = user.Username
			} else {
				slog.Debug("websocket auth token invalid, continuing as anonymous", "error", err, "remote", r.RemoteAddr)
			}
		}

		ip := middleware.ClientIP(r, opts.TrustProxy)
		if !limiter.acquire(ip) {
			writeJSON(w, http.StatusTooManyRequests, api.Error{Code: "rate_limited", Message: "too many realtime connections"})
			return
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			limiter.release(ip)
			slog.Warn("websocket upgrade failed", "error", err, "origin", r.Header.Get("Origin"), "remote", r.RemoteAddr)
			// Upgrade() already wrote the error response
			return
		}

		// Log successful WebSocket connection
		if authenticated {
			slog.Info("websocket connected (authenticated)", "user_id", userID, "username", username, "remote", r.RemoteAddr)
		} else {
			slog.Info("websocket connected (anonymous)", "remote", r.RemoteAddr)
		}

		realtime.NewClient(hub, conn, func() {
			limiter.release(ip)
		}).Run()
	}
}

func allowOrigin(r *http.Request) bool {
	origin := strings.TrimSpace(r.Header.Get("Origin"))
	if origin == "" {
		// SECURITY: Reject requests without Origin header to prevent CSRF attacks.
		// WebSocket connections initiated by browsers ALWAYS include the Origin header.
		// Missing Origin indicates potential attack or non-browser client.
		// Non-browser clients (legitimate automation) should explicitly set the Origin header.
		return false
	}

	// Get allowed origins (exact match only, not prefix matching)
	allowedOrigins := getAllowedOriginsForWebSocket()
	for _, allowed := range allowedOrigins {
		// Exact match to prevent bypass attacks like "http://localhost:3000.attacker.com"
		if allowed == origin {
			return true
		}
	}

	// Also check against PUBLIC_BASE_URL for production environments
	base := strings.TrimSpace(os.Getenv("PUBLIC_BASE_URL"))
	if base != "" {
		baseURL, err := parseBaseURL(base)
		if err != nil {
			return false
		}
		originURL, err := url.Parse(origin)
		if err != nil {
			return false
		}

		// Exact match on scheme and host (case-insensitive host comparison)
		if baseURL.Scheme == originURL.Scheme &&
			strings.EqualFold(baseURL.Host, originURL.Host) {
			return true
		}
	}

	return false
}

// getAllowedOriginsForWebSocket returns allowed origins for WebSocket connections.
// Reads from ALLOWED_ORIGINS environment variable (comma-separated).
// Falls back to default localhost origins for development.
func getAllowedOriginsForWebSocket() []string {
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

func parseBaseURL(raw string) (*url.URL, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, errors.New("empty base url")
	}
	parsed, err := url.Parse(raw)
	if err != nil {
		return nil, err
	}
	if parsed.Host == "" {
		parsed, err = url.Parse("https://" + strings.TrimPrefix(raw, "//"))
		if err != nil {
			return nil, err
		}
	}
	if parsed.Host == "" {
		return nil, errors.New("invalid base url")
	}
	return parsed, nil
}

type wsLimiter struct {
	mu       sync.Mutex
	byIP     map[string]int
	total    int
	maxTotal int
	maxPerIP int
}

func newWSLimiter(maxTotal, maxPerIP int) *wsLimiter {
	return &wsLimiter{
		byIP:     make(map[string]int),
		maxTotal: maxTotal,
		maxPerIP: maxPerIP,
	}
}

func (l *wsLimiter) acquire(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.maxTotal > 0 && l.total >= l.maxTotal {
		return false
	}
	if l.maxPerIP > 0 && l.byIP[ip] >= l.maxPerIP {
		return false
	}
	l.total++
	l.byIP[ip]++
	return true
}

func (l *wsLimiter) release(ip string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.total > 0 {
		l.total--
	}
	if l.byIP[ip] > 0 {
		l.byIP[ip]--
		if l.byIP[ip] == 0 {
			delete(l.byIP, ip)
		}
	}
}

func resolveLimit(current int, env string, fallback int) int {
	if current > 0 {
		return current
	}
	if raw := strings.TrimSpace(os.Getenv(env)); raw != "" {
		if val, err := strconv.Atoi(raw); err == nil && val > 0 {
			return val
		}
	}
	return fallback
}
