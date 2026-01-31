package moderation

import (
	"context"
	"database/sql"
	"fmt"

	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

// MediaService handles media moderation operations
type MediaService struct {
	store       *repository.Store
	logsService *LogsService
}

// NewMediaService creates a new MediaService
func NewMediaService(store *repository.Store, logsService *LogsService) *MediaService {
	return &MediaService{
		store:       store,
		logsService: logsService,
	}
}

// ListMediaParams contains parameters for listing media
type ListMediaParams struct {
	UserID  *uuid.UUID
	Deleted *bool
	Limit   int32
	Offset  int32
}

// ListMediaResult contains media with pagination info
type ListMediaResult struct {
	Media []sqlc.AdminListMediaRow
	Total int64
}

// ListMedia returns a paginated list of media with filtering
func (s *MediaService) ListMedia(ctx context.Context, params ListMediaParams) (ListMediaResult, error) {
	// Prepare nullable parameters
	var userID uuid.NullUUID
	if params.UserID != nil {
		userID = uuid.NullUUID{UUID: *params.UserID, Valid: true}
	}

	var deleted sql.NullBool
	if params.Deleted != nil {
		deleted = sql.NullBool{Bool: *params.Deleted, Valid: true}
	}

	// Get media
	media, err := s.store.Q.AdminListMedia(ctx, sqlc.AdminListMediaParams{
		UserID:  userID,
		Deleted: deleted,
		Limit:   params.Limit,
		Offset:  params.Offset,
	})
	if err != nil {
		return ListMediaResult{}, fmt.Errorf("failed to list media: %w", err)
	}

	// Get total count
	total, err := s.store.Q.CountAdminMedia(ctx, sqlc.CountAdminMediaParams{
		UserID:  userID,
		Deleted: deleted,
	})
	if err != nil {
		return ListMediaResult{}, fmt.Errorf("failed to count media: %w", err)
	}

	return ListMediaResult{
		Media: media,
		Total: total,
	}, nil
}

// DeleteMedia soft-deletes a media item
func (s *MediaService) DeleteMedia(ctx context.Context, mediaID, deletedBy uuid.UUID, reason string) error {
	// Prepare nullable parameters
	var deletionReason sql.NullString
	if reason != "" {
		deletionReason = sql.NullString{String: reason, Valid: true}
	}

	err := s.store.Q.AdminDeleteMedia(ctx, sqlc.AdminDeleteMediaParams{
		ID:             mediaID,
		DeletedBy:      uuid.NullUUID{UUID: deletedBy, Valid: true},
		DeletionReason: deletionReason,
	})
	if err != nil {
		return fmt.Errorf("failed to delete media: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: deletedBy,
		Action:      "delete_media",
		TargetType:  "media",
		TargetID:    mediaID.String(),
		Details:     reason,
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log media deletion: %v\n", err)
	}

	return nil
}
