package service

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"backend/internal/api"
	"backend/internal/cache"
	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

type TimelineService struct {
	store *repository.Store
	cache cache.Cache
}

func NewTimelineService(store *repository.Store, cache cache.Cache) *TimelineService {
	return &TimelineService{store: store, cache: cache}
}

type timelineCursor struct {
	Score int64  `json:"s"`
	ID    string `json:"i"`
}

// TimelineCursor is the exported form of the timeline pagination cursor.
//
// It is an alias to the internal type so we can keep JSON compatibility and
// still allow tests to live outside this package.
type TimelineCursor = timelineCursor

// EncodeCursor encodes a cursor for use in API requests.
// Primarily used by tests living outside this package.
func EncodeCursor(c TimelineCursor) string { return encodeCursor(c) }

// DecodeCursor decodes a cursor from API requests.
// Primarily used by tests living outside this package.
func DecodeCursor(cursor *string) (*TimelineCursor, error) { return decodeCursor(cursor) }

// ListFromRedis exposes the Redis timeline paging logic for unit tests.
// This does not perform DB fallback.
func (s *TimelineService) ListFromRedis(ctx context.Context, limit int, cursor *TimelineCursor) (postIDs []uuid.UUID, next *TimelineCursor, ok bool) {
	return s.listFromRedis(ctx, limit, cursor)
}

func (s *TimelineService) Get(ctx context.Context, params api.GetTimelineParams) (api.TimelinePage, error) {
	if s.store == nil {
		return api.TimelinePage{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	limit := 30
	if params.Limit != nil {
		limit = *params.Limit
	}
	if limit < 1 || limit > 100 {
		return api.TimelinePage{}, NewError(http.StatusBadRequest, "invalid_request", "limit must be 1..100")
	}

	cursor, err := decodeCursor(params.Cursor)
	if err != nil {
		return api.TimelinePage{}, NewError(http.StatusBadRequest, "invalid_request", "invalid cursor")
	}

	// Prefer Redis if configured.
	if s.cache != nil {
		postIDs, next, okRedis := s.listFromRedis(ctx, limit, cursor)
		if okRedis {
			posts, err := s.fetchPosts(ctx, postIDs)
			if err != nil {
				return api.TimelinePage{}, err
			}
			if err := s.attachMediaToPosts(ctx, posts); err != nil {
				return api.TimelinePage{}, err
			}
			page := api.TimelinePage{Items: posts}
			if next != nil {
				nc := encodeCursor(*next)
				page.NextCursor = &nc
			}
			return page, nil
		}
	}

	// Fallback to DB-only timeline.
	var cTime sql.NullTime
	var cID uuid.NullUUID
	if cursor != nil {
		ct := time.UnixMilli(cursor.Score).UTC()
		cTime = sql.NullTime{Time: ct, Valid: true}
		uid, err := uuid.Parse(cursor.ID)
		if err == nil {
			cID = uuid.NullUUID{UUID: uid, Valid: true}
		}
	}
	rows, err := s.store.Q.ListTimelinePosts(ctx, sqlc.ListTimelinePostsParams{CursorTime: cTime, CursorID: cID, Limit: int32(limit)})
	if err != nil {
		return api.TimelinePage{}, err
	}

	items := make([]api.Post, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapTimelineRow(row))
	}
	if err := s.attachMediaToPosts(ctx, items); err != nil {
		return api.TimelinePage{}, err
	}

	var nextCursor *string
	if len(rows) == limit {
		last := rows[len(rows)-1]
		n := encodeCursor(timelineCursor{Score: last.CreatedAt.UnixMilli(), ID: last.ID.String()})
		nextCursor = &n
	}
	return api.TimelinePage{Items: items, NextCursor: nextCursor}, nil
}

func (s *TimelineService) listFromRedis(ctx context.Context, limit int, cursor *timelineCursor) (postIDs []uuid.UUID, next *timelineCursor, ok bool) {
	key := timelineKeyGlobal()
	max := "+inf"
	if cursor != nil {
		max = strconv.FormatInt(cursor.Score, 10)
	}
	count := limit * 5
	if count > 500 {
		count = 500
	}

	zs, err := s.cache.ZRevRangeByScoreWithScores(ctx, key, &cache.ZRangeBy{Max: max, Min: "-inf", Offset: 0, Count: int64(count)})
	if err != nil {
		return nil, nil, false
	}

	type scoredID struct {
		score int64
		idStr string
		id    uuid.UUID
	}
	filtered := make([]scoredID, 0, limit)
	for _, z := range zs {
		idStr, ok := z.Member.(string)
		if !ok {
			continue
		}
		id, err := uuid.Parse(idStr)
		if err != nil {
			continue
		}
		score := int64(z.Score)
		if cursor != nil {
			if score > cursor.Score {
				continue
			}
			if score == cursor.Score && idStr >= cursor.ID {
				continue
			}
		}
		filtered = append(filtered, scoredID{score: score, idStr: idStr, id: id})
		if len(filtered) >= limit {
			break
		}
	}

	ids := make([]uuid.UUID, 0, len(filtered))
	for _, it := range filtered {
		ids = append(ids, it.id)
	}
	if len(filtered) == limit {
		last := filtered[len(filtered)-1]
		n := &timelineCursor{Score: last.score, ID: last.idStr}
		return ids, n, true
	}
	return ids, nil, true
}

func (s *TimelineService) fetchPosts(ctx context.Context, ids []uuid.UUID) ([]api.Post, error) {
	if len(ids) == 0 {
		return []api.Post{}, nil
	}
	rows, err := s.store.Q.GetPostsByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}

	posts := make([]api.Post, 0, len(rows))
	found := make(map[uuid.UUID]struct{}, len(rows))
	for _, row := range rows {
		posts = append(posts, mapPostsByIDsRow(row))
		found[row.ID] = struct{}{}
	}

	// Remove missing (likely deleted) from cache.
	if s.cache != nil && len(found) != len(ids) {
		key := timelineKeyGlobal()
		missing := make([]interface{}, 0)
		for _, id := range ids {
			if _, ok := found[id]; !ok {
				missing = append(missing, id.String())
			}
		}
		if len(missing) > 0 {
			_ = s.cache.ZRem(ctx, key, missing...)
		}
	}
	return posts, nil
}

