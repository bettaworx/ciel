package service

import (
	"context"
	"database/sql"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"backend/internal/api"
	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

// maxBookmarkLists caps how many lists one user can own. Lists are cheap, but
// the bookmark menu renders all of them at once and the set is sent whole on
// every save, so an unbounded count would hurt the client first.
const maxBookmarkLists = 50

// maxBookmarkListNameLength mirrors the CHECK constraint on bookmark_lists.name
// so an over-long name comes back as 400 rather than a 500 from the database.
const maxBookmarkListNameLength = 50

// maxBookmarkIconLength mirrors the Emoji schema's maxLength.
const maxBookmarkIconLength = 64

// defaultBookmarkIcon matches the column default, used when a create request
// omits the icon.
const defaultBookmarkIcon = "🔖"

// BookmarksService owns the caller's private bookmark lists. Bookmarks are not
// visible to anyone else, so unlike reactions there is nothing to publish, cache
// or notify about.
type BookmarksService struct {
	store *repository.Store
	posts *PostsService
}

func NewBookmarksService(store *repository.Store, posts *PostsService) *BookmarksService {
	return &BookmarksService{store: store, posts: posts}
}

// ListLists returns the caller's lists, default first then oldest first.
func (s *BookmarksService) ListLists(ctx context.Context, userID uuid.UUID) (api.BookmarkListsResponse, error) {
	if s.store == nil {
		return api.BookmarkListsResponse{}, errDatabaseUnavailable()
	}
	rows, err := s.store.Q.ListBookmarkListsByUser(ctx, userID)
	if err != nil {
		return api.BookmarkListsResponse{}, err
	}
	items := make([]api.BookmarkList, 0, len(rows))
	for _, row := range rows {
		items = append(items, api.BookmarkList{
			Id:        row.ID,
			Name:      nullStringToPtr(row.Name),
			Icon:      api.Emoji(row.Icon),
			IsDefault: row.IsDefault,
			PostCount: int(row.PostCount),
			CreatedAt: row.CreatedAt,
		})
	}
	return api.BookmarkListsResponse{Items: items}, nil
}

// CreateList adds a list. The count check and the insert share a transaction so
// two parallel creates cannot both slip past the cap.
func (s *BookmarksService) CreateList(ctx context.Context, userID uuid.UUID, req api.CreateBookmarkListRequest) (api.BookmarkList, error) {
	if s.store == nil {
		return api.BookmarkList{}, errDatabaseUnavailable()
	}
	name, err := validateBookmarkListName(req.Name)
	if err != nil {
		return api.BookmarkList{}, err
	}
	icon := defaultBookmarkIcon
	if req.Icon != nil {
		icon, err = validateBookmarkIcon(string(*req.Icon))
		if err != nil {
			return api.BookmarkList{}, err
		}
	}

	var created sqlc.CreateBookmarkListRow
	if err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		count, err := q.CountBookmarkListsByUser(ctx, userID)
		if err != nil {
			return err
		}
		if int(count) >= maxBookmarkLists {
			return NewError(http.StatusConflict, "bookmark_list_limit", "too many bookmark lists")
		}
		created, err = q.CreateBookmarkList(ctx, sqlc.CreateBookmarkListParams{
			UserID: userID,
			Name:   name,
			Icon:   icon,
		})
		return err
	}); err != nil {
		return api.BookmarkList{}, err
	}

	return api.BookmarkList{
		Id:        created.ID,
		Name:      nullStringToPtr(created.Name),
		Icon:      api.Emoji(created.Icon),
		IsDefault: created.IsDefault,
		PostCount: 0,
		CreatedAt: created.CreatedAt,
	}, nil
}

// UpdateList renames a list or changes its icon. The default list is editable;
// only deletion is blocked there.
func (s *BookmarksService) UpdateList(ctx context.Context, userID uuid.UUID, listID uuid.UUID, req api.UpdateBookmarkListRequest) (api.BookmarkList, error) {
	if s.store == nil {
		return api.BookmarkList{}, errDatabaseUnavailable()
	}
	var name sql.NullString
	if req.Name != nil {
		v, err := validateBookmarkListName(*req.Name)
		if err != nil {
			return api.BookmarkList{}, err
		}
		name = sql.NullString{String: v, Valid: true}
	}
	var icon sql.NullString
	if req.Icon != nil {
		v, err := validateBookmarkIcon(string(*req.Icon))
		if err != nil {
			return api.BookmarkList{}, err
		}
		icon = sql.NullString{String: v, Valid: true}
	}
	if !name.Valid && !icon.Valid {
		return api.BookmarkList{}, NewError(http.StatusBadRequest, "invalid_request", "name or icon required")
	}

	row, err := s.store.Q.UpdateBookmarkList(ctx, sqlc.UpdateBookmarkListParams{
		ID:     listID,
		UserID: userID,
		Name:   name,
		Icon:   icon,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return api.BookmarkList{}, errBookmarkListNotFound()
		}
		return api.BookmarkList{}, err
	}
	// The update does not return the count, and re-reading it just to answer one
	// PATCH is not worth a second query: the client already knows it.
	count, err := s.store.Q.GetBookmarkList(ctx, sqlc.GetBookmarkListParams{ID: listID, UserID: userID})
	if err != nil {
		return api.BookmarkList{}, err
	}
	return api.BookmarkList{
		Id:        row.ID,
		Name:      nullStringToPtr(row.Name),
		Icon:      api.Emoji(row.Icon),
		IsDefault: row.IsDefault,
		PostCount: int(count.PostCount),
		CreatedAt: row.CreatedAt,
	}, nil
}

