package service_test

import (
	"context"
	"database/sql"
	"net/http"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/realtime"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

type stubPublisher struct {
	events []realtime.Event
}

func (s *stubPublisher) Publish(_ context.Context, event realtime.Event) error {
	s.events = append(s.events, event)
	return nil
}

func TestPostsService_Create_PublishesEvent(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	publisher := &stubPublisher{}
	svc := service.NewPostsService(store, nil, publisher)

	userID := uuid.New()
	postID := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

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

	user := auth.User{ID: userID, Username: "alice"}
	content := "hello"
	if _, err := svc.Create(context.Background(), user, api.CreatePostRequest{Content: &content}); err != nil {
		t.Fatalf("Create: %v", err)
	}
	if len(publisher.events) != 1 || publisher.events[0].Type != realtime.EventPostCreated {
		t.Fatalf("expected post_created event, got %+v", publisher.events)
	}
	if publisher.events[0].Post == nil || publisher.events[0].Post.Id != api.PostId(postID) {
		t.Fatalf("expected post payload, got %+v", publisher.events[0])
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostsService_Create_BoostOnlyWithReferenceID(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	publisher := &stubPublisher{}
	svc := service.NewPostsService(store, nil, publisher)

	userID := uuid.New()
	postID := uuid.New()
	referenceID := uuid.New()
	referenceAuthorID := uuid.New()
	notificationID := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT id, user_id, parent_id, root_id, reference_id, deleted_at`).
		WithArgs(referenceID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "parent_id", "root_id", "reference_id", "deleted_at"}).
			AddRow(referenceID, referenceAuthorID, uuid.NullUUID{}, uuid.NullUUID{}, uuid.NullUUID{}, sql.NullTime{Valid: false}))
	mock.ExpectQuery(`INSERT INTO posts`).
		WithArgs(userID, "", uuid.NullUUID{}, uuid.NullUUID{}, uuid.NullUUID{UUID: referenceID, Valid: true}).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "content", "parent_id", "root_id", "reference_id", "created_at", "deleted_at"}).
			AddRow(postID, userID, "", uuid.NullUUID{}, uuid.NullUUID{}, uuid.NullUUID{UUID: referenceID, Valid: true}, created, sql.NullTime{Valid: false}))
	// Boosting someone else's post notifies its author.
	mock.ExpectQuery(`INSERT INTO notifications`).
		WithArgs(referenceAuthorID, string(api.Boost), uuid.NullUUID{UUID: userID, Valid: true}, uuid.NullUUID{UUID: postID, Valid: true}, "").
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(notificationID, created))
	mock.ExpectCommit()
	expectGetPostWithAuthor(mock, api.PostId(postID), userID, created, userCreated)
	mock.ExpectQuery(`SELECT\s+pm.post_id,`).WithArgs(postID).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "media_id", "type", "ext", "width", "height", "created_at", "sort_order"}))
	expectListMentions(mock)
	expectCountReplies(mock)
	expectCountBoosts(mock)

	user := auth.User{ID: userID, Username: "alice"}
	referencePostID := api.PostId(referenceID)
	if _, err := svc.Create(context.Background(), user, api.CreatePostRequest{ReferenceId: &referencePostID}); err != nil {
		t.Fatalf("Create boost: %v", err)
	}
	if len(publisher.events) != 1 || publisher.events[0].Type != realtime.EventPostCreated {
		t.Fatalf("expected post_created event, got %+v", publisher.events)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostsService_Create_DuplicateBoostReturnsConflict(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewPostsService(store, nil, nil)

	userID := uuid.New()
	referenceID := uuid.New()

	mock.ExpectBegin()
	mock.ExpectQuery(`SELECT id, user_id, parent_id, root_id, reference_id, deleted_at`).
		WithArgs(referenceID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "parent_id", "root_id", "reference_id", "deleted_at"}).
			AddRow(referenceID, uuid.New(), uuid.NullUUID{}, uuid.NullUUID{}, uuid.NullUUID{}, sql.NullTime{Valid: false}))
	mock.ExpectQuery(`INSERT INTO posts`).
		WithArgs(userID, "", uuid.NullUUID{}, uuid.NullUUID{}, uuid.NullUUID{UUID: referenceID, Valid: true}).
		WillReturnError(&pgconn.PgError{Code: "23505"})
	mock.ExpectRollback()

	user := auth.User{ID: userID, Username: "alice"}
	referencePostID := api.PostId(referenceID)
	_, err := svc.Create(context.Background(), user, api.CreatePostRequest{ReferenceId: &referencePostID})
	if err == nil {
		t.Fatal("expected conflict error")
	}
	assertServiceError(t, err, http.StatusConflict, "already_boosted")

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestPostsService_Delete_PublishesEvent(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	publisher := &stubPublisher{}
	svc := service.NewPostsService(store, nil, publisher)

	userID := uuid.New()
	postID := api.PostId(uuid.New())
	deleted := time.Unix(1_700_000_123, 0).UTC()

	mock.ExpectQuery(`SELECT user_id`).WithArgs(postID).
		WillReturnRows(sqlmock.NewRows([]string{"user_id"}).AddRow(userID))
	mock.ExpectQuery(`UPDATE posts`).WithArgs(postID, userID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "deleted_at"}).AddRow(postID, deleted))

	user := auth.User{ID: userID, Username: "alice"}
	if err := svc.Delete(context.Background(), user, postID); err != nil {
		t.Fatalf("Delete: %v", err)
	}
	if len(publisher.events) != 1 || publisher.events[0].Type != realtime.EventPostDeleted {
		t.Fatalf("expected post_deleted event, got %+v", publisher.events)
	}
	if publisher.events[0].PostId == nil || *publisher.events[0].PostId != postID {
		t.Fatalf("expected post id payload, got %+v", publisher.events[0])
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestReactionsService_Add_PublishesEvent(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	publisher := &stubPublisher{}
	svc := service.NewReactionsService(store, nil, publisher)

	userID := uuid.New()
	postID := api.PostId(uuid.New())
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	expectGetPostWithAuthor(mock, postID, userID, created, userCreated)
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO post_reaction_events`).WithArgs(userID, postID, "👍").
		WillReturnRows(sqlmock.NewRows([]string{"user_id"}).AddRow(userID))
	mock.ExpectQuery(`INSERT INTO post_reaction_counts`).WithArgs(postID, "👍").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectCommit()
	expectGetPostWithAuthor(mock, postID, userID, created, userCreated)
	expectListReactionCountsWithUserStatus(mock, postID, userID, "👍", 1, true)

	user := auth.User{ID: userID, Username: "alice"}
	if _, err := svc.Add(context.Background(), user, postID, api.ReactRequest{Emoji: api.Emoji("👍")}); err != nil {
		t.Fatalf("Add: %v", err)
	}
	if len(publisher.events) != 1 || publisher.events[0].Type != realtime.EventReactionUpdated {
		t.Fatalf("expected reaction_updated event, got %+v", publisher.events)
	}
	if publisher.events[0].ReactionCounts == nil || publisher.events[0].ReactionCounts.PostId != postID {
		t.Fatalf("expected reaction counts payload, got %+v", publisher.events[0])
	}
	if len(publisher.events[0].ReactionCounts.Reactions) != 1 ||
		publisher.events[0].ReactionCounts.Reactions[0].ReactedByCurrentUser {
		t.Fatalf("expected anonymized reaction counts payload, got %+v", publisher.events[0].ReactionCounts)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestReactionsService_Remove_PublishesEvent(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	publisher := &stubPublisher{}
	svc := service.NewReactionsService(store, nil, publisher)

	userID := uuid.New()
	postAuthorID := uuid.New()
	postID := api.PostId(uuid.New())
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	// Remove looks up the post author first, to find the notification to drop.
	expectGetPostWithAuthor(mock, postID, postAuthorID, created, userCreated)
	mock.ExpectBegin()
	mock.ExpectQuery(`DELETE FROM post_reaction_events`).WithArgs(userID, postID, "👍").
		WillReturnRows(sqlmock.NewRows([]string{"user_id"}).AddRow(userID))
	// Un-reacting takes the notification with it, so the same reaction can notify again.
	mock.ExpectExec(`DELETE FROM notifications`).
		WithArgs(postAuthorID, string(api.Reaction), uuid.NullUUID{UUID: userID, Valid: true}, uuid.NullUUID{UUID: uuid.UUID(postID), Valid: true}, "👍").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectQuery(`UPDATE post_reaction_counts`).WithArgs(postID, "👍").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectCommit()
	expectGetPostWithAuthor(mock, postID, postAuthorID, created, userCreated)
	expectListReactionCountsWithUserStatus(mock, postID, userID, "👍", 1, false)

	user := auth.User{ID: userID, Username: "alice"}
	if _, err := svc.Remove(context.Background(), user, postID, api.Emoji("👍")); err != nil {
		t.Fatalf("Remove: %v", err)
	}
	if len(publisher.events) != 1 || publisher.events[0].Type != realtime.EventReactionUpdated {
		t.Fatalf("expected reaction_updated event, got %+v", publisher.events)
	}
	if publisher.events[0].ReactionCounts == nil || publisher.events[0].ReactionCounts.PostId != postID {
		t.Fatalf("expected reaction counts payload, got %+v", publisher.events[0])
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func expectGetPostWithAuthor(mock sqlmock.Sqlmock, postID api.PostId, userID uuid.UUID, created time.Time, userCreated time.Time) {
	mock.ExpectQuery(`SELECT\s+p.id,`).WithArgs(postID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "content", "parent_id", "root_id", "reference_id", "created_at", "deleted_at", "username", "display_name", "bio", "avatar_media_id", "user_created_at", "avatar_ext"}).
			AddRow(postID, userID, "hello", uuid.NullUUID{}, uuid.NullUUID{}, uuid.NullUUID{}, created, sql.NullTime{Valid: false}, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, userCreated, sql.NullString{}))
}

// expectListMentions sets up an expectation for ListMentionsForPosts returning no rows.
func expectListMentions(mock sqlmock.Sqlmock) {
	mock.ExpectQuery(`SELECT\s+pm.post_id,\s+u.id AS user_id`).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "user_id", "username", "display_name", "avatar_media_id", "avatar_ext"}))
}

// expectCountReplies sets up an expectation for CountRepliesByParentIDs returning no rows.
func expectCountReplies(mock sqlmock.Sqlmock) {
	mock.ExpectQuery(`SELECT parent_id, COUNT\(\*\)`).
		WillReturnRows(sqlmock.NewRows([]string{"parent_id", "reply_count"}))
}

// expectCountBoosts sets up an expectation for CountBoostsByPostIDs returning no rows.
func expectCountBoosts(mock sqlmock.Sqlmock) {
	mock.ExpectQuery(`SELECT reference_id, COUNT\(\*\)`).
		WillReturnRows(sqlmock.NewRows([]string{"reference_id", "boost_count"}))
}

func expectListReactionCounts(mock sqlmock.Sqlmock, postID api.PostId, emoji string, count int) {
	mock.ExpectQuery(`SELECT emoji, count`).WithArgs(postID).
		WillReturnRows(sqlmock.NewRows([]string{"emoji", "count"}).AddRow(emoji, count))
}

func expectListReactionCountsWithUserStatus(mock sqlmock.Sqlmock, postID api.PostId, userID uuid.UUID, emoji string, count int, reactedByUser bool) {
	mock.ExpectQuery(`SELECT.*prc\.emoji.*prc\.count.*EXISTS.*post_reaction_events`).WithArgs(postID, userID).
		WillReturnRows(sqlmock.NewRows([]string{"emoji", "count", "reacted_by_user"}).AddRow(emoji, count, reactedByUser))
}
