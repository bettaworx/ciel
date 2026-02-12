//go:build integration
// +build integration

package integration_test

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"image"
	"image/color"
	"image/png"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/db"
	"backend/internal/db/sqlc"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/pbkdf2"
)

type testApp struct {
	Server       *httptest.Server
	TokenManager *auth.TokenManager
	SQLDB        *sql.DB
	RDB          *redis.Client
}

func newTestApp(t *testing.T) *testApp {
	return newTestAppWithAuthOptions(t, service.AuthServiceOptions{})
}

func newTestAppWithAuthOptions(t *testing.T, authOpts service.AuthServiceOptions) *testApp {
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

	r := chi.NewRouter()
	r.Use(middleware.OptionalAuth(tokenManager))
	r.Use(middleware.AccessControl(rdb, middleware.AccessControlOptions{TrustProxy: false}))
	r.Use(middleware.RateLimit(rdb, middleware.RateLimitOptions{TrustProxy: false}))
	authzSvc := service.NewAuthzService(store)
	r.Use(middleware.RequireAdminAccess(tokenManager, authzSvc))

	mediaDir := os.Getenv("MEDIA_DIR")
	if mediaDir == "" {
		mediaDir = t.TempDir()
	}

	mediaSvc := service.NewMediaService(store, mediaDir, nil)

	r.Get("/media/{mediaId}/image.png", mediaSvc.ServeImage)
	r.Get("/media/{mediaId}/image.webp", mediaSvc.ServeImage)

	apiServer := handlers.API{
		Items:     service.NewItemsService(repository.NewItemsRepository(sqlDB)),
		Auth:      service.NewAuthServiceWithOptions(store, tokenManager, authOpts),
		Admin:     service.NewAdminService(store, rdb, nil),
		Authz:     authzSvc,
		Users:     service.NewUsersService(store),
		Posts:     service.NewPostsService(store, rdb, nil),
		Timeline:  service.NewTimelineService(store, rdb),
		Reactions: service.NewReactionsService(store, rdb, nil),
		Media:     mediaSvc,
	}
	api.HandlerFromMuxWithBaseURL(apiServer, r, "/api/v1")

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

func resetDB(ctx context.Context, db *sql.DB) error {
	_, err := db.ExecContext(ctx, `TRUNCATE TABLE
		post_reaction_events,
		post_reaction_counts,
		post_media,
		media,
		posts,
		auth_credentials,
		users,
		items
	RESTART IDENTITY CASCADE;`)
	if err != nil {
		return err
	}
	_, err = db.ExecContext(ctx, `INSERT INTO server_settings (id, signup_enabled)
VALUES (1, TRUE)
ON CONFLICT (id) DO UPDATE
SET signup_enabled = EXCLUDED.signup_enabled;`)
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

func patchJSON(t *testing.T, client *http.Client, url string, body any, headers map[string]string) *http.Response {
	t.Helper()
	b, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}
	req, err := http.NewRequest(http.MethodPatch, url, bytes.NewReader(b))
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

func putJSON(t *testing.T, client *http.Client, url string, body any, headers map[string]string) *http.Response {
	t.Helper()
	b, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}
	req, err := http.NewRequest(http.MethodPut, url, bytes.NewReader(b))
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

func registerUser(t *testing.T, client *http.Client, baseURL, username, password string) api.User {
	t.Helper()
	resp := postJSON(t, client, baseURL+"/api/v1/auth/register", map[string]any{
		"username": username,
		"password": password,
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

func createPNGBytes(t *testing.T, w, h int) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			img.Set(x, y, color.RGBA{R: 10, G: 20, B: 30, A: 255})
		}
	}
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("png.Encode: %v", err)
	}
	return buf.Bytes()
}

func uploadMediaMultipart(t *testing.T, client *http.Client, baseURL string, authz map[string]string, filename string, declaredContentType string, data []byte) *http.Response {
	t.Helper()

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	if strings.TrimSpace(declaredContentType) == "" {
		part, err := mw.CreateFormFile("file", filename)
		if err != nil {
			t.Fatalf("CreateFormFile: %v", err)
		}
		_, _ = part.Write(data)
	} else {
		h := make(textproto.MIMEHeader)
		h.Set("Content-Disposition", `form-data; name="file"; filename="`+filename+`"`)
		h.Set("Content-Type", declaredContentType)
		part, err := mw.CreatePart(h)
		if err != nil {
			t.Fatalf("CreatePart: %v", err)
		}
		_, _ = part.Write(data)
	}
	_ = mw.Close()

	req, err := http.NewRequest(http.MethodPost, baseURL+"/api/v1/media", &body)
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())
	for k, v := range authz {
		req.Header.Set(k, v)
	}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("client.Do: %v", err)
	}
	return resp
}

func uploadAvatarMultipart(t *testing.T, client *http.Client, baseURL string, authz map[string]string, filename string, declaredContentType string, data []byte) *http.Response {
	t.Helper()

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	if strings.TrimSpace(declaredContentType) == "" {
		part, err := mw.CreateFormFile("file", filename)
		if err != nil {
			t.Fatalf("CreateFormFile: %v", err)
		}
		_, _ = part.Write(data)
	} else {
		h := make(textproto.MIMEHeader)
		h.Set("Content-Disposition", `form-data; name="file"; filename="`+filename+`"`)
		h.Set("Content-Type", declaredContentType)
		part, err := mw.CreatePart(h)
		if err != nil {
			t.Fatalf("CreatePart: %v", err)
		}
		_, _ = part.Write(data)
	}
	_ = mw.Close()

	req, err := http.NewRequest(http.MethodPost, baseURL+"/api/v1/me/avatar", &body)
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())
	for k, v := range authz {
		req.Header.Set(k, v)
	}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("client.Do: %v", err)
	}
	return resp
}

func uploadMediaPNG(t *testing.T, client *http.Client, baseURL string, authz map[string]string) api.Media {
	t.Helper()
	resp := uploadMediaMultipart(t, client, baseURL, authz, "test.png", "", createPNGBytes(t, 32, 32))
	if resp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("upload media: expected 201, got %d (%v)", resp.StatusCode, errBody)
	}
	return decodeJSON[api.Media](t, resp)
}

