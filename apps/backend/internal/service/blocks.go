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

// BlocksService owns both personal mutes and blocks. They share a service
// because they are the same gesture at two strengths: a block is a mute plus a
// refusal, and the read paths treat them as one thing (is_hidden_by).
type BlocksService struct {
	store     *repository.Store
	cache     cache.Cache
	publisher realtime.Publisher
	users     *UsersService
}

func NewBlocksService(store *repository.Store, cache cache.Cache, publisher realtime.Publisher) *BlocksService {
	return &BlocksService{store: store, cache: cache, publisher: publisher}
}

// SetUsersService injects the users service. Set after construction because the
// services are built in dependency order in main.go.
func (s *BlocksService) SetUsersService(users *UsersService) {
	s.users = users
}

// Mute hides the target from the caller's feeds. Muting someone already muted
// succeeds without doing anything: the endpoint is a toggle target.
func (s *BlocksService) Mute(ctx context.Context, caller auth.User, username api.Username) (api.User, error) {
	target, err := s.resolveTarget(ctx, caller, username, "mute")
	if err != nil {
		return api.User{}, err
	}
	if err := s.store.Q.MuteUser(ctx, sqlc.MuteUserParams{MuterID: caller.ID, MutedID: target.ID}); err != nil {
		return api.User{}, err
	}
	// The home ZSET holds ids that were filtered when it was built, so it has to
	// be rebuilt rather than trusted. Only the muter's own feed changes.
	s.invalidateHome(ctx, caller.ID)
	return s.users.GetByUsername(ctx, username, &caller.ID)
}

// Unmute reverses Mute. Nothing was deleted, so the target's whole history comes
// back at once.
func (s *BlocksService) Unmute(ctx context.Context, caller auth.User, username api.Username) (api.User, error) {
	target, err := s.resolveTarget(ctx, caller, username, "mute")
	if err != nil {
		return api.User{}, err
	}
	if err := s.store.Q.UnmuteUser(ctx, sqlc.UnmuteUserParams{MuterID: caller.ID, MutedID: target.ID}); err != nil {
		return api.User{}, err
	}
	s.invalidateHome(ctx, caller.ID)
	return s.users.GetByUsername(ctx, username, &caller.ID)
}

// Block hides the target like a mute does, and additionally cuts them off:
// can_view_user stops returning their view of the caller, which closes posts,
// media, the follow graph, reactions, notifications, and — because replying,
// boosting, quoting and reacting all check it first — every way of interacting.
//
// The follow rows go in the same transaction as the block. A follow surviving a
// block would keep feeding the blocked user's home timeline from a fan-out that
// never consults can_view_user, so the two must not be separately observable.
func (s *BlocksService) Block(ctx context.Context, caller auth.User, username api.Username) (api.User, error) {
	target, err := s.resolveTarget(ctx, caller, username, "block")
	if err != nil {
		return api.User{}, err
	}

	if err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if err := q.BlockUser(ctx, sqlc.BlockUserParams{BlockerID: caller.ID, BlockedID: target.ID}); err != nil {
			return err
		}
		// Covers pending follow requests too: they are rows in this same table
		// with accepted_at NULL.
		return q.DeleteFollowsBothWays(ctx, sqlc.DeleteFollowsBothWaysParams{
			UserID:  caller.ID,
			OtherID: target.ID,
		})
	}); err != nil {
		return api.User{}, err
	}

	// Both sides lost a follow, so both home timelines are stale.
	s.invalidateHome(ctx, caller.ID)
	s.invalidateHome(ctx, target.ID)
	s.announce(ctx, caller, target.ID)
	return s.users.GetByUsername(ctx, username, &caller.ID)
}

// Unblock restores the target's access. The follows the block severed are not
// restored: re-following is a decision, and silently reinstating it would put
// someone back in a feed they were removed from without being asked.
func (s *BlocksService) Unblock(ctx context.Context, caller auth.User, username api.Username) (api.User, error) {
	target, err := s.resolveTarget(ctx, caller, username, "block")
	if err != nil {
		return api.User{}, err
	}
	if err := s.store.Q.UnblockUser(ctx, sqlc.UnblockUserParams{BlockerID: caller.ID, BlockedID: target.ID}); err != nil {
		return api.User{}, err
	}
	s.invalidateHome(ctx, caller.ID)
	s.invalidateHome(ctx, target.ID)
	s.announce(ctx, caller, target.ID)
	return s.users.GetByUsername(ctx, username, &caller.ID)
}

