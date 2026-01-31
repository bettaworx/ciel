package middleware_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"backend/internal/auth"
	"backend/internal/middleware"

	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

func TestRateLimit_AuthLoginStart_PerIP(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	now := time.Unix(1_700_000_000, 0)
	mw := middleware.RateLimit(rdb, middleware.RateLimitOptions{Now: func() time.Time { return now }})

	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for i := 0; i < 10; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/start", nil)
		req.RemoteAddr = "1.2.3.4:1234"
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i+1, rr.Code)
		}
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/start", nil)
	req.RemoteAddr = "1.2.3.4:1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rr.Code)
	}
	if rr.Header().Get("Retry-After") == "" {
		t.Fatalf("expected Retry-After header")
	}
	if rr.Header().Get("X-RateLimit-Limit") != "10" {
		t.Fatalf("expected X-RateLimit-Limit=10, got %q", rr.Header().Get("X-RateLimit-Limit"))
	}
}

func TestRateLimit_Health_IsExcluded(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	mw := middleware.RateLimit(rdb, middleware.RateLimitOptions{Now: func() time.Time { return time.Unix(1_700_000_000, 0) }})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for i := 0; i < 200; i++ {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
		req.RemoteAddr = "1.2.3.4:1234"
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i+1, rr.Code)
		}
	}
}

func TestRateLimit_PostsCreate_PerUser(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	now := time.Unix(1_700_000_000, 0)
	mw := middleware.RateLimit(rdb, middleware.RateLimitOptions{Now: func() time.Time { return now }})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	uid := uuid.New()
	ctx := auth.WithUser(context.Background(), auth.User{ID: uid, Username: "u"})

	for i := 0; i < 30; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/posts", nil).WithContext(ctx)
		req.RemoteAddr = "9.9.9.9:9999"
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i+1, rr.Code)
		}
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/posts", nil).WithContext(ctx)
	req.RemoteAddr = "9.9.9.9:9999"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rr.Code)
	}
}

func TestRateLimit_AuthLoginFinish_PerIP(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	now := time.Unix(1_700_000_000, 0)
	mw := middleware.RateLimit(rdb, middleware.RateLimitOptions{Now: func() time.Time { return now }})

	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for i := 0; i < 10; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/finish", nil)
		req.RemoteAddr = "1.2.3.4:1234"
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i+1, rr.Code)
		}
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/finish", nil)
	req.RemoteAddr = "1.2.3.4:1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rr.Code)
	}
}

func TestRateLimit_TimelineGet_PerIP_PreseededLimit(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	now := time.Unix(1_700_000_000, 0)
	mw := middleware.RateLimit(rdb, middleware.RateLimitOptions{Now: func() time.Time { return now }})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	ip := "1.2.3.4"
	key := rateLimitKey("timeline_get", "ip:"+ip, 1*time.Minute, now)
	if err := rdb.Set(context.Background(), key, "120", time.Minute).Err(); err != nil {
		t.Fatalf("Set: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/timeline", nil)
	req.RemoteAddr = ip + ":1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rr.Code)
	}
}

func TestRateLimit_MediaGet_PerIP_PreseededLimit(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	now := time.Unix(1_700_000_000, 0)
	mw := middleware.RateLimit(rdb, middleware.RateLimitOptions{Now: func() time.Time { return now }})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	ip := "1.2.3.4"
	key := rateLimitKey("media_get", "ip:"+ip, 1*time.Minute, now)
	if err := rdb.Set(context.Background(), key, "600", time.Minute).Err(); err != nil {
		t.Fatalf("Set: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/media/00000000-0000-0000-0000-000000000000/image.webp", nil)
	req.RemoteAddr = ip + ":1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rr.Code)
	}
}

func TestRateLimit_MediaUpload_PerUser_DailyLimit(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	now := time.Unix(1_700_000_000, 0)
	mw := middleware.RateLimit(rdb, middleware.RateLimitOptions{Now: func() time.Time { return now }})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	uid := uuid.New()
	ctx := auth.WithUser(context.Background(), auth.User{ID: uid, Username: "u"})

	key := rateLimitKey("media_upload", "user:"+uid.String(), 24*time.Hour, now)
	if err := rdb.Set(context.Background(), key, "50", 24*time.Hour).Err(); err != nil {
		t.Fatalf("Set: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/media", nil).WithContext(ctx)
	req.RemoteAddr = "1.2.3.4:1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rr.Code)
	}
}

func TestRateLimit_MediaUpload_Unauthed_FallsBackToIP(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	now := time.Unix(1_700_000_000, 0)
	mw := middleware.RateLimit(rdb, middleware.RateLimitOptions{Now: func() time.Time { return now }})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	ip := "1.2.3.4"
	key := rateLimitKey("media_upload", "ip:"+ip, 10*time.Minute, now)
	if err := rdb.Set(context.Background(), key, "10", 10*time.Minute).Err(); err != nil {
		t.Fatalf("Set: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/media", nil)
	req.RemoteAddr = ip + ":1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rr.Code)
	}
}

func rateLimitKey(routeKey, subject string, window time.Duration, now time.Time) string {
	windowSeconds := int64(window.Seconds())
	start := (now.Unix() / windowSeconds) * windowSeconds
	return "rl:" + routeKey + ":" + subject + ":" + strconv.FormatInt(windowSeconds, 10) + ":" + strconv.FormatInt(start, 10)
}
