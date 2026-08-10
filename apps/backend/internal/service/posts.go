package service

import (
	"context"
	"database/sql"
	"errors"
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
	"github.com/jackc/pgx/v5/pgconn"
)

const (
	defaultMaxPostContentRunes = 1000
	defaultThreadDepth         = 2
	defaultThreadChildLimit    = 5
	maxThreadDepth             = 5
	maxThreadChildLimit        = 30
)

type PostsService struct {
	store         *repository.Store
	cache         cache.Cache
	publisher     realtime.Publisher
	reactions     *ReactionsService
	notifications *NotificationsService
}

func NewPostsService(store *repository.Store, cache cache.Cache, publisher realtime.Publisher) *PostsService {
	return &PostsService{store: store, cache: cache, publisher: publisher}
}

func (s *PostsService) SetReactionsService(reactions *ReactionsService) {
	s.reactions = reactions
}

func (s *PostsService) SetNotificationsService(notifications *NotificationsService) {
	s.notifications = notifications
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

	// At least one of content, media, or referenceId must be present
	if content == "" && len(mediaIDs) == 0 && req.ReferenceId == nil {
		return api.Post{}, NewError(http.StatusBadRequest, "invalid_request", "content, media, or referenceId required")
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

	autoDetectedReference := false
	if req.ReferenceId == nil && content != "" {
		if refID := ExtractPostReference(content); refID != nil {
			postId := api.PostId(*refID)
			req.ReferenceId = &postId
			autoDetectedReference = true
		}
	}

	var created sqlc.CreatePostRow
	var createdNotifications []CreatedNotification
	if err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		var parentID, rootID, referenceID uuid.NullUUID
		var parentAuthorID, referenceAuthorID uuid.UUID
		var mentionedIDs []uuid.UUID
		createdNotifications = nil
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
			parentAuthorID = parent.UserID
			if parent.RootID.Valid {
				rootID = parent.RootID
			} else {
				rootID = uuid.NullUUID{UUID: parent.ID, Valid: true}
			}
		}

		if req.ReferenceId != nil {
			ref, err := q.GetPostThreadInfoByID(ctx, *req.ReferenceId)
			if err != nil {
				if err == sql.ErrNoRows {
					if !autoDetectedReference {
						return NewError(http.StatusNotFound, "not_found", "referenced post not found")
					}
				} else {
					return err
				}
			} else if ref.DeletedAt.Valid {
				if !autoDetectedReference {
					return NewError(http.StatusNotFound, "not_found", "referenced post not found")
				}
			} else {
				referenceID = uuid.NullUUID{UUID: ref.ID, Valid: true}
				referenceAuthorID = ref.UserID
			}
		}

		c, err := q.CreatePost(ctx, sqlc.CreatePostParams{
			UserID:      user.ID,
			Content:     content,
			ParentID:    parentID,
			RootID:      rootID,
			ReferenceID: referenceID,
		})
		if err != nil {
			if isUniqueViolation(err) && req.ReferenceId != nil && content == "" {
				return NewError(http.StatusConflict, "already_boosted", "you have already boosted this post")
			}
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
				mentionedIDs = append(mentionedIDs, u.ID)
			}
		}

		for _, target := range PostNotifyTargets(created.ID, user.ID, parentAuthorID, referenceAuthorID, mentionedIDs) {
			id, err := Notify(ctx, q, target)
			if err != nil {
				return err
			}
			if id != uuid.Nil {
				createdNotifications = append(createdNotifications, CreatedNotification{ID: id, UserID: target.UserID})
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
	if err := s.attachBoostCountsToPosts(ctx, posts); err != nil {
		return api.Post{}, err
	}
	if err := s.attachReferencesToPosts(ctx, posts, nil); err != nil {
		return api.Post{}, err
	}
	post = posts[0]

	if s.cache != nil {
		key := timelineKeyGlobal()
		score := float64(post.CreatedAt.UnixMilli())
		_ = s.cache.ZAdd(ctx, key, cache.Z{Score: score, Member: post.Id.String()})
	}

	s.publish(ctx, realtime.Event{Type: realtime.EventPostCreated, Post: &post})
	s.notifications.Publish(ctx, s.publisher, createdNotifications)
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
	if err := s.attachBoostCountsToPosts(ctx, posts); err != nil {
		return api.Post{}, err
	}
	if err := s.attachReferencesToPosts(ctx, posts, userID); err != nil {
		return api.Post{}, err
	}
	return posts[0], nil
}

func (s *PostsService) GetContext(ctx context.Context, postID api.PostId, userID *api.UserId) (api.PostContext, error) {
	if s.store == nil {
		return api.PostContext{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	post, err := s.getVisiblePost(ctx, postID)
	if err != nil {
		return api.PostContext{}, err
	}

	relatedIDs := make([]uuid.UUID, 0, 2)
	if post.ParentId != nil {
		relatedIDs = append(relatedIDs, uuid.UUID(*post.ParentId))
	}
	if post.RootId != nil && (post.ParentId == nil || *post.RootId != *post.ParentId) {
		relatedIDs = append(relatedIDs, uuid.UUID(*post.RootId))
	}

	relatedByID, err := s.getVisiblePostsByIDs(ctx, relatedIDs)
	if err != nil {
		return api.PostContext{}, err
	}

	posts := []api.Post{post}
	if post.ParentId != nil {
		if parent, ok := relatedByID[uuid.UUID(*post.ParentId)]; ok {
			posts = append(posts, parent)
		}
	}
	if post.RootId != nil {
		if root, ok := relatedByID[uuid.UUID(*post.RootId)]; ok {
			posts = append(posts, root)
		}
	}
	if err := s.attachPostDetails(ctx, posts, userID); err != nil {
		return api.PostContext{}, err
	}

	result := api.PostContext{Post: posts[0]}
	next := 1
	if post.ParentId != nil {
		if next < len(posts) && posts[next].Id == *post.ParentId {
			parent := posts[next]
			result.Parent = &parent
			next++
		}
	}
	if post.RootId != nil {
		if result.Parent != nil && *post.RootId == result.Parent.Id {
			result.Root = result.Parent
		} else if next < len(posts) && posts[next].Id == *post.RootId {
			root := posts[next]
			result.Root = &root
		}
	}
	return result, nil
}

func (s *PostsService) GetThread(ctx context.Context, postID api.PostId, params api.GetPostsPostIdThreadParams, userID *api.UserId) (api.ThreadPage, error) {
	if s.store == nil {
		return api.ThreadPage{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	depth := defaultThreadDepth
	if params.Depth != nil {
		depth = *params.Depth
	}
	if depth < 1 || depth > maxThreadDepth {
		return api.ThreadPage{}, NewError(http.StatusBadRequest, "invalid_request", "depth must be 1..5")
	}

	childLimit := defaultThreadChildLimit
	if params.ChildLimit != nil {
		childLimit = *params.ChildLimit
	}
	if childLimit < 1 || childLimit > maxThreadChildLimit {
		return api.ThreadPage{}, NewError(http.StatusBadRequest, "invalid_request", "childLimit must be 1..30")
	}

	root, err := s.getVisiblePost(ctx, postID)
	if err != nil {
		return api.ThreadPage{}, err
	}

	anchorID := postID
	if params.AnchorNodeId != nil {
		anchorID = *params.AnchorNodeId
	}

	anchor := root
	if anchorID != postID {
		anchor, err = s.getVisiblePost(ctx, anchorID)
		if err != nil {
			return api.ThreadPage{}, err
		}
		ok, err := s.store.Q.IsPostDescendantOf(ctx, sqlc.IsPostDescendantOfParams{
			AncestorID:   uuid.UUID(postID),
			DescendantID: uuid.UUID(anchorID),
		})
		if err != nil {
			return api.ThreadPage{}, err
		}
		if !ok {
			return api.ThreadPage{}, NewError(http.StatusBadRequest, "invalid_request", "anchorNodeId is not in the requested thread")
		}
	}

	cursor, err := decodeCursor(params.Cursor)
	if err != nil {
		return api.ThreadPage{}, NewError(http.StatusBadRequest, "invalid_request", "invalid cursor")
	}

	nodes := make([]api.Post, 0, 1+childLimit*depth)
	nodeIDs := make(map[uuid.UUID]struct{}, 1+childLimit*depth)
	addNode := func(post api.Post) {
		if _, exists := nodeIDs[post.Id]; exists {
			return
		}
		nodeIDs[post.Id] = struct{}{}
		nodes = append(nodes, post)
	}
	addNode(root)
	addNode(anchor)

	children := make([]api.ThreadChildren, 0)
	parentIDs := []uuid.UUID{uuid.UUID(anchorID)}
	for level := 1; level <= depth && len(parentIDs) > 0; level++ {
		queryParams := sqlc.ListThreadChildrenPageParams{
			ParentIds:    parentIDs,
			LimitPlusOne: int32(childLimit + 1),
		}
		if level == 1 && cursor != nil {
			queryParams.CursorParentID = uuid.NullUUID{UUID: uuid.UUID(anchorID), Valid: true}
			queryParams.CursorTime = sql.NullTime{Time: time.UnixMilli(cursor.Score).UTC(), Valid: true}
			cursorID, perr := uuid.Parse(cursor.ID)
			if perr != nil {
				return api.ThreadPage{}, NewError(http.StatusBadRequest, "invalid_request", "invalid cursor")
			}
			queryParams.CursorID = uuid.NullUUID{UUID: cursorID, Valid: true}
		}

		rows, err := s.store.Q.ListThreadChildrenPage(ctx, queryParams)
		if err != nil {
			return api.ThreadPage{}, err
		}

		rowsByParent := make(map[uuid.UUID][]sqlc.ListThreadChildrenPageRow, len(parentIDs))
		for _, row := range rows {
			rowsByParent[row.ThreadParentID] = append(rowsByParent[row.ThreadParentID], row)
		}

		nextParentIDs := make([]uuid.UUID, 0)
		for _, parentID := range parentIDs {
			parentRows := rowsByParent[parentID]
			hasMore := len(parentRows) > childLimit
			if hasMore {
				parentRows = parentRows[:childLimit]
			}

			childIDs := make([]api.PostId, 0, len(parentRows))
			for _, row := range parentRows {
				post := mapThreadChildrenRow(row)
				addNode(post)
				childIDs = append(childIDs, api.PostId(row.ID))
				nextParentIDs = append(nextParentIDs, row.ID)
			}

			var nextCursor *string
			if hasMore && len(parentRows) > 0 {
				last := parentRows[len(parentRows)-1]
				n := encodeCursor(timelineCursor{Score: last.CreatedAt.UnixMilli(), ID: last.ID.String()})
				nextCursor = &n
			}
			children = append(children, api.ThreadChildren{
				ParentId:   api.PostId(parentID),
				ChildIds:   childIDs,
				HasMore:    hasMore,
				NextCursor: nextCursor,
			})
		}
		parentIDs = nextParentIDs
	}

	if err := s.attachPostDetails(ctx, nodes, userID); err != nil {
		return api.ThreadPage{}, err
	}

	var hydratedRoot, hydratedAnchor api.Post
	for _, post := range nodes {
		if post.Id == root.Id {
			hydratedRoot = post
		}
		if post.Id == anchor.Id {
			hydratedAnchor = post
		}
	}
	return api.ThreadPage{
		Root:     hydratedRoot,
		Anchor:   hydratedAnchor,
		Nodes:    nodes,
		Children: children,
	}, nil
}

func (s *PostsService) getVisiblePost(ctx context.Context, postID api.PostId) (api.Post, error) {
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
	return mapPostRow(row), nil
}

func (s *PostsService) getVisiblePostsByIDs(ctx context.Context, ids []uuid.UUID) (map[uuid.UUID]api.Post, error) {
	result := make(map[uuid.UUID]api.Post, len(ids))
	if len(ids) == 0 {
		return result, nil
	}
	rows, err := s.store.Q.GetPostsByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		result[row.ID] = mapPostsByIDsRow(row)
	}
	return result, nil
}

// GetHydratedPostsByIDs returns fully hydrated posts (media, reactions, mentions,
// counts, reference) keyed by post ID. Deleted posts are omitted. Used by
// NotificationsService to embed posts without an N+1 per notification.
func (s *PostsService) GetHydratedPostsByIDs(ctx context.Context, ids []uuid.UUID, userID *api.UserId) (map[uuid.UUID]api.Post, error) {
	result := make(map[uuid.UUID]api.Post, len(ids))
	if s.store == nil || len(ids) == 0 {
		return result, nil
	}
	rows, err := s.store.Q.GetPostsByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	posts := make([]api.Post, 0, len(rows))
	for _, row := range rows {
		posts = append(posts, mapPostsByIDsRow(row))
	}
	if err := s.attachPostDetails(ctx, posts, userID); err != nil {
		return nil, err
	}
	for _, post := range posts {
		result[post.Id] = post
	}
	return result, nil
}

func (s *PostsService) attachPostDetails(ctx context.Context, posts []api.Post, userID *api.UserId) error {
	if err := s.attachMediaToPosts(ctx, posts); err != nil {
		return err
	}
	if err := s.attachReactionsToPosts(ctx, posts, userID); err != nil {
		return err
	}
	if err := s.attachMentionsToPosts(ctx, posts); err != nil {
		return err
	}
	if err := s.attachReplyCountsToPosts(ctx, posts); err != nil {
		return err
	}
	if err := s.attachBoostCountsToPosts(ctx, posts); err != nil {
		return err
	}
	return s.attachReferencesToPosts(ctx, posts, userID)
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

	var excludeForeignReplies sql.NullBool
	if params.ExcludeForeignReplies != nil && *params.ExcludeForeignReplies {
		excludeForeignReplies = sql.NullBool{Bool: true, Valid: true}
	}

	rows, err := s.store.Q.ListPostsByUsername(ctx, sqlc.ListPostsByUsernameParams{
		Username:              uname,
		MediaType:             mediaType,
		OnlyReplies:           onlyReplies,
		ExcludeForeignReplies: excludeForeignReplies,
		CursorTime:            cTime,
		CursorID:              cID,
		Limit:                 int32(limit),
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
	if err := s.attachBoostCountsToPosts(ctx, items); err != nil {
		return api.UserPostsPage{}, err
	}
	if err := s.attachReferencesToPosts(ctx, items, userID); err != nil {
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
	if err := s.attachBoostCountsToPosts(ctx, items); err != nil {
		return api.TimelinePage{}, err
	}
	if err := s.attachReferencesToPosts(ctx, items, userID); err != nil {
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

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func (s *PostsService) attachBoostCountsToPosts(ctx context.Context, posts []api.Post) error {
	if len(posts) == 0 {
		return nil
	}
	ids := make([]uuid.UUID, len(posts))
	for i, p := range posts {
		ids[i] = p.Id
	}
	rows, err := s.store.Q.CountBoostsByPostIDs(ctx, ids)
	if err != nil {
		return err
	}
	index := make(map[uuid.UUID]int, len(posts))
	for i, p := range posts {
		index[p.Id] = i
	}
	for _, row := range rows {
		if !row.ReferenceID.Valid {
			continue
		}
		if pi, ok := index[row.ReferenceID.UUID]; ok {
			posts[pi].BoostCount = int(row.BoostCount)
		}
	}
	return nil
}

func (s *PostsService) attachReferencesToPosts(ctx context.Context, posts []api.Post, userID *api.UserId) error {
	if len(posts) == 0 {
		return nil
	}
	refIDs := make([]uuid.UUID, 0)
	seen := make(map[uuid.UUID]bool)
	for _, p := range posts {
		if p.ReferenceId != nil {
			rid := uuid.UUID(*p.ReferenceId)
			if !seen[rid] {
				refIDs = append(refIDs, rid)
				seen[rid] = true
			}
		}
	}
	if len(refIDs) == 0 {
		return nil
	}

	refRows, err := s.store.Q.GetPostsByIDs(ctx, refIDs)
	if err != nil {
		return err
	}
	refPosts := make([]api.Post, len(refRows))
	refMap := make(map[uuid.UUID]int, len(refRows))
	for i, row := range refRows {
		refPosts[i] = mapPostsByIDsRow(row)
		refMap[row.ID] = i
	}

	if err := s.attachMediaToPosts(ctx, refPosts); err != nil {
		return err
	}
	if err := s.attachReactionsToPosts(ctx, refPosts, userID); err != nil {
		return err
	}
	if err := s.attachMentionsToPosts(ctx, refPosts); err != nil {
		return err
	}
	if err := s.attachReplyCountsToPosts(ctx, refPosts); err != nil {
		return err
	}
	if err := s.attachBoostCountsToPosts(ctx, refPosts); err != nil {
		return err
	}

	for i, p := range posts {
		if p.ReferenceId != nil {
			rid := uuid.UUID(*p.ReferenceId)
			if ri, ok := refMap[rid]; ok {
				ref := refPosts[ri]
				posts[i].Reference = &ref
			}
		}
	}
	return nil
}
