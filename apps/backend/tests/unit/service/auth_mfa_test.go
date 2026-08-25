package service_test

import (
	"context"
	"database/sql"
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

func newMFATestService(t *testing.T) (*service.AuthService, sqlmock.Sqlmock, *auth.MemoryMfaSessionStore, func()) {
	t.Helper()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	store := repository.NewStore(db)
	tm := auth.NewTokenManager([]byte("secret"), time.Minute)
	svc := service.NewAuthService(store, tm)

	key := make([]byte, 32)
	for i := range key {
		key[i] = byte(i + 1)
	}
	box, err := auth.NewSecretBox(key)
	if err != nil {
		t.Fatalf("NewSecretBox: %v", err)
	}
	mfaSessions := auth.NewMemoryMfaSessionStore()
	svc.SetMFA(box, mfaSessions, auth.NewMemoryTotpSetupStore(), nil, nil, auth.NewMemoryAttemptLimiter(), "Ciel")

	cleanup := func() { _ = db.Close() }
	return svc, mock, mfaSessions, cleanup
}

func authRowColumns() []string {
	return []string{"user_id", "username", "display_name", "bio", "avatar_media_id", "banner_media_id", "created_at", "terms_version", "privacy_version", "terms_accepted_at", "privacy_accepted_at", "avatar_ext", "banner_ext", "banner_blurhash", "salt", "iterations", "stored_key", "server_key"}
}

func addAuthRow(rows *sqlmock.Rows, userID uuid.UUID, username string) {
	created := time.Unix(1_700_000_000, 0).UTC()
	rows.AddRow(userID, username, sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, uuid.NullUUID{}, created,
		sql.NullInt32{Valid: true, Int32: 1}, sql.NullInt32{Valid: true, Int32: 1}, sql.NullTime{}, sql.NullTime{},
		sql.NullString{}, sql.NullString{}, sql.NullString{}, []byte("salt"), int32(100000), []byte{1, 2}, []byte{3, 4})
}

func TestAuthService_TotpSetup_AlreadyEnabled(t *testing.T) {
	svc, mock, _, cleanup := newMFATestService(t)
	defer cleanup()

	userID := uuid.New()
	mock.ExpectQuery(`SELECT user_id, secret_enc`).WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "secret_enc", "enabled_at", "last_used_step"}).
			AddRow(userID, []byte{9}, time.Now(), sql.NullInt64{}))

	_, err := svc.TotpSetup(context.Background(), auth.User{ID: userID, Username: "alice"})
	assertServiceError(t, err, http.StatusConflict, "totp_already_enabled")
}

func TestAuthService_TotpConfirm_NoPending(t *testing.T) {
	svc, _, _, cleanup := newMFATestService(t)
	defer cleanup()

	_, err := svc.TotpConfirm(context.Background(), auth.User{ID: uuid.New(), Username: "alice"}, api.TotpConfirmRequest{Code: "123456"})
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
}

