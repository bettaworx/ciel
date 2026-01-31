package service

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/cache"
	"backend/internal/db/sqlc"
	"backend/internal/realtime"
	"backend/internal/repository"

	"github.com/google/uuid"
)

const (
	maxPostContentRunes = 300
)

type PostsService struct {
	store     *repository.Store
	cache     cache.Cache
	publisher realtime.Publisher
}

func NewPostsService(store *repository.Store, cache cache.Cache, publisher realtime.Publisher) *PostsService {
	return &PostsService{store: store, cache: cache, publisher: publisher}
}

func (s *PostsService) Create(ctx context.Context, user auth.User, req api.CreatePostRequest) (api.Post, error) {
	if s.store == nil {
		return api.Post{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	// Get content (empty string if not provided)
	content := ""
	if req.Content != nil {
		content = strings.TrimSpace(*req.Content)
	}

	mediaIDs, err := normalizeMediaIDs(req.MediaIds)
	if err != nil {
		return api.Post{}, err
	}

	// At least one of content or media must be present
	if content == "" && len(mediaIDs) == 0 {
		return api.Post{}, NewError(http.StatusBadRequest, "invalid_request", "content or media required")
	}

	// Check content length (Unicode characters, not bytes)
	if content != "" && utf8.RuneCountInString(content) > maxPostContentRunes {
		return api.Post{}, NewError(http.StatusBadRequest, "invalid_request", fmt.Sprintf("content exceeds maximum length of %d characters", maxPostContentRunes))
	}

	var created sqlc.CreatePostRow
	if err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		c, err := q.CreatePost(ctx, sqlc.CreatePostParams{UserID: user.ID, Content: content})
		if err != nil {
			return err
		}
		created = c

		if len(mediaIDs) == 0 {
			return nil
		}
		count, err := q.CountOwnedMediaByIDs(ctx, sqlc.CountOwnedMediaByIDsParams{UserID: user.ID, Column2: mediaIDs})
		if err != nil {
			return err
		}
		if int(count) != len(mediaIDs) {
			return NewError(http.StatusBadRequest, "invalid_request", "invalid mediaIds")
		}
		for i, mid := range mediaIDs {
			if err := q.AttachMediaToPost(ctx, sqlc.AttachMediaToPostParams{PostID: created.ID, MediaID: mid, SortOrder: int32(i)}); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return api.Post{}, err
	}

	row, err := s.store.Q.GetPostWithAuthorByID(ctx, created.ID)
	if err != nil {
		return api.Post{}, err
	}
	post := mapPostRow(row)
	if err := s.attachMediaToPost(ctx, &post); err != nil {
		return api.Post{}, err
	}

	if s.cache != nil {
		key := timelineKeyGlobal()
		score := float64(post.CreatedAt.UnixMilli())
		_ = s.cache.ZAdd(ctx, key, cache.Z{Score: score, Member: post.Id.String()})
	}

	s.publish(ctx, realtime.Event{Type: realtime.EventPostCreated, Post: &post})
	return post, nil
}

func (s *PostsService) Get(ctx context.Context, postID api.PostId) (api.Post, error) {
	if s.store == nil {
		return api.Post{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	row, err := s.store.Q.GetPostWithAuthorByID(ctx, postID)
	if err != nil {
		if err == sql.ErrNoRows {
			return api.Post{}, NewError(http.StatusNotFound, "not_found", "post not found")
		}
		return api.Post{}, err
	}
	if row.DeletedAt.Valid {
		return api.Post{}, NewError(http.StatusNotFound, "not_found", "post not found")
	}
	post := mapPostRow(row)
	if err := s.attachMediaToPost(ctx, &post); err != nil {
		return api.Post{}, err
	}
	return post, nil
}

func (s *PostsService) ListByUsername(ctx context.Context, username api.Username, params api.GetUsersUsernamePostsParams) (api.UserPostsPage, error) {
	if s.store == nil {
		return api.UserPostsPage{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	uname := strings.TrimSpace(string(username))
	if uname == "" {
		return api.UserPostsPage{}, NewError(http.StatusBadRequest, "invalid_request", "username required")
	}

	limit := 30
	if params.Limit != nil {
		limit = *params.Limit
	}
	if limit < 1 || limit > 100 {
		return api.UserPostsPage{}, NewError(http.StatusBadRequest, "invalid_request", "limit must be 1..100")
	}

	cursor, err := decodeCursor(params.Cursor)
	if err != nil {
		return api.UserPostsPage{}, NewError(http.StatusBadRequest, "invalid_request", "invalid cursor")
	}

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

	rows, err := s.store.Q.ListPostsByUsername(ctx, sqlc.ListPostsByUsernameParams{
		Username:   uname,
		CursorTime: cTime,
		CursorID:   cID,
		Limit:      int32(limit),
	})
	if err != nil {
		return api.UserPostsPage{}, err
	}

	items := make([]api.Post, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapPostsByUsernameRow(row))
	}
	if err := s.attachMediaToPosts(ctx, items); err != nil {
		return api.UserPostsPage{}, err
	}

	if len(rows) == 0 {
		if _, err := s.store.Q.GetUserByUsername(ctx, uname); err != nil {
			if err == sql.ErrNoRows {
				return api.UserPostsPage{}, NewError(http.StatusNotFound, "not_found", "user not found")
			}
			return api.UserPostsPage{}, err
		}
	}

	var nextCursor *string
	if len(rows) == limit {
		last := rows[len(rows)-1]
		n := encodeCursor(timelineCursor{Score: last.CreatedAt.UnixMilli(), ID: last.ID.String()})
		nextCursor = &n
	}
	return api.UserPostsPage{Items: items, NextCursor: nextCursor}, nil
}

func (s *PostsService) attachMediaToPost(ctx context.Context, post *api.Post) error {
	if s.store == nil {
		return nil
	}
	rows, err := s.store.Q.ListMediaForPost(ctx, post.Id)
	if err != nil {
		return err
	}
	post.Media = make([]api.Media, 0, len(rows))
	for _, row := range rows {
		post.Media = append(post.Media, api.Media{
			Id:        row.MediaID,
			Type:      api.MediaType("image"),
			Url:       mediaImageURL(row.MediaID, row.Ext),
			Width:     int(row.Width),
			Height:    int(row.Height),
			CreatedAt: row.CreatedAt,
		})
	}
	return nil
}

func (s *PostsService) attachMediaToPosts(ctx context.Context, posts []api.Post) error {
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

func normalizeMediaIDs(v *[]api.MediaId) ([]uuid.UUID, error) {
	if v == nil {
		return nil, nil
	}
	ids := *v
	if len(ids) == 0 {
		return nil, nil
	}
	if len(ids) > 4 {
		return nil, NewError(http.StatusBadRequest, "invalid_request", "too many mediaIds")
	}
	seen := make(map[uuid.UUID]struct{}, len(ids))
	out := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		uid := uuid.UUID(id)
		if _, ok := seen[uid]; ok {
			return nil, NewError(http.StatusBadRequest, "invalid_request", "duplicate mediaId")
		}
		seen[uid] = struct{}{}
		out = append(out, uid)
	}
	return out, nil
}

func (s *PostsService) Delete(ctx context.Context, user auth.User, postID api.PostId) error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	ownerID, err := s.store.Q.GetPostOwnerByID(ctx, postID)
	if err != nil {
		if err == sql.ErrNoRows {
			return NewError(http.StatusNotFound, "not_found", "post not found")
		}
		return err
	}
	if ownerID != user.ID {
		return NewError(http.StatusForbidden, "forbidden", "not the owner")
	}

	_, err = s.store.Q.MarkPostDeleted(ctx, sqlc.MarkPostDeletedParams{ID: postID, UserID: user.ID})
	if err != nil {
		if err == sql.ErrNoRows {
			return NewError(http.StatusNotFound, "not_found", "post not found")
		}
		return err
	}

	if s.cache != nil {
		key := timelineKeyGlobal()
		_ = s.cache.ZRem(ctx, key, postID.String())
		_ = s.cache.Delete(ctx, reactionCacheKey(postID))
	}
	pid := postID
	s.publish(ctx, realtime.Event{Type: realtime.EventPostDeleted, PostId: &pid})
	return nil
}

func timelineKeyGlobal() string { return "timeline:global" }

// TimelineKeyGlobal returns the Redis key used for the global timeline.
// Primarily used by tests living outside this package.
func TimelineKeyGlobal() string { return timelineKeyGlobal() }

func (s *PostsService) publish(ctx context.Context, event realtime.Event) {
	if s.publisher == nil {
		return
	}
	_ = s.publisher.Publish(ctx, event)
}
