package api_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"backend/internal/api"

	"github.com/go-chi/chi/v5"
)

type timelineSpy struct {
	api.Unimplemented
	called bool
	params api.GetTimelineParams
}

func (s *timelineSpy) GetTimeline(w http.ResponseWriter, r *http.Request, params api.GetTimelineParams) {
	s.called = true
	s.params = params
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

func TestHandlerFromMuxWithBaseURL_RoutesToBaseURL(t *testing.T) {
	spy := &timelineSpy{}

	r := chi.NewRouter()
	_ = api.HandlerFromMuxWithBaseURL(spy, r, "/api/v1")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/timeline?limit=10&cursor=abc", nil)
	res := httptest.NewRecorder()
	r.ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", res.Code)
	}
	if !spy.called {
		t.Fatalf("expected handler GetTimeline to be called")
	}
	if spy.params.Limit == nil || *spy.params.Limit != 10 {
		t.Fatalf("expected limit=10, got %#v", spy.params.Limit)
	}
	if spy.params.Cursor == nil || *spy.params.Cursor != "abc" {
		t.Fatalf("expected cursor=abc, got %#v", spy.params.Cursor)
	}
}

func TestDefaultErrorHandler_InvalidQueryParamFormat_Returns400(t *testing.T) {
	h := api.Handler(api.Unimplemented{})

	req := httptest.NewRequest(http.MethodGet, "/timeline?limit=not-an-int", nil)
	res := httptest.NewRecorder()
	h.ServeHTTP(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", res.Code)
	}
	body, _ := io.ReadAll(res.Body)
	if !strings.Contains(string(body), "Invalid format for parameter limit") {
		t.Fatalf("expected error to mention invalid limit format, got: %s", string(body))
	}
}

func TestDefaultErrorHandler_MissingRequiredQueryParam_Returns400(t *testing.T) {
	h := api.Handler(api.Unimplemented{})

	postID := "00000000-0000-0000-0000-000000000000"
	req := httptest.NewRequest(http.MethodDelete, "/posts/"+postID+"/reactions", nil)
	res := httptest.NewRecorder()
	h.ServeHTTP(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", res.Code)
	}
	body, _ := io.ReadAll(res.Body)
	if !strings.Contains(string(body), "Query argument emoji is required") {
		t.Fatalf("expected error to mention required emoji, got: %s", string(body))
	}
}

func TestUnimplemented_ValidRoute_Returns501(t *testing.T) {
	h := api.Handler(api.Unimplemented{})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	res := httptest.NewRecorder()
	h.ServeHTTP(res, req)

	if res.Code != http.StatusNotImplemented {
		t.Fatalf("expected status 501, got %d", res.Code)
	}
}
