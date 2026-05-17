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
	"backend/internal/config"
	"backend/internal/db/sqlc"
	"backend/internal/realtime"
	"backend/internal/repository"

	"github.com/google/uuid"
)

const (
	defaultMaxPostContentRunes = 1000
)

type PostsService struct {
	store     *repository.Store
	cache     cache.Cache
	publisher realtime.Publisher
	reactions *ReactionsService
}

func NewPostsService(store *repository.Store, cache cache.Cache, publisher realtime.Publisher) *PostsService {
	return &PostsService{store: store, cache: cache, publisher: publisher}
}

func (s *PostsService) SetReactionsService(reactions *ReactionsService) {
	s.reactions = reactions
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
	maxRunes := defaultMaxPostContentRunes
	if cfg := config.GetGlobalConfig(); cfg != nil {
		maxRunes = cfg.Post.MaxContentLength
	}
	if content != "" && utf8.RuneCountInString(content) > maxRunes {
		return api.Post{}, NewError(http.StatusBadRequest, "invalid_request", fmt.Sprintf("content exceeds maximum length of %d characters", maxRunes))
	}

	mentionNames := ExtractMentions(content, MaxMentionsPerPost)

	var created sqlc.CreatePostRow
	if err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		var parentID, rootID uuid.NullUUID
		if req.ParentId != nil {
			parent, err := q.GetPostThreadInfoByID(ctx, *req.ParentId)
			if err != nil {
				if err == sql.ErrNoRows {
					return NewError(http.StatusNotFound, "not_found", "parent post not found")
				}
				return err
			}
			if parent.DeletedAt.Valid {
				return NewError(http.StatusNotFound, "not_found", "parent post not found")
			}
			parentID = uuid.NullUUID{UUID: parent.ID, Valid: true}
			if parent.RootID.Valid {
				rootID = parent.RootID
			} else {
				rootID = uuid.NullUUID{UUID: parent.ID, Valid: true}
			}
		}

		c, err := q.CreatePost(ctx, sqlc.CreatePostParams{
			UserID:   user.ID,
			Content:  content,
			ParentID: parentID,
			RootID:   rootID,
		})
		if err != nil {
			return err
		}
		created = c

		if len(mediaIDs) > 0 {
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
		}

		if len(mentionNames) > 0 {
			found, err := q.FindUsersByUsernames(ctx, mentionNames)
			if err != nil {
				return err
			}
			for _, u := range found {
				if err := q.InsertPostMention(ctx, sqlc.InsertPostMentionParams{
					PostID:          created.ID,
					MentionedUserID: u.ID,
				}); err != nil {
					return err
				}
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
	posts := []api.Post{post}
	if err := s.attachMentionsToPosts(ctx, posts); err != nil {
		return api.Post{}, err
	}
	if err := s.attachReplyCountsToPosts(ctx, posts); err != nil {
		return api.Post{}, err
	}
	post = posts[0]

	if s.cache != nil {
		key := timelineKeyGlobal()
		score := float64(post.CreatedAt.UnixMilli())
		_ = s.cache.ZAdd(ctx, key, cache.Z{Score: score, Member: post.Id.String()})
	}

	s.publish(ctx, realtime.Event{Type: realtime.EventPostCreated, Post: &post})
	return post, nil
}

func (s *PostsService) Get(ctx context.Context, postID api.PostId, userID *api.UserId) (api.Post, error) {
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
	posts := []api.Post{post}
	if err := s.attachReactionsToPosts(ctx, posts, userID); err != nil {
		return api.Post{}, err
	}
	if err := s.attachMentionsToPosts(ctx, posts); err != nil {
		return api.Post{}, err
	}
	if err := s.attachReplyCountsToPosts(ctx, posts); err != nil {
		return api.Post{}, err
	}
	return posts[0], nil
}

func (s *PostsService) ListByUsername(ctx context.Context, username api.Username, params api.GetUsersUsernamePostsParams, userID *api.UserId) (api.UserPostsPage, error) {
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
	var mediaType sql.NullString
	if params.MediaType != nil {
		mt := strings.TrimSpace(string(*params.MediaType))
		switch mt {
		case "image", "video", "media":
			mediaType = sql.NullString{String: mt, Valid: true}
		default:
			return api.UserPostsPage{}, NewError(http.StatusBadRequest, "invalid_request", "mediaType must be image, video, or media")
		}
	}
	if cursor != nil {
		ct := time.UnixMilli(cursor.Score).UTC()
		cTime = sql.NullTime{Time: ct, Valid: true}
		uid, err := uuid.Parse(cursor.ID)
		if err == nil {
			cID = uuid.NullUUID{UUID: uid, Valid: true}
		}
	}

	var onlyReplies sql.NullBool
	if params.OnlyReplies != nil && *params.OnlyReplies {
		onlyReplies = sql.NullBool{Bool: true, Valid: true}
	}

	rows, err := s.store.Q.ListPostsByUsername(ctx, sqlc.ListPostsByUsernameParams{
		Username:    uname,
		MediaType:   mediaType,
		OnlyReplies: onlyReplies,
		CursorTime:  cTime,
		CursorID:    cID,
		Limit:       int32(limit),
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
	if err := s.attachReactionsToPosts(ctx, items, userID); err != nil {
		return api.UserPostsPage{}, err
	}
	if err := s.attachMentionsToPosts(ctx, items); err != nil {
		return api.UserPostsPage{}, err
	}
	if err := s.attachReplyCountsToPosts(ctx, items); err != nil {
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

func (s *PostsService) attachReactionsToPosts(ctx context.Context, posts []api.Post, userID *api.UserId) error {
	for i := range posts {
		posts[i].Reactions = []api.ReactionCount{}
	}
	if s.reactions == nil || len(posts) == 0 {
		return nil
	}
	ids := make([]api.PostId, 0, len(posts))
	for _, post := range posts {
		ids = append(ids, post.Id)
	}
	byPost, err := s.reactions.ListForPosts(ctx, ids, userID)
	if err != nil {
		return err
	}
	for i := range posts {
		if reactions, ok := byPost[posts[i].Id]; ok {
			posts[i].Reactions = reactions
		}
	}
	return nil
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
		media := api.Media{
			Id:        row.MediaID,
			Type:      api.MediaType(row.Type),
			Width:     int(row.Width),
			Height:    int(row.Height),
			Blurhash:  nullStringToPtr(row.Blurhash),
			CreatedAt: row.CreatedAt,
		}

		// Set URL based on media type
		if row.Type == "video" {
			media.Url = mediaVideoURL(row.MediaID, row.Ext)
			// Add duration and thumbnail for videos
			if row.Duration.Valid {
				f32 := float32(row.Duration.Float64)
				media.Duration = &f32
			}
			thumbnailURL := mediaThumbnailURL(row.MediaID)
			media.ThumbnailUrl = &thumbnailURL
		} else {
			media.Url = mediaImageURL(row.MediaID, row.Ext)
		}

		post.Media = append(post.Media, media)
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

		media := api.Media{
			Id:        row.MediaID,
			Type:      api.MediaType(row.Type),
			Width:     int(row.Width),
			Height:    int(row.Height),
			Blurhash:  nullStringToPtr(row.Blurhash),
			CreatedAt: row.CreatedAt,
		}

		// Set URL based on media type
		if row.Type == "video" {
			media.Url = mediaVideoURL(row.MediaID, row.Ext)
			// Add duration and thumbnail for videos
			if row.Duration.Valid {
				f32 := float32(row.Duration.Float64)
				media.Duration = &f32
			}
			thumbnailURL := mediaThumbnailURL(row.MediaID)
			media.ThumbnailUrl = &thumbnailURL
		} else {
			media.Url = mediaImageURL(row.MediaID, row.Ext)
		}

		posts[pi].Media = append(posts[pi].Media, media)
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

func (s *PostsService) attachMentionsToPosts(ctx context.Context, posts []api.Post) error {
	for i := range posts {
		posts[i].Mentions = []api.MentionUser{}
	}
	if s.store == nil || len(posts) == 0 {
		return nil
	}
	ids := make([]uuid.UUID, 0, len(posts))
	index := make(map[uuid.UUID]int, len(posts))
	for i := range posts {
		ids = append(ids, posts[i].Id)
		index[posts[i].Id] = i
	}
	rows, err := s.store.Q.ListMentionsForPosts(ctx, ids)
	if err != nil {
		return err
	}
	for _, row := range rows {
		pi, ok := index[row.PostID]
		if !ok {
			continue
		}
		mu := api.MentionUser{
			Id:       row.UserID,
			Username: row.Username,
		}
		if row.DisplayName.Valid {
			if v := strings.TrimSpace(row.DisplayName.String); v != "" {
				mu.DisplayName = &v
			}
		}
		if row.AvatarMediaID.Valid {
			ext := ""
			if row.AvatarExt.Valid {
				ext = row.AvatarExt.String
			}
			url := mediaImageURL(row.AvatarMediaID.UUID, ext)
			mu.AvatarUrl = &url
		}
		posts[pi].Mentions = append(posts[pi].Mentions, mu)
	}
	return nil
}

func (s *PostsService) attachReplyCountsToPosts(ctx context.Context, posts []api.Post) error {
	if s.store == nil || len(posts) == 0 {
		return nil
	}
	ids := make([]uuid.UUID, 0, len(posts))
	index := make(map[uuid.UUID]int, len(posts))
	for i := range posts {
		ids = append(ids, posts[i].Id)
		index[posts[i].Id] = i
		posts[i].ReplyCount = 0
	}
	rows, err := s.store.Q.CountRepliesByParentIDs(ctx, ids)
	if err != nil {
		return err
	}
	for _, row := range rows {
		pi, ok := index[row.ParentID.UUID]
		if !ok {
			continue
		}
		posts[pi].ReplyCount = int(row.ReplyCount)
	}
	return nil
}

func (s *PostsService) ListReplies(ctx context.Context, parentID api.PostId, params api.GetPostsPostIdRepliesParams, userID *api.UserId) (api.TimelinePage, error) {
	if s.store == nil {
		return api.TimelinePage{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	parent, err := s.store.Q.GetPostThreadInfoByID(ctx, parentID)
	if err != nil {
		if err == sql.ErrNoRows {
			return api.TimelinePage{}, NewError(http.StatusNotFound, "not_found", "post not found")
		}
		return api.TimelinePage{}, err
	}
	if parent.DeletedAt.Valid {
		return api.TimelinePage{}, NewError(http.StatusNotFound, "not_found", "post not found")
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

	var cTime sql.NullTime
	var cID uuid.NullUUID
	if cursor != nil {
		ct := time.UnixMilli(cursor.Score).UTC()
		cTime = sql.NullTime{Time: ct, Valid: true}
		uid, perr := uuid.Parse(cursor.ID)
		if perr == nil {
			cID = uuid.NullUUID{UUID: uid, Valid: true}
		}
	}

	rows, err := s.store.Q.ListRepliesByParentID(ctx, sqlc.ListRepliesByParentIDParams{
		ParentID:   uuid.NullUUID{UUID: parentID, Valid: true},
		CursorTime: cTime,
		CursorID:   cID,
		Limit:      int32(limit),
	})
	if err != nil {
		return api.TimelinePage{}, err
	}

	items := make([]api.Post, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapRepliesRow(row))
	}
	if err := s.attachMediaToPosts(ctx, items); err != nil {
		return api.TimelinePage{}, err
	}
	if err := s.attachReactionsToPosts(ctx, items, userID); err != nil {
		return api.TimelinePage{}, err
	}
	if err := s.attachMentionsToPosts(ctx, items); err != nil {
		return api.TimelinePage{}, err
	}
	if err := s.attachReplyCountsToPosts(ctx, items); err != nil {
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
