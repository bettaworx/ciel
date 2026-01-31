package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/cache"
	"backend/internal/db/sqlc"
	"backend/internal/realtime"
	"backend/internal/repository"
)

type ReactionsService struct {
	store     *repository.Store
	cache     cache.Cache
	publisher realtime.Publisher
}

func NewReactionsService(store *repository.Store, cache cache.Cache, publisher realtime.Publisher) *ReactionsService {
	return &ReactionsService{store: store, cache: cache, publisher: publisher}
}

func (s *ReactionsService) List(ctx context.Context, postID api.PostId, userID *api.UserId) (api.ReactionCounts, error) {
	if s.store == nil {
		return api.ReactionCounts{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if counts, ok := s.getReactionCache(ctx, postID); ok && userID == nil {
		// Only use cache for anonymous requests (no user-specific data)
		return counts, nil
	}
	if err := s.ensurePostVisible(ctx, postID); err != nil {
		return api.ReactionCounts{}, err
	}
	counts, err := s.buildCounts(ctx, postID, userID)
	if err != nil {
		return api.ReactionCounts{}, err
	}
	if userID == nil {
		// Only cache anonymous requests
		s.setReactionCache(ctx, counts)
	}
	return counts, nil
}

func (s *ReactionsService) ensurePostVisible(ctx context.Context, postID api.PostId) error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	// Ensure post exists and not deleted.
	row, err := s.store.Q.GetPostWithAuthorByID(ctx, postID)
	if err != nil {
		if err == sql.ErrNoRows {
			return NewError(http.StatusNotFound, "not_found", "post not found")
		}
		return err
	}
	if row.DeletedAt.Valid {
		return NewError(http.StatusNotFound, "not_found", "post not found")
	}
	return nil
}

func (s *ReactionsService) buildCounts(ctx context.Context, postID api.PostId, userID *api.UserId) (api.ReactionCounts, error) {
	if userID != nil {
		rows, err := s.store.Q.ListReactionCountsWithUserStatus(ctx, sqlc.ListReactionCountsWithUserStatusParams{
			PostID: postID,
			UserID: *userID,
		})
		if err != nil {
			return api.ReactionCounts{}, err
		}
		counts := make([]api.ReactionCount, 0, len(rows))
		for _, r := range rows {
			counts = append(counts, api.ReactionCount{
				Emoji:                r.Emoji,
				Count:                int(r.Count),
				ReactedByCurrentUser: r.ReactedByUser,
			})
		}
		return api.ReactionCounts{PostId: postID, Reactions: counts}, nil
	}

	rows, err := s.store.Q.ListReactionCounts(ctx, postID)
	if err != nil {
		return api.ReactionCounts{}, err
	}
	counts := make([]api.ReactionCount, 0, len(rows))
	for _, r := range rows {
		counts = append(counts, api.ReactionCount{
			Emoji:                r.Emoji,
			Count:                int(r.Count),
			ReactedByCurrentUser: false,
		})
	}
	return api.ReactionCounts{PostId: postID, Reactions: counts}, nil
}

func (s *ReactionsService) Add(ctx context.Context, user auth.User, postID api.PostId, req api.ReactRequest) (api.ReactionCounts, error) {
	if s.store == nil {
		return api.ReactionCounts{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	emoji := strings.TrimSpace(string(req.Emoji))
	if emoji == "" {
		return api.ReactionCounts{}, NewError(http.StatusBadRequest, "invalid_request", "emoji required")
	}
	row, err := s.store.Q.GetPostWithAuthorByID(ctx, postID)
	if err != nil {
		if err == sql.ErrNoRows {
			return api.ReactionCounts{}, NewError(http.StatusNotFound, "not_found", "post not found")
		}
		return api.ReactionCounts{}, err
	}
	if row.DeletedAt.Valid {
		return api.ReactionCounts{}, NewError(http.StatusNotFound, "not_found", "post not found")
	}

	if err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if _, err := q.AddReactionEvent(ctx, sqlc.AddReactionEventParams{UserID: user.ID, PostID: postID, Emoji: emoji}); err != nil {
			if err == sql.ErrNoRows {
				// ON CONFLICT DO NOTHING -> no row
				return NewError(http.StatusConflict, "already_reacted", "already reacted")
			}
			return err
		}
		if _, err := q.IncrementReactionCount(ctx, sqlc.IncrementReactionCountParams{PostID: postID, Emoji: emoji}); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return api.ReactionCounts{}, err
	}
	if err := s.ensurePostVisible(ctx, postID); err != nil {
		return api.ReactionCounts{}, err
	}
	counts, err := s.buildCounts(ctx, postID, &user.ID)
	if err != nil {
		return api.ReactionCounts{}, err
	}
	s.setReactionCache(ctx, counts)
	s.publish(ctx, counts)
	return counts, nil
}

func (s *ReactionsService) Remove(ctx context.Context, user auth.User, postID api.PostId, emoji api.Emoji) (api.ReactionCounts, error) {
	if s.store == nil {
		return api.ReactionCounts{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	em := strings.TrimSpace(string(emoji))
	if em == "" {
		return api.ReactionCounts{}, NewError(http.StatusBadRequest, "invalid_request", "emoji required")
	}

	if err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if _, err := q.RemoveReactionEvent(ctx, sqlc.RemoveReactionEventParams{UserID: user.ID, PostID: postID, Emoji: em}); err != nil {
			if err == sql.ErrNoRows {
				return NewError(http.StatusNotFound, "not_found", "reaction not found")
			}
			return err
		}
		count, err := q.DecrementReactionCount(ctx, sqlc.DecrementReactionCountParams{PostID: postID, Emoji: em})
		if err != nil {
			// If count row missing, treat as not found.
			if err == sql.ErrNoRows {
				return NewError(http.StatusNotFound, "not_found", "reaction not found")
			}
			return err
		}
		if count <= 0 {
			if err := q.DeleteReactionCountIfZero(ctx, sqlc.DeleteReactionCountIfZeroParams{PostID: postID, Emoji: em}); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return api.ReactionCounts{}, err
	}

	if err := s.ensurePostVisible(ctx, postID); err != nil {
		return api.ReactionCounts{}, err
	}
	counts, err := s.buildCounts(ctx, postID, &user.ID)
	if err != nil {
		return api.ReactionCounts{}, err
	}
	s.setReactionCache(ctx, counts)
	s.publish(ctx, counts)
	return counts, nil
}

func (s *ReactionsService) publish(ctx context.Context, counts api.ReactionCounts) {
	if s.publisher == nil {
		return
	}
	_ = s.publisher.Publish(ctx, realtime.Event{Type: realtime.EventReactionUpdated, ReactionCounts: &counts})
}

const reactionCacheTTL = 6 * time.Hour

func reactionCacheKey(postID api.PostId) string {
	return "reactions:post:" + postID.String()
}

func (s *ReactionsService) getReactionCache(ctx context.Context, postID api.PostId) (api.ReactionCounts, bool) {
	if s.cache == nil {
		return api.ReactionCounts{}, false
	}
	payload, err := s.cache.Get(ctx, reactionCacheKey(postID))
	if err != nil {
		return api.ReactionCounts{}, false
	}
	var counts api.ReactionCounts
	if err := json.Unmarshal([]byte(payload), &counts); err != nil {
		return api.ReactionCounts{}, false
	}
	if counts.PostId != postID {
		return api.ReactionCounts{}, false
	}
	if counts.Reactions == nil {
		counts.Reactions = []api.ReactionCount{}
	}
	return counts, true
}

func (s *ReactionsService) setReactionCache(ctx context.Context, counts api.ReactionCounts) {
	if s.cache == nil {
		return
	}
	payload, err := json.Marshal(counts)
	if err != nil {
		return
	}
	_ = s.cache.Set(ctx, reactionCacheKey(counts.PostId), string(payload), reactionCacheTTL)
}
