package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"backend/internal/repository"
	"backend/internal/search"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

// stubProvider returns a fixed result so the tests can assert what the service
// does with it, without a running search engine.
type stubProvider struct {
	result  search.Result
	err     error
	lastQry search.Query
}

func (s *stubProvider) Name() string                        { return "stub" }
func (s *stubProvider) EnsureIndexes(context.Context) error { return nil }
func (s *stubProvider) IndexPosts(context.Context, ...search.PostDoc) error {
	return nil
}
func (s *stubProvider) DeletePosts(context.Context, ...uuid.UUID) error      { return nil }
func (s *stubProvider) DeletePostsByAuthor(context.Context, uuid.UUID) error { return nil }
func (s *stubProvider) IndexUsers(context.Context, ...search.UserDoc) error  { return nil }
func (s *stubProvider) DeleteUsers(context.Context, ...uuid.UUID) error      { return nil }
func (s *stubProvider) PostCount(context.Context) (int64, error)             { return 0, nil }
func (s *stubProvider) UserCount(context.Context) (int64, error)             { return 0, nil }

func (s *stubProvider) SearchPosts(_ context.Context, q search.Query) (search.Result, error) {
	s.lastQry = q
	return s.result, s.err
}

func (s *stubProvider) SearchUsers(_ context.Context, q search.Query) (search.Result, error) {
	s.lastQry = q
	return s.result, s.err
}

