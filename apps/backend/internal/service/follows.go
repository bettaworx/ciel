package service

import (
	"context"
	"database/sql"
	"net/http"
	"strings"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/cache"
	"backend/internal/db/sqlc"
	"backend/internal/realtime"
	"backend/internal/repository"

	"github.com/google/uuid"
)

type FollowsService struct {
	store         *repository.Store
	cache         cache.Cache
	publisher     realtime.Publisher
	notifications *NotificationsService
	users         *UsersService
}

func NewFollowsService(store *repository.Store, cache cache.Cache, publisher realtime.Publisher) *FollowsService {
	return &FollowsService{store: store, cache: cache, publisher: publisher}
}

// SetNotificationsService injects the notifications service. Set after
// construction because the services are built in dependency order in main.go.
func (s *FollowsService) SetNotificationsService(notifications *NotificationsService) {
	s.notifications = notifications
}

func (s *FollowsService) SetUsersService(users *UsersService) {
	s.users = users
}

// Follow makes follower follow the named user.
//
// Following an already-followed user succeeds without doing anything: the
// endpoint is a toggle target, and clients should not have to distinguish.
func (s *FollowsService) Follow(ctx context.Context, follower auth.User, username api.Username) (api.User, error) {
	target, err := s.resolveTarget(ctx, follower, username)
	if err != nil {
		return api.User{}, err
	}

	var created []CreatedNotification
	if err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		created = nil
		n, err := q.FollowUser(ctx, sqlc.FollowUserParams{
			FollowerID: follower.ID,
			FolloweeID: target.ID,
		})
		if err != nil {
			return err
		}
		if n == 0 {
			// Already following. Nothing changed, so do not notify again.
			return nil
		}
		id, err := Notify(ctx, q, NotifyParams{
			UserID:  target.ID,
			Type:    api.Follow,
			ActorID: follower.ID,
		})
		if err != nil {
			return err
		}
		if id != uuid.Nil {
			created = append(created, CreatedNotification{ID: id, UserID: target.ID})
		}
		return nil
	}); err != nil {
		return api.User{}, err
	}

	s.invalidateHomeTimeline(ctx, follower.ID)
	s.notifications.Publish(ctx, s.publisher, created)
	return s.users.GetByUsername(ctx, username, &follower.ID)
}

// Unfollow drops the follow. Unfollowing someone not followed succeeds.
func (s *FollowsService) Unfollow(ctx context.Context, follower auth.User, username api.Username) (api.User, error) {
	target, err := s.resolveTarget(ctx, follower, username)
	if err != nil {
		return api.User{}, err
	}

	if err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		n, err := q.UnfollowUser(ctx, sqlc.UnfollowUserParams{
			FollowerID: follower.ID,
			FolloweeID: target.ID,
		})
		if err != nil {
			return err
		}
		if n == 0 {
			return nil
		}
		// Retract the notification, otherwise idx_notifications_dedupe_no_post
		// would suppress the notification if this user is followed again.
		return Unnotify(ctx, q, NotifyParams{
			UserID:  target.ID,
			Type:    api.Follow,
			ActorID: follower.ID,
		})
	}); err != nil {
		return api.User{}, err
	}

	s.invalidateHomeTimeline(ctx, follower.ID)
	return s.users.GetByUsername(ctx, username, &follower.ID)
}

