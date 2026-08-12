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
			"user_created_at", "is_private", "avatar_ext", "is_following", "is_followed_by",
		}).
			AddRow(third, "carol", nil, nil, nil, created, false, nil, false, false).
			AddRow(first, "alice", nil, nil, nil, created, false, nil, false, false).
			AddRow(second, "bob", nil, nil, nil, created, false, nil, false, false),
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
		"user_created_at", "is_private", "avatar_ext", "is_following", "is_followed_by",
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
