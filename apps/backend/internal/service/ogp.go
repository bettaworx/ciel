package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"time"

	"backend/internal/cache"
	"backend/internal/ogp"
)

const (
	// ogpCacheTTL matches the Cache-Control we hand the browser, so a preview
	// is refetched at most once a day per URL across all viewers.
	ogpCacheTTL = 24 * time.Hour

	// maxHTMLSize caps how much of a remote page we will read.
	maxHTMLSize = 1 << 20 // 1 MiB

	// maxImageSize caps a proxied thumbnail.
	maxImageSize = 5 << 20 // 5 MiB

	// A rate-limited upstream is retried a few times before giving up.
	maxImageRetries     = 3
	initialImageBackoff = time.Second
)

var imageAcceptHeader = map[string]string{
	"Accept": "image/webp, image/avif, image/*, */*;q=0.1",
}

// OGPService resolves link previews for arbitrary URLs.
type OGPService struct {
	fetcher ogp.Fetcher
	cache   cache.Cache
}

// NewOGPService creates a new OGPService.
func NewOGPService(fetcher ogp.Fetcher, cache cache.Cache) *OGPService {
	return &OGPService{fetcher: fetcher, cache: cache}
}

// ProxiedImage is a third-party image being streamed back to the browser.
type ProxiedImage struct {
	Body        io.ReadCloser
	ContentType string
}

// Get returns Open Graph metadata for url.
//
// Successful lookups are cached; failures are not, because most of them are
// transient and the negative case is cheap to retry.
func (s *OGPService) Get(ctx context.Context, rawURL string) (*ogp.Ogp, error) {
	if _, err := ogp.ValidateURL(rawURL); err != nil {
		return nil, urlError(err)
	}

	if cached, ok := s.getCache(ctx, rawURL); ok {
		return cached, nil
	}

	result, err := s.resolve(ctx, rawURL)
	if err != nil {
		return nil, err
	}

	s.setCache(ctx, rawURL, result)
	return result, nil
}

// resolve fetches metadata without consulting the cache.
func (s *OGPService) resolve(ctx context.Context, rawURL string) (*ogp.Ogp, error) {
	// x.com serves no OG tags to scrapers, so tweets go through the
	// syndication endpoint first and fall through if that fails.
	if tweet := ogp.FetchTweet(ctx, s.fetcher, rawURL); tweet != nil {
		return tweet, nil
	}

	resp, err := s.fetcher.Fetch(ctx, rawURL, ogp.Options{
		MaxBodySize:         maxHTMLSize,
		AllowedContentTypes: []string{"text/html", "application/xhtml+xml"},
	})
	if err != nil {
		return nil, fetchError(err, "failed to fetch the page")
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		slog.Debug("ogp upstream returned an error status",
			"status", resp.StatusCode, "url", ogp.SanitizeURL(rawURL))
		return nil, NewError(http.StatusBadGateway, "ogp_fetch_failed",
			"The page could not be fetched")
	}

	result := ogp.Parse(resp.Body, resp.FinalURL)
	if result == nil {
		return nil, NewError(http.StatusNotFound, "ogp_not_found",
			"No Open Graph metadata was found")
	}

	return result, nil
}

// ProxyImage streams a third-party image, retrying a rate-limited upstream
// with exponential backoff.
func (s *OGPService) ProxyImage(ctx context.Context, rawURL string) (*ProxiedImage, error) {
	if _, err := ogp.ValidateURL(rawURL); err != nil {
		return nil, urlError(err)
	}

	backoff := initialImageBackoff

	for attempt := 0; ; attempt++ {
		resp, err := s.fetcher.Fetch(ctx, rawURL, ogp.Options{
			MaxBodySize:         maxImageSize,
			AllowedContentTypes: []string{"image/"},
			Headers:             imageAcceptHeader,
		})
		if err != nil {
			return nil, fetchError(err, "failed to fetch the image")
		}

		if resp.StatusCode == http.StatusTooManyRequests && attempt < maxImageRetries {
			_ = resp.Body.Close()
			slog.Debug("ogp image upstream rate limited, retrying",
				"attempt", attempt+1, "backoff", backoff, "url", ogp.SanitizeURL(rawURL))

			select {
			case <-ctx.Done():
				return nil, NewError(http.StatusBadGateway, "ogp_fetch_failed",
					"The image could not be fetched")
			case <-time.After(backoff):
			}
			backoff *= 2
			continue
		}

		if resp.StatusCode < 200 || resp.StatusCode > 299 {
			_ = resp.Body.Close()
			return nil, NewError(http.StatusBadGateway, "ogp_fetch_failed",
				"The image could not be fetched")
		}

		contentType := resp.ContentType
		if contentType == "" {
			contentType = "image/png"
		}

		return &ProxiedImage{Body: resp.Body, ContentType: contentType}, nil
	}
}

// urlError maps a validation failure to a 400.
func urlError(err error) error {
	if errors.Is(err, ogp.ErrDisallowedScheme) {
		return NewError(http.StatusBadRequest, "invalid_url", "Only http and https URLs are allowed")
	}
	return NewError(http.StatusBadRequest, "invalid_url", "The url parameter is not a valid URL")
}

// fetchError keeps SSRF rejections as client errors — the caller asked for an
// address we will not visit — and treats everything else as an upstream fault.
func fetchError(err error, message string) error {
	if errors.Is(err, ogp.ErrBlockedAddress) {
		return NewError(http.StatusBadRequest, "url_not_allowed",
			"That address is not allowed")
	}
	if errors.Is(err, ogp.ErrDisallowedScheme) {
		return NewError(http.StatusBadRequest, "invalid_url",
			"Only http and https URLs are allowed")
	}
	if errors.Is(err, ogp.ErrDisallowedContentType) {
		return NewError(http.StatusBadGateway, "ogp_fetch_failed",
			"The URL did not return the expected content type")
	}
	return NewError(http.StatusBadGateway, "ogp_fetch_failed", message)
}

func ogpCacheKey(rawURL string) string {
	// Hashed because a URL can exceed what is comfortable in a Redis key, and
	// carries query strings we would rather not log.
	sum := sha256.Sum256([]byte(rawURL))
	return "ogp:v1:" + hex.EncodeToString(sum[:])
}

func (s *OGPService) getCache(ctx context.Context, rawURL string) (*ogp.Ogp, bool) {
	if s.cache == nil {
		return nil, false
	}

	raw, err := s.cache.Get(ctx, ogpCacheKey(rawURL))
	if err != nil {
		return nil, false
	}

	var result ogp.Ogp
	if err := json.Unmarshal([]byte(raw), &result); err != nil {
		return nil, false
	}

	return &result, true
}

func (s *OGPService) setCache(ctx context.Context, rawURL string, result *ogp.Ogp) {
	if s.cache == nil || result == nil {
		return
	}

	raw, err := json.Marshal(result)
	if err != nil {
		return
	}

	if err := s.cache.Set(ctx, ogpCacheKey(rawURL), string(raw), ogpCacheTTL); err != nil {
		slog.Warn("failed to cache ogp result", "error", err)
	}
}