// resolveTarget looks up the user being followed and rejects self-follows.
func (s *FollowsService) resolveTarget(ctx context.Context, follower auth.User, username api.Username) (sqlc.GetUserByUsernameRow, error) {
	if s.store == nil || s.users == nil {
		return sqlc.GetUserByUsernameRow{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	uname := strings.TrimSpace(string(username))
	if uname == "" {
		return sqlc.GetUserByUsernameRow{}, NewError(http.StatusBadRequest, "invalid_request", "username required")
	}
	target, err := s.store.Q.GetUserByUsername(ctx, uname)
	if err != nil {
		if err == sql.ErrNoRows {
			return sqlc.GetUserByUsernameRow{}, NewError(http.StatusNotFound, "not_found", "user not found")
		}
		return sqlc.GetUserByUsernameRow{}, err
	}
	if target.ID == follower.ID {
		// The CHECK constraint would also catch this, but as a 500.
		return sqlc.GetUserByUsernameRow{}, NewError(http.StatusBadRequest, "invalid_request", "cannot follow yourself")
	}
	return target, nil
}

// invalidateHomeTimeline drops the cached home timeline so it is rebuilt from
// the database on the next read. Cheaper to think about than working out which
// posts joined or left the feed.
func (s *FollowsService) invalidateHomeTimeline(ctx context.Context, userID uuid.UUID) {
	if s.cache == nil {
		return
	}
	_ = s.cache.Delete(ctx, timelineKeyHome(userID))
}

// ListFollowers returns the users following the named user, newest follow first.
func (s *FollowsService) ListFollowers(ctx context.Context, username api.Username, limit *int, cursor *string, viewer *uuid.UUID) (api.UsersPage, error) {
	userID, lim, cTime, cID, err := s.listArgs(ctx, username, limit, cursor)
	if err != nil {
		return api.UsersPage{}, err
	}
	rows, err := s.store.Q.ListFollowers(ctx, sqlc.ListFollowersParams{
		UserID:     userID,
		ViewerID:   nullUUIDFromPtr(viewer),
		CursorTime: cTime,
		CursorID:   cID,
		Limit:      int32(lim),
	})
	if err != nil {
		return api.UsersPage{}, err
	}
	items := make([]api.User, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapFollowListUser(row.ID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio,
			row.AvatarMediaID, row.AvatarExt, row.IsFollowing, row.IsFollowedBy, viewer))
	}
	var next *string
	if len(rows) == lim {
		last := rows[len(rows)-1]
		n := encodeCursor(timelineCursor{Score: last.FollowedAt.UnixMilli(), ID: last.ID.String()})
		next = &n
	}
	return api.UsersPage{Items: items, NextCursor: next}, nil
}

// ListFollowing returns the users the named user follows, newest follow first.
func (s *FollowsService) ListFollowing(ctx context.Context, username api.Username, limit *int, cursor *string, viewer *uuid.UUID) (api.UsersPage, error) {
	userID, lim, cTime, cID, err := s.listArgs(ctx, username, limit, cursor)
	if err != nil {
		return api.UsersPage{}, err
	}
	rows, err := s.store.Q.ListFollowing(ctx, sqlc.ListFollowingParams{
		UserID:     userID,
		ViewerID:   nullUUIDFromPtr(viewer),
		CursorTime: cTime,
		CursorID:   cID,
		Limit:      int32(lim),
	})
	if err != nil {
		return api.UsersPage{}, err
	}
	items := make([]api.User, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapFollowListUser(row.ID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio,
			row.AvatarMediaID, row.AvatarExt, row.IsFollowing, row.IsFollowedBy, viewer))
	}
	var next *string
	if len(rows) == lim {
		last := rows[len(rows)-1]
		n := encodeCursor(timelineCursor{Score: last.FollowedAt.UnixMilli(), ID: last.ID.String()})
		next = &n
	}
	return api.UsersPage{Items: items, NextCursor: next}, nil
}

