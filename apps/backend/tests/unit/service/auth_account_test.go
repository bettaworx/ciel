package service_test

import (
	"context"
	"errors"
	"net/http"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

func TestAuthService_ChangePassword_NilStore(t *testing.T) {
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(nil, tm)

	err := svc.ChangePassword(context.Background(), auth.User{ID: uuid.New(), Username: "alice"}, api.PasswordChangeRequest{
		NewPassword: "NewPassword123!",
	})
	assertServiceError(t, err, http.StatusServiceUnavailable, "service_unavailable")
}

func TestAuthService_ChangePassword_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	userID := uuid.New()

	mock.ExpectExec(`UPDATE auth_credentials`).
		WithArgs(userID, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(0, 1))

	mock.ExpectExec(`UPDATE refresh_tokens`).
		WithArgs(userID).
		WillReturnResult(sqlmock.NewResult(0, 0))

	err = svc.ChangePassword(context.Background(), auth.User{ID: userID, Username: "alice"}, api.PasswordChangeRequest{
		NewPassword: "NewPassword123!",
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_ChangePassword_DBError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	userID := uuid.New()

	mock.ExpectExec(`UPDATE auth_credentials`).
		WithArgs(userID, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnError(errors.New("db error"))

	err = svc.ChangePassword(context.Background(), auth.User{ID: userID, Username: "alice"}, api.PasswordChangeRequest{
		NewPassword: "NewPassword123!",
	})
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestAuthService_DeleteAccount_NilStore(t *testing.T) {
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(nil, tm)

	err := svc.DeleteAccount(context.Background(), auth.User{ID: uuid.New(), Username: "alice"})
	assertServiceError(t, err, http.StatusServiceUnavailable, "service_unavailable")
}

func TestAuthService_DeleteAccount_NilUser(t *testing.T) {
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	err := svc.DeleteAccount(context.Background(), auth.User{ID: uuid.Nil, Username: ""})
	assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
}

func TestAuthService_DeleteAccount_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	userID := uuid.New()

	mock.ExpectExec(`UPDATE refresh_tokens`).
		WithArgs(userID).
		WillReturnResult(sqlmock.NewResult(0, 0))

	mock.ExpectBegin()
	mock.ExpectExec(`DELETE FROM users`).
		WithArgs(userID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	err = svc.DeleteAccount(context.Background(), auth.User{ID: userID, Username: "alice"})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// The reaction purge must land before the user row is deleted and inside the
// same transaction: the other order lets the cascade take the events while
// post_reaction_counts keeps the totals, which is the bug this guards.
func TestAuthService_DeleteAccount_PurgesReactionsBeforeUser(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)
	svc.SetReactionsService(service.NewReactionsService(store, nil, nil))

	userID := uuid.New()
	postID := uuid.New()

	mock.ExpectExec(`UPDATE refresh_tokens`).
		WithArgs(userID).
		WillReturnResult(sqlmock.NewResult(0, 0))

	mock.ExpectBegin()
	mock.ExpectQuery(`DELETE FROM post_reaction_events`).
		WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"post_id"}).AddRow(postID).AddRow(postID))
	mock.ExpectExec(`DELETE FROM post_reaction_counts`).
		WithArgs(sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(`DELETE FROM users`).
		WithArgs(userID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	err = svc.DeleteAccount(context.Background(), auth.User{ID: userID, Username: "alice"})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// A failure while settling the counters must take the user deletion down with
// it, otherwise the account is gone and the reactions stay.
func TestAuthService_DeleteAccount_ReactionPurgeFailureRollsBack(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)
	svc.SetReactionsService(service.NewReactionsService(store, nil, nil))

	userID := uuid.New()

	mock.ExpectExec(`UPDATE refresh_tokens`).
		WithArgs(userID).
		WillReturnResult(sqlmock.NewResult(0, 0))

	mock.ExpectBegin()
	mock.ExpectQuery(`DELETE FROM post_reaction_events`).
		WithArgs(userID).
		WillReturnError(errors.New("db error"))
	mock.ExpectRollback()

	if err := svc.DeleteAccount(context.Background(), auth.User{ID: userID, Username: "alice"}); err == nil {
		t.Fatal("expected error, got nil")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
