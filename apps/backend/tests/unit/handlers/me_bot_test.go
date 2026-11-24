package handlers_test

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"backend/internal/auth"
	"backend/internal/handlers"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

func newBotAPI(t *testing.T) (handlers.API, sqlmock.Sqlmock, func()) {
	t.Helper()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	api := handlers.API{Users: service.NewUsersService(repository.NewStore(db))}
	return api, mock, func() { _ = db.Close() }
}

func expectBotWriteAndReread(mock sqlmock.Sqlmock, userID uuid.UUID, isBot bool) {
	mock.ExpectExec(`-- name: SetUserBot`).WithArgs(isBot, userID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectQuery(`-- name: GetUserByID`).WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "username", "display_name", "bio", "avatar_media_id", "banner_media_id",
			"created_at", "terms_version", "privacy_version", "terms_accepted_at",
			"privacy_accepted_at", "is_private", "is_bot", "avatar_ext", "banner_ext", "banner_blurhash",
		}).AddRow(
			userID, "botaccount", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, uuid.NullUUID{},
			time.Unix(1_700_000_000, 0).UTC(), int32(1), int32(1), sql.NullTime{}, sql.NullTime{},
			false, isBot, sql.NullString{}, sql.NullString{}, sql.NullString{},
		))
	mock.ExpectQuery(`AS followers_count`).
		WillReturnRows(sqlmock.NewRows([]string{
			"followers_count", "following_count", "is_following", "is_followed_by",
			"follow_request_sent", "is_muted", "is_blocking", "is_blocked_by",
		}).AddRow(0, 0, false, false, false, false, false, false))
}

func patchMeBot(t *testing.T, api handlers.API, body string, user *auth.User) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/me/bot", strings.NewReader(body))
	if user != nil {
		req = req.WithContext(auth.WithUser(req.Context(), *user))
	}
	rec := httptest.NewRecorder()
	api.PatchMeBot(rec, req)
	return rec
}

// The wire name is what the client keys the robot badge off, so pin it here
// rather than trusting the generated model to keep its json tag.
func TestAPI_PatchMeBot_ReturnsIsBot(t *testing.T) {
	api, mock, cleanup := newBotAPI(t)
	defer cleanup()

	userID := uuid.New()
	expectBotWriteAndReread(mock, userID, true)

	rec := patchMeBot(t, api, `{"isBot":true}`, &auth.User{ID: userID, Username: "botaccount"})
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", rec.Code, rec.Body.String())
	}

	var got map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if got["isBot"] != true {
		t.Errorf("isBot = %v, want true", got["isBot"])
	}
	if got["isPrivate"] != false {
		t.Errorf("isPrivate = %v, want false", got["isPrivate"])
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestAPI_PatchMeBot_Unauthenticated(t *testing.T) {
	api, mock, cleanup := newBotAPI(t)
	defer cleanup()

	rec := patchMeBot(t, api, `{"isBot":true}`, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
	// Nothing may reach the database before the caller is known.
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestAPI_PatchMeBot_InvalidJSON(t *testing.T) {
	api, mock, cleanup := newBotAPI(t)
	defer cleanup()

	userID := uuid.New()
	rec := patchMeBot(t, api, `{`, &auth.User{ID: userID, Username: "botaccount"})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestAPI_PatchMeBot_ServiceNotConfigured(t *testing.T) {
	rec := patchMeBot(t, handlers.API{}, `{"isBot":true}`, &auth.User{ID: uuid.New(), Username: "botaccount"})
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
}
