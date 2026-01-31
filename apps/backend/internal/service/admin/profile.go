package admin

import (
	"context"
	"fmt"

	"backend/internal/repository"
	"backend/internal/service/moderation"

	"github.com/google/uuid"
)

// ProfileService handles admin profile management operations
type ProfileService struct {
	store       *repository.Store
	logsService *moderation.LogsService
}

// NewProfileService creates a new ProfileService
func NewProfileService(store *repository.Store, logsService *moderation.LogsService) *ProfileService {
	return &ProfileService{
		store:       store,
		logsService: logsService,
	}
}

// DeleteUserAvatar removes a user's avatar
func (s *ProfileService) DeleteUserAvatar(ctx context.Context, userID, adminUserID uuid.UUID, reason string) error {
	err := s.store.Q.AdminDeleteUserAvatar(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user avatar: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, moderation.CreateLogParams{
		AdminUserID: adminUserID,
		Action:      "delete_avatar",
		TargetType:  "user",
		TargetID:    userID.String(),
		Details:     reason,
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log avatar deletion: %v\n", err)
	}

	return nil
}

// DeleteUserDisplayName removes a user's display name
func (s *ProfileService) DeleteUserDisplayName(ctx context.Context, userID, adminUserID uuid.UUID, reason string) error {
	err := s.store.Q.AdminDeleteUserDisplayName(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user display name: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, moderation.CreateLogParams{
		AdminUserID: adminUserID,
		Action:      "delete_display_name",
		TargetType:  "user",
		TargetID:    userID.String(),
		Details:     reason,
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log display name deletion: %v\n", err)
	}

	return nil
}

// DeleteUserBio removes a user's bio
func (s *ProfileService) DeleteUserBio(ctx context.Context, userID, adminUserID uuid.UUID, reason string) error {
	err := s.store.Q.AdminDeleteUserBio(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user bio: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, moderation.CreateLogParams{
		AdminUserID: adminUserID,
		Action:      "delete_bio",
		TargetType:  "user",
		TargetID:    userID.String(),
		Details:     reason,
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log bio deletion: %v\n", err)
	}

	return nil
}
