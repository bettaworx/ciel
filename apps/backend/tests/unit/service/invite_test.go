package service_test

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"backend/internal/repository"
	"backend/internal/service"
	"backend/internal/service/admin"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

// TestGenerateInviteCode_Length tests that generated codes are 8 characters
func TestGenerateInviteCode_Length(t *testing.T) {
	code, err := admin.GenerateInviteCode()
	if err != nil {
		t.Fatalf("GenerateInviteCode() error = %v", err)
	}
	if len(code) != 8 {
		t.Errorf("GenerateInviteCode() length = %d, want 8", len(code))
	}
}

// TestGenerateInviteCode_OnlyValidCharacters tests that codes contain only alphanumeric chars
func TestGenerateInviteCode_OnlyValidCharacters(t *testing.T) {
	for i := 0; i < 100; i++ {
		code, err := admin.GenerateInviteCode()
		if err != nil {
			t.Fatalf("GenerateInviteCode() error = %v", err)
		}
		for _, ch := range code {
			if !((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')) {
				t.Errorf("GenerateInviteCode() contains invalid character %c in %s", ch, code)
			}
		}
	}
}

// TestGenerateInviteCode_Uniqueness tests that codes are sufficiently random
func TestGenerateInviteCode_Uniqueness(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 100; i++ {
		code, err := admin.GenerateInviteCode()
		if err != nil {
			t.Fatalf("GenerateInviteCode() error = %v", err)
		}
		if seen[code] {
			t.Errorf("GenerateInviteCode() produced duplicate code %s", code)
		}
		seen[code] = true
	}
}

// TestValidateCustomInviteCode_Valid tests valid custom codes
func TestValidateCustomInviteCode_Valid(t *testing.T) {
	validCodes := []string{
		"abc123",
		"ABC123",
		"test-code",
		"test_code",
		"a",
		"12345678901234567890123456789012", // 32 chars (max)
	}

	for _, code := range validCodes {
		err := admin.ValidateCustomInviteCode(code)
		if err != nil {
			t.Errorf("ValidateCustomInviteCode(%q) error = %v, want nil", code, err)
		}
	}
}

// TestValidateCustomInviteCode_Invalid tests invalid custom codes
func TestValidateCustomInviteCode_Invalid(t *testing.T) {
	invalidCodes := []struct {
		code      string
		wantError string
	}{
		{"", "must be 1-32 characters"},
		{"123456789012345678901234567890123", "must be 1-32 characters"}, // 33 chars (too long)
		{"code with spaces", "only alphanumeric"},
		{"code@special", "only alphanumeric"},
		{"code!invalid", "only alphanumeric"},
	}

	for _, tc := range invalidCodes {
		err := admin.ValidateCustomInviteCode(tc.code)
		if err == nil {
			t.Errorf("ValidateCustomInviteCode(%q) error = nil, want error containing %q", tc.code, tc.wantError)
		}
	}
}

// TestCreateInviteCode_AutoGenerate tests creating invite with auto-generated code
func TestCreateInviteCode_AutoGenerate(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := admin.NewInvitesService(store)

	creatorID := uuid.New()
	codeID := uuid.New()
	now := time.Now()

	// Expect check for uniqueness (first attempt is unique)
	mock.ExpectQuery(`SELECT .* FROM invite_codes WHERE code`).
		WillReturnError(sql.ErrNoRows)

	// Expect create invite code
	mock.ExpectQuery(`INSERT INTO invite_codes`).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "code", "created_by", "created_at", "last_used_at", "use_count", "max_uses", "expires_at", "disabled", "note"}).
				AddRow(codeID, "abc12345", creatorID, now, sql.NullTime{}, int32(0), sql.NullInt32{}, sql.NullTime{}, false, sql.NullString{}),
		)

	params := admin.CreateInviteCodeParams{
		Code:      "", // Auto-generate
		CreatorID: creatorID,
	}

	inviteCode, err := svc.CreateInviteCode(context.Background(), params)
	if err != nil {
		t.Fatalf("CreateInviteCode() error = %v", err)
	}

	if inviteCode.ID != codeID {
		t.Errorf("CreateInviteCode() ID = %v, want %v", inviteCode.ID, codeID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestCreateInviteCode_CustomCode tests creating invite with custom code
func TestCreateInviteCode_CustomCode(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := admin.NewInvitesService(store)

	creatorID := uuid.New()
	codeID := uuid.New()
	customCode := "CUSTOM123"
	now := time.Now()

	// Expect create invite code (no uniqueness check for custom codes)
	mock.ExpectQuery(`INSERT INTO invite_codes`).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "code", "created_by", "created_at", "last_used_at", "use_count", "max_uses", "expires_at", "disabled", "note"}).
				AddRow(codeID, customCode, creatorID, now, sql.NullTime{}, int32(0), sql.NullInt32{}, sql.NullTime{}, false, sql.NullString{}),
		)

	params := admin.CreateInviteCodeParams{
		Code:      customCode,
		CreatorID: creatorID,
	}

	inviteCode, err := svc.CreateInviteCode(context.Background(), params)
	if err != nil {
		t.Fatalf("CreateInviteCode() error = %v", err)
	}

	if inviteCode.Code != customCode {
		t.Errorf("CreateInviteCode() Code = %v, want %v", inviteCode.Code, customCode)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestCreateInviteCode_WithMaxUses tests creating invite with max uses limit
func TestCreateInviteCode_WithMaxUses(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := admin.NewInvitesService(store)

	creatorID := uuid.New()
	codeID := uuid.New()
	customCode := "LIMITED"
	maxUses := int32(5)
	now := time.Now()

	mock.ExpectQuery(`INSERT INTO invite_codes`).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "code", "created_by", "created_at", "last_used_at", "use_count", "max_uses", "expires_at", "disabled", "note"}).
				AddRow(codeID, customCode, creatorID, now, sql.NullTime{}, int32(0), sql.NullInt32{Valid: true, Int32: maxUses}, sql.NullTime{}, false, sql.NullString{}),
		)

	params := admin.CreateInviteCodeParams{
		Code:      customCode,
		CreatorID: creatorID,
		MaxUses:   &maxUses,
	}

	inviteCode, err := svc.CreateInviteCode(context.Background(), params)
	if err != nil {
		t.Fatalf("CreateInviteCode() error = %v", err)
	}

	if !inviteCode.MaxUses.Valid || inviteCode.MaxUses.Int32 != maxUses {
		t.Errorf("CreateInviteCode() MaxUses = %v, want %d", inviteCode.MaxUses, maxUses)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestCreateInviteCode_WithExpiration tests creating invite with expiration
func TestCreateInviteCode_WithExpiration(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := admin.NewInvitesService(store)

	creatorID := uuid.New()
	codeID := uuid.New()
	customCode := "EXPIRES"
	expiresAt := time.Now().Add(24 * time.Hour)
	now := time.Now()

	mock.ExpectQuery(`INSERT INTO invite_codes`).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "code", "created_by", "created_at", "last_used_at", "use_count", "max_uses", "expires_at", "disabled", "note"}).
				AddRow(codeID, customCode, creatorID, now, sql.NullTime{}, int32(0), sql.NullInt32{}, sql.NullTime{Valid: true, Time: expiresAt}, false, sql.NullString{}),
		)

	params := admin.CreateInviteCodeParams{
		Code:      customCode,
		CreatorID: creatorID,
		ExpiresAt: &expiresAt,
	}

	inviteCode, err := svc.CreateInviteCode(context.Background(), params)
	if err != nil {
		t.Fatalf("CreateInviteCode() error = %v", err)
	}

	if !inviteCode.ExpiresAt.Valid {
		t.Errorf("CreateInviteCode() ExpiresAt.Valid = false, want true")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestValidateInviteCode_Valid tests validating a valid invite code
func TestValidateInviteCode_Valid(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := admin.NewInvitesService(store)

	codeID := uuid.New()
	creatorID := uuid.New()
	code := "VALID123"
	now := time.Now()
	futureExpiry := time.Now().Add(24 * time.Hour)

	mock.ExpectQuery(`SELECT .* FROM invite_codes WHERE code`).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "code", "created_by", "created_at", "last_used_at", "use_count", "max_uses", "expires_at", "disabled", "note"}).
				AddRow(codeID, code, creatorID, now, sql.NullTime{}, int32(0), sql.NullInt32{Valid: true, Int32: 10}, sql.NullTime{Valid: true, Time: futureExpiry}, false, sql.NullString{}),
		)

	inviteCode, err := svc.ValidateInviteCode(context.Background(), code)
	if err != nil {
		t.Fatalf("ValidateInviteCode() error = %v", err)
	}

	if inviteCode.Code != code {
		t.Errorf("ValidateInviteCode() Code = %v, want %v", inviteCode.Code, code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestValidateInviteCode_NotFound tests validating a non-existent invite code
func TestValidateInviteCode_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := admin.NewInvitesService(store)

	mock.ExpectQuery(`SELECT .* FROM invite_codes WHERE code`).
		WillReturnError(sql.ErrNoRows)

	_, err = svc.ValidateInviteCode(context.Background(), "NOTFOUND")
	if err == nil {
		t.Fatal("ValidateInviteCode() error = nil, want error")
	}

	se, ok := err.(*service.Error)
	if !ok || se.Code != "invalid_invite" {
		t.Errorf("ValidateInviteCode() error code = %v, want invalid_invite", se.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestValidateInviteCode_Expired tests validating an expired invite code
func TestValidateInviteCode_Expired(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := admin.NewInvitesService(store)

	codeID := uuid.New()
	creatorID := uuid.New()
	code := "EXPIRED"
	now := time.Now()
	pastExpiry := time.Now().Add(-24 * time.Hour) // Expired yesterday

	mock.ExpectQuery(`SELECT .* FROM invite_codes WHERE code`).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "code", "created_by", "created_at", "last_used_at", "use_count", "max_uses", "expires_at", "disabled", "note"}).
				AddRow(codeID, code, creatorID, now, sql.NullTime{}, int32(0), sql.NullInt32{}, sql.NullTime{Valid: true, Time: pastExpiry}, false, sql.NullString{}),
		)

	_, err = svc.ValidateInviteCode(context.Background(), code)
	if err == nil {
		t.Fatal("ValidateInviteCode() error = nil, want error")
	}

	se, ok := err.(*service.Error)
	if !ok || se.Code != "invite_expired" {
		t.Errorf("ValidateInviteCode() error code = %v, want invite_expired", se.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestValidateInviteCode_Exhausted tests validating an exhausted invite code
func TestValidateInviteCode_Exhausted(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := admin.NewInvitesService(store)

	codeID := uuid.New()
	creatorID := uuid.New()
	code := "EXHAUSTED"
	now := time.Now()
	maxUses := int32(5)

	mock.ExpectQuery(`SELECT .* FROM invite_codes WHERE code`).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "code", "created_by", "created_at", "last_used_at", "use_count", "max_uses", "expires_at", "disabled", "note"}).
				AddRow(codeID, code, creatorID, now, sql.NullTime{}, maxUses, sql.NullInt32{Valid: true, Int32: maxUses}, sql.NullTime{}, false, sql.NullString{}),
		)

	_, err = svc.ValidateInviteCode(context.Background(), code)
	if err == nil {
		t.Fatal("ValidateInviteCode() error = nil, want error")
	}

	se, ok := err.(*service.Error)
	if !ok || se.Code != "invite_exhausted" {
		t.Errorf("ValidateInviteCode() error code = %v, want invite_exhausted", se.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestValidateInviteCode_Disabled tests validating a disabled invite code
func TestValidateInviteCode_Disabled(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := admin.NewInvitesService(store)

	codeID := uuid.New()
	creatorID := uuid.New()
	code := "DISABLED"
	now := time.Now()

	mock.ExpectQuery(`SELECT .* FROM invite_codes WHERE code`).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "code", "created_by", "created_at", "last_used_at", "use_count", "max_uses", "expires_at", "disabled", "note"}).
				AddRow(codeID, code, creatorID, now, sql.NullTime{}, int32(0), sql.NullInt32{}, sql.NullTime{}, true, sql.NullString{}),
		)

	_, err = svc.ValidateInviteCode(context.Background(), code)
	if err == nil {
		t.Fatal("ValidateInviteCode() error = nil, want error")
	}

	se, ok := err.(*service.Error)
	if !ok || se.Code != "invalid_invite" {
		t.Errorf("ValidateInviteCode() error code = %v, want invalid_invite", se.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
