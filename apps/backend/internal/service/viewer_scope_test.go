package service

import (
	"context"
	"database/sql"
	"testing"

	"backend/internal/api"
	"backend/internal/repository"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

// In-package because ViewerScope's maps are unexported: building one by hand is
// how these stay pure tests of the decision rules rather than of sqlmock.

// scopeWith builds a scope without touching a database.
func scopeWith(viewer uuid.UUID, muted, blocking, blockedBy []uuid.UUID) ViewerScope {
	s := ViewerScope{ViewerID: &viewer}
	for _, id := range muted {
		s.muted = insertID(s.muted, id)
	}
	for _, id := range blocking {
		s.blocking = insertID(s.blocking, id)
	}
	for _, id := range blockedBy {
		s.blockedBy = insertID(s.blockedBy, id)
	}
	return s
}

func postBy(authorID uuid.UUID) api.Post {
	return api.Post{Id: uuid.New(), Author: api.User{Id: authorID, Username: "someone"}}
}

// The same post by the same hidden author is answered differently depending on
// how the viewer got to it. This distinction is the reason Surface exists, and
// forgetting it is the bug that shipped three times.
func TestViewerScope_ForAuthor_SurfaceDecidesOmitOrCushion(t *testing.T) {
	viewer, muted, blocked, ordinary := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	scope := scopeWith(viewer, []uuid.UUID{muted}, []uuid.UUID{blocked}, nil)

	cases := []struct {
		name    string
		author  uuid.UUID
		surface Surface
		want    Decision
	}{
		{"muted in a feed", muted, SurfaceFeed, Omit},
		{"blocked in a feed", blocked, SurfaceFeed, Omit},
		{"muted somewhere opened on purpose", muted, SurfaceDestination, Cushion},
		{"blocked somewhere opened on purpose", blocked, SurfaceDestination, Cushion},
		{"an ordinary author in a feed", ordinary, SurfaceFeed, Show},
		{"an ordinary author on a profile", ordinary, SurfaceDestination, Show},
	}
	for _, c := range cases {
		if got := scope.ForAuthor(c.author, c.surface); got != c.want {
			t.Errorf("%s: got %v, want %v", c.name, got, c.want)
		}
	}
}

// Being blocked hides the other account from the viewer's own reading, but that
// is can_view_user's job, not this one. ForAuthor answers about accounts the
// viewer chose to hide.
func TestViewerScope_ForAuthor_BlockedByIsNotTheViewersChoice(t *testing.T) {
	viewer, blocker := uuid.New(), uuid.New()
	scope := scopeWith(viewer, nil, nil, []uuid.UUID{blocker})

	if got := scope.ForAuthor(blocker, SurfaceFeed); got != Show {
		t.Fatalf("expected Show, got %v: being blocked is enforced by the query gate, not here", got)
	}
}

// A whole post can be hidden by more than its own author.
func TestViewerScope_ForPost_FeedReasons(t *testing.T) {
	viewer, hidden, visible := uuid.New(), uuid.New(), uuid.New()
	scope := scopeWith(viewer, []uuid.UUID{hidden}, nil, nil)

	yes, no := true, false
	refID := api.PostId(uuid.New())
	hiddenRef := api.Post{Id: refID, Author: api.User{Id: hidden}}
	visibleRef := api.Post{Id: refID, Author: api.User{Id: visible}}

	boost := func(ref *api.Post, restricted *bool) api.Post {
		p := postBy(visible)
		p.Content = ""
		p.ReferenceId = &refID
		p.Reference = ref
		p.ReferenceRestricted = restricted
		return p
	}

	cases := []struct {
		name string
		post api.Post
		want Decision
	}{
		{"by a hidden author", postBy(hidden), Omit},
		{"an ordinary post", postBy(visible), Show},
		{"a boost of a hidden author", boost(&hiddenRef, nil), Omit},
		{"a boost of a visible author", boost(&visibleRef, nil), Show},
		{"a boost of a post that became unreadable", boost(nil, &yes), Omit},
		{"a boost of a deleted post", boost(nil, nil), Show},
		{"a boost of a deleted post, explicitly not restricted", boost(nil, &no), Show},
		{"a reply to a private parent", withParent(postBy(visible), &yes, nil), Omit},
		{"a reply to a hidden parent", withParent(postBy(visible), nil, &yes), Omit},
		{"a reply to a readable parent", withParent(postBy(visible), &no, &no), Show},
	}
	for _, c := range cases {
		if got := scope.ForPost(c.post, SurfaceFeed); got != c.want {
			t.Errorf("%s: got %v, want %v", c.name, got, c.want)
		}
	}
}

// A quote is the quoter's own post. Only its embedded card is hidden, and the
// client cushions that, so the row itself stays.
func TestViewerScope_ForPost_QuoteOfHiddenAuthorSurvives(t *testing.T) {
	viewer, hidden, visible := uuid.New(), uuid.New(), uuid.New()
	scope := scopeWith(viewer, []uuid.UUID{hidden}, nil, nil)

	refID := api.PostId(uuid.New())
	hiddenRef := api.Post{Id: refID, Author: api.User{Id: hidden}}
	quote := postBy(visible)
	quote.Content = "look at this"
	quote.ReferenceId = &refID
	quote.Reference = &hiddenRef

	if got := scope.ForPost(quote, SurfaceFeed); got != Show {
		t.Fatalf("expected the quote to survive, got %v", got)
	}
}

// The feed-only reasons are about following a conversation, which is not what a
// profile or a post's own page is for.
func TestViewerScope_ForPost_DestinationKeepsFragments(t *testing.T) {
	viewer, visible := uuid.New(), uuid.New()
	scope := scopeWith(viewer, nil, nil, nil)

	yes := true
	reply := withParent(postBy(visible), &yes, &yes)
	if got := scope.ForPost(reply, SurfaceDestination); got != Show {
		t.Fatalf("expected a reply to be kept where it was opened on purpose, got %v", got)
	}
}

func withParent(post api.Post, private, hidden *bool) api.Post {
	post.ParentPrivate = private
	post.ParentHidden = hidden
	return post
}

// Interaction is refused in both directions, unlike reading. can_view_user
// deliberately keeps the blocker reading so the reveal cushion works.
func TestViewerScope_CanInteractWith(t *testing.T) {
	viewer, blocking, blockedBy, muted, ordinary := uuid.New(), uuid.New(), uuid.New(), uuid.New(), uuid.New()
	scope := scopeWith(viewer, []uuid.UUID{muted}, []uuid.UUID{blocking}, []uuid.UUID{blockedBy})

	cases := []struct {
		name string
		id   uuid.UUID
		want bool
	}{
		{"someone the viewer blocked", blocking, false},
		{"someone who blocked the viewer", blockedBy, false},
		{"someone the viewer merely muted", muted, true},
		{"an unrelated account", ordinary, true},
		{"the viewer themselves", viewer, true},
	}
	for _, c := range cases {
		if got := scope.CanInteractWith(c.id); got != c.want {
			t.Errorf("%s: got %v, want %v", c.name, got, c.want)
		}
	}
}

// Both flags are reported when both apply: they have separate undo buttons, and
// collapsing them would offer "unblock" on an account that stays muted after.
func TestViewerScope_StampAuthorFlags(t *testing.T) {
	viewer, muted, blocked, both, ordinary := uuid.New(), uuid.New(), uuid.New(), uuid.New(), uuid.New()
	scope := scopeWith(viewer, []uuid.UUID{muted, both}, []uuid.UUID{blocked, both}, nil)

	posts := []api.Post{postBy(muted), postBy(blocked), postBy(both), postBy(ordinary)}
	scope.StampAuthorFlags(posts)

	if !boolValue(posts[0].Author.IsMuted) || posts[0].Author.IsBlocking != nil {
		t.Error("a muted author must be reported as muted only")
	}
	if !boolValue(posts[1].Author.IsBlocking) || posts[1].Author.IsMuted != nil {
		t.Error("a blocked author must be reported as blocked only")
	}
	if !boolValue(posts[2].Author.IsMuted) || !boolValue(posts[2].Author.IsBlocking) {
		t.Error("an account that is both must be reported as both")
	}
	if posts[3].Author.IsMuted != nil || posts[3].Author.IsBlocking != nil {
		t.Error("an untouched author must carry no flags")
	}
}

// Filter only applies to feeds. A destination is handed the posts whole and lets
// the client cushion them.
func TestViewerScope_Filter_OnlyFeeds(t *testing.T) {
	viewer, hidden := uuid.New(), uuid.New()
	scope := scopeWith(viewer, []uuid.UUID{hidden}, nil, nil)
	posts := []api.Post{postBy(hidden), postBy(uuid.New())}

	if got := scope.Filter(posts, SurfaceFeed); len(got) != 1 {
		t.Fatalf("expected the hidden author to be dropped from a feed, got %d", len(got))
	}
	if got := scope.Filter(posts, SurfaceDestination); len(got) != 2 {
		t.Fatalf("expected a destination to keep everything, got %d", len(got))
	}
}

// An anonymous viewer has hidden nobody, so the load must not reach the
// database. Every public read path runs through it.
func TestLoadViewerScope_AnonymousDoesNotQuery(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	scope, err := LoadViewerScope(context.Background(), repository.NewStore(db), nil)
	if err != nil {
		t.Fatalf("LoadViewerScope: %v", err)
	}
	if scope.Hides(uuid.New()) {
		t.Fatal("an anonymous viewer hides nobody")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// The context cache is what makes "load once per request" true: hydration alone
// would otherwise ask three or four times for the same answer.
func TestEnsureViewerScope_ReusesOneRead(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()
	store := repository.NewStore(db)

	viewer, muted := uuid.New(), uuid.New()
	// Exactly one expectation: a second read would fail the run.
	mock.ExpectQuery(`FROM account_mutes`).WithArgs(viewer).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "kind"}).AddRow(muted, "muted"))

	ctx, scope, err := EnsureViewerScope(context.Background(), store, &viewer)
	if err != nil {
		t.Fatalf("EnsureViewerScope: %v", err)
	}
	if !scope.Muted(muted) {
		t.Fatal("expected the mute to load")
	}
	for i := 0; i < 3; i++ {
		again, err := LoadViewerScope(ctx, store, &viewer)
		if err != nil {
			t.Fatalf("LoadViewerScope: %v", err)
		}
		if !again.Muted(muted) {
			t.Fatal("the cached scope lost its contents")
		}
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// Notification delivery hydrates posts as their recipient, not as the caller.
// Handing it the cached scope would filter one person's feed by another's mutes.
func TestLoadViewerScope_CacheIsNotReusedForAnotherViewer(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()
	store := repository.NewStore(db)

	first, second, muted := uuid.New(), uuid.New(), uuid.New()
	mock.ExpectQuery(`FROM account_mutes`).WithArgs(first).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "kind"}).AddRow(muted, "muted"))
	mock.ExpectQuery(`FROM account_mutes`).WithArgs(second).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "kind"}))

	ctx, _, err := EnsureViewerScope(context.Background(), store, &first)
	if err != nil {
		t.Fatalf("EnsureViewerScope: %v", err)
	}
	other, err := LoadViewerScope(ctx, store, &second)
	if err != nil {
		t.Fatalf("LoadViewerScope: %v", err)
	}
	if other.Muted(muted) {
		t.Fatal("one viewer's mutes were applied to another viewer")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// A scan failure has to surface rather than quietly leaving nothing hidden.
func TestLoadViewerScope_PropagatesQueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	viewer := uuid.New()
	mock.ExpectQuery(`FROM account_mutes`).WillReturnError(sql.ErrConnDone)

	if _, err := LoadViewerScope(context.Background(), repository.NewStore(db), &viewer); err == nil {
		t.Fatal("expected the query error to propagate")
	}
}

// HiddenIDs feeds the feed queries as a uuid[], so an account that is both muted
// and blocked must appear once.
func TestViewerScope_HiddenIDsDeduplicates(t *testing.T) {
	viewer, both, muted := uuid.New(), uuid.New(), uuid.New()
	scope := scopeWith(viewer, []uuid.UUID{muted, both}, []uuid.UUID{both}, nil)

	ids := scope.HiddenIDs()
	if len(ids) != 2 {
		t.Fatalf("expected 2 distinct ids, got %d: %v", len(ids), ids)
	}
	seen := map[uuid.UUID]int{}
	for _, id := range ids {
		seen[id]++
	}
	if seen[both] != 1 || seen[muted] != 1 {
		t.Fatalf("expected each id once, got %v", seen)
	}
}
