package api_test

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/cache"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/ogp"
	"backend/internal/service"

	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
)

// These tests assemble the real generated router and the real global
// middlewares, so they cover what the handler-level tests cannot: that the
// paths are registered, that the query parameter is bound, and that the
// rate-limit rules actually match the routes. No database is involved.

type stubRouteFetcher struct {
	body        string
	contentType string
}

func (s *stubRouteFetcher) Fetch(_ context.Context, rawURL string, _ ogp.Options) (*ogp.Response, error) {
	contentType := s.contentType
	if contentType == "" {
		contentType = "text/html"
	}
	return &ogp.Response{
		Body:        io.NopCloser(strings.NewReader(s.body)),
		ContentType: contentType,
		FinalURL:    rawURL,
		StatusCode:  http.StatusOK,
	}, nil
}

// ogpRouter mounts the generated handler the way main.go does, optionally
// behind the Redis-backed rate limiter.
func ogpRouter(t *testing.T, fetcher ogp.Fetcher, rdb *redis.Client) chi.Router {
	t.Helper()

	apiServer := handlers.API{
		OGP: service.NewOGPService(fetcher, cache.NewNoOpCache()),
	}

	r := chi.NewRouter()
	if rdb != nil {
		now := time.Unix(1_700_000_000, 0)
		r.Use(middleware.RateLimit(rdb, middleware.RateLimitOptions{
			Now: func() time.Time { return now },
		}))
	}
	_ = api.HandlerFromMuxWithBaseURL(&apiServer, r, "/api/v1")

	return r
}

func TestOgpRouteIsRegistered(t *testing.T) {
	fetcher := &stubRouteFetcher{
		body: `<html><head><meta property="og:title" content="Routed"></head></html>`,
	}
	r := ogpRouter(t, fetcher, nil)

	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/ogp?url=https%3A%2F%2Fexample.com%2Fpage", nil)
	r.ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200: %s", res.Code, res.Body.String())
	}
	if !strings.Contains(res.Body.String(), "Routed") {
		t.Errorf("body = %s, want the parsed title", res.Body.String())
	}
}

func TestOgpImageRouteIsRegistered(t *testing.T) {
	r := ogpRouter(t, &stubRouteFetcher{body: "PNG", contentType: "image/png"}, nil)

	res := httptest.NewRecorder()
	req := httptest.NewRequest(
		http.MethodGet,
		"/api/v1/ogp/image?url=https%3A%2F%2Fexample.com%2Fi.png",
		nil,
	)
	r.ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200: %s", res.Code, res.Body.String())
	}
	if res.Body.String() != "PNG" {
		t.Errorf("body = %q, want the proxied bytes", res.Body.String())
	}
}

// The url parameter is required by the spec, so the generated wrapper must
// reject a request without it before the handler runs.
func TestOgpRouteRequiresURLParameter(t *testing.T) {
	r := ogpRouter(t, &stubRouteFetcher{body: "<html></html>"}, nil)

	res := httptest.NewRecorder()
	r.ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/api/v1/ogp", nil))

	if res.Code == http.StatusOK {
		t.Fatalf("status = 200, want a client error for a missing url parameter")
	}
}

// The rate-limit rules live in a lookup table keyed by a path classifier, so
// assert the classifier really matches these paths once mounted.
func TestOgpRouteIsRateLimited(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	fetcher := &stubRouteFetcher{
		body: `<html><head><meta property="og:title" content="Routed"></head></html>`,
	}
	r := ogpRouter(t, fetcher, rdb)

	request := func() *httptest.ResponseRecorder {
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/v1/ogp?url=https%3A%2F%2Fexample.com%2Fpage",
			nil,
		)
		req.RemoteAddr = "1.2.3.4:1234"
		res := httptest.NewRecorder()
		r.ServeHTTP(res, req)
		return res
	}

	for i := 0; i < 30; i++ {
		if res := request(); res.Code != http.StatusOK {
			t.Fatalf("request %d: status = %d, want 200", i+1, res.Code)
		}
	}

	if res := request(); res.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429 once the per-IP budget is spent", res.Code)
	}
}
