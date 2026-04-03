package service_test

import (
	"context"
	"database/sql"
	"net/http"
	"testing"
	"time"

	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

func newUsersService(t *testing.T) (*service.UsersService, func()) {
	t.Helper()
	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	store := repository.NewStore(db)
	svc := service.NewUsersService(store)
	return svc, func() { _ = db.Close() }
}

func newUsersServiceWithMock(t *testing.T) (*service.UsersService, sqlmock.Sqlmock, func()) {
	t.Helper()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	store := repository.NewStore(db)
	svc := service.NewUsersService(store)
	return svc, mock, func() { _ = db.Close() }
}

func TestUsersService_UpdateUsername_NilStore(t *testing.T) {
	svc := service.NewUsersService(nil)
	err := svc.UpdateUsername(context.Background(), uuid.New(), "alice")
	assertServiceError(t, err, http.StatusServiceUnavailable, "service_unavailable")
}

func TestUsersService_UpdateUsername_EmptyUsername(t *testing.T) {
	svc, cleanup := newUsersService(t)
	defer cleanup()

	err := svc.UpdateUsername(context.Background(), uuid.New(), "")
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestUsersService_UpdateUsername_TooShort(t *testing.T) {
	svc, cleanup := newUsersService(t)
	defer cleanup()

	err := svc.UpdateUsername(context.Background(), uuid.New(), "ab")
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestUsersService_UpdateUsername_InvalidChars(t *testing.T) {
	svc, cleanup := newUsersService(t)
	defer cleanup()

	err := svc.UpdateUsername(context.Background(), uuid.New(), "alice@example")
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestUsersService_UpdateUsername_Success(t *testing.T) {
	svc, mock, cleanup := newUsersServiceWithMock(t)
	defer cleanup()

	userID := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()

	mock.ExpectQuery(`UPDATE users`).
		WithArgs(userID, "newname").
		WillReturnRows(
			sqlmock.NewRows([]string{
				"id", "username", "display_name", "bio", "avatar_media_id", "banner_media_id",
				"created_at", "terms_version", "privacy_version",
				"terms_accepted_at", "privacy_accepted_at",
			}).AddRow(
				userID, "newname", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, uuid.NullUUID{},
				created, int32(1), int32(1), sql.NullTime{}, sql.NullTime{},
			),
		)

	err := svc.UpdateUsername(context.Background(), userID, "newname")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUsersService_UpdateUsername_AlreadyTaken(t *testing.T) {
	svc, mock, cleanup := newUsersServiceWithMock(t)
	defer cleanup()

	userID := uuid.New()

	mock.ExpectQuery(`UPDATE users`).
		WithArgs(userID, "taken").
		WillReturnError(&pgconn.PgError{Code: "23505"})

	err := svc.UpdateUsername(context.Background(), userID, "taken")
	assertServiceError(t, err, http.StatusConflict, "username_taken")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUsersService_UpdateUsername_NotFound(t *testing.T) {
	svc, mock, cleanup := newUsersServiceWithMock(t)
	defer cleanup()

	userID := uuid.New()

	mock.ExpectQuery(`UPDATE users`).
		WithArgs(userID, "alice").
		WillReturnError(sql.ErrNoRows)

	err := svc.UpdateUsername(context.Background(), userID, "alice")
	assertServiceError(t, err, http.StatusNotFound, "not_found")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