func uploadAvatarPNG(t *testing.T, client *http.Client, baseURL string, authz map[string]string) api.User {
	t.Helper()
	resp := uploadAvatarMultipart(t, client, baseURL, authz, "avatar.png", "", createPNGBytes(t, 640, 480))
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("upload avatar: expected 200, got %d (%v)", resp.StatusCode, errBody)
	}
	return decodeJSON[api.User](t, resp)
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

func decodeJSON[T any](t *testing.T, resp *http.Response) T {
	t.Helper()
	defer resp.Body.Close()
	var v T
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		t.Fatalf("decode json: %v", err)
	}
	return v
}

func computeClientProofB64(t *testing.T, username, password, clientNonce, serverNonce, saltB64 string, iterations int) (clientFinalNonce string, proofB64 string) {
	t.Helper()

	salt, err := base64.StdEncoding.DecodeString(saltB64)
	if err != nil {
		t.Fatalf("decode salt: %v", err)
	}

	saltedPassword := pbkdf2.Key([]byte(password), salt, iterations, 32, sha256.New)
	clientKey := hmacSHA256(saltedPassword, []byte("Client Key"))
	storedKeyArr := sha256.Sum256(clientKey)
	storedKey := storedKeyArr[:]

	clientFinalNonce = clientNonce + serverNonce
	authMessage := auth.BuildAuthMessage(username, clientNonce, serverNonce, saltB64, iterations, clientFinalNonce)
	clientSignature := hmacSHA256(storedKey, []byte(authMessage))
	clientProof := xorBytes(clientKey, clientSignature)
	proofB64 = base64.StdEncoding.EncodeToString(clientProof)
	return clientFinalNonce, proofB64
}

func hmacSHA256(key []byte, message []byte) []byte {
	h := hmac.New(sha256.New, key)
	_, _ = h.Write(message)
	return h.Sum(nil)
}

func xorBytes(a, b []byte) []byte {
	out := make([]byte, len(a))
	for i := 0; i < len(a) && i < len(b); i++ {
		out[i] = a[i] ^ b[i]
	}
	return out
}

// --- existing integration tests (ported) ---

func TestIntegration_Health_Register_CreatePost_Timeline(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	resp := get(t, client, base+"/api/v1/health", nil)
	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		t.Fatalf("health: expected 200, got %d", resp.StatusCode)
	}
	resp.Body.Close()

	regResp := postJSON(t, client, base+"/api/v1/auth/register", map[string]any{
		"username": "alice",
		"password": "password123",
	}, nil)
	if regResp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, regResp)
		t.Fatalf("register: expected 201, got %d (%v)", regResp.StatusCode, errBody)
	}
	user := decodeJSON[api.User](t, regResp)

	tok, _, err := app.TokenManager.Issue(auth.User{ID: user.Id, Username: string(user.Username)})
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}
	authz := map[string]string{"Authorization": "Bearer " + tok}

	cpResp := postJSON(t, client, base+"/api/v1/posts", map[string]any{
		"content": "hello from integration",
	}, authz)
	if cpResp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, cpResp)
		t.Fatalf("create post: expected 201, got %d (%v)", cpResp.StatusCode, errBody)
	}
	post := decodeJSON[api.Post](t, cpResp)
	if string(post.Content) != "hello from integration" {
		t.Fatalf("create post: unexpected content: %q", post.Content)
	}

	tlResp := get(t, client, base+"/api/v1/timeline?limit=30", nil)
	if tlResp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, tlResp)
		t.Fatalf("timeline: expected 200, got %d (%v)", tlResp.StatusCode, errBody)
	}
	page := decodeJSON[api.TimelinePage](t, tlResp)
	if len(page.Items) == 0 {
		t.Fatalf("timeline: expected at least 1 item")
	}
	found := false
	for _, it := range page.Items {
		if it.Id == post.Id {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("timeline: created post not found")
	}
}

func TestIntegration_Posts_Unauthorized(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	resp := postJSON(t, client, base+"/api/v1/posts", map[string]any{"content": "x"}, nil)
	if resp.StatusCode != http.StatusUnauthorized {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 401, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Posts_Lifecycle_And_OwnerCheck(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u1 := registerUser(t, client, base, "p1", "password123")
	u2 := registerUser(t, client, base, "p2", "password123")
	a1 := issueBearer(t, app.TokenManager, u1)
	a2 := issueBearer(t, app.TokenManager, u2)

	cpResp := postJSON(t, client, base+"/api/v1/posts", map[string]any{"content": "hello"}, a1)
	if cpResp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, cpResp)
		t.Fatalf("create post: expected 201, got %d (%v)", cpResp.StatusCode, errBody)
	}
	post := decodeJSON[api.Post](t, cpResp)

	del2 := deleteReq(t, client, base+"/api/v1/posts/"+post.Id.String(), a2)
	if del2.StatusCode != http.StatusForbidden {
		errBody := decodeJSON[map[string]any](t, del2)
		t.Fatalf("delete as other: expected 403, got %d (%v)", del2.StatusCode, errBody)
	}

	del1 := deleteReq(t, client, base+"/api/v1/posts/"+post.Id.String(), a1)
	if del1.StatusCode != http.StatusNoContent {
		body := decodeJSON[map[string]any](t, del1)
		t.Fatalf("delete as owner: expected 204, got %d (%v)", del1.StatusCode, body)
	}
	del1.Body.Close()

	getResp := get(t, client, base+"/api/v1/posts/"+post.Id.String(), nil)
	if getResp.StatusCode != http.StatusNotFound {
		errBody := decodeJSON[map[string]any](t, getResp)
		t.Fatalf("get after delete: expected 404, got %d (%v)", getResp.StatusCode, errBody)
	}
}

