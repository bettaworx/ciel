package service_test

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

func TestReactionsService_ListUsers(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewReactionsService(store, nil, nil)

	postID := api.PostId(uuid.New())
	userID := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()
	reactedAt := time.Unix(1_700_000_100, 0).UTC()

	expectGetPostWithAuthor(mock, postID, userID, created, userCreated)
	mock.ExpectQuery(`SELECT
	pre.user_id,`).
		WithArgs(postID, "👍", sql.NullTime{}, uuid.NullUUID{}, int32(2)).
		WillReturnRows(sqlmock.NewRows([]string{
			"user_id",
			"username",
			"display_name",
			"bio",
			"avatar_media_id",
			"user_created_at",
			"avatar_ext",
			"reacted_at",
		}).AddRow(userID, "alice", "Alice", "", nil, userCreated, "", reactedAt))

	page, err := svc.ListUsers(context.Background(), postID, api.Emoji("👍"), 2, nil)
	if err != nil {
		t.Fatalf("ListUsers: %v", err)
	}
	if page.PostId != postID || page.Emoji != api.Emoji("👍") || len(page.Users) != 1 {
		t.Fatalf("unexpected page: %+v", page)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