// TestSearchUsersPreservesRelevanceOrder checks that results come back in the
// order the engine ranked them. Hydration goes through a map, so without an
// explicit re-ordering pass the ranking would be lost to map iteration order.
func TestSearchUsersPreservesRelevanceOrder(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	first, second, third := uuid.New(), uuid.New(), uuid.New()
	provider := &stubProvider{result: search.Result{
		IDs:            []uuid.UUID{first, second, third},
		EstimatedTotal: 3,
	}}
	svc := service.NewSearchService(repository.NewStore(db), provider)

	created := time.Unix(1_700_000_000, 0).UTC()
	// Rows come back in a different order than the engine ranked them.
	mock.ExpectQuery(`SELECT`).WillReturnRows(
		sqlmock.NewRows([]string{
			"id", "username", "display_name", "bio", "avatar_media_id",
			"user_created_at", "is_private", "avatar_ext", "is_following", "is_followed_by", "is_blocked_by",
		}).
			AddRow(third, "carol", nil, nil, nil, created, false, nil, false, false, false).
			AddRow(first, "alice", nil, nil, nil, created, false, nil, false, false, false).
			AddRow(second, "bob", nil, nil, nil, created, false, nil, false, false, false),
	)

	page, err := svc.SearchUsers(context.Background(), "someone", nil, nil, nil)
	if err != nil {
		t.Fatalf("SearchUsers: %v", err)
	}
	want := []string{"alice", "bob", "carol"}
	if len(page.Items) != len(want) {
		t.Fatalf("got %d items, want %d", len(page.Items), len(want))
	}
	for i, username := range want {
		if string(page.Items[i].Username) != username {
			t.Errorf("item %d = %q, want %q", i, page.Items[i].Username, username)
		}
	}
	if page.EstimatedTotal != 3 {
		t.Errorf("EstimatedTotal = %d, want 3", page.EstimatedTotal)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestSearchUnavailableMapsTo503 checks that a missing search engine surfaces
// as a 503 the handler can return, not an opaque 500.
func TestSearchUnavailableMapsTo503(t *testing.T) {
	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	svc := service.NewSearchService(repository.NewStore(db), &stubProvider{err: search.ErrUnavailable})

	_, err = svc.SearchUsers(context.Background(), "anything", nil, nil, nil)
	var svcErr *service.Error
	if !errors.As(err, &svcErr) {
		t.Fatalf("got %v, want a *service.Error", err)
	}
	if svcErr.Status != 503 || svcErr.Code != "search_unavailable" {
		t.Fatalf("got %d/%s, want 503/search_unavailable", svcErr.Status, svcErr.Code)
	}
}

// TestSearchRejectsBadPaging keeps the paging bounds enforced in the service,
// where they apply regardless of how the handler was reached.
func TestSearchRejectsBadPaging(t *testing.T) {
	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	svc := service.NewSearchService(repository.NewStore(db), &stubProvider{})

	tooBig := 101
	if _, err := svc.SearchUsers(context.Background(), "x", &tooBig, nil, nil); err == nil {
		t.Error("limit 101 was accepted, want an error")
	}
	negative := -1
	if _, err := svc.SearchUsers(context.Background(), "x", nil, &negative, nil); err == nil {
		t.Error("offset -1 was accepted, want an error")
	}
}

// TestSearchPassesParsedFiltersToProvider makes sure the mini-syntax survives
// the trip from the raw query string to the engine query.
func TestSearchPassesParsedFiltersToProvider(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	provider := &stubProvider{}
	svc := service.NewSearchService(repository.NewStore(db), provider)

	mock.ExpectQuery(`SELECT`).WillReturnRows(sqlmock.NewRows([]string{
		"id", "username", "display_name", "bio", "avatar_media_id",
		"user_created_at", "is_private", "avatar_ext", "is_following", "is_followed_by", "is_blocked_by",
	}))

	if _, err := svc.SearchUsers(context.Background(), `since:2026-01-01 "a phrase" cat OR dog`, nil, nil, nil); err != nil {
		t.Fatalf("SearchUsers: %v", err)
	}
	got := provider.lastQry
	if got.Text != `"a phrase" cat dog` {
		t.Errorf("Text = %q, want %q", got.Text, `"a phrase" cat dog`)
	}
	if got.MatchAll {
		t.Error("MatchAll = true, want false after a bare OR")
	}
	if got.Since == nil || got.Since.Format("2006-01-02") != "2026-01-01" {
		t.Errorf("Since = %v, want 2026-01-01", got.Since)
	}
}

// A muted or blocked author's posts must not come back in search results.
//
// The filter is not in the query: GetPostsByIDs keeps only the hard visibility
// gate so a quoted or replied-to post stays fetchable for the reveal cushion.
// That leaves the service to drop them, and this pins the wiring — the same
// wiring that was missing from the timeline's Redis path.
func TestSearchPostsDropsHiddenAuthors(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	hiddenPost, visiblePost := uuid.New(), uuid.New()
	hiddenAuthor, visibleAuthor := uuid.New(), uuid.New()
	viewer := uuid.New()

	provider := &stubProvider{result: search.Result{
		IDs:            []uuid.UUID{hiddenPost, visiblePost},
		EstimatedTotal: 2,
	}}
	store := repository.NewStore(db)
	svc := service.NewSearchService(store, provider)
	posts := service.NewPostsService(store, nil, nil)
	svc.SetPostsService(posts)

	created := time.Unix(1_700_000_000, 0).UTC()
	mock.ExpectQuery(`SELECT\s+p.id,`).WillReturnRows(
		sqlmock.NewRows([]string{
			"id", "user_id", "content", "parent_id", "root_id", "reference_id",
			"created_at", "deleted_at", "username", "display_name", "bio",
			"avatar_media_id", "user_created_at", "is_private", "avatar_ext",
			"parent_private", "parent_hidden",
		}).
			AddRow(hiddenPost, hiddenAuthor, "from a blocked account", nil, nil, nil,
				created, nil, "mallory", nil, nil, nil, created, false, nil, false, false).
			AddRow(visiblePost, visibleAuthor, "an ordinary post", nil, nil, nil,
				created, nil, "bob", nil, nil, nil, created, false, nil, false, false),
	)
	// Media, then the hidden-author lookup that stamps the flags, then the
	// remaining hydration steps.
	mock.ExpectQuery(`SELECT\s+pm.post_id,`).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "media_id", "type", "ext", "width", "height", "created_at", "sort_order"}))
	mock.ExpectQuery(`SELECT muted_id AS user_id`).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "blocked"}).AddRow(hiddenAuthor, true))
	mock.ExpectQuery(`SELECT\s+pm.post_id,\s+u.id AS user_id`).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "user_id", "username", "display_name", "avatar_media_id", "avatar_ext"}))
	mock.ExpectQuery(`SELECT parent_id, COUNT\(\*\)`).
		WillReturnRows(sqlmock.NewRows([]string{"parent_id", "reply_count"}))
	mock.ExpectQuery(`SELECT reference_id, COUNT\(\*\)`).
		WillReturnRows(sqlmock.NewRows([]string{"reference_id", "boost_count"}))

	page, err := svc.SearchPosts(context.Background(), "something", nil, nil, &viewer)
	if err != nil {
		t.Fatalf("SearchPosts: %v", err)
	}
	if len(page.Items) != 1 {
		t.Fatalf("expected the blocked author's post to be dropped, got %d items", len(page.Items))
	}
	if page.Items[0].Id != visiblePost {
		t.Fatalf("expected the visible post to survive, got %s", page.Items[0].Id)
	}
}