func TestAuthService_VerifyMfaCode_TotpSuccess(t *testing.T) {
	svc, mock, mfaSessions, cleanup := newMFATestService(t)
	defer cleanup()

	userID := uuid.New()
	token := "mfa-token-1"
	if err := mfaSessions.Put(auth.MfaSession{
		Token:        token,
		UserID:       userID.String(),
		Username:     "alice",
		Purpose:      auth.MfaPurposeLogin,
		Methods:      []string{"totp"},
		ExpiresAtUTC: time.Now().UTC().Add(5 * time.Minute),
	}); err != nil {
		t.Fatal(err)
	}

	// Encrypt a known secret with the SAME key the service's box uses.
	key, _ := auth.DecodeTotpSecret("JBSWY3DPEHPK3PXP")
	boxKey := make([]byte, 32)
	for i := range boxKey {
		boxKey[i] = byte(i + 1)
	}
	box, _ := auth.NewSecretBox(boxKey)
	enc, err := box.Seal(key)
	if err != nil {
		t.Fatal(err)
	}

	now := time.Now().UTC()
	code := auth.TotpCodeAt(key, now.Unix())

	mock.ExpectQuery(`SELECT user_id, secret_enc`).WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "secret_enc", "enabled_at", "last_used_step"}).
			AddRow(userID, enc, now.Add(-time.Hour), sql.NullInt64{}))
	mock.ExpectExec(`UPDATE auth_totp`).
		WithArgs(userID, sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(0, 1))
	// completeLogin: refresh token + user hydration
	mock.ExpectQuery(`INSERT INTO refresh_tokens`).
		WithArgs(userID, sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "token_hash", "created_at", "expires_at", "revoked_at"}).
			AddRow(uuid.New(), userID, []byte{1}, time.Now(), time.Now().Add(24*time.Hour), sql.NullTime{}))
	mock.ExpectQuery(`SELECT\s+u.id`).WithArgs(userID).WillReturnRows(func() *sqlmock.Rows {
		r := sqlmock.NewRows(authRowColumns())
		addAuthRow(r, userID, "alice")
		return r
	}())

	login, _, refresh, err := svc.VerifyMfaCode(context.Background(), api.MfaCodeVerifyRequest{
		MfaToken: token,
		Code:     code,
	}, auth.MfaPurposeLogin)
	if err != nil {
		t.Fatalf("VerifyMfaCode: %v", err)
	}
	if login.Status != api.LoginAuthenticatedStatusAuthenticated || login.AccessToken == "" {
		t.Fatalf("unexpected login response %+v", login.Status)
	}
	if refresh == "" {
		t.Fatal("expected refresh token")
	}
	// Session consumed
	if _, ok := mfaSessions.Get(token); ok {
		t.Fatal("expected MFA session to be consumed")
	}
}

func TestAuthService_VerifyMfaCode_InvalidKeepsSession(t *testing.T) {
	svc, mock, mfaSessions, cleanup := newMFATestService(t)
	defer cleanup()

	userID := uuid.New()
	token := "mfa-token-2"
	_ = mfaSessions.Put(auth.MfaSession{
		Token:        token,
		UserID:       userID.String(),
		Username:     "alice",
		Purpose:      auth.MfaPurposeStepup,
		Methods:      []string{"totp"},
		ExpiresAtUTC: time.Now().UTC().Add(5 * time.Minute),
	})

	key, _ := auth.DecodeTotpSecret("JBSWY3DPEHPK3PXP")
	boxKey := make([]byte, 32)
	for i := range boxKey {
		boxKey[i] = byte(i + 1)
	}
	box, _ := auth.NewSecretBox(boxKey)
	enc, _ := box.Seal(key)

	mock.ExpectQuery(`SELECT user_id, secret_enc`).WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "secret_enc", "enabled_at", "last_used_step"}).
			AddRow(userID, enc, time.Now(), sql.NullInt64{}))

	_, _, _, err := svc.VerifyMfaCode(context.Background(), api.MfaCodeVerifyRequest{
		MfaToken: token,
		Code:     "000000",
	}, auth.MfaPurposeStepup)
	assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")

	// Session survives failed verification so the client can retry.
	if _, ok := mfaSessions.Get(token); !ok {
		t.Fatal("expected MFA session to survive failed attempt")
	}
}