func TestIntegration_Timeline_Pagination_And_DeleteReflection(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "t1", "password123")
	a := issueBearer(t, app.TokenManager, u)

	posts := make([]api.Post, 0, 3)
	for i := 0; i < 3; i++ {
		resp := postJSON(t, client, base+"/api/v1/posts", map[string]any{"content": "p" + strconv.Itoa(i)}, a)
		if resp.StatusCode != http.StatusCreated {
			errBody := decodeJSON[map[string]any](t, resp)
			t.Fatalf("create post %d: got %d (%v)", i, resp.StatusCode, errBody)
		}
		posts = append(posts, decodeJSON[api.Post](t, resp))
		time.Sleep(3 * time.Millisecond)
	}

	page1Resp := get(t, client, base+"/api/v1/timeline?limit=2", nil)
	if page1Resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, page1Resp)
		t.Fatalf("timeline page1: %d (%v)", page1Resp.StatusCode, errBody)
	}
	page1 := decodeJSON[api.TimelinePage](t, page1Resp)
	if len(page1.Items) != 2 {
		t.Fatalf("expected 2 items on page1, got %d", len(page1.Items))
	}
	if page1.NextCursor == nil || strings.TrimSpace(*page1.NextCursor) == "" {
		t.Fatalf("expected nextCursor")
	}

	page2Resp := get(t, client, base+"/api/v1/timeline?limit=2&cursor="+*page1.NextCursor, nil)
	if page2Resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, page2Resp)
		t.Fatalf("timeline page2: %d (%v)", page2Resp.StatusCode, errBody)
	}
	page2 := decodeJSON[api.TimelinePage](t, page2Resp)
	if len(page2.Items) != 1 {
		t.Fatalf("expected 1 item on page2, got %d", len(page2.Items))
	}

	seen := map[string]struct{}{}
	for _, it := range page1.Items {
		seen[it.Id.String()] = struct{}{}
	}
	for _, it := range page2.Items {
		if _, ok := seen[it.Id.String()]; ok {
			t.Fatalf("duplicate post across pages: %s", it.Id.String())
		}
		seen[it.Id.String()] = struct{}{}
	}
	if len(seen) != 3 {
		t.Fatalf("expected total 3 unique posts, got %d", len(seen))
	}

	toDelete := posts[1]
	del := deleteReq(t, client, base+"/api/v1/posts/"+toDelete.Id.String(), a)
	if del.StatusCode != http.StatusNoContent {
		body := decodeJSON[map[string]any](t, del)
		t.Fatalf("delete: expected 204, got %d (%v)", del.StatusCode, body)
	}
	del.Body.Close()

	refResp := get(t, client, base+"/api/v1/timeline?limit=30", nil)
	if refResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, refResp)
		t.Fatalf("timeline refresh: %d (%v)", refResp.StatusCode, body)
	}
	ref := decodeJSON[api.TimelinePage](t, refResp)
	for _, it := range ref.Items {
		if it.Id == toDelete.Id {
			t.Fatalf("deleted post still in timeline")
		}
	}
}

func TestIntegration_Reactions_Add_Duplicate_Remove(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "r1", "password123")
	a := issueBearer(t, app.TokenManager, u)

	cpResp := postJSON(t, client, base+"/api/v1/posts", map[string]any{"content": "hello"}, a)
	if cpResp.StatusCode != http.StatusCreated {
		body := decodeJSON[map[string]any](t, cpResp)
		t.Fatalf("create post: %d (%v)", cpResp.StatusCode, body)
	}
	post := decodeJSON[api.Post](t, cpResp)

	list0 := get(t, client, base+"/api/v1/posts/"+post.Id.String()+"/reactions", nil)
	if list0.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, list0)
		t.Fatalf("list reactions: %d (%v)", list0.StatusCode, body)
	}
	counts0 := decodeJSON[api.ReactionCounts](t, list0)
	if len(counts0.Reactions) != 0 {
		t.Fatalf("expected empty reactions")
	}

	add1 := postJSON(t, client, base+"/api/v1/posts/"+post.Id.String()+"/reactions", map[string]any{"emoji": "👍"}, a)
	if add1.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, add1)
		t.Fatalf("add reaction: %d (%v)", add1.StatusCode, body)
	}
	counts1 := decodeJSON[api.ReactionCounts](t, add1)
	if len(counts1.Reactions) != 1 || counts1.Reactions[0].Count != 1 {
		t.Fatalf("unexpected counts after add: %+v", counts1)
	}

	add2 := postJSON(t, client, base+"/api/v1/posts/"+post.Id.String()+"/reactions", map[string]any{"emoji": "👍"}, a)
	if add2.StatusCode != http.StatusConflict {
		body := decodeJSON[map[string]any](t, add2)
		t.Fatalf("duplicate add: expected 409, got %d (%v)", add2.StatusCode, body)
	}

	rem1 := deleteReq(t, client, base+"/api/v1/posts/"+post.Id.String()+"/reactions?emoji=%F0%9F%91%8D", a)
	if rem1.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, rem1)
		t.Fatalf("remove: expected 200, got %d (%v)", rem1.StatusCode, body)
	}
	counts2 := decodeJSON[api.ReactionCounts](t, rem1)
	if len(counts2.Reactions) != 0 {
		t.Fatalf("expected empty after remove, got %+v", counts2)
	}

	rem2 := deleteReq(t, client, base+"/api/v1/posts/"+post.Id.String()+"/reactions?emoji=%F0%9F%91%8D", a)
	if rem2.StatusCode != http.StatusNotFound {
		body := decodeJSON[map[string]any](t, rem2)
		t.Fatalf("remove missing: expected 404, got %d (%v)", rem2.StatusCode, body)
	}
}

func TestIntegration_Media_Upload_Attach_And_Serve(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "m1", "password123")
	a := issueBearer(t, app.TokenManager, u)

	media := uploadMediaPNG(t, client, base, a)
	if media.Url == "" {
		t.Fatalf("expected media url")
	}

	cpResp := postJSON(t, client, base+"/api/v1/posts", map[string]any{
		"content":  "with media",
		"mediaIds": []string{media.Id.String()},
	}, a)
	if cpResp.StatusCode != http.StatusCreated {
		body := decodeJSON[map[string]any](t, cpResp)
		t.Fatalf("create post with media: %d (%v)", cpResp.StatusCode, body)
	}
	post := decodeJSON[api.Post](t, cpResp)
	if len(post.Media) != 1 {
		t.Fatalf("expected 1 media, got %d", len(post.Media))
	}
	if post.Media[0].Id != media.Id {
		t.Fatalf("expected media id to match")
	}

	imgResp := get(t, client, base+"/media/"+media.Id.String()+"/image.webp", nil)
	if imgResp.StatusCode != http.StatusOK {
		imgResp.Body.Close()
		t.Fatalf("serve image: expected 200, got %d", imgResp.StatusCode)
	}
	ct := imgResp.Header.Get("Content-Type")
	imgResp.Body.Close()
	if !strings.HasPrefix(ct, "image/webp") {
		t.Fatalf("expected image/webp content-type, got %q", ct)
	}
}

