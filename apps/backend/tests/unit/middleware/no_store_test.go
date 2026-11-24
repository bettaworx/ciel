package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/internal/middleware"
)

// A media 404 that carries no Cache-Control is cached by a CDN in front, which then
// keeps serving the 404 after the file is back.
func TestNoStoreByDefault_ErrorKeepsNoStore(t *testing.T) {
	handler := middleware.NoStoreByDefault(http.HandlerFunc(http.NotFound))

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/media/x/image.webp", nil))

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}
	if got := rr.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("expected Cache-Control no-store on the 404, got %q", got)
	}
}

func TestNoStoreByDefault_HandlerReplacesItWhenServing(t *testing.T) {
	const immutable = "public, max-age=31536000, immutable"
	handler := middleware.NoStoreByDefault(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", immutable)
		_, _ = w.Write([]byte("image"))
	}))

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/media/x/image.webp", nil))

	if got := rr.Header().Get("Cache-Control"); got != immutable {
		t.Fatalf("expected the handler's Cache-Control to win, got %q", got)
	}
}
