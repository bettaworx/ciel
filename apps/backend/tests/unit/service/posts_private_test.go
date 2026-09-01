package service_test

import (
	"context"
	"database/sql"
	"net/http"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

// A private user's post may be seen and replied to by their accepted followers,
// but never boosted or quoted: both republish it to an audience the author never
// approved. The rule is enforced on the server, so a client that hides the button
// is a convenience, not the control.
func TestPostsService_Create_BoostOfPrivateAuthorIsForbidden(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewPostsService(store, nil, nil)

	userID := uuid.New()
	referenceID := uuid.New()

	expectNotBlocked(mock)
	mock.ExpectBegin()
	// can_view true: the caller follows them and can read the post. Boosting is
	// still refused, which is the distinction this test exists to pin down.
	expectPostThreadInfo(mock, referenceID, uuid.New(), true)
	mock.ExpectRollback()

	user := auth.User{ID: userID, Username: "alice"}
	referencePostID := api.PostId(referenceID)
	_, err := svc.Create(context.Background(), user, api.CreatePostRequest{ReferenceId: &referencePostID})
	if err == nil {
		t.Fatal("expected boost of a private author's post to be refused")
	}
	assertServiceError(t, err, http.StatusForbidden, "private_account")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// Quoting is the same act with a comment attached, so it is refused identically.
func TestPostsService_Create_QuoteOfPrivateAuthorIsForbidden(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewPostsService(store, nil, nil)

	userID := uuid.New()
	referenceID := uuid.New()

	expectNotBlocked(mock)
	mock.ExpectBegin()
	expectPostThreadInfo(mock, referenceID, uuid.New(), true)
	mock.ExpectRollback()

	user := auth.User{ID: userID, Username: "alice"}
	referencePostID := api.PostId(referenceID)
	content := "look at this"
	_, err := svc.Create(context.Background(), user, api.CreatePostRequest{
		Content:     &content,
		ReferenceId: &referencePostID,
	})
	if err == nil {
		t.Fatal("expected quote of a private author's post to be refused")
	}
	assertServiceError(t, err, http.StatusForbidden, "private_account")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// A post whose author is not visible to the caller reports as missing rather than
// forbidden, so replying cannot be used to confirm that a private post exists.
func TestPostsService_Create_ReplyToInvisibleAuthorIsNotFound(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewPostsService(store, nil, nil)

	userID := uuid.New()
	parentID := uuid.New()

	expectNotBlocked(mock)
	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT\s+p.id,\s+p.user_id,\s+p.parent_id`).
		WithArgs(sqlmock.AnyArg(), parentID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "parent_id", "root_id", "reference_id", "deleted_at", "author_is_private", "can_view"}).
			AddRow(parentID, uuid.New(), uuid.NullUUID{}, uuid.NullUUID{}, uuid.NullUUID{}, sql.NullTime{Valid: false}, true, false))
	mock.ExpectRollback()

	user := auth.User{ID: userID, Username: "alice"}
	parentPostID := api.PostId(parentID)
	content := "hi"
	_, err := svc.Create(context.Background(), user, api.CreatePostRequest{
		Content:  &content,
		ParentId: &parentPostID,
	})
	if err == nil {
		t.Fatal("expected reply to an invisible post to be refused")
	}
	assertServiceError(t, err, http.StatusNotFound, "not_found")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// A private author's new post must never reach the hub's untargeted broadcast,
// which goes to every open connection including unauthenticated ones. Each
// accepted follower gets their own targeted copy instead.
func TestPostsService_Create_PrivateAuthorPublishesOnlyToFollowers(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	publisher := &stubPublisher{}
	svc := service.NewPostsService(store, nil, publisher)

	userID := uuid.New()
	postID := uuid.New()
	followerID := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	expectNotBlocked(mock)
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO posts`).
		WithArgs(userID, "hello", uuid.NullUUID{}, uuid.NullUUID{}, uuid.NullUUID{}).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "content", "parent_id", "root_id", "reference_id", "created_at", "deleted_at"}).
			AddRow(postID, userID, "hello", uuid.NullUUID{}, uuid.NullUUID{}, uuid.NullUUID{}, created, sql.NullTime{Valid: false}))
	mock.ExpectCommit()
	expectGetPostWithAuthor(mock, api.PostId(postID), userID, created, userCreated)
	mock.ExpectQuery(`SELECT\s+pm.post_id,`).WithArgs(postID).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "media_id", "type", "ext", "width", "height", "created_at", "sort_order"}))
	expectListMentions(mock)
	expectCountReplies(mock)
	expectCountBoosts(mock)
	expectIsUserPrivate(mock, userID, true)
	mock.ExpectQuery(`SELECT follower_id`).WithArgs(userID, sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"follower_id"}).AddRow(followerID))

	user := auth.User{ID: userID, Username: "alice"}
	content := "hello"
	if _, err := svc.Create(context.Background(), user, api.CreatePostRequest{Content: &content}); err != nil {
		t.Fatalf("Create: %v", err)
	}

	// One event carrying both recipients, not one event each. Publish marshals,
	// signs and pushes to Redis per call, so a per-follower loop cost a round
	// trip per follower for every post and every reaction on it.
	if len(publisher.events) != 1 {
		t.Fatalf("expected a single batched event, got %d: %+v", len(publisher.events), publisher.events)
	}
	recipients := publisher.events[0].TargetUserIds
	if len(recipients) == 0 {
		t.Fatalf("a private author's post was broadcast untargeted: %+v", publisher.events[0])
	}
	if len(recipients) != 2 {
		t.Fatalf("expected the follower and the author, got %+v", recipients)
	}
	if recipients[0] != api.UserId(followerID) {
		t.Fatalf("expected the follower first, got %+v", recipients)
	}
	if recipients[1] != api.UserId(userID) {
		t.Fatalf("expected the author second, got %+v", recipients)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// A public user replying to a private account produces a reply that is itself
// public. It must still not appear in a feed: a viewer who follows only the
// public half of the conversation would otherwise watch the private half happen,
// one visible reply at a time.
//
// This is the shape reported in practice: A private, B public and following A,
// C following neither A nor caring — C saw B's replies scroll past.
func TestTimeline_DropsRepliesWhoseParentIsHidden(t *testing.T) {
	visible := api.Post{Id: api.PostId(uuid.New())}
	hiddenParent := true
	notHidden := false
	replyToPrivate := api.Post{Id: api.PostId(uuid.New()), ParentPrivate: &hiddenParent}
	replyToPublic := api.Post{Id: api.PostId(uuid.New()), ParentPrivate: &notHidden}

	// An anonymous scope hides nobody, so only the parent flags decide here —
	// which is exactly the privacy case this test is about.
	var scope service.ViewerScope
	got := scope.Filter([]api.Post{visible, replyToPrivate, replyToPublic}, service.SurfaceFeed)

	if len(got) != 2 {
		t.Fatalf("expected the reply to a hidden parent to be dropped, got %d posts", len(got))
	}
	for _, post := range got {
		if post.Id == replyToPrivate.Id {
			t.Fatal("a reply whose parent is hidden reached the feed")
		}
	}
	// A reply to a parent the viewer can see is untouched, which is what keeps
	// this from hiding ordinary conversations.
	if got[1].Id != replyToPublic.Id {
		t.Fatalf("expected the reply to a visible parent to survive, got %+v", got[1])
	}
}
