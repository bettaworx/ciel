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
	defer db.Close()

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
