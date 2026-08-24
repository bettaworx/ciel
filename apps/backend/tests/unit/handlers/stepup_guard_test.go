package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/handlers"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

func TestPostAuthPasswordChange_MissingStepupToken(t *testing.T) {
	buf := captureAuditLogs(t)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	apiHandler := handlers.API{
		Auth:   service.NewAuthService(nil, tm),
		Tokens: tm,
	}
	user := auth.User{ID: uuid.New(), Username: "alice"}
	ctx := auth.WithUser(context.Background(), user)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/password/change", strings.NewReader(`{"newPassword":"password123"}`)).WithContext(ctx)
	rr := httptest.NewRecorder()
	apiHandler.PostAuthPasswordChange(rr, req, api.PostAuthPasswordChangeParams{})

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
	var body api.Error
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body.Code != "stepup_required" {
		t.Fatalf("expected stepup_required, got %q", body.Code)
	}
	if !hasAuditEntry(t, buf, "auth.stepup.use", "failure", "missing_token", "password_change") {
		t.Fatalf("expected audit log for missing token")
	}
}

func TestPostAuthPasswordChange_InvalidStepupToken(t *testing.T) {
	buf := captureAuditLogs(t)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	apiHandler := handlers.API{
		Auth:   service.NewAuthService(nil, tm),
		Tokens: tm,
	}
	user := auth.User{ID: uuid.New(), Username: "alice"}
	ctx := auth.WithUser(context.Background(), user)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/password/change", strings.NewReader(`{"newPassword":"password123"}`)).WithContext(ctx)
	req.Header.Set("X-Stepup-Token", "invalid")
	rr := httptest.NewRecorder()
	apiHandler.PostAuthPasswordChange(rr, req, api.PostAuthPasswordChangeParams{})

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
	if !hasAuditEntry(t, buf, "auth.stepup.use", "failure", "invalid_token", "password_change") {
		t.Fatalf("expected audit log for invalid token")
	}
}

func TestPostAuthPasswordChange_StepupReplayRejected(t *testing.T) {
	buf := captureAuditLogs(t)
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	user := auth.User{ID: uuid.New(), Username: "alice"}
	stepupToken, _, err := tm.IssueStepup(user)
	if err != nil {
		t.Fatalf("IssueStepup: %v", err)
	}

	mock.ExpectExec(`-- name: UpdateAuthCredential`).
		WithArgs(user.ID, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(0, 1))

	apiHandler := handlers.API{
		Auth:   svc,
		Tokens: tm,
		Redis:  rdb,
	}
	ctx := auth.WithUser(context.Background(), user)

	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/password/change", strings.NewReader(`{"newPassword":"Password123"}`)).WithContext(ctx)
	req1.Header.Set("X-Stepup-Token", stepupToken)
	rr1 := httptest.NewRecorder()
	apiHandler.PostAuthPasswordChange(rr1, req1, api.PostAuthPasswordChangeParams{})
	if rr1.Code != http.StatusNoContent {
		t.Logf("Response body: %s", rr1.Body.String())
		t.Fatalf("expected 204, got %d", rr1.Code)
	}

	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/password/change", strings.NewReader(`{"newPassword":"Password123"}`)).WithContext(ctx)
	req2.Header.Set("X-Stepup-Token", stepupToken)
	rr2 := httptest.NewRecorder()
	apiHandler.PostAuthPasswordChange(rr2, req2, api.PostAuthPasswordChangeParams{})
	if rr2.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr2.Code)
	}
	if !hasAuditEntry(t, buf, "auth.stepup.use", "success", "", "password_change") {
		t.Fatalf("expected audit log for stepup use success")
	}
	if !hasAuditEntry(t, buf, "auth.stepup.use", "failure", "replay", "password_change") {
		t.Fatalf("expected audit log for stepup replay rejection")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func captureAuditLogs(t *testing.T) *bytes.Buffer {
	t.Helper()
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, &slog.HandlerOptions{Level: slog.LevelDebug}))
	prev := slog.Default()
	slog.SetDefault(logger)
	t.Cleanup(func() {
		slog.SetDefault(prev)
	})
	return &buf
}

