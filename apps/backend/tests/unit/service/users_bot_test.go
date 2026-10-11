package service_test

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"testing"
	"time"

	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

// userByIDColumns mirrors the GetUserByID select list. is_bot sits immediately
// after is_private: if the two ever swap in db/queries.sql, the profile re-read
// below starts reporting one badge as the other and this file fails.
func userByIDColumns() []string {
	return []string{
		"id", "username", "display_name", "bio", "avatar_media_id", "banner_media_id",
		"created_at", "terms_version", "privacy_version", "terms_accepted_at",
		"privacy_accepted_at", "is_private", "is_bot", "avatar_ext", "banner_ext", "banner_blurhash",
	}
}

// expectProfileReread covers the GetByID + follow-stats pair that SetBot returns.
func expectProfileReread(mock sqlmock.Sqlmock, userID uuid.UUID, isPrivate, isBot bool) {
	mock.ExpectQuery(`-- name: GetUserByID`).WithArgs(userID).
		WillReturnRows(sqlmock.NewRows(userByIDColumns()).AddRow(
			userID, "botaccount", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, uuid.NullUUID{},
			time.Unix(1_700_000_000, 0).UTC(), int32(1), int32(1), sql.NullTime{}, sql.NullTime{},
			isPrivate, isBot, sql.NullString{}, sql.NullString{}, sql.NullString{},
		))
	mock.ExpectQuery(`AS followers_count`).
		WillReturnRows(sqlmock.NewRows([]string{
			"followers_count", "following_count", "is_following", "is_followed_by",
			"follow_request_sent", "is_muted", "is_blocking", "is_blocked_by",
		}).AddRow(0, 0, false, false, false, false, false, false))
}

func TestUsersService_SetBot_NilStore(t *testing.T) {
	svc := service.NewUsersService(nil)
	_, err := svc.SetBot(context.Background(), uuid.New(), true)
	assertServiceError(t, err, http.StatusServiceUnavailable, "service_unavailable")
}

func TestUsersService_SetBot_On(t *testing.T) {
	svc, mock, cleanup := newUsersServiceWithMock(t)
	defer cleanup()

	userID := uuid.New()
	mock.ExpectExec(`-- name: SetUserBot`).WithArgs(true, userID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	expectProfileReread(mock, userID, false, true)

	got, err := svc.SetBot(context.Background(), userID, true)
	if err != nil {
		t.Fatalf("SetBot: %v", err)
	}
	if got.IsBot == nil || !*got.IsBot {
		t.Errorf("IsBot = %v, want true", got.IsBot)
	}
	// The badge must not leak into the privacy flag. These are the two adjacent
	// bools ProfileFlags exists to keep apart, so assert both, not just the one
	// under test.
	if got.IsPrivate == nil || *got.IsPrivate {
		t.Errorf("IsPrivate = %v, want false", got.IsPrivate)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestUsersService_SetBot_Off(t *testing.T) {
	svc, mock, cleanup := newUsersServiceWithMock(t)
	defer cleanup()

	userID := uuid.New()
	mock.ExpectExec(`-- name: SetUserBot`).WithArgs(false, userID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	expectProfileReread(mock, userID, false, false)

	got, err := svc.SetBot(context.Background(), userID, false)
	if err != nil {
		t.Fatalf("SetBot: %v", err)
	}
	if got.IsBot == nil || *got.IsBot {
		t.Errorf("IsBot = %v, want false", got.IsBot)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// A private account that turns on the bot badge must stay private. SetBot does
// not go through a transaction the way SetPrivate does, so this pins that it
// also never touches the other flag.
func TestUsersService_SetBot_LeavesPrivacyAlone(t *testing.T) {
	svc, mock, cleanup := newUsersServiceWithMock(t)
	defer cleanup()

	userID := uuid.New()
	mock.ExpectExec(`-- name: SetUserBot`).WithArgs(true, userID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	expectProfileReread(mock, userID, true, true)

	got, err := svc.SetBot(context.Background(), userID, true)
	if err != nil {
		t.Fatalf("SetBot: %v", err)
	}
	if got.IsPrivate == nil || !*got.IsPrivate {
		t.Errorf("IsPrivate = %v, want true", got.IsPrivate)
	}
	if got.IsBot == nil || !*got.IsBot {
		t.Errorf("IsBot = %v, want true", got.IsBot)
	}
}

func TestUsersService_SetBot_WriteFails(t *testing.T) {
	svc, mock, cleanup := newUsersServiceWithMock(t)
	defer cleanup()

	userID := uuid.New()
	mock.ExpectExec(`-- name: SetUserBot`).WithArgs(true, userID).
		WillReturnError(errors.New("boom"))

	if _, err := svc.SetBot(context.Background(), userID, true); err == nil {
		t.Fatal("SetBot: expected error, got nil")
	}
}
