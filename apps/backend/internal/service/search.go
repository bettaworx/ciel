package service

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"backend/internal/api"
	"backend/internal/cache"
	"backend/internal/db/sqlc"
	"backend/internal/repository"
	"backend/internal/search"

	"github.com/google/uuid"
)

const (
	// searchBackfillBatch is how many rows are read and pushed per round trip
	// during the startup backfill.
	searchBackfillBatch = 1000
	// searchBackfillLockKey guards the backfill so only one replica runs it.
	searchBackfillLockKey = "search:backfill:lock"
	searchBackfillLockTTL = 30 * time.Minute
)

// SearchService turns user queries into engine queries, hydrates the results
// from the database, and keeps the index in step with post and user changes.
//
// Search results are always rebuilt from the database, so the index only ever
// decides *which* rows to show, never *what* they contain. That keeps a stale
// index from leaking deleted or hidden content.
type SearchService struct {
	store    *repository.Store
	provider search.Provider
	posts    *PostsService
}

func NewSearchService(store *repository.Store, provider search.Provider) *SearchService {
	if provider == nil {
		provider = search.NoOp{}
	}
	return &SearchService{store: store, provider: provider}
}

func (s *SearchService) SetPostsService(posts *PostsService) {
	s.posts = posts
}

// Enabled reports whether a real search engine is configured.
func (s *SearchService) Enabled() bool {
	return s != nil && search.Enabled(s.provider)
}

func (s *SearchService) SearchPosts(ctx context.Context, raw string, limit, offset *int, viewer *uuid.UUID) (api.PostSearchPage, error) {
	q, err := s.parse(raw, limit, offset)
	if err != nil {
		return api.PostSearchPage{}, err
	}
	if s.store == nil || s.posts == nil {
		return api.PostSearchPage{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	// `from:` names a user; the index filters on the author's id so that a
	// rename never invalidates their posts. An unknown name matches nothing.
	if q.Username != "" {
		author, err := s.store.Q.GetUserByUsername(ctx, q.Username)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return api.PostSearchPage{Items: []api.Post{}, Limit: q.Limit, Offset: q.Offset}, nil
			}
			return api.PostSearchPage{}, err
		}
		q.AuthorID = &author.ID
	}

	result, err := s.provider.SearchPosts(ctx, q)
	if err != nil {
		return api.PostSearchPage{}, mapSearchError(err)
	}

	// Loaded before hydration so the hydration below shares this one read
	// rather than repeating it per attach step.
	ctx, _, err = EnsureViewerScope(ctx, s.store, viewer)
	if err != nil {
		return api.PostSearchPage{}, err
	}

	byID, err := s.posts.GetHydratedPostsByIDs(ctx, result.IDs, viewer, SurfaceFeed)
	if err != nil {
		return api.PostSearchPage{}, err
	}
	// Walk the engine's ordering, not the map's: map iteration would throw
	// away the newest-first ordering. Missing ids are posts deleted or hidden
	// since they were indexed.
	items := make([]api.Post, 0, len(result.IDs))
	for _, id := range result.IDs {
		if post, ok := byID[id]; ok {
			items = append(items, post)
		}
	}
	// EstimatedTotal is left as the engine reported it. It is already an estimate
	// over an index that does not know about this viewer, and correcting it for
	// one page would make it wrong in a different way.
	return api.PostSearchPage{
		Items:          items,
		EstimatedTotal: int(result.EstimatedTotal),
		Limit:          q.Limit,
		Offset:         q.Offset,
	}, nil
}

