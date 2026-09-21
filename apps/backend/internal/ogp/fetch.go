// Package ogp fetches and parses Open Graph metadata from third-party URLs.
//
// Everything that talks to the outside world lives behind Fetcher so callers
// (and tests) never depend on the real network.
package ogp

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"strings"
	"syscall"
	"time"
)

const (
	// UserAgent identifies our scraper to remote sites.
	UserAgent = "Ciel OGP Fetcher/1.0"

	dialTimeout    = 5 * time.Second
	requestTimeout = 10 * time.Second
	maxRedirects   = 5
)

var (
	// ErrBlockedAddress is returned when a target resolves to a private or
	// reserved address. It surfaces through the http.Client as a dial error.
	ErrBlockedAddress = errors.New("ogp: target resolves to a blocked address")

	// ErrTooManyRedirects is returned when the redirect chain is too long.
	ErrTooManyRedirects = errors.New("ogp: too many redirects")

	// ErrDisallowedScheme is returned for anything that is not http(s).
	ErrDisallowedScheme = errors.New("ogp: only http and https URLs are allowed")

	// ErrDisallowedContentType is returned when the response type is not allowed.
	ErrDisallowedContentType = errors.New("ogp: disallowed content type")
)

// blockedPrefixes covers the ranges netip's own predicates do not.
//
//	0.0.0.0/8        - "this" network
//	100.64.0.0/10    - shared address space (CGNAT, RFC 6598)
//	192.0.0.0/24     - IETF protocol assignments
//	192.0.2.0/24     - TEST-NET-1
//	192.88.99.0/24   - 6to4 relay anycast (deprecated)
//	198.18.0.0/15    - benchmarking
//	198.51.100.0/24  - TEST-NET-2
//	203.0.113.0/24   - TEST-NET-3
//	240.0.0.0/4      - reserved
//	100::/64         - discard-only (RFC 6666)
//	2001::/32        - Teredo
//	2001:db8::/32    - documentation
//	2002::/16        - 6to4 (deprecated)
var blockedPrefixes = []netip.Prefix{
	netip.MustParsePrefix("0.0.0.0/8"),
	netip.MustParsePrefix("100.64.0.0/10"),
	netip.MustParsePrefix("192.0.0.0/24"),
	netip.MustParsePrefix("192.0.2.0/24"),
	netip.MustParsePrefix("192.88.99.0/24"),
	netip.MustParsePrefix("198.18.0.0/15"),
	netip.MustParsePrefix("198.51.100.0/24"),
	netip.MustParsePrefix("203.0.113.0/24"),
	netip.MustParsePrefix("240.0.0.0/4"),
	netip.MustParsePrefix("100::/64"),
	netip.MustParsePrefix("2001::/32"),
	netip.MustParsePrefix("2001:db8::/32"),
	netip.MustParsePrefix("2002::/16"),
}

// IsBlockedAddr reports whether addr must not be connected to.
//
// Unmapping first means an IPv4-mapped IPv6 address (::ffff:127.0.0.1) is
// judged by its IPv4 rules rather than slipping through as "some v6 address".
func IsBlockedAddr(addr netip.Addr) bool {
	if !addr.IsValid() {
		return true
	}

	addr = addr.Unmap()

	if addr.IsLoopback() ||
		addr.IsPrivate() ||
		addr.IsUnspecified() ||
		addr.IsLinkLocalUnicast() ||
		addr.IsLinkLocalMulticast() ||
		addr.IsInterfaceLocalMulticast() ||
		addr.IsMulticast() {
		return true
	}

	for _, prefix := range blockedPrefixes {
		if prefix.Contains(addr) {
			return true
		}
	}

	return false
}

// controlBlockPrivate runs after DNS resolution and immediately before the
// socket connects, so it sees the address the kernel is about to dial. That
// closes the DNS-rebinding window a "resolve, validate, then connect" check
// would leave open, and it applies to every redirect hop for free.
func controlBlockPrivate(_, address string, _ syscall.RawConn) error {
	addrPort, err := netip.ParseAddrPort(address)
	if err != nil {
		return fmt.Errorf("ogp: unparsable dial address %q: %w", address, err)
	}

	if IsBlockedAddr(addrPort.Addr()) {
		return fmt.Errorf("%w: %s", ErrBlockedAddress, addrPort.Addr())
	}

	return nil
}

