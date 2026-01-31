package service_test

import (
	"context"
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

func TestAuthService_Register_EmptyUsername(t *testing.T) {
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	_, err := svc.Register(context.Background(), api.RegisterRequest{Username: "", Password: "Password123"})
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestAuthService_Register_ShortPassword(t *testing.T) {
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	_, err := svc.Register(context.Background(), api.RegisterRequest{Username: "alice", Password: "short"})
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestAuthService_Register_WeakPassword(t *testing.T) {
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	// Password missing uppercase
	_, err := svc.Register(context.Background(), api.RegisterRequest{Username: "alice", Password: "password123"})
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestAuthService_Register_DatabaseUnavailable(t *testing.T) {
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(nil, tm)

	_, err := svc.Register(context.Background(), api.RegisterRequest{Username: "alice", Password: "Password123"})
	assertServiceError(t, err, http.StatusServiceUnavailable, "service_unavailable")
}

func TestAuthService_Register_SignupDisabled(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	// Mock EnsureServerSettings
	mock.ExpectExec(`-- name: EnsureServerSettings`).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Mock GetServerSettings with signup_enabled = false
	mock.ExpectQuery(`-- name: GetServerSettings`).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "signup_enabled", "terms_version", "privacy_version"}).
				AddRow(int32(1), false, int32(1), int32(1)),
		)

	_, err = svc.Register(context.Background(), api.RegisterRequest{
		Username:       "alice",
		Password:       "Password123",
		TermsVersion:   1,
		PrivacyVersion: 1,
	})
	assertServiceError(t, err, http.StatusForbidden, "signup_disabled")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_Register_TermsVersionMismatch(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	// Mock EnsureServerSettings
	mock.ExpectExec(`-- name: EnsureServerSettings`).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Mock GetServerSettings with terms_version = 2
	mock.ExpectQuery(`-- name: GetServerSettings`).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "signup_enabled", "terms_version", "privacy_version"}).
				AddRow(int32(1), true, int32(2), int32(1)),
		)

	_, err = svc.Register(context.Background(), api.RegisterRequest{
		Username:       "alice",
		Password:       "Password123",
		TermsVersion:   1, // Wrong version
		PrivacyVersion: 1,
	})
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_Register_PrivacyVersionMismatch(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	// Mock EnsureServerSettings
	mock.ExpectExec(`-- name: EnsureServerSettings`).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Mock GetServerSettings with privacy_version = 2
	mock.ExpectQuery(`-- name: GetServerSettings`).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "signup_enabled", "terms_version", "privacy_version"}).
				AddRow(int32(1), true, int32(1), int32(2)),
		)

	_, err = svc.Register(context.Background(), api.RegisterRequest{
		Username:       "alice",
		Password:       "Password123",
		TermsVersion:   1,
		PrivacyVersion: 1, // Wrong version
	})
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_LoginStart_MissingFields(t *testing.T) {
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	_, err := svc.LoginStart(context.Background(), api.LoginStartRequest{Username: "", ClientNonce: ""})
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestAuthService_LoginFinish_MissingFields(t *testing.T) {
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	_, err := svc.LoginFinish(context.Background(), api.LoginFinishRequest{})
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestAuthService_LoginFinish_InvalidSession(t *testing.T) {
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	_, err := svc.LoginFinish(context.Background(), api.LoginFinishRequest{
		LoginSessionId:   "missing",
		ClientFinalNonce: "cnonce+snonce",
		ClientProof:      "proof",
	})
	assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
}

func TestAuthService_ChangePassword_EmptyUserID(t *testing.T) {
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	err := svc.ChangePassword(context.Background(), auth.User{ID: uuid.Nil}, api.PasswordChangeRequest{
		NewPassword: "NewPassword123",
	})
	assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
}

func TestAuthService_ChangePassword_InvalidPassword(t *testing.T) {
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	err := svc.ChangePassword(context.Background(), auth.User{ID: uuid.New(), Username: "alice"}, api.PasswordChangeRequest{
		NewPassword: "short", // Too short
	})
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestAuthService_ChangePassword_WeakPassword(t *testing.T) {
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	err := svc.ChangePassword(context.Background(), auth.User{ID: uuid.New(), Username: "alice"}, api.PasswordChangeRequest{
		NewPassword: "password123", // Missing uppercase
	})
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func newAuthServiceWithMockStore(t *testing.T) (*service.AuthService, func()) {
	t.Helper()

	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)
	cleanup := func() {
		_ = db.Close()
	}
	return svc, cleanup
}

func assertServiceError(t *testing.T, err error, status int, code string) {
	t.Helper()

	se, ok := err.(*service.Error)
	if !ok {
		t.Fatalf("expected service.Error, got %T", err)
	}
	if se.Status != status || se.Code != code {
		t.Fatalf("expected status=%d code=%s, got status=%d code=%s", status, code, se.Status, se.Code)
	}
}