func (s *SearchService) SearchUsers(ctx context.Context, raw string, limit, offset *int, viewer *uuid.UUID) (api.UserSearchPage, error) {
	q, err := s.parse(raw, limit, offset)
	if err != nil {
		return api.UserSearchPage{}, err
	}
	if s.store == nil {
		return api.UserSearchPage{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	result, err := s.provider.SearchUsers(ctx, q)
	if err != nil {
		return api.UserSearchPage{}, mapSearchError(err)
	}

	rows, err := s.store.Q.GetUsersByIDs(ctx, sqlc.GetUsersByIDsParams{
		ViewerID: nullUUIDFromPtr(viewer),
		Ids:      result.IDs,
	})
	if err != nil {
		return api.UserSearchPage{}, err
	}
	byID := make(map[uuid.UUID]api.User, len(rows))
	for _, row := range rows {
		user := mapFollowListUser(row.ID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio,
			row.AvatarMediaID, row.AvatarExt, row.IsFollowing, row.IsFollowedBy, row.IsPrivate, viewer)
		// Only set for an identified viewer, matching the other relationship
		// flags: an anonymous caller has no relationship to report.
		if viewer != nil {
			isBlockedBy := row.IsBlockedBy
			user.IsBlockedBy = &isBlockedBy
		}
		byID[row.ID] = user
	}
	items := make([]api.User, 0, len(result.IDs))
	for _, id := range result.IDs {
		if user, ok := byID[id]; ok {
			items = append(items, user)
		}
	}
	return api.UserSearchPage{
		Items:          items,
		EstimatedTotal: int(result.EstimatedTotal),
		Limit:          q.Limit,
		Offset:         q.Offset,
	}, nil
}

// parse normalizes paging and interprets the query mini-syntax.
func (s *SearchService) parse(raw string, limit, offset *int) (search.Query, error) {
	lim := 30
	if limit != nil {
		lim = *limit
	}
	if lim < 1 || lim > 100 {
		return search.Query{}, NewError(http.StatusBadRequest, "invalid_request", "limit must be 1..100")
	}
	off := 0
	if offset != nil {
		off = *offset
	}
	if off < 0 || off > 1000 {
		return search.Query{}, NewError(http.StatusBadRequest, "invalid_request", "offset must be 0..1000")
	}

	q, err := search.ParseQuery(raw, lim, off)
	if err != nil {
		return search.Query{}, NewError(http.StatusBadRequest, "invalid_request", err.Error())
	}
	return q, nil
}

func mapSearchError(err error) error {
	if errors.Is(err, search.ErrUnavailable) {
		return NewError(http.StatusServiceUnavailable, "search_unavailable", "search is not configured on this server")
	}
	slog.Error("search query failed", "error", err)
	return NewError(http.StatusServiceUnavailable, "search_unavailable", "search is temporarily unavailable")
}

// ReindexPost brings the index in line with the post's current state: it
// upserts a visible post and removes one that is deleted, hidden or gone.
// Callers do not need to know which happened, so every mutation site is the
// same single line.
//
// Errors are logged and swallowed, like realtime publishing: a search index
// problem must not fail the write that triggered it.
func (s *SearchService) ReindexPost(ctx context.Context, postID uuid.UUID) {
	if s == nil || s.store == nil || !search.Enabled(s.provider) {
		return
	}
	row, err := s.store.Q.GetPostForIndex(ctx, postID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			s.logIndexError("delete post from index", postID, s.provider.DeletePosts(ctx, postID))
			return
		}
		slog.Error("search reindex: load post", "post_id", postID, "error", err)
		return
	}
	if row.DeletedAt.Valid || row.Visibility != "public" {
		s.logIndexError("delete post from index", postID, s.provider.DeletePosts(ctx, postID))
		return
	}
	s.logIndexError("index post", postID, s.provider.IndexPosts(ctx, search.PostDoc{
		ID:        row.ID.String(),
		Content:   row.Content,
		Tags:      search.ExtractHashtags(row.Content),
		UserID:    row.UserID.String(),
		CreatedAt: row.CreatedAt.Unix(),
	}))
}

// ReindexUser mirrors ReindexPost for user profiles.
func (s *SearchService) ReindexUser(ctx context.Context, userID uuid.UUID) {
	if s == nil || s.store == nil || !search.Enabled(s.provider) {
		return
	}
	row, err := s.store.Q.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			s.logIndexError("delete user from index", userID, s.provider.DeleteUsers(ctx, userID))
			return
		}
		slog.Error("search reindex: load user", "user_id", userID, "error", err)
		return
	}
	s.logIndexError("index user", userID, s.provider.IndexUsers(ctx, search.UserDoc{
		ID:          row.ID.String(),
		Username:    row.Username,
		DisplayName: row.DisplayName.String,
		Bio:         row.Bio.String,
		Tags:        search.ExtractHashtags(row.Bio.String),
		CreatedAt:   row.CreatedAt.Unix(),
	}))
}

// RemoveUser drops a deleted user and everything they wrote from the index.
// Deleting a user cascades their posts out of the database, so ReindexPost has
// nothing left to look up; the posts have to be purged by author instead.
func (s *SearchService) RemoveUser(ctx context.Context, userID uuid.UUID) {
	if s == nil || !search.Enabled(s.provider) {
		return
	}
	s.logIndexError("delete user from index", userID, s.provider.DeleteUsers(ctx, userID))
	s.logIndexError("delete user posts from index", userID, s.provider.DeletePostsByAuthor(ctx, userID))
}

func (s *SearchService) logIndexError(op string, id uuid.UUID, err error) {
	if err != nil {
		slog.Error("search index update failed", "op", op, "id", id, "error", err)
	}
}