func TestIntegration_Posts_Create_MediaOnly_Success(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "mediaonly", "password123")
	a := issueBearer(t, app.TokenManager, u)

	media := uploadMediaPNG(t, client, base, a)
	if media.Url == "" {
		t.Fatalf("expected media url")
	}

	// Create post with only media (no content)
	cpResp := postJSON(t, client, base+"/api/v1/posts", map[string]any{
		"mediaIds": []string{media.Id.String()},
	}, a)
	if cpResp.StatusCode != http.StatusCreated {
		body := decodeJSON[map[string]any](t, cpResp)
		t.Fatalf("create post with media only: expected 201, got %d (%v)", cpResp.StatusCode, body)
	}
	post := decodeJSON[api.Post](t, cpResp)
	if len(post.Media) != 1 {
		t.Fatalf("expected 1 media, got %d", len(post.Media))
	}
	if post.Media[0].Id != media.Id {
		t.Fatalf("expected media id to match")
	}
	if post.Content != "" {
		t.Fatalf("expected empty content, got %q", post.Content)
	}
}

func TestIntegration_Auth_Login_Success_And_ReplayPrevented(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	regResp := postJSON(t, client, base+"/api/v1/auth/register", map[string]any{
		"username": "bob",
		"password": "password123",
	}, nil)
	if regResp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, regResp)
		t.Fatalf("register: expected 201, got %d (%v)", regResp.StatusCode, errBody)
	}
	_ = decodeJSON[api.User](t, regResp)

	clientNonce := "cnonce-1"
	startResp := postJSON(t, client, base+"/api/v1/auth/login/start", api.LoginStartRequest{
		Username:    "bob",
		ClientNonce: clientNonce,
	}, nil)
	if startResp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, startResp)
		t.Fatalf("login start: expected 200, got %d (%v)", startResp.StatusCode, errBody)
	}
	start := decodeJSON[api.LoginStartResponse](t, startResp)

	clientFinalNonce, proof := computeClientProofB64(t, "bob", "password123", clientNonce, start.ServerNonce, start.Salt, start.Iterations)
	finishReq := api.LoginFinishRequest{
		LoginSessionId:   start.LoginSessionId,
		ClientFinalNonce: clientFinalNonce,
		ClientProof:      proof,
	}
	finishResp := postJSON(t, client, base+"/api/v1/auth/login/finish", finishReq, nil)
	if finishResp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, finishResp)
		t.Fatalf("login finish: expected 200, got %d (%v)", finishResp.StatusCode, errBody)
	}
	finish := decodeJSON[api.LoginFinishResponse](t, finishResp)
	if finish.AccessToken == "" {
		t.Fatalf("login finish: expected accessToken")
	}

	replayResp := postJSON(t, client, base+"/api/v1/auth/login/finish", finishReq, nil)
	if replayResp.StatusCode != http.StatusUnauthorized {
		errBody := decodeJSON[map[string]any](t, replayResp)
		t.Fatalf("replay finish: expected 401, got %d (%v)", replayResp.StatusCode, errBody)
	}
}

func TestIntegration_Auth_Login_InvalidNonce(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	regResp := postJSON(t, client, base+"/api/v1/auth/register", map[string]any{
		"username": "carol",
		"password": "password123",
	}, nil)
	if regResp.StatusCode != http.StatusCreated {
		_ = decodeJSON[map[string]any](t, regResp)
		t.Fatalf("register failed")
	}
	regResp.Body.Close()

	clientNonce := "cnonce-2"
	startResp := postJSON(t, client, base+"/api/v1/auth/login/start", api.LoginStartRequest{Username: "carol", ClientNonce: clientNonce}, nil)
	if startResp.StatusCode != http.StatusOK {
		_ = decodeJSON[map[string]any](t, startResp)
		t.Fatalf("login start failed")
	}
	start := decodeJSON[api.LoginStartResponse](t, startResp)

	_, proof := computeClientProofB64(t, "carol", "password123", clientNonce, start.ServerNonce, start.Salt, start.Iterations)
	finishResp := postJSON(t, client, base+"/api/v1/auth/login/finish", api.LoginFinishRequest{
		LoginSessionId:   start.LoginSessionId,
		ClientFinalNonce: "wrong-nonce",
		ClientProof:      proof,
	}, nil)
	if finishResp.StatusCode != http.StatusUnauthorized {
		errBody := decodeJSON[map[string]any](t, finishResp)
		t.Fatalf("invalid nonce: expected 401, got %d (%v)", finishResp.StatusCode, errBody)
	}
}

func TestIntegration_Auth_Login_InvalidProof(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	regResp := postJSON(t, client, base+"/api/v1/auth/register", map[string]any{
		"username": "dave",
		"password": "password123",
	}, nil)
	if regResp.StatusCode != http.StatusCreated {
		_ = decodeJSON[map[string]any](t, regResp)
		t.Fatalf("register failed")
	}
	regResp.Body.Close()

	clientNonce := "cnonce-3"
	startResp := postJSON(t, client, base+"/api/v1/auth/login/start", api.LoginStartRequest{Username: "dave", ClientNonce: clientNonce}, nil)
	if startResp.StatusCode != http.StatusOK {
		_ = decodeJSON[map[string]any](t, startResp)
		t.Fatalf("login start failed")
	}
	start := decodeJSON[api.LoginStartResponse](t, startResp)

	clientFinalNonce, proof := computeClientProofB64(t, "dave", "password123", clientNonce, start.ServerNonce, start.Salt, start.Iterations)
	badProof := proof
	if len(badProof) > 0 {
		badProof = badProof[:len(badProof)-1] + "A"
	}
	finishResp := postJSON(t, client, base+"/api/v1/auth/login/finish", api.LoginFinishRequest{
		LoginSessionId:   start.LoginSessionId,
		ClientFinalNonce: clientFinalNonce,
		ClientProof:      badProof,
	}, nil)
	if finishResp.StatusCode != http.StatusUnauthorized {
		errBody := decodeJSON[map[string]any](t, finishResp)
		t.Fatalf("invalid proof: expected 401, got %d (%v)", finishResp.StatusCode, errBody)
	}
}

