package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"backend/internal/api"
	"backend/internal/auth"

	"github.com/redis/go-redis/v9"
)

type AccessControlOptions struct {
	TrustProxy bool
}

// AccessControl blocks requests early based on deny lists stored in Redis.
//
// Data model (ToDo 9.2):
//   - deny:ip (SET) contains raw IP strings (e.g. "203.0.113.10")
//   - deny:user (SET) contains user UUID strings
//   - deny:route:{route} (SET) contains subjects like "ip:{ip}" or "user:{uuid}" or "*"
//   - Temporary bans (TTL):
//       - deny:ip:{ip} (STRING with TTL)
//       - deny:user:{uuid} (STRING with TTL)
//       - deny:route:{route}:ban (STRING with TTL)
func AccessControl(rdb *redis.Client, opt AccessControlOptions) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if rdb == nil {
				next.ServeHTTP(w, r)
				return
			}

			route := classifyRoute(r)
			ip := ClientIP(r, opt.TrustProxy)
			user, hasUser := auth.UserFromContext(r.Context())

			ctx, cancel := context.WithTimeout(r.Context(), 250*time.Millisecond)
			defer cancel()

			// Route-level temporary ban.
			if route != "" {
				if v, err := rdb.Get(ctx, "deny:route:"+route+":ban").Result(); err == nil && strings.TrimSpace(v) != "" {
					writeForbidden(w)
					return
				}
			}

			// IP deny (set + temporary).
			if ip != "" {
				if ok, err := rdb.SIsMember(ctx, "deny:ip", ip).Result(); err == nil && ok {
					writeForbidden(w)
					return
				}
				if v, err := rdb.Get(ctx, "deny:ip:"+ip).Result(); err == nil && strings.TrimSpace(v) != "" {
					writeForbidden(w)
					return
				}
			}

			// User deny (set + temporary).
			if hasUser {
				uid := user.ID.String()
				if ok, err := rdb.SIsMember(ctx, "deny:user", uid).Result(); err == nil && ok {
					writeForbidden(w)
					return
				}
				if v, err := rdb.Get(ctx, "deny:user:"+uid).Result(); err == nil && strings.TrimSpace(v) != "" {
					writeForbidden(w)
					return
				}
			}

			// Route deny list.
			if route != "" {
				key := "deny:route:" + route
				if ok, err := rdb.SIsMember(ctx, key, "*").Result(); err == nil && ok {
					writeForbidden(w)
					return
				}
				if ip != "" {
					if ok, err := rdb.SIsMember(ctx, key, "ip:"+ip).Result(); err == nil && ok {
						writeForbidden(w)
						return
					}
				}
				if hasUser {
					if ok, err := rdb.SIsMember(ctx, key, "user:"+user.ID.String()).Result(); err == nil && ok {
						writeForbidden(w)
						return
					}
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

func writeForbidden(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)
	_ = json.NewEncoder(w).Encode(api.Error{Code: "forbidden", Message: "forbidden"})
}