// StartBackfill applies the index settings and, if the indexes are empty,
// loads every existing post and user into them in the background. Startup is
// never blocked on it.
//
// Set SEARCH_BACKFILL=force to reindex even when the indexes already hold
// documents, which is how a drifted index gets repaired without downtime.
func (s *SearchService) StartBackfill(ctx context.Context, c cache.Cache, force bool) {
	if s == nil || s.store == nil || !search.Enabled(s.provider) {
		return
	}
	go func() {
		if err := s.provider.EnsureIndexes(ctx); err != nil {
			slog.Error("search: could not prepare indexes", "error", err)
			return
		}
		// Only one replica should backfill. A no-op cache reports the lock as
		// taken, so single-process development just proceeds without one.
		if c != nil {
			ok, err := c.SetNX(ctx, searchBackfillLockKey, "1", searchBackfillLockTTL)
			if err != nil {
				slog.Warn("search: backfill lock unavailable, continuing", "error", err)
			} else if !ok {
				slog.Info("search: backfill already running elsewhere, skipping")
				return
			}
		}
		s.backfill(ctx, force)
	}()
}

func (s *SearchService) backfill(ctx context.Context, force bool) {
	if err := s.backfillPosts(ctx, force); err != nil {
		slog.Error("search: post backfill failed", "error", err)
	}
	if err := s.backfillUsers(ctx, force); err != nil {
		slog.Error("search: user backfill failed", "error", err)
	}
}

func (s *SearchService) backfillPosts(ctx context.Context, force bool) error {
	if !force {
		count, err := s.provider.PostCount(ctx)
		if err != nil {
			return err
		}
		if count > 0 {
			slog.Info("search: post index already populated, skipping backfill", "documents", count)
			return nil
		}
	}

	var (
		cursorTime sql.NullTime
		cursorID   uuid.NullUUID
		total      int
	)
	for {
		rows, err := s.store.Q.ListPostsForIndex(ctx, sqlc.ListPostsForIndexParams{
			CursorTime: cursorTime,
			CursorID:   cursorID,
			Limit:      searchBackfillBatch,
		})
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			break
		}
		docs := make([]search.PostDoc, 0, len(rows))
		for _, row := range rows {
			docs = append(docs, search.PostDoc{
				ID:        row.ID.String(),
				Content:   row.Content,
				Tags:      search.ExtractHashtags(row.Content),
				UserID:    row.UserID.String(),
				CreatedAt: row.CreatedAt.Unix(),
			})
		}
		if err := s.provider.IndexPosts(ctx, docs...); err != nil {
			return err
		}
		total += len(rows)
		last := rows[len(rows)-1]
		cursorTime = sql.NullTime{Time: last.CreatedAt, Valid: true}
		cursorID = uuid.NullUUID{UUID: last.ID, Valid: true}
		if len(rows) < searchBackfillBatch {
			break
		}
	}
	slog.Info("search: post backfill complete", "posts", total)
	return nil
}

func (s *SearchService) backfillUsers(ctx context.Context, force bool) error {
	if !force {
		count, err := s.provider.UserCount(ctx)
		if err != nil {
			return err
		}
		if count > 0 {
			slog.Info("search: user index already populated, skipping backfill", "documents", count)
			return nil
		}
	}

	var (
		cursorTime sql.NullTime
		cursorID   uuid.NullUUID
		total      int
	)
	for {
		rows, err := s.store.Q.ListUsersForIndex(ctx, sqlc.ListUsersForIndexParams{
			CursorTime: cursorTime,
			CursorID:   cursorID,
			Limit:      searchBackfillBatch,
		})
		if err != nil {
			return err
		}
		if len(rows) == 0 {
			break
		}
		docs := make([]search.UserDoc, 0, len(rows))
		for _, row := range rows {
			docs = append(docs, search.UserDoc{
				ID:          row.ID.String(),
				Username:    row.Username,
				DisplayName: row.DisplayName.String,
				Bio:         row.Bio.String,
				Tags:        search.ExtractHashtags(row.Bio.String),
				CreatedAt:   row.CreatedAt.Unix(),
			})
		}
		if err := s.provider.IndexUsers(ctx, docs...); err != nil {
			return err
		}
		total += len(rows)
		last := rows[len(rows)-1]
		cursorTime = sql.NullTime{Time: last.CreatedAt, Valid: true}
		cursorID = uuid.NullUUID{UUID: last.ID, Valid: true}
		if len(rows) < searchBackfillBatch {
			break
		}
	}
	slog.Info("search: user backfill complete", "users", total)
	return nil
}
