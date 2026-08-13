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

// expectGetUserByUsername stands in for the target lookup every mute and block
// call starts with.
func expectGetUserByUsername(mock sqlmock.Sqlmock, id uuid.UUID, username string) {
	mock.ExpectQuery(`FROM users u\s+LEFT JOIN media m`).WithArgs(username).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "username", "display_name", "bio", "avatar_media_id", "banner_media_id",
			"created_at", "terms_version", "privacy_version", "terms_accepted_at",
			"privacy_accepted_at", "is_private", "avatar_ext", "banner_ext", "banner_blurhash",
		}).AddRow(
			id, username, sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, uuid.NullUUID{},
			time.Unix(1_600_000_000, 0).UTC(), 1, 1, sql.NullTime{}, sql.NullTime{},
			false, sql.NullString{}, sql.NullString{}, sql.NullString{},
		))
}

// expectFollowStats covers the profile re-read every mutation returns.
func expectFollowStats(mock sqlmock.Sqlmock, isMuted, isBlocking, isBlockedBy bool) {
	mock.ExpectQuery(`AS followers_count`).
		WillReturnRows(sqlmock.NewRows([]string{
			"followers_count", "following_count", "is_following", "is_followed_by",
			"follow_request_sent", "is_muted", "is_blocking", "is_blocked_by",
		}).AddRow(0, 0, false, false, false, isMuted, isBlocking, isBlockedBy))
}

