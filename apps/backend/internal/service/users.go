package service

import (
	"context"
	"database/sql"
	"net/http"
	"strings"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

type UsersService struct {
	store *repository.Store
}

func NewUsersService(store *repository.Store) *UsersService {
	return &UsersService{store: store}
}

// GetByUsername loads a profile. viewer is the caller, used to resolve the
// follow relationship; pass nil for anonymous requests.
func (s *UsersService) GetByUsername(ctx context.Context, username api.Username, viewer *uuid.UUID) (api.User, error) {
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
	out := mapUserWithProfile(user.ID, user.Username, user.CreatedAt, user.DisplayName, user.Bio, user.AvatarMediaID, user.AvatarExt, user.BannerMediaID, user.BannerExt, user.BannerBlurhash, user.TermsVersion, user.PrivacyVersion, user.TermsAcceptedAt, user.PrivacyAcceptedAt)
	s.attachFollowStats(ctx, &out, viewer)
	return out, nil
}

// GetByID loads a profile by id. See GetByUsername for viewer.
func (s *UsersService) GetByID(ctx context.Context, userID uuid.UUID, viewer *uuid.UUID) (api.User, error) {
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
	out := mapUserWithProfile(row.ID, row.Username, row.CreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, row.BannerMediaID, row.BannerExt, row.BannerBlurhash, row.TermsVersion, row.PrivacyVersion, row.TermsAcceptedAt, row.PrivacyAcceptedAt)
	s.attachFollowStats(ctx, &out, viewer)
	return out, nil
}

// attachFollowStats fills the follow counters, and the caller's relationship to
// this user when there is a caller. A failure here leaves the fields unset
// rather than failing the whole profile request.
func (s *UsersService) attachFollowStats(ctx context.Context, user *api.User, viewer *uuid.UUID) {
	stats, err := s.store.Q.GetUserFollowStats(ctx, sqlc.GetUserFollowStatsParams{
		UserID:   user.Id,
		ViewerID: nullUUIDFromPtr(viewer),
	})
	if err != nil {
		return
	}
	followers := int(stats.FollowersCount)
	following := int(stats.FollowingCount)
	user.FollowersCount = &followers
	user.FollowingCount = &following
	if viewer == nil {
		return
	}
	isFollowing := stats.IsFollowing
	isFollowedBy := stats.IsFollowedBy
	user.IsFollowing = &isFollowing
	user.IsFollowedBy = &isFollowedBy
}

// nullUUIDFromPtr converts an optional viewer id into a SQL nullable uuid.
func nullUUIDFromPtr(id *uuid.UUID) uuid.NullUUID {
	if id == nil {
		return uuid.NullUUID{}
	}
	return uuid.NullUUID{UUID: *id, Valid: true}
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
	return mapUserWithProfile(row.ID, row.Username, row.CreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, sql.NullString{}, row.BannerMediaID, sql.NullString{}, sql.NullString{}, row.TermsVersion, row.PrivacyVersion, row.TermsAcceptedAt, row.PrivacyAcceptedAt), nil
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
	user := mapUserWithProfile(row.ID, row.Username, row.CreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, row.BannerMediaID, row.BannerExt, row.BannerBlurhash, row.TermsVersion, row.PrivacyVersion, row.TermsAcceptedAt, row.PrivacyAcceptedAt)
	return user, previous, nil
}

func (s *UsersService) UpdateBanner(ctx context.Context, userID uuid.UUID, bannerMediaID uuid.UUID) (api.User, *uuid.UUID, error) {
	if s.store == nil {
		return api.User{}, nil, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	row, err := s.store.Q.UpdateUserBanner(ctx, sqlc.UpdateUserBannerParams{
		ID:            userID,
		BannerMediaID: uuid.NullUUID{UUID: bannerMediaID, Valid: true},
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return api.User{}, nil, NewError(http.StatusNotFound, "not_found", "user not found")
		}
		return api.User{}, nil, err
	}

	var previous *uuid.UUID
	if row.PreviousBannerMediaID.Valid {
		id := row.PreviousBannerMediaID.UUID
		previous = &id
	}
	user := mapUserWithProfile(row.ID, row.Username, row.CreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, row.BannerMediaID, row.BannerExt, row.BannerBlurhash, row.TermsVersion, row.PrivacyVersion, row.TermsAcceptedAt, row.PrivacyAcceptedAt)
	return user, previous, nil
}

func (s *UsersService) UpdateUsername(ctx context.Context, userID uuid.UUID, newUsername string) error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if err := auth.ValidateUsername(newUsername); err != nil {
		return NewError(http.StatusBadRequest, "invalid_request", err.Error())
	}
	_, err := s.store.Q.UpdateUsername(ctx, sqlc.UpdateUsernameParams{
		ID:       userID,
		Username: newUsername,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return NewError(http.StatusNotFound, "not_found", "user not found")
		}
		var pgErr *pgconn.PgError
		if errorsAsImpl(err, &pgErr) && pgErr.Code == "23505" {
			return NewError(http.StatusConflict, "username_taken", "username already taken")
		}
		return err
	}
	return nil
}
