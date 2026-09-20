package service

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"backend/internal/cache"
	"backend/internal/ogp"
	"backend/internal/service"

	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

// stubFetcher answers with a scripted sequence of responses so the service can
// be tested without any outbound network access.
type stubFetcher struct {
	responses []stubResponse
	calls     int
	lastOpts  ogp.Options
}

type stubResponse struct {
	body        string
	contentType string
	statusCode  int
	err         error
}

func (s *stubFetcher) Fetch(_ context.Context, _ string, opts ogp.Options) (*ogp.Response, error) {
	s.lastOpts = opts
	index := s.calls
	if index >= len(s.responses) {
		index = len(s.responses) - 1
	}
	s.calls++

	scripted := s.responses[index]
	if scripted.err != nil {
		return nil, scripted.err
	}

	contentType := scripted.contentType
	if contentType == "" {
		contentType = "text/html"
	}
	status := scripted.statusCode
	if status == 0 {
		status = http.StatusOK
	}

	return &ogp.Response{
		Body:        io.NopCloser(strings.NewReader(scripted.body)),
		ContentType: contentType,
		FinalURL:    "https://example.com/page",
		StatusCode:  status,
	}, nil
}

func htmlPage(title string) string {
	return `<html><head><meta property="og:title" content="` + title + `"></head></html>`
}

func redisCache(t *testing.T) cache.Cache {
	t.Helper()
	mr := miniredis.RunT(t)
	return cache.NewRedisCache(redis.NewClient(&redis.Options{Addr: mr.Addr()}))
}

func serviceError(t *testing.T, err error) *service.Error {
	t.Helper()
	var svcErr *service.Error
	if !errors.As(err, &svcErr) {
		t.Fatalf("error %v is not a *service.Error", err)
	}
	return svcErr
}

func TestOGPServiceGetParsesPage(t *testing.T) {
	fetcher := &stubFetcher{responses: []stubResponse{{body: htmlPage("Hello")}}}
	svc := service.NewOGPService(fetcher, cache.NewNoOpCache())

	result, err := svc.Get(context.Background(), "https://example.com/page")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Title == nil || *result.Title != "Hello" {
		t.Fatalf("title = %v, want Hello", result.Title)
	}

	// The HTML fetch must be capped and type-restricted.
	if fetcher.lastOpts.MaxBodySize != 1<<20 {
		t.Errorf("MaxBodySize = %d, want 1 MiB", fetcher.lastOpts.MaxBodySize)
	}
	if len(fetcher.lastOpts.AllowedContentTypes) == 0 {
		t.Error("the HTML fetch must restrict content types")
	}
}

// A second lookup for the same URL must be served from Redis rather than
// costing another outbound request.
func TestOGPServiceGetCachesResults(t *testing.T) {
	fetcher := &stubFetcher{responses: []stubResponse{{body: htmlPage("Cached")}}}
	svc := service.NewOGPService(fetcher, redisCache(t))

	first, err := svc.Get(context.Background(), "https://example.com/page")
	if err != nil {
		t.Fatalf("first call failed: %v", err)
	}

	second, err := svc.Get(context.Background(), "https://example.com/page")
	if err != nil {
		t.Fatalf("second call failed: %v", err)
	}

	if fetcher.calls != 1 {
		t.Errorf("fetcher was called %d times, want 1 (second call should hit the cache)", fetcher.calls)
	}
	if *first.Title != *second.Title {
		t.Errorf("cached title = %q, want %q", *second.Title, *first.Title)
	}
}

func TestOGPServiceGetCachesPerURL(t *testing.T) {
	fetcher := &stubFetcher{responses: []stubResponse{
		{body: htmlPage("First")},
		{body: htmlPage("Second")},
	}}
	svc := service.NewOGPService(fetcher, redisCache(t))

	if _, err := svc.Get(context.Background(), "https://example.com/a"); err != nil {
		t.Fatalf("first call failed: %v", err)
	}
	result, err := svc.Get(context.Background(), "https://example.com/b")
	if err != nil {
		t.Fatalf("second call failed: %v", err)
	}

	if fetcher.calls != 2 {
		t.Errorf("fetcher was called %d times, want 2 (different URLs)", fetcher.calls)
	}
	if *result.Title != "Second" {
		t.Errorf("title = %q, want Second", *result.Title)
	}
}

// Failures are deliberately not cached, so a transient error does not poison a
// URL for 24 hours.
func TestOGPServiceDoesNotCacheFailures(t *testing.T) {
	fetcher := &stubFetcher{responses: []stubResponse{
		{body: "<html><head></head></html>"}, // no title -> 404
		{body: htmlPage("Recovered")},
	}}
	svc := service.NewOGPService(fetcher, redisCache(t))

	if _, err := svc.Get(context.Background(), "https://example.com/page"); err == nil {
		t.Fatal("expected the first call to fail")
	}

	result, err := svc.Get(context.Background(), "https://example.com/page")
	if err != nil {
		t.Fatalf("retry failed: %v", err)
	}
	if *result.Title != "Recovered" {
		t.Errorf("title = %q, want Recovered", *result.Title)
	}
}

