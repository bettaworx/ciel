package admin

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"math/big"
	"net/http"
	"regexp"
	"time"

	"backend/internal/db/sqlc"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/google/uuid"
)

// InvitesService handles invite code operations
type InvitesService struct {
	store *repository.Store
}

// NewInvitesService creates a new InvitesService
func NewInvitesService(store *repository.Store) *InvitesService {
	return &InvitesService{
		store: store,
	}
}

// GenerateInviteCode generates a cryptographically secure random 8-character alphanumeric code
// Character set: a-z, A-Z, 0-9 (62 possible characters)
// Returns codes like: "aB3cD4eF"
func GenerateInviteCode() (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const length = 8

	result := make([]byte, length)
	charsetLen := big.NewInt(int64(len(charset)))

	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, charsetLen)
		if err != nil {
			return "", fmt.Errorf("failed to generate random number: %w", err)
		}
		result[i] = charset[num.Int64()]
	}

	return string(result), nil
}

// ValidateCustomInviteCode validates a custom invite code
// Allowed: a-z, A-Z, 0-9, underscore, hyphen
// Length: 1-32 characters
func ValidateCustomInviteCode(code string) error {
	if len(code) < 1 || len(code) > 32 {
		return fmt.Errorf("invite code must be 1-32 characters, got %d", len(code))
	}

	matched, err := regexp.MatchString(`^[a-zA-Z0-9_-]+$`, code)
	if err != nil {
		return fmt.Errorf("regex error: %w", err)
	}
	if !matched {
		return fmt.Errorf("invite code must contain only alphanumeric characters, underscores, and hyphens")
	}

	return nil
}

// CreateInviteCodeParams contains parameters for creating an invite code
type CreateInviteCodeParams struct {
	Code      string // Optional custom code (empty = auto-generate)
	CreatorID uuid.UUID
	MaxUses   *int32
	ExpiresAt *time.Time
	Note      string
}

// CreateInviteCode creates a new invite code with optional limits
func (s *InvitesService) CreateInviteCode(ctx context.Context, params CreateInviteCodeParams) (sqlc.InviteCode, error) {
	var code string
	var err error

	// If custom code provided, validate and use it
	if params.Code != "" {
		if err := ValidateCustomInviteCode(params.Code); err != nil {
			return sqlc.InviteCode{}, fmt.Errorf("invalid custom invite code: %w", err)
		}
		code = params.Code
	} else {
		// Auto-generate unique code with retry logic
		maxAttempts := 10
		for attempt := 0; attempt < maxAttempts; attempt++ {
			code, err = GenerateInviteCode()
			if err != nil {
				return sqlc.InviteCode{}, fmt.Errorf("failed to generate invite code: %w", err)
			}

			// Check if code already exists
			_, err := s.store.Q.GetInviteCodeByCode(ctx, code)
			if err == sql.ErrNoRows {
				// Code is unique, use it
				break
			}
			if err != nil {
				return sqlc.InviteCode{}, fmt.Errorf("failed to check code uniqueness: %w", err)
			}
			// Code exists, retry
			if attempt == maxAttempts-1 {
				return sqlc.InviteCode{}, fmt.Errorf("failed to generate unique code after %d attempts", maxAttempts)
			}
		}
	}

	// Prepare parameters
	var maxUses sql.NullInt32
	if params.MaxUses != nil {
		maxUses = sql.NullInt32{Int32: *params.MaxUses, Valid: true}
	}

	var expiresAt sql.NullTime
	if params.ExpiresAt != nil {
		expiresAt = sql.NullTime{Time: *params.ExpiresAt, Valid: true}
	}

	// Create invite code
	inviteCode, err := s.store.Q.CreateInviteCode(ctx, sqlc.CreateInviteCodeParams{
		Code:      code,
		CreatedBy: params.CreatorID,
		MaxUses:   maxUses,
		ExpiresAt: expiresAt,
		Note: sql.NullString{
			String: params.Note,
			Valid:  params.Note != "",
		},
	})

	if err != nil {
		// Check if duplicate key error (custom code already exists)
		if isDuplicateKeyError(err) {
			return sqlc.InviteCode{}, service.NewError(http.StatusConflict, "duplicate_code", "invite code already exists")
		}
		return sqlc.InviteCode{}, fmt.Errorf("failed to create invite code: %w", err)
	}

	return inviteCode, nil
}