// announce tells the other side's open tabs to drop what they already fetched.
//
// Only blocks announce. A mute is invisible to the account it hides, and a push
// arriving the moment someone mutes you would be the one thing that gives it
// away; the muter's own tabs are refreshed by the mutation response instead.
//
// Targeted at the blocked user, so nobody else learns a block happened. It reuses
// the privacy-changed event because the client already handles it by dropping
// every cached post, profile and timeline — which is exactly what has to happen
// here, and a second event type would only be a second thing to keep in step.
//
// The username in the payload is the blocker's, which the recipient can already
// see: it is what they will fail to load next.
func (s *BlocksService) announce(ctx context.Context, caller auth.User, targetID uuid.UUID) {
	if s.publisher == nil {
		return
	}
	username := string(caller.Username)
	target := api.UserId(targetID)
	_ = s.publisher.Publish(ctx, realtime.Event{
		Type:         realtime.EventUserPrivacyChanged,
		Username:     &username,
		TargetUserId: &target,
	})
}

// ListMutes returns the accounts the caller has muted, newest first.
func (s *BlocksService) ListMutes(ctx context.Context, viewer uuid.UUID, limit *int, cursor *string) (api.UsersPage, error) {
	lim, cTime, cID, err := s.listArgs(limit, cursor)
	if err != nil {
		return api.UsersPage{}, err
	}
	rows, err := s.store.Q.ListMutedUsers(ctx, sqlc.ListMutedUsersParams{
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
		u := mapFollowListUser(row.ID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio,
			row.AvatarMediaID, row.AvatarExt, false, false, row.IsPrivate, &viewer)
		// Every row on this page is muted by definition, and the query does not
		// select the flag back out.
		muted := true
		u.IsMuted = &muted
		items = append(items, u)
	}
	var next *string
	if len(rows) == lim {
		last := rows[len(rows)-1]
		n := encodeCursor(timelineCursor{Score: last.HiddenAt.UnixMilli(), ID: last.ID.String()})
		next = &n
	}
	return api.UsersPage{Items: items, NextCursor: next}, nil
}

// ListBlocks returns the accounts the caller has blocked, newest first. This is
// the only route back to them: a block takes them out of search and every list.
func (s *BlocksService) ListBlocks(ctx context.Context, viewer uuid.UUID, limit *int, cursor *string) (api.UsersPage, error) {
	lim, cTime, cID, err := s.listArgs(limit, cursor)
	if err != nil {
		return api.UsersPage{}, err
	}
	rows, err := s.store.Q.ListBlockedUsers(ctx, sqlc.ListBlockedUsersParams{
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
		u := mapFollowListUser(row.ID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio,
			row.AvatarMediaID, row.AvatarExt, false, false, row.IsPrivate, &viewer)
		blocking := true
		u.IsBlocking = &blocking
		items = append(items, u)
	}
	var next *string
	if len(rows) == lim {
		last := rows[len(rows)-1]
		n := encodeCursor(timelineCursor{Score: last.HiddenAt.UnixMilli(), ID: last.ID.String()})
		next = &n
	}
	return api.UsersPage{Items: items, NextCursor: next}, nil
}

func (s *BlocksService) listArgs(limit *int, cursor *string) (int, sql.NullTime, uuid.NullUUID, error) {
	if s.store == nil || s.users == nil {
		return 0, sql.NullTime{}, uuid.NullUUID{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	lim := 30
	if limit != nil {
		lim = *limit
	}
	if lim < 1 || lim > 100 {
		return 0, sql.NullTime{}, uuid.NullUUID{}, NewError(http.StatusBadRequest, "invalid_request", "limit must be 1..100")
	}
	c, err := decodeCursor(cursor)
	if err != nil {
		return 0, sql.NullTime{}, uuid.NullUUID{}, NewError(http.StatusBadRequest, "invalid_request", "invalid cursor")
	}
	var cTime sql.NullTime
	var cID uuid.NullUUID
	if c != nil {
		cTime = sql.NullTime{Time: time.UnixMilli(c.Score).UTC(), Valid: true}
		if id, err := uuid.Parse(c.ID); err == nil {
			cID = uuid.NullUUID{UUID: id, Valid: true}
		}
	}
	return lim, cTime, cID, nil
}

// resolveTarget looks up the target and rejects acting on yourself. verb only
// shapes the error message; the CHECK constraint would also catch it, as a 500.
func (s *BlocksService) resolveTarget(ctx context.Context, caller auth.User, username api.Username, verb string) (sqlc.GetUserByUsernameRow, error) {
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
	if target.ID == caller.ID {
		return sqlc.GetUserByUsernameRow{}, NewError(http.StatusBadRequest, "invalid_request", "cannot "+verb+" yourself")
	}
	return target, nil
}

func (s *BlocksService) invalidateHome(ctx context.Context, userID uuid.UUID) {
	if s.cache == nil {
		return
	}
	_ = s.cache.Delete(ctx, timelineKeyHome(userID))
}