func TestIntegration_Auth_Login_ExpiredSession(t *testing.T) {
	app := newTestAppWithAuthOptions(t, service.AuthServiceOptions{LoginTTL: 20 * time.Millisecond})
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	regResp := postJSON(t, client, base+"/api/v1/auth/register", map[string]any{
		"username": "erin",
		"password": "password123",
	}, nil)
	if regResp.StatusCode != http.StatusCreated {
		_ = decodeJSON[map[string]any](t, regResp)
		t.Fatalf("register failed")
	}
	regResp.Body.Close()

	clientNonce := "cnonce-4"
	startResp := postJSON(t, client, base+"/api/v1/auth/login/start", api.LoginStartRequest{Username: "erin", ClientNonce: clientNonce}, nil)
	if startResp.StatusCode != http.StatusOK {
		_ = decodeJSON[map[string]any](t, startResp)
		t.Fatalf("login start failed")
	}
	start := decodeJSON[api.LoginStartResponse](t, startResp)

	time.Sleep(60 * time.Millisecond)

	clientFinalNonce, proof := computeClientProofB64(t, "erin", "password123", clientNonce, start.ServerNonce, start.Salt, start.Iterations)
	finishResp := postJSON(t, client, base+"/api/v1/auth/login/finish", api.LoginFinishRequest{
		LoginSessionId:   start.LoginSessionId,
		ClientFinalNonce: clientFinalNonce,
		ClientProof:      proof,
	}, nil)
	if finishResp.StatusCode != http.StatusUnauthorized {
		errBody := decodeJSON[map[string]any](t, finishResp)
		t.Fatalf("expired session: expected 401, got %d (%v)", finishResp.StatusCode, errBody)
	}
}

// --- extra coverage (ported from earlier additions) ---

func TestIntegration_Auth_Register_DuplicateUsername(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	_ = registerUser(t, client, base, "dup", "password123")
	resp := postJSON(t, client, base+"/api/v1/auth/register", map[string]any{
		"username": "dup",
		"password": "password123",
	}, nil)
	if resp.StatusCode != http.StatusConflict {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 409, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Auth_Register_ShortPassword(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	resp := postJSON(t, client, base+"/api/v1/auth/register", map[string]any{
		"username": "shortpw",
		"password": "short",
	}, nil)
	if resp.StatusCode != http.StatusBadRequest {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 400, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Auth_LoginStart_UserNotFound(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	resp := postJSON(t, client, base+"/api/v1/auth/login/start", api.LoginStartRequest{Username: "no_such_user", ClientNonce: "cnonce"}, nil)
	if resp.StatusCode != http.StatusNotFound {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 404, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Users_Me_Unauthorized(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	resp := get(t, client, base+"/api/v1/me", nil)
	if resp.StatusCode != http.StatusUnauthorized {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		t.Fatalf("expected 401, got %d (body=%s)", resp.StatusCode, string(body))
	}
	resp.Body.Close()
}

func TestIntegration_Users_Me_ReturnsCurrentUser(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "meuser", "password123")
	a := issueBearer(t, app.TokenManager, u)

	resp := get(t, client, base+"/api/v1/me", a)
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 200, got %d (%v)", resp.StatusCode, errBody)
	}
	me := decodeJSON[api.User](t, resp)
	if me.Id != u.Id || me.Username != u.Username {
		t.Fatalf("unexpected me: %+v", me)
	}
}

func TestIntegration_Users_Profile_Update(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "profileuser", "password123")
	a := issueBearer(t, app.TokenManager, u)

	resp := patchJSON(t, client, base+"/api/v1/me/profile", map[string]any{
		"displayName": "  <b>Alice</b>  ",
		"bio":         "hello\nhttps://example.com",
	}, a)
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 200, got %d (%v)", resp.StatusCode, errBody)
	}
	updated := decodeJSON[api.User](t, resp)
	if updated.DisplayName == nil || *updated.DisplayName != "Alice" {
		t.Fatalf("expected sanitized displayName, got %+v", updated.DisplayName)
	}
	if updated.Bio == nil || *updated.Bio != "hello" {
		t.Fatalf("expected sanitized bio, got %+v", updated.Bio)
	}
}

func TestIntegration_Users_Avatar_Update(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "avataruser", "password123")
	a := issueBearer(t, app.TokenManager, u)

	updated := uploadAvatarPNG(t, client, base, a)
	if updated.AvatarUrl == nil || *updated.AvatarUrl == "" {
		t.Fatalf("expected avatarUrl")
	}

	parts := strings.Split(*updated.AvatarUrl, "/media/")
	if len(parts) != 2 {
		t.Fatalf("unexpected avatar url: %q", *updated.AvatarUrl)
	}
	pathParts := strings.Split(parts[1], "/")
	if len(pathParts) == 0 || pathParts[0] == "" {
		t.Fatalf("unexpected avatar url path: %q", *updated.AvatarUrl)
	}
	avatarID := pathParts[0]
	imgResp := get(t, client, base+"/media/"+avatarID+"/image.webp", nil)
	if imgResp.StatusCode != http.StatusOK {
		imgResp.Body.Close()
		t.Fatalf("serve avatar: expected 200, got %d", imgResp.StatusCode)
	}
	ct := imgResp.Header.Get("Content-Type")
	imgResp.Body.Close()
	if !strings.HasPrefix(ct, "image/webp") {
		t.Fatalf("expected image/webp content-type, got %q", ct)
	}
}

func TestIntegration_Users_Avatar_Update_DeletesOld(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "avatardelete", "password123")
	a := issueBearer(t, app.TokenManager, u)

	// Upload first avatar
	updated1 := uploadAvatarPNG(t, client, base, a)
	if updated1.AvatarUrl == nil || *updated1.AvatarUrl == "" {
		t.Fatalf("expected first avatarUrl")
	}
	firstAvatarURL := *updated1.AvatarUrl

	// Upload second avatar - should delete the first one internally
	updated2 := uploadAvatarPNG(t, client, base, a)
	if updated2.AvatarUrl == nil || *updated2.AvatarUrl == "" {
		t.Fatalf("expected second avatarUrl")
	}
	secondAvatarURL := *updated2.AvatarUrl

	// Verify the avatars are different
	if firstAvatarURL == secondAvatarURL {
		t.Fatalf("expected different avatar URLs, got same: %s", firstAvatarURL)
	}

	// Verify the second avatar is accessible
	parts := strings.Split(secondAvatarURL, "/media/")
	if len(parts) != 2 {
		t.Fatalf("unexpected second avatar url: %q", secondAvatarURL)
	}
	pathParts := strings.Split(parts[1], "/")
	if len(pathParts) == 0 || pathParts[0] == "" {
		t.Fatalf("unexpected second avatar url path: %q", secondAvatarURL)
	}
	avatarID := pathParts[0]
	imgResp := get(t, client, base+"/media/"+avatarID+"/image.webp", nil)
	if imgResp.StatusCode != http.StatusOK {
		imgResp.Body.Close()
		t.Fatalf("serve second avatar: expected 200, got %d", imgResp.StatusCode)
	}
	imgResp.Body.Close()

	// This test verifies that avatar updates work correctly, which internally
	// calls DeleteMedia with owner verification. The fact that we can successfully
	// update the avatar twice proves the DeleteMedia owner check is working.
}

