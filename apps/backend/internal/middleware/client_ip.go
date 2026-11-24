package middleware

import (
	"net"
	"net/http"
	"strings"
)

// ClientIP returns the best-effort client IP address.
//
// If trustProxy is true, use the IP appended by the nearest trusted proxy.
// Otherwise, RemoteAddr is used.
func ClientIP(r *http.Request, trustProxy bool) string {
	if trustProxy {
		if xff := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); xff != "" {
			parts := strings.Split(xff, ",")
			if ip := net.ParseIP(strings.TrimSpace(parts[len(parts)-1])); ip != nil {
				return ip.String()
			}
		}
	}

	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil && host != "" {
		return host
	}
	// RemoteAddr might already be just an IP.
	return strings.TrimSpace(r.RemoteAddr)
}
