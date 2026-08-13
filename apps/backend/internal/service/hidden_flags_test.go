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

// In-package rather than in tests/unit/service: attachHiddenAuthorFlags is what
// drives both the name indicator and the reveal cushion, and exporting it just
// to test it would widen the package for no other caller.

func hiddenFlagsStore(t *testing.T) (*repository.Store, sqlmock.Sqlmock, func()) {
	t.Helper()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	return repository.NewStore(db), mock, func() { _ = db.Close() }
}

func expectHiddenUserIDs(mock sqlmock.Sqlmock, rows [][2]any) {
	r := sqlmock.NewRows([]string{"user_id", "blocked"})
	for _, row := range rows {
		r.AddRow(row[0], row[1])
	}
	mock.ExpectQuery(`SELECT muted_id AS user_id`).WillReturnRows(r)
}

func postBy(authorID uuid.UUID) api.Post {
	return api.Post{Id: uuid.New(), Author: api.User{Id: authorID, Username: "someone"}}
}

// A muted author is flagged, a blocked author is flagged differently, and an
// author the viewer has done neither to is left alone. The client tells the
// three apart by which pointer is set, so a wrong one here is a wrong icon and a
// cushion on the wrong card.
func TestAttachHiddenAuthorFlags_MarksMutedAndBlocked(t *testing.T) {
	store, mock, cleanup := hiddenFlagsStore(t)
	defer cleanup()

	svc := NewPostsService(store, nil, nil)

	muted := uuid.New()
	blocked := uuid.New()
	ordinary := uuid.New()
	viewer := uuid.New()

	expectHiddenUserIDs(mock, [][2]any{{muted, false}, {blocked, true}})

	posts := []api.Post{postBy(muted), postBy(blocked), postBy(ordinary)}
	if err := svc.attachHiddenAuthorFlags(context.Background(), posts, &viewer); err != nil {
		t.Fatalf("attachHiddenAuthorFlags: %v", err)
	}

	if posts[0].Author.IsMuted == nil || !*posts[0].Author.IsMuted {
		t.Fatal("expected the muted author to be flagged as muted")
	}
	if posts[0].Author.IsBlocking != nil {
		t.Fatal("a mute must not be reported as a block")
	}
	if posts[1].Author.IsBlocking == nil || !*posts[1].Author.IsBlocking {
		t.Fatal("expected the blocked author to be flagged as blocked")
	}
	if posts[1].Author.IsMuted != nil {
		t.Fatal("a block must not also be reported as a mute")
	}
	if posts[2].Author.IsMuted != nil || posts[2].Author.IsBlocking != nil {
		t.Fatal("an author the viewer has not hidden must carry no flags")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// An account can be muted and blocked at once. Both flags are reported, in
// either row order: they are separate decisions with separate undo buttons, and
// the card draws an icon per flag.
func TestAttachHiddenAuthorFlags_ReportsMuteAndBlockTogether(t *testing.T) {
	for _, name := range []string{"mute first", "block first"} {
		t.Run(name, func(t *testing.T) {
			store, mock, cleanup := hiddenFlagsStore(t)
			defer cleanup()

			svc := NewPostsService(store, nil, nil)
			author := uuid.New()
			viewer := uuid.New()

			rows := [][2]any{{author, false}, {author, true}}
			if name == "block first" {
				rows[0], rows[1] = rows[1], rows[0]
			}
			expectHiddenUserIDs(mock, rows)

			posts := []api.Post{postBy(author)}
			if err := svc.attachHiddenAuthorFlags(context.Background(), posts, &viewer); err != nil {
				t.Fatalf("attachHiddenAuthorFlags: %v", err)
			}
			if posts[0].Author.IsBlocking == nil || !*posts[0].Author.IsBlocking {
				t.Fatal("expected the block to be reported")
			}
			if posts[0].Author.IsMuted == nil || !*posts[0].Author.IsMuted {
				t.Fatal("expected the mute to be reported alongside the block")
			}
		})
	}
}

// An anonymous caller has hidden nobody, so this must not reach the database at
// all. Every public read path runs through here.
func TestAttachHiddenAuthorFlags_AnonymousDoesNotQuery(t *testing.T) {
	store, mock, cleanup := hiddenFlagsStore(t)
	defer cleanup()

	svc := NewPostsService(store, nil, nil)
	posts := []api.Post{postBy(uuid.New())}

	if err := svc.attachHiddenAuthorFlags(context.Background(), posts, nil); err != nil {
		t.Fatalf("attachHiddenAuthorFlags: %v", err)
	}
	if posts[0].Author.IsMuted != nil || posts[0].Author.IsBlocking != nil {
		t.Fatal("expected no flags for an anonymous viewer")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// Guards against a silent regression in the row scan: a NULL avatar or similar
// would surface as a scan error rather than as missing flags.
func TestAttachHiddenAuthorFlags_PropagatesQueryError(t *testing.T) {
	store, mock, cleanup := hiddenFlagsStore(t)
	defer cleanup()

	svc := NewPostsService(store, nil, nil)
	viewer := uuid.New()

	mock.ExpectQuery(`SELECT muted_id AS user_id`).WillReturnError(sql.ErrConnDone)

	posts := []api.Post{postBy(uuid.New())}
	if err := svc.attachHiddenAuthorFlags(context.Background(), posts, &viewer); err == nil {
		t.Fatal("expected the query error to propagate")
	}
}

// dropHiddenFromFeed is what actually keeps a muted account out of a timeline
// served from Redis, where the SQL predicate never runs. Boosts are the case
// that motivated it: the row's own author is visible, and only the reference
// gives it away.
func TestDropHiddenFromFeed(t *testing.T) {
	flag := true
	hiddenAuthor := api.User{Id: uuid.New(), IsMuted: &flag}
	blockedAuthor := api.User{Id: uuid.New(), IsBlocking: &flag}
	visibleAuthor := api.User{Id: uuid.New()}

	refID := api.PostId(uuid.New())
	hiddenRef := api.Post{Id: refID, Author: hiddenAuthor}
	visibleRef := api.Post{Id: refID, Author: visibleAuthor}

	posts := []api.Post{
		{Id: uuid.New(), Author: hiddenAuthor, Content: "by a muted account"},
		{Id: uuid.New(), Author: blockedAuthor, Content: "by a blocked account"},
		// A pure boost is empty content plus a reference, and carries the
		// hidden account's post under a visible name.
		{Id: uuid.New(), Author: visibleAuthor, Content: "", ReferenceId: &refID, Reference: &hiddenRef},
		// A quote is the quoter's own post; the embedded card is cushioned by
		// the client instead of the whole row disappearing.
		{Id: uuid.New(), Author: visibleAuthor, Content: "look at this", ReferenceId: &refID, Reference: &hiddenRef},
		{Id: uuid.New(), Author: visibleAuthor, Content: "", ReferenceId: &refID, Reference: &visibleRef},
		{Id: uuid.New(), Author: visibleAuthor, Content: "an ordinary post"},
	}

	kept := dropHiddenFromFeed(posts)

	var contents []string
	for _, post := range kept {
		contents = append(contents, post.Content)
	}
	want := []string{"look at this", "", "an ordinary post"}
	if len(contents) != len(want) {
		t.Fatalf("expected %d posts kept, got %d: %v", len(want), len(contents), contents)
	}
	for i := range want {
		if contents[i] != want[i] {
			t.Fatalf("expected %q at %d, got %q", want[i], i, contents[i])
		}
	}
}

// A boost of a post that became unreadable after it was made — the author went
// private, or blocked the viewer. There is nothing left to render, so the row
// goes rather than becoming a placeholder announcing an unreadable share.
func TestDropHiddenFromFeed_DropsBoostOfRestrictedReference(t *testing.T) {
	refID := api.PostId(uuid.New())
	restricted := true
	posts := []api.Post{
		{
			Id:                  uuid.New(),
			Author:              api.User{Id: uuid.New()},
			Content:             "",
			ReferenceId:         &refID,
			ReferenceRestricted: &restricted,
		},
		// A quote keeps its own words, so it stays and embeds the placeholder.
		{
			Id:                  uuid.New(),
			Author:              api.User{Id: uuid.New()},
			Content:             "look at this",
			ReferenceId:         &refID,
			ReferenceRestricted: &restricted,
		},
	}
	kept := dropHiddenFromFeed(posts)
	if len(kept) != 1 || kept[0].Content != "look at this" {
		t.Fatalf("expected only the quote to survive, got %+v", kept)
	}
}

// A boost whose reference is simply gone keeps its deleted-post card, which is
// existing behaviour and true. It must not panic on the nil Reference either.
func TestDropHiddenFromFeed_BoostOfDeletedReferenceSurvives(t *testing.T) {
	refID := api.PostId(uuid.New())
	posts := []api.Post{{
		Id:          uuid.New(),
		Author:      api.User{Id: uuid.New()},
		Content:     "",
		ReferenceId: &refID,
	}}
	if len(dropHiddenFromFeed(posts)) != 1 {
		t.Fatal("expected a boost of a deleted post to be kept")
	}
}