// ValidateInviteCode checks if an invite code is valid and usable
// Returns the invite code if valid, or an error if:
// - Code doesn't exist or is disabled
// - Code has expired
// - Code has reached maximum uses
func (s *InvitesService) ValidateInviteCode(ctx context.Context, code string) (sqlc.InviteCode, error) {
	inviteCode, err := s.store.Q.GetInviteCodeByCode(ctx, code)
	if err != nil {
		if err == sql.ErrNoRows {
			return sqlc.InviteCode{}, service.NewError(http.StatusForbidden, "invalid_invite", "invalid or expired invite code")
		}
		return sqlc.InviteCode{}, fmt.Errorf("failed to get invite code: %w", err)
	}

	// Check if disabled (GetInviteCodeByCode already filters disabled=false, but double-check)
	if inviteCode.Disabled {
		return sqlc.InviteCode{}, service.NewError(http.StatusForbidden, "invalid_invite", "invite code has been disabled")
	}

	// Check expiration
	if inviteCode.ExpiresAt.Valid && inviteCode.ExpiresAt.Time.Before(time.Now()) {
		return sqlc.InviteCode{}, service.NewError(http.StatusForbidden, "invite_expired", "invite code has expired")
	}

	// Check max uses
	if inviteCode.MaxUses.Valid && inviteCode.UseCount >= inviteCode.MaxUses.Int32 {
		return sqlc.InviteCode{}, service.NewError(http.StatusForbidden, "invite_exhausted", "invite code has reached maximum uses")
	}

	return inviteCode, nil
}

// UseInviteCode records usage of an invite code and increments the use count
func (s *InvitesService) UseInviteCode(ctx context.Context, inviteCodeID uuid.UUID, userID uuid.UUID) error {
	// Record usage in history table
	_, err := s.store.Q.RecordInviteCodeUse(ctx, sqlc.RecordInviteCodeUseParams{
		InviteCodeID: inviteCodeID,
		UserID:       userID,
	})
	if err != nil {
		return fmt.Errorf("failed to record invite code use: %w", err)
	}

	// Increment use count
	err = s.store.Q.UpdateInviteCodeUsage(ctx, inviteCodeID)
	if err != nil {
		return fmt.Errorf("failed to update invite code usage: %w", err)
	}

	return nil
}

// ListInviteCodesResult contains invite codes with creator information
type ListInviteCodesResult struct {
	Invites []sqlc.ListInviteCodesRow
	Total   int64
}

// ListInviteCodes returns a paginated list of invite codes with creator information
func (s *InvitesService) ListInviteCodes(ctx context.Context, limit, offset int32) (ListInviteCodesResult, error) {
	invites, err := s.store.Q.ListInviteCodes(ctx, sqlc.ListInviteCodesParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return ListInviteCodesResult{}, fmt.Errorf("failed to list invite codes: %w", err)
	}

	total, err := s.store.Q.CountInviteCodes(ctx)
	if err != nil {
		return ListInviteCodesResult{}, fmt.Errorf("failed to count invite codes: %w", err)
	}

	return ListInviteCodesResult{
		Invites: invites,
		Total:   total,
	}, nil
}

// GetInviteCode gets a single invite code by ID
func (s *InvitesService) GetInviteCode(ctx context.Context, codeID uuid.UUID) (sqlc.InviteCode, error) {
	inviteCode, err := s.store.Q.GetInviteCodeByID(ctx, codeID)
	if err != nil {
		if err == sql.ErrNoRows {
			return sqlc.InviteCode{}, service.NewError(http.StatusNotFound, "not_found", "invite code not found")
		}
		return sqlc.InviteCode{}, fmt.Errorf("failed to get invite code: %w", err)
	}
	return inviteCode, nil
}

