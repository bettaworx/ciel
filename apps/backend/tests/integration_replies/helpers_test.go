//go:build integration
// +build integration

package integration_replies_test

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/cache"
	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
)

type testApp struct {
	Server       *httptest.Server
	TokenManager *auth.TokenManager
	SQLDB        *sql.DB
	RDB          *redis.Client
}

func newTestApp(t *testing.T) *testApp {
	t.Helper()

	databaseURL := os.Getenv("DATABASE_URL")
	redisAddr := os.Getenv("REDIS_ADDR")
	if databaseURL == "" || redisAddr == "" {
		t.Skip("DATABASE_URL/REDIS_ADDR not set (run via docker compose test harness)")
	}

	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("test-secret-test-secret-test-secret-32b")
	}
	tokenManager := auth.NewTokenManager(jwtSecret, 1*time.Hour)

	sqlDB, err := db.Open(databaseURL)
	if err != nil {
		t.Fatalf("db.Open: %v", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := sqlDB.PingContext(ctx); err != nil {
		_ = sqlDB.Close()
		t.Fatalf("db ping: %v", err)
	}

	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	if err := rdb.Ping(ctx).Err(); err != nil {
		_ = sqlDB.Close()
		_ = rdb.Close()
		t.Fatalf("redis ping: %v", err)
	}

	if err := resetDB(ctx, sqlDB); err != nil {
		_ = sqlDB.Close()
		_ = rdb.Close()
		t.Fatalf("reset db: %v", err)
	}
	if err := rdb.FlushDB(ctx).Err(); err != nil {
		_ = sqlDB.Close()
		_ = rdb.Close()
		t.Fatalf("redis flushdb: %v", err)
	}

	store := repository.NewStore(sqlDB)
	cacheImpl := cache.NewRedisCache(rdb)

	r := chi.NewRouter()
	r.Use(middleware.OptionalAuth(tokenManager))
	r.Use(middleware.AccessControl(rdb, middleware.AccessControlOptions{TrustProxy: false}))
	r.Use(middleware.RateLimit(rdb, middleware.RateLimitOptions{TrustProxy: false}))
	authzSvc := service.NewAuthzService(store)
	r.Use(middleware.RequireAdminAccess(tokenManager, authzSvc))

	mediaDir := t.TempDir()
	mediaCfg := config.DefaultConfig().Media
	mediaSvc := service.NewMediaService(store, mediaDir, mediaCfg, nil)

	postsSvc := service.NewPostsService(store, cacheImpl, nil)
	timelineSvc := service.NewTimelineService(store, cacheImpl)
	reactionsSvc := service.NewReactionsService(store, cacheImpl, nil)
	postsSvc.SetReactionsService(reactionsSvc)
	timelineSvc.SetReactionsService(reactionsSvc)

	apiServer := handlers.API{
		Auth:      service.NewAuthServiceWithOptions(store, tokenManager, service.AuthServiceOptions{}),
		Admin:     service.NewAdminService(store, cacheImpl, nil, nil),
		Authz:     authzSvc,
		Users:     service.NewUsersService(store),
		Posts:     postsSvc,
		Timeline:  timelineSvc,
		Reactions: reactionsSvc,
		Media:     mediaSvc,
	}
	api.HandlerFromMuxWithBaseURL(&apiServer, r, "/api/v1")

	srv := httptest.NewServer(r)

	return &testApp{
		Server:       srv,
		TokenManager: tokenManager,
		SQLDB:        sqlDB,
		RDB:          rdb,
	}
}

func (a *testApp) Close() {
	if a == nil {
		return
	}
	if a.Server != nil {
		a.Server.Close()
	}
	if a.RDB != nil {
		_ = a.RDB.Close()
	}
	if a.SQLDB != nil {
		_ = a.SQLDB.Close()
	}
}

func resetDB(ctx context.Context, d *sql.DB) error {
	_, err := d.ExecContext(ctx, `TRUNCATE TABLE
		post_mentions,
		notifications,
		post_reaction_events,
		post_reaction_counts,
		post_media,
		media,
		posts,
		auth_credentials,
		users
	RESTART IDENTITY CASCADE;`)
	if err != nil {
		return err
	}
	_, err = d.ExecContext(ctx, `INSERT INTO server_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;`)
	return err
}

func postJSON(t *testing.T, client *http.Client, url string, body any, headers map[string]string) *http.Response {
	t.Helper()
	b, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("client.Do: %v", err)
	}
	return resp
}

func get(t *testing.T, client *http.Client, url string, headers map[string]string) *http.Response {
	t.Helper()
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("client.Do: %v", err)
	}
	return resp
}

func deleteReq(t *testing.T, client *http.Client, url string, headers map[string]string) *http.Response {
	t.Helper()
	req, err := http.NewRequest(http.MethodDelete, url, nil)
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("client.Do: %v", err)
	}
	return resp
}

func decodeJSON[T any](t *testing.T, resp *http.Response) T {
	t.Helper()
	defer resp.Body.Close()
	var v T
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		t.Fatalf("decode json: %v", err)
	}
	return v
}

func registerUser(t *testing.T, client *http.Client, baseURL, username, password string) api.User {
	t.Helper()
	resp := postJSON(t, client, baseURL+"/api/v1/auth/register", map[string]any{
		"username": username,
		"password": password,
		// resetDB seeds server_settings with the schema defaults.
		"termsVersion":   1,
		"privacyVersion": 1,
	}, nil)
	if resp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("register(%s): expected 201, got %d (%v)", username, resp.StatusCode, errBody)
	}
	return decodeJSON[api.User](t, resp)
}

func issueBearer(t *testing.T, tm *auth.TokenManager, u api.User) map[string]string {
	t.Helper()
	tok, _, err := tm.Issue(auth.User{ID: u.Id, Username: string(u.Username)})
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}
	return map[string]string{"Authorization": "Bearer " + tok}
}

func createPost(t *testing.T, client *http.Client, baseURL string, authz map[string]string, content string) api.Post {
	t.Helper()
	resp := postJSON(t, client, baseURL+"/api/v1/posts", map[string]any{"content": content}, authz)
	if resp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("create post: expected 201, got %d (%v)", resp.StatusCode, errBody)
	}
	return decodeJSON[api.Post](t, resp)
}
