package service_test

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"log/slog"
	"strings"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"golang.org/x/crypto/pbkdf2"
)

func TestAuthService_StepUpStart_MissingNonce(t *testing.T) {
	buf := captureAuditLogs(t)
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	user := auth.User{ID: uuid.New(), Username: "alice"}
	_, err := svc.StepUpStart(context.Background(), user, api.StepupStartRequest{ClientNonce: ""})
	assertServiceError(t, err, 400, "invalid_request")
	if !hasAuditEntry(t, buf, "auth.stepup.start", "failure", "invalid_request") {
		t.Fatalf("expected audit log for missing nonce")
	}
}

func TestAuthService_StepUpFinish_MissingFields(t *testing.T) {
	buf := captureAuditLogs(t)
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	user := auth.User{ID: uuid.New(), Username: "alice"}
	_, err := svc.StepUpFinish(context.Background(), user, api.StepupFinishRequest{})
	assertServiceError(t, err, 400, "invalid_request")
	if !hasAuditEntry(t, buf, "auth.stepup.finish", "failure", "invalid_request") {
		t.Fatalf("expected audit log for missing fields")
	}
}

func TestAuthService_StepUpFinish_InvalidSession(t *testing.T) {
	buf := captureAuditLogs(t)
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	user := auth.User{ID: uuid.New(), Username: "alice"}
	_, err := svc.StepUpFinish(context.Background(), user, api.StepupFinishRequest{
		StepupSessionId:  "missing",
		ClientFinalNonce: "cnonce+snonce",
		ClientProof:      "proof",
	})
	assertServiceError(t, err, 401, "unauthorized")
	if !hasAuditEntry(t, buf, "auth.stepup.finish", "failure", "invalid_session") {
		t.Fatalf("expected audit log for invalid session")
	}
}