func TestAuthService_VerifyMfaCode_BackupCode(t *testing.T) {
	svc, mock, mfaSessions, cleanup := newMFATestService(t)
	defer cleanup()

	userID := uuid.New()
	token := "mfa-token-3"
	_ = mfaSessions.Put(auth.MfaSession{
		Token:        token,
		UserID:       userID.String(),
		Username:     "alice",
		Purpose:      auth.MfaPurposeLogin,
		Methods:      []string{"backup_code"},
		ExpiresAtUTC: time.Now().UTC().Add(5 * time.Minute),
	})

	// No TOTP row ↁEfalls through to backup code path.
	mock.ExpectQuery(`SELECT user_id, secret_enc`).WithArgs(userID).
		WillReturnError(sql.ErrNoRows)
	mock.ExpectQuery(`UPDATE auth_backup_codes AS c`).
		WithArgs(userID, auth.HashBackupCode("ABCD-EF01")).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "code_hash", "created_at", "used_at"}).
			AddRow(uuid.New(), userID, auth.HashBackupCode("ABCD-EF01"), time.Now(), time.Now()))
	mock.ExpectQuery(`INSERT INTO refresh_tokens`).
		WithArgs(userID, sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "token_hash", "created_at", "expires_at", "revoked_at"}).
			AddRow(uuid.New(), userID, []byte{1}, time.Now(), time.Now().Add(24*time.Hour), sql.NullTime{}))
	mock.ExpectQuery(`SELECT\s+u.id`).WithArgs(userID).WillReturnRows(func() *sqlmock.Rows {
		r := sqlmock.NewRows(authRowColumns())
		addAuthRow(r, userID, "alice")
		return r
	}())

	login, _, _, err := svc.VerifyMfaCode(context.Background(), api.MfaCodeVerifyRequest{
		MfaToken: token,
		Code:     "abcd-ef01",
	}, auth.MfaPurposeLogin)
	if err != nil {
		t.Fatalf("VerifyMfaCode backup: %v", err)
	}
	if login.AccessToken == "" {
		t.Fatal("expected access token")
	}
}

func TestAuthService_LoginFinish_MfaRequired(t *testing.T) {
	svc, mock, _, cleanup := newMFATestService(t)
	defer cleanup()

	userID := uuid.New()
	password := "password123"
	salt := []byte("0123456789abcdef")
	iterations := 1000
	storedKey, serverKey := auth.DeriveVerifier(password, salt, iterations)

	// LoginStart looks up credentials by username.
	mock.ExpectQuery(`SELECT\s+u.id`).WithArgs("alice").WillReturnRows(func() *sqlmock.Rows {
		r := sqlmock.NewRows(authRowColumns())
		created := time.Unix(1_700_000_000, 0).UTC()
		r.AddRow(userID, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, uuid.NullUUID{}, created,
			sql.NullInt32{Valid: true, Int32: 1}, sql.NullInt32{Valid: true, Int32: 1}, sql.NullTime{}, sql.NullTime{},
			sql.NullString{}, sql.NullString{}, sql.NullString{}, salt, int32(iterations), storedKey, serverKey)
		return r
	}())

	startResp, err := svc.LoginStart(context.Background(), api.LoginStartRequest{
		Username:    "alice",
		ClientNonce: "clientnonce123",
	})
	if err != nil {
		t.Fatalf("LoginStart: %v", err)
	}

	// GetAuthByUsername during finish
	mock.ExpectQuery(`SELECT\s+u.id`).WithArgs("alice").WillReturnRows(func() *sqlmock.Rows {
		r := sqlmock.NewRows(authRowColumns())
		created := time.Unix(1_700_000_000, 0).UTC()
		r.AddRow(userID, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, uuid.NullUUID{}, created,
			sql.NullInt32{Valid: true, Int32: 1}, sql.NullInt32{Valid: true, Int32: 1}, sql.NullTime{}, sql.NullTime{},
			sql.NullString{}, sql.NullString{}, sql.NullString{}, salt, int32(iterations), storedKey, serverKey)
		return r
	}())
	// TOTP enrolled ↁEMFA required
	mock.ExpectQuery(`EXISTS\(SELECT 1 FROM auth_totp`).WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"has_totp", "has_webauthn", "backup_codes_remaining"}).AddRow(true, false, 10))

	clientFinalNonce := "clientnonce123" + startResp.ServerNonce
	authMessage := auth.BuildAuthMessage("alice", "clientnonce123", startResp.ServerNonce, startResp.Salt, startResp.Iterations, clientFinalNonce)
	proofB64 := computeClientProofB64ForTest(t, password, salt, iterations, storedKey, authMessage)

	resp, refresh, err := svc.LoginFinish(context.Background(), api.LoginFinishRequest{
		LoginSessionId:   startResp.LoginSessionId,
		ClientFinalNonce: clientFinalNonce,
		ClientProof:      proofB64,
	})
	if err != nil {
		t.Fatalf("LoginFinish: %v", err)
	}
	if refresh != "" {
		t.Fatal("must not issue refresh token when MFA required")
	}
	mfa, err := resp.AsLoginMfaRequired()
	if err != nil {
		t.Fatalf("expected mfa_required variant: %v", err)
	}
	if mfa.Status != api.LoginMfaRequiredStatusMfaRequired || mfa.MfaToken == "" {
		t.Fatalf("bad mfa payload: %+v", mfa)
	}
	found := false
	for _, m := range mfa.Methods {
		if m == api.Totp {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected totp in methods, got %v", mfa.Methods)
	}
}

