package moderation

import (
	"context"
	"database/sql"
	"fmt"

	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

// BannedContentService handles banned words and image hashes
type BannedContentService struct {
	store       *repository.Store
	logsService *LogsService
}

// NewBannedContentService creates a new BannedContentService
func NewBannedContentService(store *repository.Store, logsService *LogsService) *BannedContentService {
	return &BannedContentService{
		store:       store,
		logsService: logsService,
	}
}

// ========== Banned Words ==========

// CreateBannedWordParams contains parameters for creating a banned word
type CreateBannedWordParams struct {
	Pattern   string
	AppliesTo string
	Severity  string
	CreatedBy uuid.UUID
}

// CreateBannedWord creates a new banned word pattern
func (s *BannedContentService) CreateBannedWord(ctx context.Context, params CreateBannedWordParams) (sqlc.BannedWord, error) {
	word, err := s.store.Q.CreateBannedWord(ctx, sqlc.CreateBannedWordParams{
		Pattern:   params.Pattern,
		AppliesTo: params.AppliesTo,
		Severity:  params.Severity,
		CreatedBy: params.CreatedBy,
	})
	if err != nil {
		return sqlc.BannedWord{}, fmt.Errorf("failed to create banned word: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: params.CreatedBy,
		Action:      "create_banned_word",
		TargetType:  "banned_word",
		TargetID:    word.ID.String(),
		Details:     fmt.Sprintf("pattern=%s applies_to=%s severity=%s", params.Pattern, params.AppliesTo, params.Severity),
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log banned word creation: %v\n", err)
	}

	return word, nil
}

// ListBannedWords returns all banned words, optionally filtered by applies_to
func (s *BannedContentService) ListBannedWords(ctx context.Context, appliesTo *string) ([]sqlc.BannedWord, error) {
	var appliesParam sql.NullString
	if appliesTo != nil {
		appliesParam = sql.NullString{String: *appliesTo, Valid: true}
	}

	words, err := s.store.Q.ListBannedWords(ctx, appliesParam)
	if err != nil {
		return nil, fmt.Errorf("failed to list banned words: %w", err)
	}

	return words, nil
}

// GetBannedWord retrieves a banned word by ID
func (s *BannedContentService) GetBannedWord(ctx context.Context, id uuid.UUID) (sqlc.BannedWord, error) {
	word, err := s.store.Q.GetBannedWord(ctx, id)
	if err != nil {
		return sqlc.BannedWord{}, fmt.Errorf("failed to get banned word: %w", err)
	}

	return word, nil
}

// DeleteBannedWord removes a banned word pattern
func (s *BannedContentService) DeleteBannedWord(ctx context.Context, id, adminUserID uuid.UUID) error {
	err := s.store.Q.DeleteBannedWord(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete banned word: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: adminUserID,
		Action:      "delete_banned_word",
		TargetType:  "banned_word",
		TargetID:    id.String(),
		Details:     "removed banned word pattern",
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log banned word deletion: %v\n", err)
	}

	return nil
}

// ========== Banned Image Hashes ==========

// CreateBannedImageHashParams contains parameters for creating a banned image hash
type CreateBannedImageHashParams struct {
	Hash      string
	HashType  string
	Reason    string
	CreatedBy uuid.UUID
}

// CreateBannedImageHash creates a new banned image hash
func (s *BannedContentService) CreateBannedImageHash(ctx context.Context, params CreateBannedImageHashParams) (sqlc.BannedImageHash, error) {
	// Prepare nullable parameters
	var reason sql.NullString
	if params.Reason != "" {
		reason = sql.NullString{String: params.Reason, Valid: true}
	}

	hash, err := s.store.Q.CreateBannedImageHash(ctx, sqlc.CreateBannedImageHashParams{
		Hash:      params.Hash,
		HashType:  params.HashType,
		Reason:    reason,
		CreatedBy: params.CreatedBy,
	})
	if err != nil {
		return sqlc.BannedImageHash{}, fmt.Errorf("failed to create banned image hash: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: params.CreatedBy,
		Action:      "create_banned_image_hash",
		TargetType:  "banned_image_hash",
		TargetID:    hash.ID.String(),
		Details:     fmt.Sprintf("hash_type=%s reason=%s", params.HashType, params.Reason),
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log banned image hash creation: %v\n", err)
	}

	return hash, nil
}

// ListBannedImageHashes returns all banned image hashes
func (s *BannedContentService) ListBannedImageHashes(ctx context.Context) ([]sqlc.BannedImageHash, error) {
	hashes, err := s.store.Q.ListBannedImageHashes(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list banned image hashes: %w", err)
	}

	return hashes, nil
}

// GetBannedImageHash retrieves a banned image hash by ID
func (s *BannedContentService) GetBannedImageHash(ctx context.Context, id uuid.UUID) (sqlc.BannedImageHash, error) {
	hash, err := s.store.Q.GetBannedImageHash(ctx, id)
	if err != nil {
		return sqlc.BannedImageHash{}, fmt.Errorf("failed to get banned image hash: %w", err)
	}

	return hash, nil
}

// CheckImageHashBanned checks if an image hash is banned
func (s *BannedContentService) CheckImageHashBanned(ctx context.Context, hash, hashType string) (bool, error) {
	isBanned, err := s.store.Q.CheckImageHashBanned(ctx, sqlc.CheckImageHashBannedParams{
		Hash:     hash,
		HashType: hashType,
	})
	if err != nil {
		return false, fmt.Errorf("failed to check image hash banned: %w", err)
	}

	return isBanned, nil
}

// DeleteBannedImageHash removes a banned image hash
func (s *BannedContentService) DeleteBannedImageHash(ctx context.Context, id, adminUserID uuid.UUID) error {
	err := s.store.Q.DeleteBannedImageHash(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete banned image hash: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: adminUserID,
		Action:      "delete_banned_image_hash",
		TargetType:  "banned_image_hash",
		TargetID:    id.String(),
		Details:     "removed banned image hash",
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log banned image hash deletion: %v\n", err)
	}

	return nil
}
