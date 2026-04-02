package service_test

import (
	"context"
	"database/sql"
	"encoding/base64"
	"net/http"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/repository"
	"backend/internal/service"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

// ============================================================
// Helpers
// ============================================================

// authByUsernameColumns returns the column list for GetAuthByUsername queries,
// including the deleted_at column added for soft-delete support.
var authByUsernameColumns = []string{
	"user_id", "username", "display_name", "bio", "avatar_media_id",
	"created_at", "terms_version", "privacy_version",
	"terms_accepted_at", "privacy_accepted_at",
	"deleted_at",
	"avatar_ext", "salt", "iterations", "stored_key", "server_key",
}

// getUserByIDColumns returns the column list for GetUserByID queries.
var getUserByIDColumns = []string{
	"id", "username", "display_name", "bio", "avatar_media_id",
	"created_at", "terms_version", "privacy_version",
	"terms_accepted_at", "privacy_accepted_at",
	"deleted_at",
	"avatar_ext",
}

// updateUsernameColumns are the RETURNING columns from UpdateUsername.
var updateUsernameColumns = []string{
	"id", "username", "display_name", "bio", "avatar_media_id",
	"created_at", "terms_version", "privacy_version",
	"terms_accepted_at", "privacy_accepted_at",
}

// fixedTime is a stable timestamp used across tests.
var fixedTime = time.Unix(1_700_000_000, 0).UTC()

// ============================================================
// ChangePassword
// ============================================================

func TestAuthService_ChangePassword_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	userID := uuid.New()
	user := auth.User{ID: userID, Username: "alice"}

	mock.ExpectExec(`-- name: UpdateAuthCredential`).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err = svc.ChangePassword(context.Background(), user, api.PasswordChangeRequest{
		NewPassword: "NewPassword123",
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_ChangePassword_DatabaseUnavailable(t *testing.T) {
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(nil, tm)

	err := svc.ChangePassword(context.Background(), auth.User{ID: uuid.New(), Username: "alice"}, api.PasswordChangeRequest{
		NewPassword: "NewPassword123",
	})
	assertServiceError(t, err, http.StatusServiceUnavailable, "service_unavailable")
}

// ============================================================
// DeleteAccount (soft delete)
// ============================================================

func TestAuthService_DeleteAccount_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	userID := uuid.New()
	user := auth.User{ID: userID, Username: "alice"}

	// SoftDeleteUser
	mock.ExpectExec(`-- name: SoftDeleteUser`).
		WithArgs(userID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	// SoftDeleteUserPosts
	mock.ExpectExec(`-- name: SoftDeleteUserPosts`).
		WillReturnResult(sqlmock.NewResult(0, 3))

	err = svc.DeleteAccount(context.Background(), user)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_DeleteAccount_Unauthorized(t *testing.T) {
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	err := svc.DeleteAccount(context.Background(), auth.User{ID: uuid.Nil})
	assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
}

func TestAuthService_DeleteAccount_DatabaseUnavailable(t *testing.T) {
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(nil, tm)

	err := svc.DeleteAccount(context.Background(), auth.User{ID: uuid.New(), Username: "alice"})
	assertServiceError(t, err, http.StatusServiceUnavailable, "service_unavailable")
}

// ============================================================
// LoginFinish – pending deletion flag
// ============================================================

// TestAuthService_LoginFinish_PendingDeletion verifies that logging in with a
// soft-deleted account returns a token alongside pendingDeletion=true.
func TestAuthService_LoginFinish_PendingDeletion(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	password := "Password123"
	salt := []byte("0123456789abcdef")
	iterations := 1000
	storedKey, serverKey := auth.DeriveVerifier(password, salt, iterations)
	saltB64 := base64.StdEncoding.EncodeToString(salt)
	deletedAt := sql.NullTime{Time: fixedTime, Valid: true}

	clientNonce := "testclientnonce"

	// Mock GetAuthByUsername for LoginStart (non-deleted row is fine here)
	mock.ExpectQuery(`-- name: GetAuthByUsername`).
		WithArgs("alice").
		WillReturnRows(
			sqlmock.NewRows(authByUsernameColumns).AddRow(
				uuid.New(), "alice",
				sql.NullString{}, sql.NullString{}, uuid.NullUUID{},
				fixedTime, int32(1), int32(1), sql.NullTime{}, sql.NullTime{},
				sql.NullTime{}, // deleted_at – not deleted yet (login start doesn't check)
				sql.NullString{},
				salt, int32(iterations), storedKey, serverKey,
			),
		)

	startResp, err := svc.LoginStart(context.Background(), api.LoginStartRequest{
		Username:    "alice",
		ClientNonce: clientNonce,
	})
	if err != nil {
		t.Fatalf("LoginStart: %v", err)
	}

	clientFinalNonce := clientNonce + startResp.ServerNonce
	authMessage := auth.BuildAuthMessage("alice", clientNonce, startResp.ServerNonce, saltB64, startResp.Iterations, clientFinalNonce)
	proofB64 := computeClientProofB64ForTest(t, password, salt, iterations, storedKey, authMessage)

	// Mock GetAuthByUsername for LoginFinish – soft-deleted row
	mock.ExpectQuery(`-- name: GetAuthByUsername`).
		WithArgs("alice").
		WillReturnRows(
			sqlmock.NewRows(authByUsernameColumns).AddRow(
				uuid.New(), "alice",
				sql.NullString{}, sql.NullString{}, uuid.NullUUID{},
				fixedTime, int32(1), int32(1), sql.NullTime{}, sql.NullTime{},
				deletedAt, // deleted_at is set
				sql.NullString{},
				salt, int32(iterations), storedKey, serverKey,
			),
		)

	resp, err := svc.LoginFinish(context.Background(), api.LoginFinishRequest{
		LoginSessionId:   startResp.LoginSessionId,
		ClientFinalNonce: clientFinalNonce,
		ClientProof:      proofB64,
	})
	if err != nil {
		t.Fatalf("LoginFinish: %v", err)
	}

	if resp.PendingDeletion == nil || !*resp.PendingDeletion {
		t.Fatal("expected pendingDeletion=true for soft-deleted account")
	}
	if resp.DeleteScheduledAt == nil {
		t.Fatal("expected deleteScheduledAt to be set")
	}
	expectedDeleteAt := fixedTime.Add(14 * 24 * time.Hour)
	if !resp.DeleteScheduledAt.Equal(expectedDeleteAt) {
		t.Fatalf("deleteScheduledAt: got %v, want %v", resp.DeleteScheduledAt, expectedDeleteAt)
	}
	if resp.AccessToken == "" {
		t.Fatal("expected access token to be issued even for pending-deletion account")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestAuthService_LoginFinish_NoPendingDeletion verifies that a normal (active)
// login does not set the pendingDeletion flag.
func TestAuthService_LoginFinish_NoPendingDeletion(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	password := "Password123"
	salt := []byte("0123456789abcdef")
	iterations := 1000
	storedKey, serverKey := auth.DeriveVerifier(password, salt, iterations)
	saltB64 := base64.StdEncoding.EncodeToString(salt)
	clientNonce := "testclientnonce"

	for i := 0; i < 2; i++ {
		mock.ExpectQuery(`-- name: GetAuthByUsername`).
			WithArgs("alice").
			WillReturnRows(
				sqlmock.NewRows(authByUsernameColumns).AddRow(
					uuid.New(), "alice",
					sql.NullString{}, sql.NullString{}, uuid.NullUUID{},
					fixedTime, int32(1), int32(1), sql.NullTime{}, sql.NullTime{},
					sql.NullTime{}, // deleted_at is NOT set
					sql.NullString{},
					salt, int32(iterations), storedKey, serverKey,
				),
			)
	}

	startResp, err := svc.LoginStart(context.Background(), api.LoginStartRequest{
		Username:    "alice",
		ClientNonce: clientNonce,
	})
	if err != nil {
		t.Fatalf("LoginStart: %v", err)
	}

	clientFinalNonce := clientNonce + startResp.ServerNonce
	authMessage := auth.BuildAuthMessage("alice", clientNonce, startResp.ServerNonce, saltB64, startResp.Iterations, clientFinalNonce)
	proofB64 := computeClientProofB64ForTest(t, password, salt, iterations, storedKey, authMessage)

	resp, err := svc.LoginFinish(context.Background(), api.LoginFinishRequest{
		LoginSessionId:   startResp.LoginSessionId,
		ClientFinalNonce: clientFinalNonce,
		ClientProof:      proofB64,
	})
	if err != nil {
		t.Fatalf("LoginFinish: %v", err)
	}

	if resp.PendingDeletion != nil && *resp.PendingDeletion {
		t.Fatal("expected pendingDeletion to be false for active account")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// ============================================================
// RestoreAccount
// ============================================================

func TestAuthService_RestoreAccount_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	userID := uuid.New()
	user := auth.User{ID: userID, Username: "alice"}

	// GetUserByID returns soft-deleted row
	mock.ExpectQuery(`-- name: GetUserByID`).
		WithArgs(userID).
		WillReturnRows(
			sqlmock.NewRows(getUserByIDColumns).AddRow(
				userID, "alice",
				sql.NullString{}, sql.NullString{}, uuid.NullUUID{},
				fixedTime, int32(1), int32(1), sql.NullTime{}, sql.NullTime{},
				sql.NullTime{Time: fixedTime, Valid: true}, // deleted_at set
				sql.NullString{},
			),
		)

	// RestoreUser
	mock.ExpectExec(`-- name: RestoreUser`).
		WithArgs(userID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	// RestoreUserPosts
	mock.ExpectExec(`-- name: RestoreUserPosts`).
		WithArgs(userID).
		WillReturnResult(sqlmock.NewResult(0, 5))

	err = svc.RestoreAccount(context.Background(), user)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_RestoreAccount_NotPendingDeletion(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	userID := uuid.New()
	user := auth.User{ID: userID, Username: "alice"}

	// GetUserByID returns an active (not soft-deleted) row
	mock.ExpectQuery(`-- name: GetUserByID`).
		WithArgs(userID).
		WillReturnRows(
			sqlmock.NewRows(getUserByIDColumns).AddRow(
				userID, "alice",
				sql.NullString{}, sql.NullString{}, uuid.NullUUID{},
				fixedTime, int32(1), int32(1), sql.NullTime{}, sql.NullTime{},
				sql.NullTime{}, // deleted_at NOT set
				sql.NullString{},
			),
		)

	err = svc.RestoreAccount(context.Background(), user)
	assertServiceError(t, err, http.StatusConflict, "not_pending_deletion")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_RestoreAccount_UserNotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	userID := uuid.New()
	user := auth.User{ID: userID, Username: "alice"}

	mock.ExpectQuery(`-- name: GetUserByID`).
		WithArgs(userID).
		WillReturnError(sql.ErrNoRows)

	err = svc.RestoreAccount(context.Background(), user)
	assertServiceError(t, err, http.StatusNotFound, "not_found")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_RestoreAccount_Unauthorized(t *testing.T) {
	svc, cleanup := newAuthServiceWithMockStore(t)
	defer cleanup()

	err := svc.RestoreAccount(context.Background(), auth.User{ID: uuid.Nil})
	assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
}

func TestAuthService_RestoreAccount_DatabaseUnavailable(t *testing.T) {
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(nil, tm)

	err := svc.RestoreAccount(context.Background(), auth.User{ID: uuid.New(), Username: "alice"})
	assertServiceError(t, err, http.StatusServiceUnavailable, "service_unavailable")
}

// ============================================================
// PurgeExpiredAccounts (account permanent deletion)
// ============================================================

func TestAuthService_PurgeExpiredAccounts_DeletesExpiredUsers(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	id1 := uuid.New()
	id2 := uuid.New()

	// GetUsersForPermanentDeletion returns two expired accounts
	mock.ExpectQuery(`-- name: GetUsersForPermanentDeletion`).
		WillReturnRows(
			sqlmock.NewRows([]string{"id"}).
				AddRow(id1).
				AddRow(id2),
		)

	// DeleteUserByID called for each
	mock.ExpectExec(`-- name: DeleteUserByID`).
		WithArgs(id1).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(`-- name: DeleteUserByID`).
		WithArgs(id2).
		WillReturnResult(sqlmock.NewResult(0, 1))

	svc.PurgeExpiredAccounts(context.Background())

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_PurgeExpiredAccounts_NoExpiredAccounts(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	mock.ExpectQuery(`-- name: GetUsersForPermanentDeletion`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}))

	svc.PurgeExpiredAccounts(context.Background())

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAuthService_PurgeExpiredAccounts_DatabaseUnavailable(t *testing.T) {
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(nil, tm)

	// Should not panic when store is nil
	svc.PurgeExpiredAccounts(context.Background())
}

// ============================================================
// UpdateUsername (in UsersService)
// ============================================================

func newUsersService(t *testing.T) (*service.UsersService, sqlmock.Sqlmock, func()) {
	t.Helper()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	store := repository.NewStore(db)
	svc := service.NewUsersService(store)
	return svc, mock, func() { _ = db.Close() }
}

func TestUsersService_UpdateUsername_Success(t *testing.T) {
	svc, mock, cleanup := newUsersService(t)
	defer cleanup()

	userID := uuid.New()

	mock.ExpectQuery(`-- name: UpdateUsername`).
		WithArgs(userID, "newname").
		WillReturnRows(
			sqlmock.NewRows(updateUsernameColumns).AddRow(
				userID, "newname",
				sql.NullString{}, sql.NullString{}, uuid.NullUUID{},
				fixedTime, int32(1), int32(1), sql.NullTime{}, sql.NullTime{},
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

func TestUsersService_UpdateUsername_UsernameTaken(t *testing.T) {
	svc, mock, cleanup := newUsersService(t)
	defer cleanup()

	userID := uuid.New()

	mock.ExpectQuery(`-- name: UpdateUsername`).
		WithArgs(userID, "taken").
		WillReturnError(&pgconn.PgError{Code: "23505"})

	err := svc.UpdateUsername(context.Background(), userID, "taken")
	assertServiceError(t, err, http.StatusConflict, "username_taken")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUsersService_UpdateUsername_TooShort(t *testing.T) {
	svc, _, cleanup := newUsersService(t)
	defer cleanup()

	err := svc.UpdateUsername(context.Background(), uuid.New(), "ab")
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestUsersService_UpdateUsername_TooLong(t *testing.T) {
	svc, _, cleanup := newUsersService(t)
	defer cleanup()

	err := svc.UpdateUsername(context.Background(), uuid.New(), "averylongusernamethatiswayover32characters")
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestUsersService_UpdateUsername_InvalidChars(t *testing.T) {
	svc, _, cleanup := newUsersService(t)
	defer cleanup()

	err := svc.UpdateUsername(context.Background(), uuid.New(), "invalid name!")
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestUsersService_UpdateUsername_DatabaseUnavailable(t *testing.T) {
	svc := service.NewUsersService(nil)

	err := svc.UpdateUsername(context.Background(), uuid.New(), "validname")
	assertServiceError(t, err, http.StatusServiceUnavailable, "service_unavailable")
}