// DeleteList removes a list and, by cascade, its bookmarks.
func (s *BookmarksService) DeleteList(ctx context.Context, userID uuid.UUID, listID uuid.UUID) error {
	if s.store == nil {
		return errDatabaseUnavailable()
	}
	n, err := s.store.Q.DeleteBookmarkList(ctx, sqlc.DeleteBookmarkListParams{ID: listID, UserID: userID})
	if err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	// Nothing deleted: either the list is not the caller's, or it is their
	// default one. Re-read to tell those apart, so a wrong id never leaks the
	// fact that the list exists.
	if _, err := s.store.Q.GetBookmarkList(ctx, sqlc.GetBookmarkListParams{ID: listID, UserID: userID}); err != nil {
		if err == sql.ErrNoRows {
			return errBookmarkListNotFound()
		}
		return err
	}
	return NewError(http.StatusConflict, "bookmark_list_default", "the default list cannot be deleted")
}

// ListPosts returns the posts saved in a list, most recently bookmarked first.
func (s *BookmarksService) ListPosts(ctx context.Context, userID uuid.UUID, listID uuid.UUID, limit *int, cursor *string) (api.UserPostsPage, error) {
	if s.store == nil || s.posts == nil {
		return api.UserPostsPage{}, errDatabaseUnavailable()
	}
	lim := 30
	if limit != nil {
		lim = *limit
	}
	if lim < 1 || lim > 100 {
		return api.UserPostsPage{}, NewError(http.StatusBadRequest, "invalid_request", "limit must be 1..100")
	}
	c, err := decodeCursor(cursor)
	if err != nil {
		return api.UserPostsPage{}, NewError(http.StatusBadRequest, "invalid_request", "invalid cursor")
	}
	if _, err := s.store.Q.GetBookmarkList(ctx, sqlc.GetBookmarkListParams{ID: listID, UserID: userID}); err != nil {
		if err == sql.ErrNoRows {
			return api.UserPostsPage{}, errBookmarkListNotFound()
		}
		return api.UserPostsPage{}, err
	}

	var cTime sql.NullTime
	var cID uuid.NullUUID
	if c != nil {
		cTime = sql.NullTime{Time: time.UnixMilli(c.Score).UTC(), Valid: true}
		if id, err := uuid.Parse(c.ID); err == nil {
			cID = uuid.NullUUID{UUID: id, Valid: true}
		}
	}

	rows, err := s.store.Q.ListBookmarkedPostIDs(ctx, sqlc.ListBookmarkedPostIDsParams{
		ListID:     listID,
		ViewerID:   uuid.NullUUID{UUID: userID, Valid: true},
		CursorTime: cTime,
		CursorID:   cID,
		Limit:      int32(lim),
	})
	if err != nil {
		return api.UserPostsPage{}, err
	}

	ids := make([]uuid.UUID, 0, len(rows))
	for _, row := range rows {
		ids = append(ids, row.PostID)
	}
	viewer := api.UserId(userID)
	byID, err := s.posts.GetHydratedPostsByIDs(ctx, ids, &viewer)
	if err != nil {
		return api.UserPostsPage{}, err
	}
	// Walk the bookmark ordering, not the map's. A missing id is a post deleted
	// between the two queries.
	items := make([]api.Post, 0, len(ids))
	for _, id := range ids {
		if post, ok := byID[id]; ok {
			items = append(items, post)
		}
	}

	var next *string
	if len(rows) == lim {
		last := rows[len(rows)-1]
		n := encodeCursor(timelineCursor{Score: last.CreatedAt.UnixMilli(), ID: last.PostID.String()})
		next = &n
	}
	return api.UserPostsPage{Items: items, NextCursor: next}, nil
}