// ListFollowersYouFollow returns the named user's followers that the viewer also
// follows, newest follow first. TotalCount is filled on the first page only: it
// is what the profile facepile needs, and later pages have nothing to show it on.
func (s *FollowsService) ListFollowersYouFollow(ctx context.Context, username api.Username, limit *int, cursor *string, viewer uuid.UUID) (api.UsersPage, error) {
	userID, lim, cTime, cID, err := s.listArgs(ctx, username, limit, cursor)
	if err != nil {
		return api.UsersPage{}, err
	}
	rows, err := s.store.Q.ListFollowersYouFollow(ctx, sqlc.ListFollowersYouFollowParams{
		UserID:     userID,
		ViewerID:   viewer,
		CursorTime: cTime,
		CursorID:   cID,
		Limit:      int32(lim),
	})
	if err != nil {
		return api.UsersPage{}, err
	}
	items := make([]api.User, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapFollowListUser(row.ID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio,
			row.AvatarMediaID, row.AvatarExt, row.IsFollowing, row.IsFollowedBy, &viewer))
	}
	var next *string
	if len(rows) == lim {
		last := rows[len(rows)-1]
		n := encodeCursor(timelineCursor{Score: last.FollowedAt.UnixMilli(), ID: last.ID.String()})
		next = &n
	}
	page := api.UsersPage{Items: items, NextCursor: next}
	if cursor == nil || *cursor == "" {
		total, err := s.store.Q.CountFollowersYouFollow(ctx, sqlc.CountFollowersYouFollowParams{
			UserID:   userID,
			ViewerID: viewer,
		})
		if err != nil {
			return api.UsersPage{}, err
		}
		t := int(total)
		page.TotalCount = &t
	}
	return page, nil
}

// listArgs validates the shared paging inputs and resolves the subject user.
func (s *FollowsService) listArgs(ctx context.Context, username api.Username, limit *int, cursor *string) (uuid.UUID, int, sql.NullTime, uuid.NullUUID, error) {
	if s.store == nil {
		return uuid.Nil, 0, sql.NullTime{}, uuid.NullUUID{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	lim := 30
	if limit != nil {
		lim = *limit
	}
	if lim < 1 || lim > 100 {
		return uuid.Nil, 0, sql.NullTime{}, uuid.NullUUID{}, NewError(http.StatusBadRequest, "invalid_request", "limit must be 1..100")
	}
	c, err := decodeCursor(cursor)
	if err != nil {
		return uuid.Nil, 0, sql.NullTime{}, uuid.NullUUID{}, NewError(http.StatusBadRequest, "invalid_request", "invalid cursor")
	}

	uname := strings.TrimSpace(string(username))
	if uname == "" {
		return uuid.Nil, 0, sql.NullTime{}, uuid.NullUUID{}, NewError(http.StatusBadRequest, "invalid_request", "username required")
	}
	user, err := s.store.Q.GetUserByUsername(ctx, uname)
	if err != nil {
		if err == sql.ErrNoRows {
			return uuid.Nil, 0, sql.NullTime{}, uuid.NullUUID{}, NewError(http.StatusNotFound, "not_found", "user not found")
		}
		return uuid.Nil, 0, sql.NullTime{}, uuid.NullUUID{}, err
	}

	var cTime sql.NullTime
	var cID uuid.NullUUID
	if c != nil {
		cTime = sql.NullTime{Time: time.UnixMilli(c.Score).UTC(), Valid: true}
		if id, err := uuid.Parse(c.ID); err == nil {
			cID = uuid.NullUUID{UUID: id, Valid: true}
		}
	}
	return user.ID, lim, cTime, cID, nil
}

// mapFollowListUser builds the trimmed user shape used in follow lists. Banner
// and agreement fields are not selected: nothing renders them in a list.
func mapFollowListUser(
	id uuid.UUID,
	username string,
	createdAt time.Time,
	displayName sql.NullString,
	bio sql.NullString,
	avatarMediaID uuid.NullUUID,
	avatarExt sql.NullString,
	isFollowing bool,
	isFollowedBy bool,
	viewer *uuid.UUID,
) api.User {
	user := mapUserWithProfile(id, username, createdAt, displayName, bio, avatarMediaID, avatarExt,
		uuid.NullUUID{}, sql.NullString{}, sql.NullString{}, 0, 0, sql.NullTime{}, sql.NullTime{})
	if viewer != nil {
		f := isFollowing
		fb := isFollowedBy
		user.IsFollowing = &f
		user.IsFollowedBy = &fb
	}
	return user
}
