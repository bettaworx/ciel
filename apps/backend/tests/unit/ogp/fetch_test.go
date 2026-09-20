package ogp

import (
	"context"
	"errors"
	"net/netip"
	"testing"

	"backend/internal/ogp"
)

// The address tables mirror apps/frontend/lib/ogp/ssrf.test.ts so the Go guard
// is verified against exactly the cases the TypeScript implementation was.
func TestIsBlockedAddrBlocksPrivateAndReserved(t *testing.T) {
	cases := []struct {
		addr string
		why  string
	}{
		// IPv4
		{"0.0.0.0", "0.0.0.0/8 - this network"},
		{"0.255.255.255", "0.0.0.0/8 upper bound"},
		{"10.0.0.1", "10.0.0.0/8 - private RFC 1918"},
		{"10.255.255.255", "10.0.0.0/8 upper bound"},
		{"100.64.0.1", "100.64.0.0/10 - CGNAT RFC 6598"},
		{"100.127.255.255", "100.64.0.0/10 upper bound"},
		{"127.0.0.1", "127.0.0.0/8 - loopback"},
		{"127.255.255.255", "127.0.0.0/8 upper bound"},
		{"169.254.0.1", "169.254.0.0/16 - link-local"},
		{"169.254.255.255", "169.254.0.0/16 upper bound"},
		{"172.16.0.1", "172.16.0.0/12 - private RFC 1918"},
		{"172.31.255.255", "172.16.0.0/12 upper bound"},
		{"192.0.0.1", "192.0.0.0/24 - IETF protocol assignments"},
		{"192.0.2.1", "192.0.2.0/24 - TEST-NET-1"},
		{"192.88.99.1", "192.88.99.0/24 - 6to4 relay anycast"},
		{"192.168.0.1", "192.168.0.0/16 - private RFC 1918"},
		{"192.168.255.255", "192.168.0.0/16 upper bound"},
		{"198.18.0.1", "198.18.0.0/15 - benchmarking"},
		{"198.19.255.255", "198.18.0.0/15 upper bound"},
		{"198.51.100.1", "198.51.100.0/24 - TEST-NET-2"},
		{"203.0.113.1", "203.0.113.0/24 - TEST-NET-3"},
		{"224.0.0.1", "224.0.0.0/4 - multicast"},
		{"239.255.255.255", "224.0.0.0/4 upper bound"},
		{"240.0.0.1", "240.0.0.0/4 - reserved"},
		{"255.255.255.255", "broadcast"},
		// IPv6
		{"::1", "loopback"},
		{"::", "unspecified"},
		{"::ffff:127.0.0.1", "IPv4-mapped loopback"},
		{"::ffff:192.168.1.1", "IPv4-mapped private"},
		{"::ffff:10.0.0.1", "IPv4-mapped 10.x"},
		{"fc00::1", "unique local fc00::/7"},
		{"fd00::1", "unique local fd00::/8"},
		{"fe80::1", "link-local"},
		{"ff02::1", "multicast"},
		{"2001:db8::1", "documentation"},
		{"2002::1", "6to4 deprecated"},
		{"2001::1", "Teredo"},
		{"100::1", "discard-only RFC 6666"},
	}

	for _, tc := range cases {
		addr, err := netip.ParseAddr(tc.addr)
		if err != nil {
			t.Fatalf("unparsable test address %q: %v", tc.addr, err)
		}
		if !ogp.IsBlockedAddr(addr) {
			t.Errorf("IsBlockedAddr(%s) = false, want true (%s)", tc.addr, tc.why)
		}
	}
}

func TestIsBlockedAddrAllowsPublic(t *testing.T) {
	cases := []string{
		"1.1.1.1",              // Cloudflare DNS
		"8.8.8.8",              // Google DNS
		"93.184.216.34",        // example.com
		"100.63.255.255",       // just below CGNAT
		"100.128.0.0",          // just above CGNAT
		"172.15.255.255",       // just below 172.16.0.0/12
		"172.32.0.0",           // just above 172.16.0.0/12
		"192.0.3.0",            // just above 192.0.2.0/24
		"198.17.255.255",       // just below 198.18.0.0/15
		"198.20.0.0",           // just above 198.18.0.0/15
		"223.255.255.255",      // just below multicast
		"2606:4700:4700::1111", // Cloudflare DNS
		"2001:4860:4860::8888", // Google DNS
	}

	for _, raw := range cases {
		addr, err := netip.ParseAddr(raw)
		if err != nil {
			t.Fatalf("unparsable test address %q: %v", raw, err)
		}
		if ogp.IsBlockedAddr(addr) {
			t.Errorf("IsBlockedAddr(%s) = true, want false", raw)
		}
	}
}

func TestIsBlockedAddrDeniesInvalidByDefault(t *testing.T) {
	if !ogp.IsBlockedAddr(netip.Addr{}) {
		t.Error("the zero Addr must be blocked (deny by default)")
	}
}

func TestValidateURL(t *testing.T) {
	cases := []struct {
		name    string
		url     string
		wantErr error
	}{
		{name: "http is allowed", url: "http://example.com/page"},
		{name: "https is allowed", url: "https://example.com/page"},
		{name: "ftp is rejected", url: "ftp://example.com", wantErr: ogp.ErrDisallowedScheme},
		{name: "file is rejected", url: "file:///etc/passwd", wantErr: ogp.ErrDisallowedScheme},
		{name: "data is rejected", url: "data:image/png;base64,AAAA", wantErr: ogp.ErrDisallowedScheme},
		{name: "scheme-less input is rejected", url: "not-a-url", wantErr: ogp.ErrDisallowedScheme},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := ogp.ValidateURL(tc.url)

			if tc.wantErr != nil {
				if !errors.Is(err, tc.wantErr) {
					t.Fatalf("ValidateURL(%q) error = %v, want %v", tc.url, err, tc.wantErr)
				}
				return
			}

			if err != nil {
				t.Fatalf("ValidateURL(%q) unexpected error: %v", tc.url, err)
			}
		})
	}
}

func TestValidateURLRejectsMissingHost(t *testing.T) {
	if _, err := ogp.ValidateURL("http:///page"); err == nil {
		t.Error("a URL without a host must be rejected")
	}
}

// The dial-time guard is what actually stops SSRF, so assert it end to end:
// a literal loopback target must never reach the socket. Port 9 (discard) is
// used so the test fails on the guard rather than on a connection refusal.
func TestClientRefusesToDialLoopback(t *testing.T) {
	client := ogp.NewClient()

	_, err := client.Fetch(context.Background(), "http://127.0.0.1:9/", ogp.Options{})
	if err == nil {
		t.Fatal("expected the dial guard to reject a loopback target")
	}
	if !errors.Is(err, ogp.ErrBlockedAddress) {
		t.Fatalf("error = %v, want ErrBlockedAddress", err)
	}
}

func TestClientRefusesDisallowedScheme(t *testing.T) {
	client := ogp.NewClient()

	_, err := client.Fetch(context.Background(), "file:///etc/passwd", ogp.Options{})
	if !errors.Is(err, ogp.ErrDisallowedScheme) {
		t.Fatalf("error = %v, want ErrDisallowedScheme", err)
	}
}
