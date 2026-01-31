package logging

import (
	"context"
	"log/slog"
	"strings"
)

type requestInfo struct {
	requestID string
	clientIP  string
	route     string
}

type requestInfoKey struct{}

// WithRequestContext stores request metadata in context for auditing.
func WithRequestContext(ctx context.Context, requestID, clientIP, route string) context.Context {
	if ctx == nil {
		ctx = context.Background()
	}
	info := requestInfo{
		requestID: strings.TrimSpace(requestID),
		clientIP:  strings.TrimSpace(clientIP),
		route:     strings.TrimSpace(route),
	}
	return context.WithValue(ctx, requestInfoKey{}, info)
}

// RequestAttrs returns slog attributes for request metadata.
func RequestAttrs(ctx context.Context) []slog.Attr {
	if ctx == nil {
		return nil
	}
	info, ok := ctx.Value(requestInfoKey{}).(requestInfo)
	if !ok {
		return nil
	}
	attrs := make([]slog.Attr, 0, 3)
	if info.requestID != "" {
		attrs = append(attrs, slog.String("request_id", info.requestID))
	}
	if info.clientIP != "" {
		attrs = append(attrs, slog.String("client_ip", info.clientIP))
	}
	if info.route != "" {
		attrs = append(attrs, slog.String("route", info.route))
	}
	return attrs
}