func hasAuditEntry(t *testing.T, buf *bytes.Buffer, event, outcome, reason, action string) bool {
	t.Helper()
	entries := auditEntries(t, buf)
	for _, entry := range entries {
		if !matchString(entry, "event", event) {
			continue
		}
		if !matchString(entry, "outcome", outcome) {
			continue
		}
		if reason != "" && !matchString(entry, "reason", reason) {
			continue
		}
		if action != "" && !matchString(entry, "action", action) {
			continue
		}
		return true
	}
	return false
}

func auditEntries(t *testing.T, buf *bytes.Buffer) []map[string]any {
	t.Helper()
	lines := strings.Split(strings.TrimSpace(buf.String()), "\n")
	entries := make([]map[string]any, 0, len(lines))
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		var entry map[string]any
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			continue
		}
		if !matchString(entry, "type", "audit") {
			continue
		}
		entries = append(entries, entry)
	}
	return entries
}

func matchString(entry map[string]any, key, want string) bool {
	if want == "" {
		return true
	}
	got, ok := entry[key].(string)
	return ok && got == want
}

// MFA management runs in a sudo window: one step-up token authorises the whole
// settings session, so the same token must survive more than one call. The
// service has no store here, so both calls fail the same way (503) — what is
// under test is that the SECOND one gets past the step-up guard at all.
func TestPostAuthMfaDisable_StepupTokenReusableWithinWindow(t *testing.T) {
	buf := captureAuditLogs(t)
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	user := auth.User{ID: uuid.New(), Username: "alice"}
	stepupToken, _, err := tm.IssueStepup(user)
	if err != nil {
		t.Fatalf("IssueStepup: %v", err)
	}

	apiHandler := handlers.API{
		Auth:   service.NewAuthService(nil, tm),
		Tokens: tm,
		Redis:  rdb,
	}
	ctx := auth.WithUser(context.Background(), user)

	call := func() int {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/disable", nil).WithContext(ctx)
		req.Header.Set("X-Stepup-Token", stepupToken)
		rr := httptest.NewRecorder()
		apiHandler.PostAuthMfaDisable(rr, req, api.PostAuthMfaDisableParams{})
		return rr.Code
	}

	for i := 1; i <= 3; i++ {
		if code := call(); code == http.StatusUnauthorized {
			t.Fatalf("call %d: step-up token rejected inside the sudo window", i)
		}
	}

	if hasAuditEntry(t, buf, "auth.stepup.use", "failure", "replay", "mfa_disable") {
		t.Fatalf("did not expect a replay rejection inside the sudo window")
	}
	if !hasAuditEntry(t, buf, "auth.stepup.use", "success", "", "mfa_disable") {
		t.Fatalf("expected audit log for stepup use success")
	}
}

// Both logout and account deletion end a session, so they share
// clearAuthCookies. Deletion used to skip it and answer 204 on its own, which
// left the browser presenting credentials for an account that no longer
// existed — the realtime socket reconnected in a loop against a 401.
//
// The deletion path itself needs the whole account-removal transaction to
// reach its cookie clearing, so what is pinned here is the helper they share:
// both cookies expired, with the attributes they were set with.
func TestPostAuthLogout_ClearsBothSessionCookies(t *testing.T) {
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	apiHandler := handlers.API{Tokens: tm}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)
	rr := httptest.NewRecorder()
	apiHandler.PostAuthLogout(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rr.Code)
	}

	wantPath := map[string]string{
		"ciel_auth":    "/",
		"ciel_refresh": "/api/v1/auth/refresh",
	}
	seen := map[string]bool{}
	for _, c := range rr.Result().Cookies() {
		path, wanted := wantPath[c.Name]
		if !wanted {
			continue
		}
		seen[c.Name] = true
		if c.Value != "" {
			t.Errorf("%s: expected an empty value, got %q", c.Name, c.Value)
		}
		if c.MaxAge >= 0 {
			t.Errorf("%s: expected MaxAge < 0 to expire it, got %d", c.Name, c.MaxAge)
		}
		// A mismatched path leaves the original cookie in place, so the browser
		// keeps sending it and the expiry silently does nothing.
		if c.Path != path {
			t.Errorf("%s: expected path %q, got %q", c.Name, path, c.Path)
		}
		if !c.HttpOnly {
			t.Errorf("%s: expected HttpOnly", c.Name)
		}
	}
	for name := range wantPath {
		if !seen[name] {
			t.Errorf("%s was never cleared", name)
		}
	}
}