func TestAuthService_ResetUserMFA_UserNotFound(t *testing.T) {
	svc, mock, _, cleanup := newMFATestService(t)
	defer cleanup()

	target := uuid.New()
	mock.ExpectQuery(`SELECT\s+u\.id, u\.username`).WithArgs(target).WillReturnError(sql.ErrNoRows)

	err := svc.ResetUserMFA(context.Background(), auth.User{ID: uuid.New(), Username: "admin"}, target)
	assertServiceError(t, err, http.StatusNotFound, "not_found")
}

func TestListMFAMethods_None(t *testing.T) {
	svc, mock, _, cleanup := newMFATestService(t)
	defer cleanup()

	userID := uuid.New()
	mock.ExpectQuery(`EXISTS\(SELECT 1 FROM auth_totp`).WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"has_totp", "has_webauthn", "backup_codes_remaining"}).AddRow(false, false, 0))

	methods, err := svc.ListMFAMethods(context.Background(), userID)
	if err != nil {
		t.Fatalf("ListMFAMethods: %v", err)
	}
	if len(methods) != 0 {
		t.Fatalf("expected no methods, got %v", methods)
	}
}

func TestAuthService_VerifyMfaCode_LockoutAfterRepeatedFailures(t *testing.T) {
	svc, mock, mfaSessions, cleanup := newMFATestService(t)
	defer cleanup()

	userID := uuid.New()
	token := "mfa-token-lock"
	if err := mfaSessions.Put(auth.MfaSession{
		Token:        token,
		UserID:       userID.String(),
		Username:     "alice",
		Purpose:      auth.MfaPurposeLogin,
		Methods:      []string{"totp"},
		ExpiresAtUTC: time.Now().UTC().Add(5 * time.Minute),
	}); err != nil {
		t.Fatal(err)
	}

	key, _ := auth.DecodeTotpSecret("JBSWY3DPEHPK3PXP")
	boxKey := make([]byte, 32)
	for i := range boxKey {
		boxKey[i] = byte(i + 1)
	}
	box, _ := auth.NewSecretBox(boxKey)
	enc, _ := box.Seal(key)

	// DefaultMaxAttempts failures are allowed...
	for i := 0; auth.DefaultMaxAttempts > i; i++ {
		mock.ExpectQuery(`SELECT user_id, secret_enc`).WithArgs(userID).
			WillReturnRows(sqlmock.NewRows([]string{"user_id", "secret_enc", "enabled_at", "last_used_step"}).
				AddRow(userID, enc, time.Now(), sql.NullInt64{}))
		_, _, _, err := svc.VerifyMfaCode(context.Background(), api.MfaCodeVerifyRequest{
			MfaToken: token,
			Code:     "000000",
		}, auth.MfaPurposeLogin)
		assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
	}

	// ...then the account locks out without touching the database.
	_, _, _, err := svc.VerifyMfaCode(context.Background(), api.MfaCodeVerifyRequest{
		MfaToken: token,
		Code:     "000000",
	}, auth.MfaPurposeLogin)
	assertServiceError(t, err, http.StatusTooManyRequests, "too_many_attempts")

	// A wrong mfaToken still reports unauthorized rather than revealing lockout state.
	_, _, _, err = svc.VerifyMfaCode(context.Background(), api.MfaCodeVerifyRequest{
		MfaToken: "no-such-token",
		Code:     "000000",
	}, auth.MfaPurposeLogin)
	assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