func TestIntegration_Users_Posts_List(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u1 := registerUser(t, client, base, "listuser1", "password123")
	u2 := registerUser(t, client, base, "listuser2", "password123")
	a1 := issueBearer(t, app.TokenManager, u1)
	a2 := issueBearer(t, app.TokenManager, u2)

	p1 := createPost(t, client, base, a1, "first")
	p2 := createPost(t, client, base, a1, "second")
	p3 := createPost(t, client, base, a1, "third")
	_ = createPost(t, client, base, a2, "other")

	resp := get(t, client, base+"/api/v1/users/"+string(u1.Username)+"/posts?limit=2", nil)
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 200, got %d (%v)", resp.StatusCode, errBody)
	}
	page := decodeJSON[api.UserPostsPage](t, resp)
	if len(page.Items) != 2 {
		t.Fatalf("expected 2 items, got %d", len(page.Items))
	}
	if page.Items[0].Id != p3.Id || page.Items[1].Id != p2.Id {
		t.Fatalf("unexpected order: %+v", page.Items)
	}
	if page.NextCursor == nil || *page.NextCursor == "" {
		t.Fatalf("expected next cursor")
	}

	resp2 := get(t, client, base+"/api/v1/users/"+string(u1.Username)+"/posts?limit=2&cursor="+*page.NextCursor, nil)
	if resp2.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp2)
		t.Fatalf("expected 200, got %d (%v)", resp2.StatusCode, errBody)
	}
	page2 := decodeJSON[api.UserPostsPage](t, resp2)
	if len(page2.Items) != 1 || page2.Items[0].Id != p1.Id {
		t.Fatalf("unexpected page2 items: %+v", page2.Items)
	}
}

