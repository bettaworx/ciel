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
	store     *repository.Store
	cache     cache.Cache
	reactions *ReactionsService
	posts     *PostsService
}

func NewTimelineService(store *repository.Store, cache cache.Cache) *TimelineService {
	return &TimelineService{store: store, cache: cache}
}

func (s *TimelineService) SetReactionsService(reactions *ReactionsService) {
	s.reactions = reactions
}

func (s *TimelineService) SetPostsService(posts *PostsService) {
	s.posts = posts
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
	return s.listFromRedis(ctx, timelineKeyGlobal(), limit, cursor)
}

func (s *TimelineService) Get(ctx context.Context, params api.GetTimelineParams, userID *api.UserId) (api.TimelinePage, error) {
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
		postIDs, next, okRedis := s.listFromRedis(ctx, timelineKeyGlobal(), limit, cursor)
		if okRedis {
			posts, err := s.fetchPosts(ctx, timelineKeyGlobal(), postIDs, userID)
			if err != nil {
				return api.TimelinePage{}, err
			}
			posts = dropRepliesToHiddenParents(posts)
			if err := s.hydratePosts(ctx, posts, userID); err != nil {
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
	rows, err := s.store.Q.ListTimelinePosts(ctx, sqlc.ListTimelinePostsParams{
		ViewerID:   nullUUIDFromPtr(userID),
		CursorTime: cTime,
		CursorID:   cID,
		Limit:      int32(limit),
	})
	if err != nil {
		return api.TimelinePage{}, err
	}

	items := make([]api.Post, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapTimelineRow(row))
	}
	items = dropRepliesToHiddenParents(items)
	if err := s.hydratePosts(ctx, items, userID); err != nil {
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

// hydratePosts fills in everything a timeline row needs beyond the post itself.
// Every feed goes through here so the shapes stay identical.
func (s *TimelineService) hydratePosts(ctx context.Context, posts []api.Post, userID *api.UserId) error {
	if err := s.attachMediaToPosts(ctx, posts); err != nil {
		return err
	}
	if err := s.attachViewerStateToPosts(ctx, posts, userID); err != nil {
		return err
	}
	if err := s.attachReplyCountsToPosts(ctx, posts); err != nil {
		return err
	}
	if s.posts == nil {
		return nil
	}
	if err := s.posts.attachBoostCountsToPosts(ctx, posts); err != nil {
		return err
	}
	return s.posts.attachReferencesToPosts(ctx, posts, userID)
}

// GetHome returns the timeline of posts by the viewer and everyone they follow.
//
// Unlike the global timeline this cannot trust an empty Redis result. A per-user
// ZSET is always partial — it is capped, it expires, and it is dropped outright
// on follow/unfollow — so "Redis returned nothing" and "the timeline is empty"
// are different things. The cache is therefore only used when it can fill the
// whole page; anything else falls through to the database, which is the source
// of truth.
func (s *TimelineService) GetHome(ctx context.Context, params api.GetTimelineHomeParams, userID api.UserId) (api.TimelinePage, error) {
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

	key := timelineKeyHome(userID)
	if s.cache != nil {
		// next is only set when the page came back full, which is exactly the
		// condition under which the cache is trustworthy here.
		postIDs, next, okRedis := s.listFromRedis(ctx, key, limit, cursor)
		if okRedis && next != nil {
			posts, err := s.fetchPosts(ctx, key, postIDs, &userID)
			if err != nil {
				return api.TimelinePage{}, err
			}
			// A post dropped by fetchPosts (deleted since being cached) would
			// leave a short page, so only serve it when nothing was lost.
			if len(posts) == limit {
				posts = dropRepliesToHiddenParents(posts)
				if err := s.hydratePosts(ctx, posts, &userID); err != nil {
					return api.TimelinePage{}, err
				}
				nc := encodeCursor(*next)
				return api.TimelinePage{Items: posts, NextCursor: &nc}, nil
			}
		}
	}

	var cTime sql.NullTime
	var cID uuid.NullUUID
	if cursor != nil {
		cTime = sql.NullTime{Time: time.UnixMilli(cursor.Score).UTC(), Valid: true}
		if uid, err := uuid.Parse(cursor.ID); err == nil {
			cID = uuid.NullUUID{UUID: uid, Valid: true}
		}
	}
	rows, err := s.store.Q.ListHomeTimelinePosts(ctx, sqlc.ListHomeTimelinePostsParams{
		ViewerID:   userID,
		CursorTime: cTime,
		CursorID:   cID,
		Limit:      int32(limit),
	})
	if err != nil {
		return api.TimelinePage{}, err
	}

	items := make([]api.Post, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapHomeTimelineRow(row))
	}
	items = dropRepliesToHiddenParents(items)
	if err := s.hydratePosts(ctx, items, &userID); err != nil {
		return api.TimelinePage{}, err
	}

	// Rebuild the cache on a first-page miss, so the next read can use it.
	if cursor == nil {
		s.warmHomeTimeline(ctx, userID)
	}

	var nextCursor *string
	if len(rows) == limit {
		last := rows[len(rows)-1]
		n := encodeCursor(timelineCursor{Score: last.CreatedAt.UnixMilli(), ID: last.ID.String()})
		nextCursor = &n
	}
	return api.TimelinePage{Items: items, NextCursor: nextCursor}, nil
}

// warmHomeTimeline repopulates a user's home ZSET from the database. Errors are
// ignored; a cold cache only costs a database query on the next read.
func (s *TimelineService) warmHomeTimeline(ctx context.Context, userID uuid.UUID) {
	if s.cache == nil {
		return
	}
	rows, err := s.store.Q.ListHomeTimelinePostIDs(ctx, sqlc.ListHomeTimelinePostIDsParams{
		ViewerID: userID,
		Limit:    homeTimelineMaxEntries,
	})
	if err != nil || len(rows) == 0 {
		return
	}
	members := make([]cache.Z, 0, len(rows))
	for _, row := range rows {
		members = append(members, cache.Z{Score: float64(row.CreatedAt.UnixMilli()), Member: row.ID.String()})
	}
	key := timelineKeyHome(userID)
	if err := s.cache.ZAdd(ctx, key, members...); err != nil {
		return
	}
	_ = s.cache.Expire(ctx, key, homeTimelineTTL)
}

func mapHomeTimelineRow(row sqlc.ListHomeTimelinePostsRow) api.Post {
	return api.Post{
		Id:          row.ID,
		Content:     row.Content,
		Media:       []api.Media{},
		Reactions:   []api.ReactionCount{},
		Mentions:    []api.MentionUser{},
		ParentId:    nullUUIDToPostIDPtr(row.ParentID),
		RootId:      nullUUIDToPostIDPtr(row.RootID),
		ReferenceId: nullUUIDToPostIDPtr(row.ReferenceID),
		ParentPrivate: &row.ParentPrivate,
		CreatedAt:   row.CreatedAt,
		DeletedAt:   nil,
		Author:      mapUserWithProfile(row.UserID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, uuid.NullUUID{}, sql.NullString{}, sql.NullString{}, 0, 0, sql.NullTime{}, sql.NullTime{}, row.IsPrivate),
	}
}

// attachViewerStateToPosts mirrors PostsService: the per-viewer fields are the
// same set wherever posts are read. The bookmarks service is reached through
// PostsService rather than injected again, since a timeline without one has no
// post hydration either.
func (s *TimelineService) attachViewerStateToPosts(ctx context.Context, posts []api.Post, userID *api.UserId) error {
	if err := s.attachReactionsToPosts(ctx, posts, userID); err != nil {
		return err
	}
	var bookmarks *BookmarksService
	if s.posts != nil {
		bookmarks = s.posts.bookmarks
	}
	return attachBookmarkListIDs(ctx, bookmarks, posts, userID)
}

func (s *TimelineService) attachReactionsToPosts(ctx context.Context, posts []api.Post, userID *api.UserId) error {
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

func (s *TimelineService) listFromRedis(ctx context.Context, key string, limit int, cursor *timelineCursor) (postIDs []uuid.UUID, next *timelineCursor, ok bool) {
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

// dropRepliesToHiddenParents removes replies whose parent the viewer cannot see
// because its author is private.
//
// Both feeds use this: the public timeline and the home timeline. A reply with
// no readable parent is a fragment of a conversation the viewer cannot follow,
// and it advertises that the private account posted something — following the
// public half of a conversation is enough to watch the private half happen.
//
// A viewer who does follow that account gets ParentPrivate false and keeps the
// reply as normal. The redacted parent card is for the places reached on
// purpose — a profile's replies tab, a post's own page — where the subject is
// that author's activity rather than a feed of everything.
//
// Applied after the page cursor is derived, so nothing is skipped on the next
// page; the page simply comes back shorter, as it already can when a cached
// post turns out to be deleted.
// DropRepliesToHiddenParents exposes the feed filter for tests living outside
// this package.
func DropRepliesToHiddenParents(posts []api.Post) []api.Post {
	return dropRepliesToHiddenParents(posts)
}

func dropRepliesToHiddenParents(posts []api.Post) []api.Post {
	kept := make([]api.Post, 0, len(posts))
	for _, post := range posts {
		if post.ParentPrivate != nil && *post.ParentPrivate {
			continue
		}
		kept = append(kept, post)
	}
	return kept
}

func (s *TimelineService) fetchPosts(ctx context.Context, key string, ids []uuid.UUID, userID *api.UserId) ([]api.Post, error) {
	if len(ids) == 0 {
		return []api.Post{}, nil
	}
	// The ZSETs hold ids only, so this re-read is what applies the privacy gate
	// to a cache hit. A post whose author just went private drops out here on the
	// very next request, without anything having to expire.
	rows, err := s.store.Q.GetPostsByIDs(ctx, sqlc.GetPostsByIDsParams{
		Ids:      ids,
		ViewerID: nullUUIDFromPtr(userID),
	})
	if err != nil {
		return nil, err
	}

	posts := make([]api.Post, 0, len(rows))
	found := make(map[uuid.UUID]struct{}, len(rows))
	for _, row := range rows {
		posts = append(posts, mapPostsByIDsRow(row))
		found[row.ID] = struct{}{}
	}

	// Remove missing (likely deleted) from cache. Deleted posts are never
	// removed from the per-user ZSETs on write, so this is how they get cleaned.
	//
	// Never do this to the global ZSET. A row can now also be missing because
	// this particular viewer may not see its author, and evicting on that would
	// let one stranger's request strip a private user's posts out of a shared
	// timeline for everybody, permanently. Per-user home ZSETs are already
	// treated as lossy — capped, expiring, dropped on follow changes, and only
	// trusted when they fill a whole page — so an over-eager eviction there
	// costs nothing but a database fallback.
	if s.cache != nil && key != timelineKeyGlobal() && len(found) != len(ids) {
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

func (s *TimelineService) attachReplyCountsToPosts(ctx context.Context, posts []api.Post) error {
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

func mapTimelineRow(row sqlc.ListTimelinePostsRow) api.Post {
	return api.Post{
		Id:          row.ID,
		Content:     row.Content,
		Media:       []api.Media{},
		Reactions:   []api.ReactionCount{},
		Mentions:    []api.MentionUser{},
		ParentId:    nullUUIDToPostIDPtr(row.ParentID),
		RootId:      nullUUIDToPostIDPtr(row.RootID),
		ReferenceId: nullUUIDToPostIDPtr(row.ReferenceID),
		ParentPrivate: &row.ParentPrivate,
		CreatedAt:   row.CreatedAt,
		DeletedAt:   nil,
		Author:      mapUserWithProfile(row.UserID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, uuid.NullUUID{}, sql.NullString{}, sql.NullString{}, 0, 0, sql.NullTime{}, sql.NullTime{}, row.IsPrivate),
	}
}

func mapPostsByIDsRow(row sqlc.GetPostsByIDsRow) api.Post {
	return api.Post{
		Id:          row.ID,
		Content:     row.Content,
		Media:       []api.Media{},
		Reactions:   []api.ReactionCount{},
		Mentions:    []api.MentionUser{},
		ParentId:    nullUUIDToPostIDPtr(row.ParentID),
		RootId:      nullUUIDToPostIDPtr(row.RootID),
		ReferenceId: nullUUIDToPostIDPtr(row.ReferenceID),
		ParentPrivate: &row.ParentPrivate,
		CreatedAt:   row.CreatedAt,
		DeletedAt:   nil,
		Author:      mapUserWithProfile(row.UserID, row.Username, row.UserCreatedAt, row.DisplayName, row.Bio, row.AvatarMediaID, row.AvatarExt, uuid.NullUUID{}, sql.NullString{}, sql.NullString{}, 0, 0, sql.NullTime{}, sql.NullTime{}, row.IsPrivate),
	}
}