// Blocking writes the block and severs both follows inside one transaction.
// Splitting them would leave a window in which the blocked account still holds
// a follow, and the home-timeline fan-out never consults can_view_user.
func TestBlocksService_Block_SeversFollowsInSameTransaction(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	users := service.NewUsersService(store)
	svc := service.NewBlocksService(store, nil, nil)
	svc.SetUsersService(users)

	callerID := uuid.New()
	targetID := uuid.New()

	expectGetUserByUsername(mock, targetID, "bob")
	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO account_blocks`).WithArgs(callerID, targetID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(`DELETE FROM follows`).WithArgs(callerID, targetID).
		WillReturnResult(sqlmock.NewResult(0, 2))
	mock.ExpectCommit()
	expectGetUserByUsername(mock, targetID, "bob")
	expectFollowStats(mock, false, true, false)

	user, err := svc.Block(context.Background(), auth.User{ID: callerID, Username: "alice"}, api.Username("bob"))
	if err != nil {
		t.Fatalf("Block: %v", err)
	}
	if user.IsBlocking == nil || !*user.IsBlocking {
		t.Fatal("expected the returned profile to report the block")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// Unblocking restores access but not the follows the block destroyed. Re-following
// is a decision; reinstating it silently would put someone back in a feed they
// were removed from without being asked.
func TestBlocksService_Unblock_DoesNotRestoreFollows(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	users := service.NewUsersService(store)
	svc := service.NewBlocksService(store, nil, nil)
	svc.SetUsersService(users)

	callerID := uuid.New()
	targetID := uuid.New()

	expectGetUserByUsername(mock, targetID, "bob")
	mock.ExpectExec(`DELETE FROM account_blocks`).WithArgs(callerID, targetID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	expectGetUserByUsername(mock, targetID, "bob")
	expectFollowStats(mock, false, false, false)

	// No transaction and no follow write: sqlmock is ordered and strict, so an
	// INSERT INTO follows appearing here would fail the run.
	if _, err := svc.Unblock(context.Background(), auth.User{ID: callerID, Username: "alice"}, api.Username("bob")); err != nil {
		t.Fatalf("Unblock: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// Blocking yourself is caught before the database. The CHECK constraint would
// also refuse it, but as a 500.
func TestBlocksService_Block_SelfIsRejected(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	users := service.NewUsersService(store)
	svc := service.NewBlocksService(store, nil, nil)
	svc.SetUsersService(users)

	callerID := uuid.New()
	expectGetUserByUsername(mock, callerID, "alice")

	_, err := svc.Block(context.Background(), auth.User{ID: callerID, Username: "alice"}, api.Username("alice"))
	if err == nil {
		t.Fatal("expected blocking yourself to be refused")
	}
	assertServiceError(t, err, http.StatusBadRequest, "invalid_request")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// Muting is a single write with no transaction and no effect on the follow graph:
// the muted account is never told and loses nothing.
func TestBlocksService_Mute_LeavesFollowsAlone(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	users := service.NewUsersService(store)
	svc := service.NewBlocksService(store, nil, nil)
	svc.SetUsersService(users)

	callerID := uuid.New()
	targetID := uuid.New()

	expectGetUserByUsername(mock, targetID, "bob")
	mock.ExpectExec(`INSERT INTO account_mutes`).WithArgs(callerID, targetID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	expectGetUserByUsername(mock, targetID, "bob")
	expectFollowStats(mock, true, false, false)

	user, err := svc.Mute(context.Background(), auth.User{ID: callerID, Username: "alice"}, api.Username("bob"))
	if err != nil {
		t.Fatalf("Mute: %v", err)
	}
	if user.IsMuted == nil || !*user.IsMuted {
		t.Fatal("expected the returned profile to report the mute")
	}
	if user.IsBlocking != nil && *user.IsBlocking {
		t.Fatal("muting must not report a block")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// A block refuses a follow in either direction, and says so with one code: a
// distinct error for "you are blocked" would let anyone probe for it.
func TestFollowsService_Follow_RefusedWhenBlocked(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	users := service.NewUsersService(store)
	svc := service.NewFollowsService(store, nil, nil)
	svc.SetUsersService(users)

	callerID := uuid.New()
	targetID := uuid.New()

	expectGetUserByUsername(mock, targetID, "bob")
	mock.ExpectQuery(`FROM account_blocks`).WithArgs(callerID, targetID).
		WillReturnRows(sqlmock.NewRows([]string{"blocked"}).AddRow(true))

	_, err := svc.Follow(context.Background(), auth.User{ID: callerID, Username: "alice"}, api.Username("bob"))
	if err == nil {
		t.Fatal("expected following across a block to be refused")
	}
	assertServiceError(t, err, http.StatusForbidden, "blocked")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// can_view_user answers "no" for a private account and for a block alike, so the
// follow-list endpoints ask which it was. Telling a blocked caller the account is
// private would be a lie.
func TestFollowsService_ListFollowers_BlockedGetsBlockedCode(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewFollowsService(store, nil, nil)
	svc.SetUsersService(service.NewUsersService(store))

	viewerID := uuid.New()
	targetID := uuid.New()

	expectGetUserByUsername(mock, targetID, "bob")
	mock.ExpectQuery(`SELECT can_view_user`).
		WillReturnRows(sqlmock.NewRows([]string{"can_view"}).AddRow(false))
	mock.ExpectQuery(`FROM account_blocks`).WithArgs(targetID, viewerID).
		WillReturnRows(sqlmock.NewRows([]string{"blocked"}).AddRow(true))

	_, err := svc.ListFollowers(context.Background(), api.Username("bob"), nil, nil, &viewerID)
	if err == nil {
		t.Fatal("expected the follow list to be refused")
	}
	assertServiceError(t, err, http.StatusForbidden, "blocked")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// The same path with no block still reports a private account, so the added
// branch does not swallow the case it was threaded through.
func TestFollowsService_ListFollowers_PrivateStillReportsPrivate(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewFollowsService(store, nil, nil)
	svc.SetUsersService(service.NewUsersService(store))

	viewerID := uuid.New()
	targetID := uuid.New()

	expectGetUserByUsername(mock, targetID, "bob")
	mock.ExpectQuery(`SELECT can_view_user`).
		WillReturnRows(sqlmock.NewRows([]string{"can_view"}).AddRow(false))
	mock.ExpectQuery(`FROM account_blocks`).WithArgs(targetID, viewerID).
		WillReturnRows(sqlmock.NewRows([]string{"blocked"}).AddRow(false))

	_, err := svc.ListFollowers(context.Background(), api.Username("bob"), nil, nil, &viewerID)
	assertServiceError(t, err, http.StatusForbidden, "private_account")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// A block cuts both ways for interaction, even though it does not for reading.
// can_view_user deliberately keeps the blocker's view open so the reveal cushion
// has something to reveal; replying into a thread the other side cannot answer is
// a different thing, and is refused.
func TestPostsService_Create_ReplyToBlockedAuthorIsForbidden(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewPostsService(store, nil, nil)

	userID := uuid.New()
	parentID := uuid.New()

	mock.ExpectBegin()
	expectPostThreadInfo(mock, parentID, uuid.New(), false)
	mock.ExpectQuery(`FROM account_blocks`).
		WillReturnRows(sqlmock.NewRows([]string{"blocked"}).AddRow(true))
	mock.ExpectRollback()

	user := auth.User{ID: userID, Username: "alice"}
	parentPostID := api.PostId(parentID)
	content := "hello"
	_, err := svc.Create(context.Background(), user, api.CreatePostRequest{
		Content:  &content,
		ParentId: &parentPostID,
	})
	if err == nil {
		t.Fatal("expected replying across a block to be refused")
	}
	assertServiceError(t, err, http.StatusForbidden, "blocked")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// Boosting and quoting are refused the same way, and for the same reason.
func TestPostsService_Create_BoostOfBlockedAuthorIsForbidden(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewPostsService(store, nil, nil)

	userID := uuid.New()
	referenceID := uuid.New()

	mock.ExpectBegin()
	expectPostThreadInfo(mock, referenceID, uuid.New(), false)
	mock.ExpectQuery(`FROM account_blocks`).
		WillReturnRows(sqlmock.NewRows([]string{"blocked"}).AddRow(true))
	mock.ExpectRollback()

	user := auth.User{ID: userID, Username: "alice"}
	referencePostID := api.PostId(referenceID)
	_, err := svc.Create(context.Background(), user, api.CreatePostRequest{ReferenceId: &referencePostID})
	if err == nil {
		t.Fatal("expected boosting across a block to be refused")
	}
	assertServiceError(t, err, http.StatusForbidden, "blocked")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// A bookmark saved before the block stops appearing in the list.
//
// The bookmark row itself is left alone, so unmuting or unblocking brings the
// saved post straight back. Nothing here is a delete.
func TestBookmarksService_ListPosts_DropsHiddenAuthors(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	posts := service.NewPostsService(store, nil, nil)
	svc := service.NewBookmarksService(store, posts)

	viewer := uuid.New()
	listID := uuid.New()
	hiddenPost, visiblePost := uuid.New(), uuid.New()
	hiddenAuthor, visibleAuthor := uuid.New(), uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()

	mock.ExpectQuery(`FROM bookmark_lists l`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "icon", "is_default", "created_at", "post_count"}).
			AddRow(listID, nil, "🔖", true, created, 2))
	mock.ExpectQuery(`FROM bookmarks b`).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "created_at"}).
			AddRow(hiddenPost, created).AddRow(visiblePost, created))
	mock.ExpectQuery(`SELECT\s+p.id,`).WillReturnRows(
		sqlmock.NewRows([]string{
			"id", "user_id", "content", "parent_id", "root_id", "reference_id",
			"created_at", "deleted_at", "username", "display_name", "bio",
			"avatar_media_id", "user_created_at", "is_private", "avatar_ext",
			"parent_private", "parent_hidden",
		}).
			AddRow(hiddenPost, hiddenAuthor, "saved before the block", nil, nil, nil,
				created, nil, "mallory", nil, nil, nil, created, false, nil, false, false).
			AddRow(visiblePost, visibleAuthor, "an ordinary post", nil, nil, nil,
				created, nil, "bob", nil, nil, nil, created, false, nil, false, false),
	)
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

	page, err := svc.ListPosts(context.Background(), viewer, listID, nil, nil)
	if err != nil {
		t.Fatalf("ListPosts: %v", err)
	}
	if len(page.Items) != 1 || page.Items[0].Id != visiblePost {
		t.Fatalf("expected only the visible post, got %+v", page.Items)
	}
}
