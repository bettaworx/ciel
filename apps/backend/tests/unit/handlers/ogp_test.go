package handlers

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"backend/internal/api"
	"backend/internal/cache"
	"backend/internal/handlers"
	"backend/internal/ogp"
	"backend/internal/service"
)

// stubOgpFetcher returns one canned response, standing in for the outbound
// HTTP client the real service uses.
type stubOgpFetcher struct {
	body        string
	contentType string
	statusCode  int
	err         error
}

func (s *stubOgpFetcher) Fetch(_ context.Context, rawURL string, _ ogp.Options) (*ogp.Response, error) {
	if s.err != nil {
		return nil, s.err
	}

	contentType := s.contentType
	if contentType == "" {
		contentType = "text/html"
	}
	status := s.statusCode
	if status == 0 {
		status = http.StatusOK
	}

	return &ogp.Response{
		Body:        io.NopCloser(strings.NewReader(s.body)),
		ContentType: contentType,
		FinalURL:    rawURL,
		StatusCode:  status,
	}, nil
}

func ogpHandler(fetcher ogp.Fetcher) handlers.API {
	return handlers.API{OGP: service.NewOGPService(fetcher, cache.NewNoOpCache())}
}

func TestGetOgpReturnsMetadata(t *testing.T) {
	h := ogpHandler(&stubOgpFetcher{
		body: `<html><head>
			<meta property="og:title" content="Example Page">
			<meta property="og:description" content="A description">
			<meta property="og:image" content="https://cdn.example.com/i.png">
		</head></html>`,
	})

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/ogp?url=https://example.com/page", nil)
	h.GetOgp(rr, req, api.GetOgpParams{Url: "https://example.com/page"})

	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200: %s", rr.Code, rr.Body.String())
	}

	var body api.Ogp
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatalf("decoding the response failed: %v", err)
	}
	if body.Title == nil || *body.Title != "Example Page" {
		t.Errorf("title = %v, want Example Page", body.Title)
	}
	if body.Image == nil || *body.Image != "https://cdn.example.com/i.png" {
		t.Errorf("image = %v", body.Image)
	}

	// SecurityHeaders stamps no-store on non-media routes, so the handler has
	// to set its own cacheable value or previews are refetched every render.
	if got := rr.Header().Get("Cache-Control"); got != "public, max-age=86400" {
		t.Errorf("Cache-Control = %q, want a day of public caching", got)
	}
}

func TestGetOgpMapsServiceErrors(t *testing.T) {
	cases := []struct {
		name       string
		url        string
		fetcher    *stubOgpFetcher
		wantStatus int
		wantCode   string
	}{
		{
			name:       "disallowed scheme",
			url:        "file:///etc/passwd",
			fetcher:    &stubOgpFetcher{},
			wantStatus: http.StatusBadRequest,
			wantCode:   "invalid_url",
		},
		{
			name:       "blocked address",
			url:        "https://example.com/page",
			fetcher:    &stubOgpFetcher{err: ogp.ErrBlockedAddress},
			wantStatus: http.StatusBadRequest,
			wantCode:   "url_not_allowed",
		},
		{
			name:       "page without metadata",
			url:        "https://example.com/page",
			fetcher:    &stubOgpFetcher{body: "<html><head></head></html>"},
			wantStatus: http.StatusNotFound,
			wantCode:   "ogp_not_found",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			h := ogpHandler(tc.fetcher)

			rr := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodGet, "/api/v1/ogp", nil)
			h.GetOgp(rr, req, api.GetOgpParams{Url: tc.url})

			if rr.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d: %s", rr.Code, tc.wantStatus, rr.Body.String())
			}

			var body api.Error
			if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
				t.Fatalf("decoding the error failed: %v", err)
			}
			if body.Code != tc.wantCode {
				t.Errorf("code = %q, want %q", body.Code, tc.wantCode)
			}
		})
	}
}

func TestGetOgpImageStreamsBytes(t *testing.T) {
	h := ogpHandler(&stubOgpFetcher{body: "\x89PNG\x0d\x0a", contentType: "image/png"})

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/ogp/image", nil)
	h.GetOgpImage(rr, req, api.GetOgpImageParams{Url: "https://example.com/i.png"})

	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200: %s", rr.Code, rr.Body.String())
	}
	if rr.Body.String() != "\x89PNG\x0d\x0a" {
		t.Errorf("body = %q, want the upstream bytes", rr.Body.String())
	}
	if got := rr.Header().Get("Content-Type"); got != "image/png" {
		t.Errorf("Content-Type = %q, want the upstream type", got)
	}
	if got := rr.Header().Get("Cache-Control"); got != "public, max-age=604800, immutable" {
		t.Errorf("Cache-Control = %q", got)
	}
	// A proxied third-party file must never be sniffed into something else.
	if got := rr.Header().Get("X-Content-Type-Options"); got != "nosniff" {
		t.Errorf("X-Content-Type-Options = %q, want nosniff", got)
	}
}

func TestGetOgpImageRejectsNonImage(t *testing.T) {
	h := ogpHandler(&stubOgpFetcher{err: ogp.ErrDisallowedContentType})

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/ogp/image", nil)
	h.GetOgpImage(rr, req, api.GetOgpImageParams{Url: "https://example.com/page.html"})

	if rr.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502: %s", rr.Code, rr.Body.String())
	}
}
