package middleware

import (
	"net"
	"net/http"
	"strings"
)

// ClientIP returns the best-effort client IP address.
//
// If trustProxy is true, X-Forwarded-For is used (left-most IP).
// Otherwise, RemoteAddr is used.
func ClientIP(r *http.Request, trustProxy bool) string {
	if trustProxy {
		if xff := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); xff != "" {
			// XFF format: client, proxy1, proxy2
			parts := strings.Split(xff, ",")
			if len(parts) > 0 {
				ip := strings.TrimSpace(parts[0])
				if ip != "" {
					return ip
				}
			}
		}
		if xrip := strings.TrimSpace(r.Header.Get("X-Real-Ip")); xrip != "" {
			return xrip
		}
	}

	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil && host != "" {
		return host
	}
	// RemoteAddr might already be just an IP.
	return strings.TrimSpace(r.RemoteAddr)
}