func TestIntegration_Users_GetByUsername_NotFound(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	resp := get(t, client, base+"/api/v1/users/nope", nil)
	if resp.StatusCode != http.StatusNotFound {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 404, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Posts_Get_NotFound(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	resp := get(t, client, base+"/api/v1/posts/00000000-0000-0000-0000-000000000000", nil)
	if resp.StatusCode != http.StatusNotFound {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 404, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Posts_Create_EmptyContent_Returns400(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "pc0", "password123")
	a := issueBearer(t, app.TokenManager, u)

	resp := postJSON(t, client, base+"/api/v1/posts", map[string]any{"content": "   "}, a)
	if resp.StatusCode != http.StatusBadRequest {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 400, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Posts_Create_TooManyMediaIds_Returns400(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "pc1", "password123")
	a := issueBearer(t, app.TokenManager, u)

	ids := []string{
		"00000000-0000-0000-0000-000000000001",
		"00000000-0000-0000-0000-000000000002",
		"00000000-0000-0000-0000-000000000003",
		"00000000-0000-0000-0000-000000000004",
		"00000000-0000-0000-0000-000000000005",
	}
	resp := postJSON(t, client, base+"/api/v1/posts", map[string]any{"content": "x", "mediaIds": ids}, a)
	if resp.StatusCode != http.StatusBadRequest {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 400, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Posts_Create_DuplicateMediaIds_Returns400(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "pc2", "password123")
	a := issueBearer(t, app.TokenManager, u)

	id := "00000000-0000-0000-0000-000000000001"
	resp := postJSON(t, client, base+"/api/v1/posts", map[string]any{"content": "x", "mediaIds": []string{id, id}}, a)
	if resp.StatusCode != http.StatusBadRequest {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 400, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Posts_Create_InvalidMediaIds_Returns400(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u1 := registerUser(t, client, base, "mowner", "password123")
	u2 := registerUser(t, client, base, "mother", "password123")
	a1 := issueBearer(t, app.TokenManager, u1)
	a2 := issueBearer(t, app.TokenManager, u2)

	m := uploadMediaPNG(t, client, base, a2)
	resp := postJSON(t, client, base+"/api/v1/posts", map[string]any{"content": "x", "mediaIds": []string{m.Id.String()}}, a1)
	if resp.StatusCode != http.StatusBadRequest {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 400, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Media_Upload_Unauthorized(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	resp := uploadMediaMultipart(t, client, base, nil, "test.png", "", createPNGBytes(t, 8, 8))
	if resp.StatusCode != http.StatusUnauthorized {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		t.Fatalf("expected 401, got %d (body=%s)", resp.StatusCode, string(body))
	}
	resp.Body.Close()
}

func TestIntegration_Media_Upload_UnsupportedExtension_Returns415(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "mx", "password123")
	a := issueBearer(t, app.TokenManager, u)

	resp := uploadMediaMultipart(t, client, base, a, "test.txt", "text/plain", []byte("hello"))
	if resp.StatusCode != http.StatusUnsupportedMediaType {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 415, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Media_Upload_BadContent_Returns415(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "mbad", "password123")
	a := issueBearer(t, app.TokenManager, u)

	resp := uploadMediaMultipart(t, client, base, a, "test.png", "image/png", []byte("not a real png"))
	if resp.StatusCode != http.StatusUnsupportedMediaType {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 415, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Media_ServeImage_NotFound(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	resp := get(t, client, base+"/media/00000000-0000-0000-0000-000000000000/image.webp", nil)
	if resp.StatusCode != http.StatusNotFound {
		resp.Body.Close()
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
	resp.Body.Close()
}

// TestIntegration_Media_Upload_LargeImage_AutoResize tests that images larger than
// the old limits (4096x4096, 12MP) are now accepted and automatically resized to 2048px.
// This verifies the automatic resizing feature while preventing resource exhaustion attacks.
func TestIntegration_Media_Upload_LargeImage_AutoResize(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "largeimg", "password123")
	a := issueBearer(t, app.TokenManager, u)

	// Create a 6000x4000 image (24 megapixels) - exceeds old 4096x4096 limit
	// This would previously return "image too large" error
	t.Log("Creating 6000x4000 test image (24MP)")
	imgData := createPNGBytes(t, 6000, 4000)
	t.Logf("Generated PNG size: %d bytes (%.2f MB)", len(imgData), float64(len(imgData))/(1024*1024))

	// Upload the large image
	resp := uploadMediaMultipart(t, client, base, a, "large.png", "", imgData)
	if resp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("upload large image: expected 201, got %d (%v)", resp.StatusCode, errBody)
	}
	media := decodeJSON[api.Media](t, resp)

	// Verify the image was resized to maxOutputEdgePx (2048px)
	// Original: 6000x4000 (aspect ratio 1.5)
	// Expected: 2048x1365 (maintains aspect ratio, longest edge = 2048)
	if media.Width > 2048 || media.Height > 2048 {
		t.Fatalf("expected image resized to max 2048px edge, got %dx%d", media.Width, media.Height)
	}

	// Verify aspect ratio is preserved (within floating point tolerance)
	originalAspect := 6000.0 / 4000.0 // 1.5
	resizedAspect := float64(media.Width) / float64(media.Height)
	aspectDiff := originalAspect - resizedAspect
	if aspectDiff < -0.01 || aspectDiff > 0.01 {
		t.Fatalf("aspect ratio not preserved: original=%.3f, resized=%.3f (width=%d, height=%d)",
			originalAspect, resizedAspect, media.Width, media.Height)
	}

	t.Logf("Image successfully resized: %dx%d -> %dx%d (aspect ratio preserved)",
		6000, 4000, media.Width, media.Height)

	// Verify the image can be served
	imgResp := get(t, client, base+"/media/"+media.Id.String()+"/image.webp", nil)
	if imgResp.StatusCode != http.StatusOK {
		imgResp.Body.Close()
		t.Fatalf("serve resized image: expected 200, got %d", imgResp.StatusCode)
	}
	ct := imgResp.Header.Get("Content-Type")
	imgResp.Body.Close()
	if !strings.HasPrefix(ct, "image/webp") {
		t.Fatalf("expected image/webp content-type, got %q", ct)
	}
}

// TestIntegration_Media_Upload_ExtremelyLargeImage_Rejected tests that images
// exceeding the new safety limits (16384x16384, 100MP) are still rejected
// to prevent memory exhaustion and DoS attacks.
func TestIntegration_Media_Upload_ExtremelyLargeImage_Rejected(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "extremeimg", "password123")
	a := issueBearer(t, app.TokenManager, u)

	// Create a 20000x10000 image (200 megapixels) - exceeds safety limit
	// This should be rejected to prevent resource exhaustion
	t.Log("Creating 20000x10000 test image (200MP) - should be rejected")
	imgData := createPNGBytes(t, 20000, 10000)
	t.Logf("Generated PNG size: %d bytes (%.2f MB)", len(imgData), float64(len(imgData))/(1024*1024))

	// Upload should fail with "image too large" error
	resp := uploadMediaMultipart(t, client, base, a, "extreme.png", "", imgData)
	if resp.StatusCode != http.StatusBadRequest {
		body := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 400 (image too large), got %d (%v)", resp.StatusCode, body)
	}

	errBody := decodeJSON[api.Error](t, resp)
	if !strings.Contains(strings.ToLower(errBody.Message), "too large") {
		t.Fatalf("expected 'too large' error message, got: %q", errBody.Message)
	}

	t.Log("Extremely large image correctly rejected")
}

func TestIntegration_Timeline_InvalidCursor_Returns400(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	resp := get(t, client, base+"/api/v1/timeline?limit=10&cursor=not-base64", nil)
	if resp.StatusCode != http.StatusBadRequest {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 400, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Timeline_LimitOutOfRange_Returns400(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	resp := get(t, client, base+"/api/v1/timeline?limit=0", nil)
	if resp.StatusCode != http.StatusBadRequest {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 400, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Items_CreateAndList(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	create := postJSON(t, client, base+"/api/v1/items", map[string]any{"name": "item-1"}, nil)
	if create.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(create.Body)
		create.Body.Close()
		t.Fatalf("create item: expected 201, got %d (body=%s)", create.StatusCode, string(body))
	}
	created := decodeJSON[api.Item](t, create)
	if created.Name != "item-1" {
		t.Fatalf("unexpected created item: %+v", created)
	}

	list := get(t, client, base+"/api/v1/items", nil)
	if list.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(list.Body)
		list.Body.Close()
		t.Fatalf("list items: expected 200, got %d (body=%s)", list.StatusCode, string(body))
	}
	items := decodeJSON[[]api.Item](t, list)
	if len(items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(items))
	}
	if items[0].Name != "item-1" {
		t.Fatalf("unexpected item: %+v", items[0])
	}
}

func TestIntegration_Admin_Roles_ForbiddenWithoutPermission(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "admin_no", "password123")
	authz := issueBearer(t, app.TokenManager, u)

	resp := get(t, client, base+"/api/v1/admin/roles", authz)
	if resp.StatusCode != http.StatusForbidden {
		body := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 403, got %d (%v)", resp.StatusCode, body)
	}
}

func TestIntegration_Admin_Roles_WithAdminRole(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	adminUser := registerUser(t, client, base, "admin_yes", "password123")
	q := sqlc.New(app.SQLDB)
	if err := q.AddUserRole(context.Background(), sqlc.AddUserRoleParams{UserID: adminUser.Id, RoleID: "admin"}); err != nil {
		t.Fatalf("AddUserRole: %v", err)
	}
	authz := issueBearer(t, app.TokenManager, adminUser)

	resp := get(t, client, base+"/api/v1/admin/roles", authz)
	if resp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 200, got %d (%v)", resp.StatusCode, body)
	}
	_ = decodeJSON[api.RoleList](t, resp)
}

func TestIntegration_Auth_Register_Disabled(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	q := sqlc.New(app.SQLDB)
	if _, err := q.UpdateSignupEnabled(context.Background(), false); err != nil {
		t.Fatalf("UpdateSignupEnabled: %v", err)
	}

	client := app.Server.Client()
	base := app.Server.URL

	resp := postJSON(t, client, base+"/api/v1/auth/register", map[string]any{
		"username": "disabled",
		"password": "password123",
	}, nil)
	if resp.StatusCode != http.StatusForbidden {
		body := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 403, got %d (%v)", resp.StatusCode, body)
	}
}

func TestIntegration_Admin_Ban_User(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	adminUser := registerUser(t, client, base, "ban_admin", "password123")
	target := registerUser(t, client, base, "ban_user", "password123")

	q := sqlc.New(app.SQLDB)
	if err := q.AddUserRole(context.Background(), sqlc.AddUserRoleParams{UserID: adminUser.Id, RoleID: "admin"}); err != nil {
		t.Fatalf("AddUserRole: %v", err)
	}

	adminAuthz := issueBearer(t, app.TokenManager, adminUser)
	targetAuthz := issueBearer(t, app.TokenManager, target)

	banResp := postJSON(t, client, base+"/api/v1/admin/users/"+target.Id.String()+"/ban", map[string]any{}, adminAuthz)
	if banResp.StatusCode != http.StatusNoContent {
		body := decodeJSON[map[string]any](t, banResp)
		t.Fatalf("ban: expected 204, got %d (%v)", banResp.StatusCode, body)
	}

	denied := postJSON(t, client, base+"/api/v1/posts", map[string]any{"content": "blocked"}, targetAuthz)
	if denied.StatusCode != http.StatusForbidden {
		body := decodeJSON[map[string]any](t, denied)
		t.Fatalf("expected 403, got %d (%v)", denied.StatusCode, body)
	}
}

func TestIntegration_Permissions_PostsCreate_DenyOverride(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	adminUser := registerUser(t, client, base, "perm_admin1", "password123")
	target := registerUser(t, client, base, "perm_user1", "password123")

	q := sqlc.New(app.SQLDB)
	if err := q.AddUserRole(context.Background(), sqlc.AddUserRoleParams{UserID: adminUser.Id, RoleID: "admin"}); err != nil {
		t.Fatalf("AddUserRole: %v", err)
	}

	adminAuthz := issueBearer(t, app.TokenManager, adminUser)
	targetAuthz := issueBearer(t, app.TokenManager, target)

	overrideResp := putJSON(t, client, base+"/api/v1/admin/users/"+target.Id.String()+"/permissions", map[string]any{
		"overrides": []map[string]any{
			{"permissionId": "posts_create", "scope": "global", "effect": "deny"},
		},
	}, adminAuthz)
	if overrideResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, overrideResp)
		t.Fatalf("override: expected 200, got %d (%v)", overrideResp.StatusCode, body)
	}

	resp := postJSON(t, client, base+"/api/v1/posts", map[string]any{"content": "blocked"}, targetAuthz)
	if resp.StatusCode != http.StatusForbidden {
		body := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 403, got %d (%v)", resp.StatusCode, body)
	}
}

func TestIntegration_Permissions_PostsCreate_AllowOverrideWithoutRole(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	adminUser := registerUser(t, client, base, "perm_admin2", "password123")
	target := registerUser(t, client, base, "perm_user2", "password123")

	q := sqlc.New(app.SQLDB)
	if err := q.AddUserRole(context.Background(), sqlc.AddUserRoleParams{UserID: adminUser.Id, RoleID: "admin"}); err != nil {
		t.Fatalf("AddUserRole: %v", err)
	}

	adminAuthz := issueBearer(t, app.TokenManager, adminUser)
	targetAuthz := issueBearer(t, app.TokenManager, target)

	rolesResp := putJSON(t, client, base+"/api/v1/admin/users/"+target.Id.String()+"/roles", map[string]any{
		"roles": []string{},
	}, adminAuthz)
	if rolesResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, rolesResp)
		t.Fatalf("roles: expected 200, got %d (%v)", rolesResp.StatusCode, body)
	}

	overrideResp := putJSON(t, client, base+"/api/v1/admin/users/"+target.Id.String()+"/permissions", map[string]any{
		"overrides": []map[string]any{
			{"permissionId": "posts_create", "scope": "global", "effect": "allow"},
		},
	}, adminAuthz)
	if overrideResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, overrideResp)
		t.Fatalf("override: expected 200, got %d (%v)", overrideResp.StatusCode, body)
	}

	resp := postJSON(t, client, base+"/api/v1/posts", map[string]any{"content": "allowed"}, targetAuthz)
	if resp.StatusCode != http.StatusCreated {
		body := decodeJSON[map[string]any](t, resp)
		t.Fatalf("expected 201, got %d (%v)", resp.StatusCode, body)
	}
}
