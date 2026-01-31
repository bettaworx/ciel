package moderation

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

// MutesService handles user mute operations
type MutesService struct {
	store       *repository.Store
	logsService *LogsService
}

// NewMutesService creates a new MutesService
func NewMutesService(store *repository.Store, logsService *LogsService) *MutesService {
	return &MutesService{
		store:       store,
		logsService: logsService,
	}
}

// CreateUserMuteParams contains parameters for creating a user mute
type CreateUserMuteParams struct {
	UserID    uuid.UUID
	MuteType  string
	MutedBy   uuid.UUID
	Reason    string
	ExpiresAt *time.Time
}

// CreateUserMute creates a new mute for a user
func (s *MutesService) CreateUserMute(ctx context.Context, params CreateUserMuteParams) (sqlc.UserMute, error) {
	// Prepare nullable parameters
	var reason sql.NullString
	if params.Reason != "" {
		reason = sql.NullString{String: params.Reason, Valid: true}
	}

	var expiresAt sql.NullTime
	if params.ExpiresAt != nil {
		expiresAt = sql.NullTime{Time: *params.ExpiresAt, Valid: true}
	}

	// Create mute
	mute, err := s.store.Q.CreateUserMute(ctx, sqlc.CreateUserMuteParams{
		UserID:    params.UserID,
		MuteType:  params.MuteType,
		MutedBy:   params.MutedBy,
		Reason:    reason,
		ExpiresAt: expiresAt,
	})
	if err != nil {
		return sqlc.UserMute{}, fmt.Errorf("failed to create user mute: %w", err)
	}

	// Log the action
	details := fmt.Sprintf("type=%s reason=%s", params.MuteType, params.Reason)
	if params.ExpiresAt != nil {
		details += fmt.Sprintf(" expires=%s", params.ExpiresAt.Format(time.RFC3339))
	}

	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: params.MutedBy,
		Action:      "create_mute",
		TargetType:  "user",
		TargetID:    params.UserID.String(),
		Details:     details,
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log mute creation: %v\n", err)
	}

	return mute, nil
}

// GetUserMutes returns all active mutes for a user
func (s *MutesService) GetUserMutes(ctx context.Context, userID uuid.UUID) ([]sqlc.UserMute, error) {
	mutes, err := s.store.Q.GetUserMutes(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user mutes: %w", err)
	}

	return mutes, nil
}

// GetUserMutesByType returns active mutes of a specific type for a user
func (s *MutesService) GetUserMutesByType(ctx context.Context, userID uuid.UUID, muteType string) ([]sqlc.UserMute, error) {
	mutes, err := s.store.Q.GetUserMutesByType(ctx, sqlc.GetUserMutesByTypeParams{
		UserID:   userID,
		MuteType: muteType,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get user mutes by type: %w", err)
	}

	return mutes, nil
}

// CheckUserMuted checks if a user is currently muted for a specific type
func (s *MutesService) CheckUserMuted(ctx context.Context, userID uuid.UUID, muteType string) (bool, error) {
	isMuted, err := s.store.Q.CheckUserMuted(ctx, sqlc.CheckUserMutedParams{
		UserID:   userID,
		MuteType: muteType,
	})
	if err != nil {
		return false, fmt.Errorf("failed to check user muted: %w", err)
	}

	return isMuted, nil
}

// DeleteUserMutes removes all mutes for a user
func (s *MutesService) DeleteUserMutes(ctx context.Context, userID, adminUserID uuid.UUID) error {
	err := s.store.Q.DeleteUserMutes(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user mutes: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: adminUserID,
		Action:      "delete_all_mutes",
		TargetType:  "user",
		TargetID:    userID.String(),
		Details:     "removed all mutes",
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log mute deletion: %v\n", err)
	}

	return nil
}

// DeleteUserMutesByType removes mutes of a specific type for a user
func (s *MutesService) DeleteUserMutesByType(ctx context.Context, userID uuid.UUID, muteType string, adminUserID uuid.UUID) error {
	err := s.store.Q.DeleteUserMutesByType(ctx, sqlc.DeleteUserMutesByTypeParams{
		UserID:   userID,
		MuteType: muteType,
	})
	if err != nil {
		return fmt.Errorf("failed to delete user mutes by type: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: adminUserID,
		Action:      "delete_mute",
		TargetType:  "user",
		TargetID:    userID.String(),
		Details:     fmt.Sprintf("removed mute type=%s", muteType),
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log mute deletion: %v\n", err)
	}

	return nil
}

// CleanupExpiredMutes removes all expired mutes
func (s *MutesService) CleanupExpiredMutes(ctx context.Context) error {
	err := s.store.Q.CleanupExpiredMutes(ctx)
	if err != nil {
		return fmt.Errorf("failed to cleanup expired mutes: %w", err)
	}

	return nil
}
