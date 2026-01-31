package middleware

import (
	"bufio"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"time"

	"backend/internal/auth"
	"backend/internal/logging"

	chimw "github.com/go-chi/chi/v5/middleware"
)

type AccessLogOptions struct {
	TrustProxy bool
}

type statusRecorder struct {
	http.ResponseWriter
	status      int
	wroteBytes  int
	wroteHeader bool
}

func (sr *statusRecorder) WriteHeader(code int) {
	if sr.wroteHeader {
		return
	}
	sr.status = code
	sr.wroteHeader = true
	sr.ResponseWriter.WriteHeader(code)
}

func (sr *statusRecorder) Write(b []byte) (int, error) {
	if !sr.wroteHeader {
		sr.WriteHeader(http.StatusOK)
	}
	n, err := sr.ResponseWriter.Write(b)
	sr.wroteBytes += n
	return n, err
}

func (sr *statusRecorder) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	hijacker, ok := sr.ResponseWriter.(http.Hijacker)
	if !ok {
		return nil, nil, errors.New("response does not implement http.Hijacker")
	}
	return hijacker.Hijack()
}

// AccessLog records basic request/response metadata to the default logger.
func AccessLog(opt AccessLogOptions) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rec := &statusRecorder{ResponseWriter: w}
			requestID := chimw.GetReqID(r.Context())
			clientIP := ClientIP(r, opt.TrustProxy)
			route := r.Method + " " + r.URL.Path

			ctx := logging.WithRequestContext(r.Context(), requestID, clientIP, route)
			r = r.WithContext(ctx)

			next.ServeHTTP(rec, r)

			status := rec.status
			if status == 0 {
				status = http.StatusOK
			}
			attrs := []slog.Attr{
				slog.String("request_id", requestID),
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.Int("status", status),
				slog.Int64("latency_ms", time.Since(start).Milliseconds()),
				slog.String("client_ip", clientIP),
				slog.String("user_agent", r.UserAgent()),
			}
			if user, ok := auth.UserFromContext(r.Context()); ok {
				attrs = append(attrs, slog.String("user_id", user.ID.String()))
			}
			if rec.wroteBytes > 0 {
				attrs = append(attrs, slog.Int("response_bytes", rec.wroteBytes))
			}

			slog.LogAttrs(r.Context(), slog.LevelInfo, "access", attrs...)
		})
	}
}
