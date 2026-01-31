package admin

import (
	"context"
	"database/sql"
	"fmt"

	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

// UsersService handles admin user management operations
type UsersService struct {
	store *repository.Store
}

// NewUsersService creates a new UsersService
func NewUsersService(store *repository.Store) *UsersService {
	return &UsersService{
		store: store,
	}
}

// SearchUsersParams contains parameters for searching users
type SearchUsersParams struct {
	Search string  // Search term for username or display name
	Sort   *string // Sort order: created_asc, username_asc, username_desc
	Limit  int32
	Offset int32
}

// SearchUsersResult contains search results with pagination info
type SearchUsersResult struct {
	Users []sqlc.User
	Total int64
}

// SearchUsers searches users by username or display name with pagination
func (s *UsersService) SearchUsers(ctx context.Context, params SearchUsersParams) (SearchUsersResult, error) {
	// Prepare nullable parameters
	var search sql.NullString
	if params.Search != "" {
		search = sql.NullString{String: params.Search, Valid: true}
	}

	var sort sql.NullString
	if params.Sort != nil {
		sort = sql.NullString{String: *params.Sort, Valid: true}
	}

	// Get users
	users, err := s.store.Q.SearchUsers(ctx, sqlc.SearchUsersParams{
		Search: search,
		Sort:   sort,
		Limit:  params.Limit,
		Offset: params.Offset,
	})
	if err != nil {
		return SearchUsersResult{}, fmt.Errorf("failed to search users: %w", err)
	}

	// Get total count
	total, err := s.store.Q.CountUsers(ctx, search)
	if err != nil {
		return SearchUsersResult{}, fmt.Errorf("failed to count users: %w", err)
	}

	return SearchUsersResult{
		Users: users,
		Total: total,
	}, nil
}

// UserStats contains statistics about a user
type UserStats struct {
	PostsCount   int64
	MediaCount   int64
	ReportsCount int64
}

// GetUserStats returns statistics for a specific user
func (s *UsersService) GetUserStats(ctx context.Context, userID uuid.UUID) (UserStats, error) {
	stats, err := s.store.Q.GetUserStats(ctx, userID)
	if err != nil {
		return UserStats{}, fmt.Errorf("failed to get user stats: %w", err)
	}

	return UserStats{
		PostsCount:   stats.PostsCount,
		MediaCount:   stats.MediaCount,
		ReportsCount: stats.ReportsCount,
	}, nil
}

// GetAdminUserNote retrieves the admin note for a user
func (s *UsersService) GetAdminUserNote(ctx context.Context, userID uuid.UUID) (sqlc.AdminUserNote, error) {
	note, err := s.store.Q.GetAdminUserNote(ctx, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			// No note exists, return empty note
			return sqlc.AdminUserNote{}, nil
		}
		return sqlc.AdminUserNote{}, fmt.Errorf("failed to get admin user note: %w", err)
	}

	return note, nil
}

// CreateAdminUserNoteParams contains parameters for creating an admin user note
type CreateAdminUserNoteParams struct {
	UserID    uuid.UUID
	Content   string
	CreatedBy uuid.UUID
}

// CreateAdminUserNote creates a new admin note for a user
func (s *UsersService) CreateAdminUserNote(ctx context.Context, params CreateAdminUserNoteParams) (sqlc.AdminUserNote, error) {
	note, err := s.store.Q.CreateAdminUserNote(ctx, sqlc.CreateAdminUserNoteParams{
		UserID:    params.UserID,
		Content:   params.Content,
		CreatedBy: params.CreatedBy,
	})
	if err != nil {
		return sqlc.AdminUserNote{}, fmt.Errorf("failed to create admin user note: %w", err)
	}

	return note, nil
}

// UpdateAdminUserNoteParams contains parameters for updating an admin user note
type UpdateAdminUserNoteParams struct {
	UserID    uuid.UUID
	Content   string
	UpdatedBy uuid.UUID
}

// UpdateAdminUserNote updates an existing admin note for a user
func (s *UsersService) UpdateAdminUserNote(ctx context.Context, params UpdateAdminUserNoteParams) (sqlc.AdminUserNote, error) {
	note, err := s.store.Q.UpdateAdminUserNote(ctx, sqlc.UpdateAdminUserNoteParams{
		UserID:    params.UserID,
		Content:   params.Content,
		UpdatedBy: params.UpdatedBy,
	})
	if err != nil {
		return sqlc.AdminUserNote{}, fmt.Errorf("failed to update admin user note: %w", err)
	}

	return note, nil
}

// DeleteAdminUserNote deletes an admin note for a user
func (s *UsersService) DeleteAdminUserNote(ctx context.Context, userID uuid.UUID) error {
	err := s.store.Q.DeleteAdminUserNote(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to delete admin user note: %w", err)
	}

	return nil
}
