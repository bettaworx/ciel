package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/internal/api"
	"backend/internal/auth"

	"github.com/redis/go-redis/v9"
)

type RateLimitOptions struct {
	TrustProxy bool
	Now        func() time.Time
}

type rateRule struct {
	routeKey string
	limit    int64
	window   time.Duration
	subject  subjectKind
}

type subjectKind int

const (
	subjectIP subjectKind = iota
	subjectUser
)

var incrExpireScript = redis.NewScript(`
local v = redis.call('INCR', KEYS[1])
if v == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return {v, ttl}
`)

// RateLimit applies Redis-backed fixed-window rate limiting.
// If Redis is unavailable (rdb == nil), it becomes a no-op.
func RateLimit(rdb *redis.Client, opt RateLimitOptions) func(http.Handler) http.Handler {
	if opt.Now == nil {
		opt.Now = time.Now
	}

	// Rules are intentionally conservative defaults.
	// They can be adjusted later or made configurable.
	rules := []rateRule{
		// Auth endpoints: strict, per-IP.
		{routeKey: "auth_login_start", limit: 10, window: 1 * time.Minute, subject: subjectIP},
		{routeKey: "auth_login_finish", limit: 10, window: 1 * time.Minute, subject: subjectIP},
		{routeKey: "auth_stepup_start", limit: 10, window: 1 * time.Minute, subject: subjectIP},
		{routeKey: "auth_stepup_finish", limit: 10, window: 1 * time.Minute, subject: subjectIP},
		// Media upload: per-user, low frequency + daily cap.
		{routeKey: "media_upload", limit: 10, window: 10 * time.Minute, subject: subjectUser},
		{routeKey: "media_upload", limit: 50, window: 24 * time.Hour, subject: subjectUser},
		// Avatar upload: per-user, modest limits.
		{routeKey: "avatar_upload", limit: 5, window: 10 * time.Minute, subject: subjectUser},
		{routeKey: "avatar_upload", limit: 20, window: 24 * time.Hour, subject: subjectUser},
		// Profile updates: per-user.
		{routeKey: "profile_update", limit: 20, window: 1 * time.Hour, subject: subjectUser},
		// Post creation: per-user.
		{routeKey: "posts_create", limit: 30, window: 5 * time.Minute, subject: subjectUser},
		// Timeline reads: per-IP, looser.
		{routeKey: "timeline_get", limit: 120, window: 1 * time.Minute, subject: subjectIP},
		// User posts: per-IP, looser.
		{routeKey: "users_posts_get", limit: 120, window: 1 * time.Minute, subject: subjectIP},
		// Public media delivery (GET /media/*): very loose, per-IP.
		{routeKey: "media_get", limit: 600, window: 1 * time.Minute, subject: subjectIP},
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if rdb == nil {
				next.ServeHTTP(w, r)
				return
			}

			route := classifyRoute(r)
			if route == "" || route == "health" {
				next.ServeHTTP(w, r)
				return
			}

			now := opt.Now()
			ip := ClientIP(r, opt.TrustProxy)
			user, hasUser := auth.UserFromContext(r.Context())

			var applicable []rateRule
			for _, rr := range rules {
				if rr.routeKey == route {
					applicable = append(applicable, rr)
				}
			}
			if len(applicable) == 0 {
				next.ServeHTTP(w, r)
				return
			}

			// Evaluate rules; block immediately on exceed.
			for _, rr := range applicable {
				subject := subjectFor(rr.subject, ip, hasUser, user.ID.String())
				if subject == "" {
					// Cannot identify; fail open to avoid accidental lockouts.
					continue
				}
				count, ttl, resetUnix, err := hitFixedWindow(r.Context(), rdb, rr.routeKey, subject, rr.window, now)
				if err != nil {
					// Redis error: fail open.
					continue
				}
				remaining := rr.limit - count
				if remaining < 0 {
					remaining = 0
				}

				// Always emit informative headers (best-effort).
				w.Header().Set("X-RateLimit-Limit", strconv.FormatInt(rr.limit, 10))
				w.Header().Set("X-RateLimit-Remaining", strconv.FormatInt(remaining, 10))
				w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(resetUnix, 10))

				if count > rr.limit {
					retryAfter := ttl
					if retryAfter <= 0 {
						retryAfter = int64(rr.window.Seconds())
					}
					w.Header().Set("Retry-After", strconv.FormatInt(retryAfter, 10))
					writeRateLimited(w)
					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

func writeRateLimited(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusTooManyRequests)
	_ = json.NewEncoder(w).Encode(api.Error{Code: "rate_limited", Message: "too many requests"})
}

func subjectFor(kind subjectKind, ip string, hasUser bool, userID string) string {
	switch kind {
	case subjectUser:
		if hasUser && strings.TrimSpace(userID) != "" {
			return "user:" + userID
		}
		// If unauthenticated, fall back to IP.
		if strings.TrimSpace(ip) != "" {
			return "ip:" + ip
		}
		return ""
	case subjectIP:
		if strings.TrimSpace(ip) != "" {
			return "ip:" + ip
		}
		return ""
	default:
		return ""
	}
}

func hitFixedWindow(ctx context.Context, rdb *redis.Client, routeKey string, subject string, window time.Duration, now time.Time) (count int64, ttlSeconds int64, resetUnix int64, err error) {
	windowSeconds := int64(window.Seconds())
	if windowSeconds <= 0 {
		return 0, 0, 0, nil
	}

	start := (now.Unix() / windowSeconds) * windowSeconds
	resetUnix = start + windowSeconds
	key := "rl:" + routeKey + ":" + subject + ":" + strconv.FormatInt(windowSeconds, 10) + ":" + strconv.FormatInt(start, 10)

	// Keep this fast; do not let Redis stalls block the API.
	ctx, cancel := context.WithTimeout(ctx, 250*time.Millisecond)
	defer cancel()

	res, err := incrExpireScript.Run(ctx, rdb, []string{key}, windowSeconds).Result()
	if err != nil {
		return 0, 0, resetUnix, err
	}

	arr, ok := res.([]any)
	if !ok || len(arr) < 2 {
		return 0, 0, resetUnix, nil
	}

	// go-redis returns int64 for integers.
	if v, ok := arr[0].(int64); ok {
		count = v
	}
	if v, ok := arr[1].(int64); ok {
		ttlSeconds = v
	}
	return count, ttlSeconds, resetUnix, nil
}

// classifyAuthRoute classifies authentication-related routes
func classifyAuthRoute(method, path string) string {
	if method != http.MethodPost {
		return ""
	}

	switch path {
	case "/api/v1/auth/login/start":
		return "auth_login_start"
	case "/api/v1/auth/login/finish":
		return "auth_login_finish"
	case "/api/v1/auth/stepup/start":
		return "auth_stepup_start"
	case "/api/v1/auth/stepup/finish":
		return "auth_stepup_finish"
	default:
		return ""
	}
}

// classifyMediaRoute classifies media-related routes (upload and delivery)
func classifyMediaRoute(method, path string) string {
	// Media upload
	if method == http.MethodPost && path == "/api/v1/media" {
		return "media_upload"
	}

	// Public media delivery (GET /media/*)
	if method == http.MethodGet && strings.HasPrefix(path, "/media/") {
		// ServeImage supports /media/{id}/image.png and /media/{id}/image.webp
		if strings.HasSuffix(path, "/image.png") || strings.HasSuffix(path, "/image.webp") {
			return "media_get"
		}
	}

	return ""
}

// classifyPostRoute classifies post-related routes
func classifyPostRoute(method, path string) string {
	if method == http.MethodPost && path == "/api/v1/posts" {
		return "posts_create"
	}

	// User posts
	if method == http.MethodGet && strings.HasPrefix(path, "/api/v1/users/") && strings.HasSuffix(path, "/posts") {
		return "users_posts_get"
	}

	return ""
}

// classifyProfileRoute classifies profile-related routes
func classifyProfileRoute(method, path string) string {
	switch path {
	case "/api/v1/me/profile":
		if method == http.MethodPatch {
			return "profile_update"
		}
	case "/api/v1/me/avatar":
		if method == http.MethodPost {
			return "avatar_upload"
		}
	}
	return ""
}

// classifyTimelineRoute classifies timeline-related routes
func classifyTimelineRoute(method, path string) string {
	if method == http.MethodGet && path == "/api/v1/timeline" {
		return "timeline_get"
	}
	return ""
}

// classifyRoute maps request paths to stable route keys for rate limiting / access control.
// This is intentionally simple prefix matching so it works in global chi middlewares.
func classifyRoute(r *http.Request) string {
	path := r.URL.Path
	method := r.Method

	// Health (excluded)
	if method == http.MethodGet && path == "/api/v1/health" {
		return "health"
	}

	// Try each category of routes
	if route := classifyAuthRoute(method, path); route != "" {
		return route
	}
	if route := classifyMediaRoute(method, path); route != "" {
		return route
	}
	if route := classifyPostRoute(method, path); route != "" {
		return route
	}
	if route := classifyProfileRoute(method, path); route != "" {
		return route
	}
	if route := classifyTimelineRoute(method, path); route != "" {
		return route
	}

	return ""
}