func TestOGPServiceGetErrorMapping(t *testing.T) {
	cases := []struct {
		name       string
		url        string
		response   stubResponse
		wantStatus int
		wantCode   string
	}{
		{
			name:       "non-http scheme",
			url:        "ftp://example.com/page",
			wantStatus: http.StatusBadRequest,
			wantCode:   "invalid_url",
		},
		{
			name:       "blocked address",
			url:        "https://example.com/page",
			response:   stubResponse{err: ogp.ErrBlockedAddress},
			wantStatus: http.StatusBadRequest,
			wantCode:   "url_not_allowed",
		},
		{
			name:       "upstream error status",
			url:        "https://example.com/page",
			response:   stubResponse{statusCode: http.StatusInternalServerError, body: ""},
			wantStatus: http.StatusBadGateway,
			wantCode:   "ogp_fetch_failed",
		},
		{
			name:       "no metadata",
			url:        "https://example.com/page",
			response:   stubResponse{body: "<html><head></head></html>"},
			wantStatus: http.StatusNotFound,
			wantCode:   "ogp_not_found",
		},
		{
			name:       "disallowed content type",
			url:        "https://example.com/page",
			response:   stubResponse{err: ogp.ErrDisallowedContentType},
			wantStatus: http.StatusBadGateway,
			wantCode:   "ogp_fetch_failed",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			fetcher := &stubFetcher{responses: []stubResponse{tc.response}}
			svc := service.NewOGPService(fetcher, cache.NewNoOpCache())

			_, err := svc.Get(context.Background(), tc.url)
			if err == nil {
				t.Fatal("expected an error")
			}

			svcErr := serviceError(t, err)
			if svcErr.Status != tc.wantStatus {
				t.Errorf("status = %d, want %d", svcErr.Status, tc.wantStatus)
			}
			if svcErr.Code != tc.wantCode {
				t.Errorf("code = %q, want %q", svcErr.Code, tc.wantCode)
			}
		})
	}
}

func TestOGPServiceProxyImage(t *testing.T) {
	fetcher := &stubFetcher{responses: []stubResponse{
		{body: "\x89PNG-bytes", contentType: "image/png"},
	}}
	svc := service.NewOGPService(fetcher, cache.NewNoOpCache())

	image, err := svc.ProxyImage(context.Background(), "https://example.com/i.png")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer func() { _ = image.Body.Close() }()

	if image.ContentType != "image/png" {
		t.Errorf("contentType = %q, want image/png", image.ContentType)
	}

	body, err := io.ReadAll(image.Body)
	if err != nil {
		t.Fatalf("reading the proxied body failed: %v", err)
	}
	if string(body) != "\x89PNG-bytes" {
		t.Errorf("body = %q, want the upstream bytes", body)
	}

	if fetcher.lastOpts.MaxBodySize != 5<<20 {
		t.Errorf("MaxBodySize = %d, want 5 MiB", fetcher.lastOpts.MaxBodySize)
	}
	if len(fetcher.lastOpts.AllowedContentTypes) != 1 ||
		fetcher.lastOpts.AllowedContentTypes[0] != "image/" {
		t.Errorf("AllowedContentTypes = %v, want [image/]", fetcher.lastOpts.AllowedContentTypes)
	}
}

// A rate-limited upstream is retried; the first 429 must not reach the client.
func TestOGPServiceProxyImageRetriesOn429(t *testing.T) {
	fetcher := &stubFetcher{responses: []stubResponse{
		{statusCode: http.StatusTooManyRequests, contentType: "image/png"},
		{body: "bytes", contentType: "image/png"},
	}}
	svc := service.NewOGPService(fetcher, cache.NewNoOpCache())

	// The backoff is a real sleep, so bound the test with a context that is
	// still generous enough for the single 1s wait.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	image, err := svc.ProxyImage(ctx, "https://example.com/i.png")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer func() { _ = image.Body.Close() }()

	if fetcher.calls != 2 {
		t.Errorf("fetcher was called %d times, want 2 (one retry)", fetcher.calls)
	}
}

func TestOGPServiceProxyImageRejectsBadURL(t *testing.T) {
	svc := service.NewOGPService(&stubFetcher{responses: []stubResponse{{}}}, cache.NewNoOpCache())

	_, err := svc.ProxyImage(context.Background(), "data:image/png;base64,AAAA")
	if err == nil {
		t.Fatal("expected a data: URL to be rejected")
	}

	svcErr := serviceError(t, err)
	if svcErr.Status != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", svcErr.Status)
	}
}

// A nil cache must degrade to "always fetch" rather than panicking.
func TestOGPServiceWorksWithoutCache(t *testing.T) {
	fetcher := &stubFetcher{responses: []stubResponse{{body: htmlPage("No cache")}}}
	svc := service.NewOGPService(fetcher, nil)

	if _, err := svc.Get(context.Background(), "https://example.com/page"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, err := svc.Get(context.Background(), "https://example.com/page"); err != nil {
		t.Fatalf("unexpected error on the second call: %v", err)
	}
	if fetcher.calls != 2 {
		t.Errorf("fetcher was called %d times, want 2 (no caching)", fetcher.calls)
	}
}
