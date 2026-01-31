package service_test

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/realtime"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
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
		WithArgs(userID, "hello").
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "content", "created_at", "deleted_at"}).
			AddRow(postID, userID, "hello", created, sql.NullTime{Valid: false}))
	mock.ExpectCommit()
	mock.ExpectQuery(`SELECT\s+p.id,`).WithArgs(postID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "content", "created_at", "deleted_at", "username", "display_name", "bio", "avatar_media_id", "user_created_at", "avatar_ext"}).
			AddRow(postID, userID, "hello", created, sql.NullTime{Valid: false}, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, userCreated, sql.NullString{}))
	mock.ExpectQuery(`SELECT\s+pm.post_id,`).WithArgs(postID).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "media_id", "type", "ext", "width", "height", "created_at", "sort_order"}))

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
	postID := api.PostId(uuid.New())
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	mock.ExpectBegin()
	mock.ExpectQuery(`DELETE FROM post_reaction_events`).WithArgs(userID, postID, "👍").
		WillReturnRows(sqlmock.NewRows([]string{"user_id"}).AddRow(userID))
	mock.ExpectQuery(`UPDATE post_reaction_counts`).WithArgs(postID, "👍").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectCommit()
	expectGetPostWithAuthor(mock, postID, userID, created, userCreated)
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
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "content", "created_at", "deleted_at", "username", "display_name", "bio", "avatar_media_id", "user_created_at", "avatar_ext"}).
			AddRow(postID, userID, "hello", created, sql.NullTime{Valid: false}, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, userCreated, sql.NullString{}))
}

func expectListReactionCounts(mock sqlmock.Sqlmock, postID api.PostId, emoji string, count int) {
	mock.ExpectQuery(`SELECT emoji, count`).WithArgs(postID).
		WillReturnRows(sqlmock.NewRows([]string{"emoji", "count"}).AddRow(emoji, count))
}

func expectListReactionCountsWithUserStatus(mock sqlmock.Sqlmock, postID api.PostId, userID uuid.UUID, emoji string, count int, reactedByUser bool) {
	mock.ExpectQuery(`SELECT.*prc\.emoji.*prc\.count.*EXISTS.*post_reaction_events`).WithArgs(postID, userID).
		WillReturnRows(sqlmock.NewRows([]string{"emoji", "count", "reacted_by_user"}).AddRow(emoji, count, reactedByUser))
}