func (s *TimelineService) attachMediaToPosts(ctx context.Context, posts []api.Post) error {
	if s.store == nil || len(posts) == 0 {
		return nil
	}
	ids := make([]uuid.UUID, 0, len(posts))
	index := make(map[uuid.UUID]int, len(posts))
	for i := range posts {
		posts[i].Media = []api.Media{}
		ids = append(ids, posts[i].Id)
		index[posts[i].Id] = i
	}
	rows, err := s.store.Q.ListMediaForPosts(ctx, ids)
	if err != nil {
		return err
	}
	counts := make(map[uuid.UUID]int, len(posts))
	for _, row := range rows {
		pi, ok := index[row.PostID]
		if !ok {
			continue
		}
		if counts[row.PostID] >= 4 {
			continue
		}
		posts[pi].Media = append(posts[pi].Media, api.Media{
			Id:        row.MediaID,
			Type:      api.MediaType("image"),
			Url:       mediaImageURL(row.MediaID, row.Ext),
			Width:     int(row.Width),
			Height:    int(row.Height),
			CreatedAt: row.CreatedAt,
		})
		counts[row.PostID]++
	}
	return nil
}

func encodeCursor(c timelineCursor) string {
	b, _ := json.Marshal(c)
	return base64.RawURLEncoding.EncodeToString(b)
}

func decodeCursor(cursor *string) (*timelineCursor, error) {
	if cursor == nil || *cursor == "" {
		return nil, nil
	}
	b, err := base64.RawURLEncoding.DecodeString(*cursor)
	if err != nil {
		return nil, err
	}
	var c timelineCursor
	if err := json.Unmarshal(b, &c); err != nil {
		return nil, err
	}
	if c.Score < 0 || c.ID == "" {
		return nil, errors.New("invalid cursor")
	}
	if _, err := uuid.Parse(c.ID); err != nil {
		return nil, errors.New("invalid cursor")
	}
	return &c, nil
}

func mapTimelineRow(row sqlc.ListTimelinePostsRow) api.Post {
	return api.Post{
		Id:        row.ID,
		Content:   row.Content,
		Media:     []api.Media{},
		CreatedAt: row.CreatedAt,
		DeletedAt: nil,
		// Note: Timeline post author doesn't include agreement fields (not needed for display)
		Author: mapUserWithProfile(row.UserID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, 0, 0, sql.NullTime{}, sql.NullTime{}),
	}
}

func mapPostsByIDsRow(row sqlc.GetPostsByIDsRow) api.Post {
	return api.Post{
		Id:        row.ID,
		Content:   row.Content,
		Media:     []api.Media{},
		CreatedAt: row.CreatedAt,
		DeletedAt: nil,
		// Note: Post author doesn't include agreement fields (not needed for display)
		Author: mapUserWithProfile(row.UserID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, 0, 0, sql.NullTime{}, sql.NullTime{}),
	}
}