// UpdateInviteCodeParams contains parameters for updating an invite code
type UpdateInviteCodeParams struct {
	ID        uuid.UUID
	Code      *string
	MaxUses   *int32
	ExpiresAt *time.Time
	Note      *string
}

// UpdateInviteCode updates an existing invite code
func (s *InvitesService) UpdateInviteCode(ctx context.Context, params UpdateInviteCodeParams) (sqlc.InviteCode, error) {
	// Validate custom code if provided
	if params.Code != nil && *params.Code != "" {
		if err := ValidateCustomInviteCode(*params.Code); err != nil {
			return sqlc.InviteCode{}, service.NewError(http.StatusBadRequest, "invalid_code", fmt.Sprintf("invalid invite code: %v", err))
		}
	}

	// Validate expiration date if provided
	if params.ExpiresAt != nil && params.ExpiresAt.Before(time.Now()) {
		return sqlc.InviteCode{}, service.NewError(http.StatusBadRequest, "invalid_expiration", "expiration date must be in the future")
	}

	// Prepare nullable parameters
	var code sql.NullString
	if params.Code != nil {
		code = sql.NullString{String: *params.Code, Valid: true}
	}

	var maxUses sql.NullInt32
	if params.MaxUses != nil {
		maxUses = sql.NullInt32{Int32: *params.MaxUses, Valid: true}
	}

	var expiresAt sql.NullTime
	if params.ExpiresAt != nil {
		expiresAt = sql.NullTime{Time: *params.ExpiresAt, Valid: true}
	}

	var note sql.NullString
	if params.Note != nil {
		note = sql.NullString{String: *params.Note, Valid: true}
	}

	// Update invite code
	inviteCode, err := s.store.Q.UpdateInviteCode(ctx, sqlc.UpdateInviteCodeParams{
		ID:        params.ID,
		Code:      code,
		MaxUses:   maxUses,
		ExpiresAt: expiresAt,
		Note:      note,
	})

	if err != nil {
		if err == sql.ErrNoRows {
			return sqlc.InviteCode{}, service.NewError(http.StatusNotFound, "not_found", "invite code not found")
		}
		// Check if duplicate key error (code already exists)
		if isDuplicateKeyError(err) {
			return sqlc.InviteCode{}, service.NewError(http.StatusConflict, "duplicate_code", "invite code already exists")
		}
		return sqlc.InviteCode{}, fmt.Errorf("failed to update invite code: %w", err)
	}

	return inviteCode, nil
}

// DisableInviteCode soft-deletes an invite code by marking it as disabled
func (s *InvitesService) DisableInviteCode(ctx context.Context, codeID uuid.UUID) error {
	err := s.store.Q.DisableInviteCode(ctx, codeID)
	if err != nil {
		return fmt.Errorf("failed to disable invite code: %w", err)
	}
	return nil
}

// DeleteInviteCode permanently deletes an invite code
func (s *InvitesService) DeleteInviteCode(ctx context.Context, codeID uuid.UUID) error {
	err := s.store.Q.DeleteInviteCode(ctx, codeID)
	if err != nil {
		return fmt.Errorf("failed to delete invite code: %w", err)
	}
	return nil
}

// GetInviteCodeUsageHistory returns the usage history for an invite code
func (s *InvitesService) GetInviteCodeUsageHistory(ctx context.Context, codeID uuid.UUID) ([]sqlc.GetInviteCodeUsageHistoryRow, error) {
	history, err := s.store.Q.GetInviteCodeUsageHistory(ctx, codeID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invite code usage history: %w", err)
	}
	return history, nil
}

// isDuplicateKeyError checks if the error is a PostgreSQL unique constraint violation
func isDuplicateKeyError(err error) bool {
	// Check for pgx error with code 23505 (unique_violation)
	if err == nil {
		return false
	}
	// Simple string check for "duplicate key" or "already exists"
	errStr := err.Error()
	return contains(errStr, "duplicate key") || contains(errStr, "unique constraint")
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || containsMiddle(s, substr)))
}

func containsMiddle(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
