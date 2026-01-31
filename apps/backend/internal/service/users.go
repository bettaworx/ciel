package service

import (
	"context"
	"database/sql"
	"net/http"
	"strings"

	"backend/internal/api"
	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

type UsersService struct {
	store *repository.Store
}

func NewUsersService(store *repository.Store) *UsersService {
	return &UsersService{store: store}
}

func (s *UsersService) GetByUsername(ctx context.Context, username api.Username) (api.User, error) {
	if s.store == nil {
		return api.User{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	uname := strings.TrimSpace(string(username))
	if uname == "" {
		return api.User{}, NewError(http.StatusBadRequest, "invalid_request", "username required")
	}
	user, err := s.store.Q.GetUserByUsername(ctx, uname)
	if err != nil {
		if err == sql.ErrNoRows {
			return api.User{}, NewError(http.StatusNotFound, "not_found", "user not found")
		}
		return api.User{}, err
	}
	return mapUserWithProfile(user.ID, user.Username, user.CreatedAt, user.DisplayName, user.Bio, user.AvatarMediaID, user.AvatarExt, user.TermsVersion, user.PrivacyVersion, user.TermsAcceptedAt, user.PrivacyAcceptedAt), nil
}

func (s *UsersService) GetByID(ctx context.Context, userID uuid.UUID) (api.User, error) {
	if s.store == nil {
		return api.User{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	row, err := s.store.Q.GetUserByID(ctx, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return api.User{}, NewError(http.StatusNotFound, "not_found", "user not found")
		}
		return api.User{}, err
	}
	return mapUserWithProfile(row.ID, row.Username, row.CreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, row.TermsVersion, row.PrivacyVersion, row.TermsAcceptedAt, row.PrivacyAcceptedAt), nil
}

func (s *UsersService) UpdateProfile(ctx context.Context, userID uuid.UUID, displayName *string, bio *string) (api.User, error) {
	if s.store == nil {
		return api.User{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if displayName == nil && bio == nil {
		return api.User{}, NewError(http.StatusBadRequest, "invalid_request", "displayName or bio required")
	}

	params := sqlc.UpdateUserProfileParams{ID: userID}
	if displayName != nil {
		cleaned := sanitizeDisplayName(*displayName)
		if err := validateProfileLength(cleaned, maxDisplayNameLen, "displayName"); err != nil {
			return api.User{}, err
		}
		params.DisplayName = sql.NullString{String: cleaned, Valid: true}
	}
	if bio != nil {
		cleaned := sanitizeBio(*bio)
		if err := validateProfileLength(cleaned, maxBioLen, "bio"); err != nil {
			return api.User{}, err
		}
		params.Bio = sql.NullString{String: cleaned, Valid: true}
	}

	row, err := s.store.Q.UpdateUserProfile(ctx, params)
	if err != nil {
		if err == sql.ErrNoRows {
			return api.User{}, NewError(http.StatusNotFound, "not_found", "user not found")
		}
		return api.User{}, err
	}
	return mapUserWithProfile(row.ID, row.Username, row.CreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, sql.NullString{}, row.TermsVersion, row.PrivacyVersion, row.TermsAcceptedAt, row.PrivacyAcceptedAt), nil
}

func (s *UsersService) UpdateAvatar(ctx context.Context, userID uuid.UUID, avatarMediaID uuid.UUID) (api.User, *uuid.UUID, error) {
	if s.store == nil {
		return api.User{}, nil, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	row, err := s.store.Q.UpdateUserAvatar(ctx, sqlc.UpdateUserAvatarParams{
		ID:            userID,
		AvatarMediaID: uuid.NullUUID{UUID: avatarMediaID, Valid: true},
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return api.User{}, nil, NewError(http.StatusNotFound, "not_found", "user not found")
		}
		return api.User{}, nil, err
	}

	var previous *uuid.UUID
	if row.PreviousAvatarMediaID.Valid {
		id := row.PreviousAvatarMediaID.UUID
		previous = &id
	}
	user := mapUserWithProfile(row.ID, row.Username, row.CreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, row.TermsVersion, row.PrivacyVersion, row.TermsAcceptedAt, row.PrivacyAcceptedAt)
	return user, previous, nil
}