func TestAuthService_StepUpFinish_WrongNonce(t *testing.T) {
	buf := captureAuditLogs(t)
	svc, mock, cleanup := newAuthServiceWithMockStoreAndMock(t)
	defer cleanup()

	userID := uuid.New()
	user := auth.User{ID: userID, Username: "alice"}
	created := time.Unix(1_700_000_000, 0).UTC()

	mock.ExpectQuery(`SELECT\s+u.id`).WithArgs(userID).WillReturnRows(
		sqlmock.NewRows([]string{"user_id", "username", "display_name", "bio", "avatar_media_id", "created_at", "terms_version", "privacy_version", "terms_accepted_at", "privacy_accepted_at", "avatar_ext", "salt", "iterations", "stored_key", "server_key"}).
			AddRow(userID, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, created, sql.NullInt32{Valid: true, Int32: 1}, sql.NullInt32{Valid: true, Int32: 1}, sql.NullTime{}, sql.NullTime{}, sql.NullString{}, []byte("salt"), int32(100000), []byte{1, 2}, []byte{3, 4}),
	)

	startResp, err := svc.StepUpStart(context.Background(), user, api.StepupStartRequest{ClientNonce: "cnonce"})
	if err != nil {
		t.Fatalf("StepUpStart: %v", err)
	}

	_, err = svc.StepUpFinish(context.Background(), user, api.StepupFinishRequest{
		StepupSessionId:  startResp.StepupSessionId,
		ClientFinalNonce: "wrong",
		ClientProof:      "proof",
	})
	assertServiceError(t, err, 401, "unauthorized")
	if !hasAuditEntry(t, buf, "auth.stepup.finish", "failure", "invalid_nonce") {
		t.Fatalf("expected audit log for invalid nonce")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_StepUpStart_AuditSuccess(t *testing.T) {
	buf := captureAuditLogs(t)
	svc, mock, cleanup := newAuthServiceWithMockStoreAndMock(t)
	defer cleanup()

	userID := uuid.New()
	user := auth.User{ID: userID, Username: "alice"}
	created := time.Unix(1_700_000_000, 0).UTC()
	salt := []byte("0123456789abcdef")
	iterations := 1000
	storedKey, serverKey := auth.DeriveVerifier("password123", salt, iterations)

	mock.ExpectQuery(`SELECT\s+u.id`).WithArgs(userID).WillReturnRows(
		sqlmock.NewRows([]string{"user_id", "username", "display_name", "bio", "avatar_media_id", "created_at", "terms_version", "privacy_version", "terms_accepted_at", "privacy_accepted_at", "avatar_ext", "salt", "iterations", "stored_key", "server_key"}).
			AddRow(userID, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, created, sql.NullInt32{Valid: true, Int32: 1}, sql.NullInt32{Valid: true, Int32: 1}, sql.NullTime{}, sql.NullTime{}, sql.NullString{}, salt, int32(iterations), storedKey, serverKey),
	)

	_, err := svc.StepUpStart(context.Background(), user, api.StepupStartRequest{ClientNonce: "cnonce"})
	if err != nil {
		t.Fatalf("StepUpStart: %v", err)
	}
	if !hasAuditEntry(t, buf, "auth.stepup.start", "success", "") {
		t.Fatalf("expected audit log for stepup start success")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_StepUpFinish_AuditSuccess(t *testing.T) {
	buf := captureAuditLogs(t)
	svc, mock, cleanup := newAuthServiceWithMockStoreAndMock(t)
	defer cleanup()

	userID := uuid.New()
	user := auth.User{ID: userID, Username: "alice"}
	created := time.Unix(1_700_000_000, 0).UTC()
	password := "password123"
	salt := []byte("0123456789abcdef")
	iterations := 1000
	storedKey, serverKey := auth.DeriveVerifier(password, salt, iterations)

	mock.ExpectQuery(`SELECT\s+u.id`).WithArgs(userID).WillReturnRows(
		sqlmock.NewRows([]string{"user_id", "username", "display_name", "bio", "avatar_media_id", "created_at", "terms_version", "privacy_version", "terms_accepted_at", "privacy_accepted_at", "avatar_ext", "salt", "iterations", "stored_key", "server_key"}).
			AddRow(userID, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, created, sql.NullInt32{Valid: true, Int32: 1}, sql.NullInt32{Valid: true, Int32: 1}, sql.NullTime{}, sql.NullTime{}, sql.NullString{}, salt, int32(iterations), storedKey, serverKey),
	)
	mock.ExpectQuery(`SELECT\s+u.id`).WithArgs(userID).WillReturnRows(
		sqlmock.NewRows([]string{"user_id", "username", "display_name", "bio", "avatar_media_id", "created_at", "terms_version", "privacy_version", "terms_accepted_at", "privacy_accepted_at", "avatar_ext", "salt", "iterations", "stored_key", "server_key"}).
			AddRow(userID, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, created, sql.NullInt32{Valid: true, Int32: 1}, sql.NullInt32{Valid: true, Int32: 1}, sql.NullTime{}, sql.NullTime{}, sql.NullString{}, salt, int32(iterations), storedKey, serverKey),
	)

	startResp, err := svc.StepUpStart(context.Background(), user, api.StepupStartRequest{ClientNonce: "cnonce"})
	if err != nil {
		t.Fatalf("StepUpStart: %v", err)
	}
	clientFinalNonce := "cnonce" + startResp.ServerNonce
	authMessage := auth.BuildAuthMessage(user.Username, "cnonce", startResp.ServerNonce, startResp.Salt, startResp.Iterations, clientFinalNonce)
	proofB64 := computeClientProofB64ForTest(t, password, salt, iterations, storedKey, authMessage)

	_, err = svc.StepUpFinish(context.Background(), user, api.StepupFinishRequest{
		StepupSessionId:  startResp.StepupSessionId,
		ClientFinalNonce: clientFinalNonce,
		ClientProof:      proofB64,
	})
	if err != nil {
		t.Fatalf("StepUpFinish: %v", err)
	}
	if !hasAuditEntry(t, buf, "auth.stepup.finish", "success", "") {
		t.Fatalf("expected audit log for stepup finish success")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func newAuthServiceWithMockStoreAndMock(t *testing.T) (*service.AuthService, sqlmock.Sqlmock, func()) {
	t.Helper()

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)
	cleanup := func() {
		_ = db.Close()
	}
	return svc, mock, cleanup
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

func hasAuditEntry(t *testing.T, buf *bytes.Buffer, event, outcome, reason string) bool {
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

func computeClientProofB64ForTest(t *testing.T, password string, salt []byte, iterations int, storedKey []byte, authMessage string) string {
	t.Helper()
	saltedPassword := pbkdf2.Key([]byte(password), salt, iterations, 32, sha256.New)
	clientKey := hmacSHA256ForTest(saltedPassword, []byte("Client Key"))
	storedKeyCheckArr := sha256.Sum256(clientKey)
	if !hmac.Equal(storedKeyCheckArr[:], storedKey) {
		t.Fatalf("storedKey mismatch in test setup")
	}
	clientSignature := hmacSHA256ForTest(storedKey, []byte(authMessage))
	clientProof := xorBytesForTest(clientKey, clientSignature)
	return base64.StdEncoding.EncodeToString(clientProof)
}

func hmacSHA256ForTest(key []byte, msg []byte) []byte {
	h := hmac.New(sha256.New, key)
	_, _ = h.Write(msg)
	return h.Sum(nil)
}

func xorBytesForTest(a, b []byte) []byte {
	out := make([]byte, len(a))
	for i := 0; i < len(a) && i < len(b); i++ {
		out[i] = a[i] ^ b[i]
	}
	return out
}
