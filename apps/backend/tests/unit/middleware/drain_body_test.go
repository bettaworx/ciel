package middleware_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"backend/internal/middleware"
)

// A handler that rejects a request without reading its body leaves net/http no
// choice but to close the connection, which an uploading browser reports as a
// failed request instead of the status. The middleware has to consume what is
// left before the response goes out.
func TestDrainRequestBody_ConsumesWhatTheHandlerIgnored(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/media", strings.NewReader(strings.Repeat("x", 64*1024)))

	handler := middleware.DrainRequestBody(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Rate limiter behaviour: respond immediately, read nothing.
		w.WriteHeader(http.StatusTooManyRequests)
	}))

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected the handler's status to survive, got %d", rr.Code)
	}
	remaining, err := io.Copy(io.Discard, req.Body)
	if err != nil {
		t.Fatalf("reading the body after draining: %v", err)
	}
	if remaining != 0 {
		t.Fatalf("expected the body to be drained, %d bytes left", remaining)
	}
}

func TestDrainRequestBody_LeavesAConsumedBodyAlone(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/media", strings.NewReader("payload"))

	var got string
	handler := middleware.DrainRequestBody(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		got = string(body)
		w.WriteHeader(http.StatusOK)
	}))

	handler.ServeHTTP(httptest.NewRecorder(), req)

	if got != "payload" {
		t.Fatalf("handler should still see the whole body, got %q", got)
	}
}