// SetPostBookmarks replaces the whole set of the caller's lists holding a post.
// An empty set removes the bookmark, which is how the client expresses "unsave".
func (s *BookmarksService) SetPostBookmarks(ctx context.Context, userID uuid.UUID, postID api.PostId, req api.SetPostBookmarksRequest) (api.PostBookmarks, error) {
	if s.store == nil {
		return api.PostBookmarks{}, errDatabaseUnavailable()
	}
	// Non-nil even when empty: a nil slice reaches Postgres as NULL, and
	// `list_id = ANY(NULL)` deletes nothing instead of everything.
	listIDs := make([]uuid.UUID, 0, len(req.ListIds))
	seen := make(map[uuid.UUID]struct{}, len(req.ListIds))
	for _, id := range req.ListIds {
		if _, dup := seen[id]; dup {
			continue
		}
		seen[id] = struct{}{}
		listIDs = append(listIDs, id)
	}
	if len(listIDs) > maxBookmarkLists {
		return api.PostBookmarks{}, NewError(http.StatusBadRequest, "invalid_request", "too many lists")
	}

	row, err := s.store.Q.GetPostWithAuthorByID(ctx, sqlc.GetPostWithAuthorByIDParams{
		ID:       postID,
		ViewerID: uuid.NullUUID{UUID: userID, Valid: true},
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return api.PostBookmarks{}, NewError(http.StatusNotFound, "not_found", "post not found")
		}
		return api.PostBookmarks{}, err
	}
	if row.DeletedAt.Valid {
		return api.PostBookmarks{}, NewError(http.StatusNotFound, "not_found", "post not found")
	}

	if err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if len(listIDs) > 0 {
			// One count instead of a lookup per id. A short count means at least
			// one list is not the caller's; 404 rather than 403 so a probe cannot
			// confirm someone else's list id exists.
			owned, err := q.CountOwnedBookmarkLists(ctx, sqlc.CountOwnedBookmarkListsParams{
				UserID: userID,
				Ids:    listIDs,
			})
			if err != nil {
				return err
			}
			if int(owned) != len(listIDs) {
				return errBookmarkListNotFound()
			}
		}
		if err := q.RemoveBookmarksNotIn(ctx, sqlc.RemoveBookmarksNotInParams{
			UserID:  userID,
			PostID:  postID,
			ListIds: listIDs,
		}); err != nil {
			return err
		}
		for _, listID := range listIDs {
			if err := q.AddBookmark(ctx, sqlc.AddBookmarkParams{
				ListID: listID,
				PostID: postID,
				UserID: userID,
			}); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return api.PostBookmarks{}, err
	}

	return api.PostBookmarks{PostId: postID, ListIds: listIDs}, nil
}

// ListIDsForPosts returns, per post, the caller's lists that hold it. One query
// for a whole timeline page: this is what fills Post.bookmarkListIds.
func (s *BookmarksService) ListIDsForPosts(ctx context.Context, userID uuid.UUID, postIDs []api.PostId) (map[api.PostId][]api.BookmarkListId, error) {
	result := make(map[api.PostId][]api.BookmarkListId)
	if s.store == nil || len(postIDs) == 0 {
		return result, nil
	}
	rows, err := s.store.Q.ListBookmarkListIDsForPosts(ctx, sqlc.ListBookmarkListIDsForPostsParams{
		UserID:  userID,
		PostIds: postIDs,
	})
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		result[row.PostID] = append(result[row.PostID], row.ListID)
	}
	return result, nil
}

// attachBookmarkListIDs fills Post.bookmarkListIds for the reader. Posts in no
// list, and every post for an anonymous reader, get an empty array rather than
// null so the client can index it without a guard.
func attachBookmarkListIDs(ctx context.Context, bookmarks *BookmarksService, posts []api.Post, userID *api.UserId) error {
	for i := range posts {
		ids := []api.BookmarkListId{}
		posts[i].BookmarkListIds = &ids
	}
	if bookmarks == nil || userID == nil || len(posts) == 0 {
		return nil
	}
	postIDs := make([]api.PostId, 0, len(posts))
	for _, post := range posts {
		postIDs = append(postIDs, post.Id)
	}
	byPost, err := bookmarks.ListIDsForPosts(ctx, *userID, postIDs)
	if err != nil {
		return err
	}
	for i := range posts {
		if ids, ok := byPost[posts[i].Id]; ok {
			posts[i].BookmarkListIds = &ids
		}
	}
	return nil
}

func validateBookmarkListName(raw string) (string, error) {
	name := strings.TrimSpace(raw)
	if name == "" {
		return "", NewError(http.StatusBadRequest, "invalid_request", "name required")
	}
	if utf8.RuneCountInString(name) > maxBookmarkListNameLength {
		return "", NewError(http.StatusBadRequest, "invalid_request", "name too long")
	}
	return name, nil
}

func validateBookmarkIcon(raw string) (string, error) {
	icon := strings.TrimSpace(raw)
	if icon == "" {
		return "", NewError(http.StatusBadRequest, "invalid_request", "icon required")
	}
	if len(icon) > maxBookmarkIconLength {
		return "", NewError(http.StatusBadRequest, "invalid_request", "icon too long")
	}
	return icon, nil
}

func errBookmarkListNotFound() error {
	return NewError(http.StatusNotFound, "not_found", "bookmark list not found")
}

func errDatabaseUnavailable() error {
	return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
}

