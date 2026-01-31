package moderation

import (
	"context"
	"database/sql"
	"fmt"

	"backend/internal/api"
	"backend/internal/db/sqlc"
	"backend/internal/realtime"
	"backend/internal/repository"

	"github.com/google/uuid"
)

// PostsService handles post moderation operations
type PostsService struct {
	store       *repository.Store
	logsService *LogsService
	publisher   realtime.Publisher
}

// NewPostsService creates a new PostsService
func NewPostsService(store *repository.Store, logsService *LogsService) *PostsService {
	return &PostsService{
		store:       store,
		logsService: logsService,
		publisher:   nil,
	}
}

// NewPostsServiceWithPublisher creates a new PostsService with realtime publishing.
func NewPostsServiceWithPublisher(store *repository.Store, logsService *LogsService, publisher realtime.Publisher) *PostsService {
	return &PostsService{
		store:       store,
		logsService: logsService,
		publisher:   publisher,
	}
}

// ListPostsParams contains parameters for listing posts
type ListPostsParams struct {
	UserID     *uuid.UUID
	Visibility *string
	Limit      int32
	Offset     int32
}

// ListPostsResult contains posts with pagination info
type ListPostsResult struct {
	Posts []sqlc.AdminListPostsRow
	Total int64
}

// ListPosts returns a paginated list of posts with filtering
func (s *PostsService) ListPosts(ctx context.Context, params ListPostsParams) (ListPostsResult, error) {
	// Prepare nullable parameters
	var userID uuid.NullUUID
	if params.UserID != nil {
		userID = uuid.NullUUID{UUID: *params.UserID, Valid: true}
	}

	var visibility sql.NullString
	if params.Visibility != nil {
		visibility = sql.NullString{String: *params.Visibility, Valid: true}
	}

	// Get posts
	posts, err := s.store.Q.AdminListPosts(ctx, sqlc.AdminListPostsParams{
		UserID:     userID,
		Visibility: visibility,
		Limit:      params.Limit,
		Offset:     params.Offset,
	})
	if err != nil {
		return ListPostsResult{}, fmt.Errorf("failed to list posts: %w", err)
	}

	// Get total count
	total, err := s.store.Q.CountAdminPosts(ctx, sqlc.CountAdminPostsParams{
		UserID:     userID,
		Visibility: visibility,
	})
	if err != nil {
		return ListPostsResult{}, fmt.Errorf("failed to count posts: %w", err)
	}

	return ListPostsResult{
		Posts: posts,
		Total: total,
	}, nil
}

// DeletePost soft-deletes a post
func (s *PostsService) DeletePost(ctx context.Context, postID, deletedBy uuid.UUID, reason string) error {
	// Prepare nullable parameters
	var deletionReason sql.NullString
	if reason != "" {
		deletionReason = sql.NullString{String: reason, Valid: true}
	}

	err := s.store.Q.AdminDeletePost(ctx, sqlc.AdminDeletePostParams{
		ID:             postID,
		DeletedBy:      uuid.NullUUID{UUID: deletedBy, Valid: true},
		DeletionReason: deletionReason,
	})
	if err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}
	if s.publisher != nil {
		pid := apiPostId(postID)
		_ = s.publisher.Publish(ctx, realtime.Event{Type: realtime.EventPostDeleted, PostId: &pid})
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: deletedBy,
		Action:      "delete_post",
		TargetType:  "post",
		TargetID:    postID.String(),
		Details:     reason,
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log post deletion: %v\n", err)
	}

	return nil
}

func apiPostId(id uuid.UUID) api.PostId {
	return api.PostId(id)
}

// HidePost sets a post's visibility to hidden
func (s *PostsService) HidePost(ctx context.Context, postID, adminUserID uuid.UUID) error {
	err := s.store.Q.HidePost(ctx, postID)
	if err != nil {
		return fmt.Errorf("failed to hide post: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: adminUserID,
		Action:      "hide_post",
		TargetType:  "post",
		TargetID:    postID.String(),
		Details:     "set visibility to hidden",
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log post hide: %v\n", err)
	}

	return nil
}

// UnhidePost restores a post's visibility to public
func (s *PostsService) UnhidePost(ctx context.Context, postID, adminUserID uuid.UUID) error {
	err := s.store.Q.UnhidePost(ctx, postID)
	if err != nil {
		return fmt.Errorf("failed to unhide post: %w", err)
	}

	// Log the action
	_, err = s.logsService.CreateLog(ctx, CreateLogParams{
		AdminUserID: adminUserID,
		Action:      "unhide_post",
		TargetType:  "post",
		TargetID:    postID.String(),
		Details:     "restored visibility to public",
	})
	if err != nil {
		// Log error but don't fail the operation
		fmt.Printf("warning: failed to log post unhide: %v\n", err)
	}

	return nil
}