// ValidateURL checks the parts of a target we can judge without connecting.
func ValidateURL(raw string) (*url.URL, error) {
	parsed, err := url.Parse(raw)
	if err != nil {
		return nil, fmt.Errorf("ogp: malformed URL: %w", err)
	}

	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return nil, ErrDisallowedScheme
	}

	if parsed.Host == "" {
		return nil, errors.New("ogp: malformed URL: missing host")
	}

	return parsed, nil
}

// SanitizeURL strips the query string and any userinfo so a target can be
// logged without leaking tokens that sites put in preview links.
func SanitizeURL(raw string) string {
	parsed, err := url.Parse(raw)
	if err != nil {
		if base, _, found := strings.Cut(raw, "?"); found {
			return base
		}
		return raw
	}

	parsed.User = nil
	parsed.RawQuery = ""
	parsed.Fragment = ""
	return parsed.String()
}

// Options narrows what a single fetch will accept.
type Options struct {
	// MaxBodySize caps how many bytes Response.Body will yield.
	MaxBodySize int64
	// AllowedContentTypes are Content-Type prefixes; empty means anything.
	AllowedContentTypes []string
	// Headers are added to (and override) the defaults.
	Headers map[string]string
}

// Response is a fetched, validated, size-limited response.
type Response struct {
	Body        io.ReadCloser
	ContentType string
	FinalURL    string
	StatusCode  int
}

// Fetcher retrieves remote URLs. The production implementation is Client;
// tests substitute their own.
type Fetcher interface {
	Fetch(ctx context.Context, rawURL string, opts Options) (*Response, error)
}

// Client is the SSRF-hardened Fetcher used in production.
type Client struct {
	httpClient *http.Client
}

// NewClient builds a Fetcher that refuses to connect to private or reserved
// addresses and follows at most maxRedirects hops.
func NewClient() *Client {
	dialer := &net.Dialer{
		Timeout: dialTimeout,
		Control: controlBlockPrivate,
	}

	return &Client{
		httpClient: &http.Client{
			Timeout: requestTimeout,
			Transport: &http.Transport{
				DialContext:           dialer.DialContext,
				TLSHandshakeTimeout:   dialTimeout,
				ResponseHeaderTimeout: requestTimeout,
				DisableKeepAlives:     true,
				Proxy:                 nil, // never route scrapes through a proxy
			},
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= maxRedirects {
					return ErrTooManyRedirects
				}
				if req.URL.Scheme != "http" && req.URL.Scheme != "https" {
					return ErrDisallowedScheme
				}
				return nil
			},
		},
	}
}

// Fetch performs a GET, validating the target and the response type, and
// returns a body that cannot yield more than opts.MaxBodySize bytes.
func (c *Client) Fetch(ctx context.Context, rawURL string, opts Options) (*Response, error) {
	if _, err := ValidateURL(rawURL); err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, fmt.Errorf("ogp: building request: %w", err)
	}

	req.Header.Set("User-Agent", UserAgent)
	req.Header.Set("Accept", "text/html, application/xhtml+xml, image/*, */*;q=0.1")
	req.Header.Set("Accept-Language", "ja,en;q=0.9")
	for key, value := range opts.Headers {
		req.Header.Set(key, value)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}

	contentType := resp.Header.Get("Content-Type")
	if !contentTypeAllowed(contentType, opts.AllowedContentTypes) {
		_ = resp.Body.Close()
		return nil, fmt.Errorf("%w: %s", ErrDisallowedContentType, contentType)
	}

	body := resp.Body
	if opts.MaxBodySize > 0 {
		body = &limitedBody{
			reader: io.LimitReader(resp.Body, opts.MaxBodySize),
			closer: resp.Body,
		}
	}

	return &Response{
		Body:        body,
		ContentType: contentType,
		FinalURL:    resp.Request.URL.String(),
		StatusCode:  resp.StatusCode,
	}, nil
}

func contentTypeAllowed(contentType string, allowed []string) bool {
	if len(allowed) == 0 {
		return true
	}

	normalized := strings.ToLower(strings.TrimSpace(contentType))
	for _, prefix := range allowed {
		if strings.HasPrefix(normalized, prefix) {
			return true
		}
	}

	return false
}

// limitedBody keeps Close wired to the real body while Read is capped.
type limitedBody struct {
	reader io.Reader
	closer io.Closer
}

func (b *limitedBody) Read(p []byte) (int, error) { return b.reader.Read(p) }
func (b *limitedBody) Close() error               { return b.closer.Close() }
