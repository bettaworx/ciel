package middleware_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"backend/internal/auth"
	"backend/internal/middleware"

	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

func TestAccessControl_DenyIPSet(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	if err := rdb.SAdd(context.Background(), "deny:ip", "1.2.3.4").Err(); err != nil {
		t.Fatalf("SAdd: %v", err)
	}

	mw := middleware.AccessControl(rdb, middleware.AccessControlOptions{})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/timeline", nil)
	req.RemoteAddr = "1.2.3.4:1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestAccessControl_DenyRouteSubject(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	if err := rdb.SAdd(context.Background(), "deny:route:auth_login_start", "ip:1.2.3.4").Err(); err != nil {
		t.Fatalf("SAdd: %v", err)
	}

	mw := middleware.AccessControl(rdb, middleware.AccessControlOptions{})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/start", nil)
	req.RemoteAddr = "1.2.3.4:9999"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}

	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/timeline", nil)
	req2.RemoteAddr = "1.2.3.4:9999"
	rr2 := httptest.NewRecorder()
	h.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr2.Code)
	}
}

func TestAccessControl_TemporaryIPBan(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	if err := rdb.Set(context.Background(), "deny:ip:1.2.3.4", "1", 10*time.Second).Err(); err != nil {
		t.Fatalf("Set: %v", err)
	}

	mw := middleware.AccessControl(rdb, middleware.AccessControlOptions{})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/timeline", nil)
	req.RemoteAddr = "1.2.3.4:1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestAccessControl_DenyUserSet(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	uid := uuid.New()
	if err := rdb.SAdd(context.Background(), "deny:user", uid.String()).Err(); err != nil {
		t.Fatalf("SAdd: %v", err)
	}

	mw := middleware.AccessControl(rdb, middleware.AccessControlOptions{})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	ctx := auth.WithUser(context.Background(), auth.User{ID: uid, Username: "u"})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/posts", nil).WithContext(ctx)
	req.RemoteAddr = "1.2.3.4:1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestAccessControl_DenyUserTemporary(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	uid := uuid.New()
	if err := rdb.Set(context.Background(), "deny:user:"+uid.String(), "1", 10*time.Second).Err(); err != nil {
		t.Fatalf("Set: %v", err)
	}

	mw := middleware.AccessControl(rdb, middleware.AccessControlOptions{})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	ctx := auth.WithUser(context.Background(), auth.User{ID: uid, Username: "u"})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/posts", nil).WithContext(ctx)
	req.RemoteAddr = "1.2.3.4:1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestAccessControl_DenyRouteAll(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	if err := rdb.SAdd(context.Background(), "deny:route:timeline_get", "*").Err(); err != nil {
		t.Fatalf("SAdd: %v", err)
	}

	mw := middleware.AccessControl(rdb, middleware.AccessControlOptions{})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/timeline", nil)
	req.RemoteAddr = "1.2.3.4:1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestAccessControl_DenyRouteUser(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	uid := uuid.New()
	if err := rdb.SAdd(context.Background(), "deny:route:posts_create", "user:"+uid.String()).Err(); err != nil {
		t.Fatalf("SAdd: %v", err)
	}

	mw := middleware.AccessControl(rdb, middleware.AccessControlOptions{})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	ctx := auth.WithUser(context.Background(), auth.User{ID: uid, Username: "u"})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/posts", nil).WithContext(ctx)
	req.RemoteAddr = "1.2.3.4:1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestAccessControl_DenyRouteBan(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	if err := rdb.Set(context.Background(), "deny:route:auth_login_finish:ban", "1", 10*time.Second).Err(); err != nil {
		t.Fatalf("Set: %v", err)
	}

	mw := middleware.AccessControl(rdb, middleware.AccessControlOptions{})
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/finish", nil)
	req.RemoteAddr = "1.2.3.4:1234"
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}
