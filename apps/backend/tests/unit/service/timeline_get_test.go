package service_test

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/cache"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

func TestTimelineService_Get_UsesRedis(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)

	svc := service.NewTimelineService(store, cacheImpl)
	key := service.TimelineKeyGlobal()

	postID := uuid.New()
	userID := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	if err := rdb.ZAdd(context.Background(), key, redis.Z{Score: float64(created.UnixMilli()), Member: postID.String()}).Err(); err != nil {
		t.Fatalf("ZAdd: %v", err)
	}

	mock.ExpectQuery(`SELECT\s+p.id,`).WithArgs(sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "content", "created_at", "deleted_at", "username", "display_name", "bio", "avatar_media_id", "user_created_at", "avatar_ext"}).
			AddRow(postID, userID, "hello", created, sql.NullTime{Valid: false}, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, userCreated, sql.NullString{}))
	mock.ExpectQuery(`SELECT\s+pm.post_id,`).WithArgs(sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "media_id", "type", "ext", "width", "height", "created_at", "sort_order"}))

	limit := 1
	page, err := svc.Get(context.Background(), api.GetTimelineParams{Limit: &limit})
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if len(page.Items) != 1 || page.Items[0].Id != postID {
		t.Fatalf("unexpected page items: %+v", page.Items)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestTimelineService_Get_FallsBackToDB(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewTimelineService(store, nil)

	postID := uuid.New()
	userID := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	mock.ExpectQuery(`SELECT\s+p.id,`).WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "content", "created_at", "deleted_at", "username", "display_name", "bio", "avatar_media_id", "user_created_at", "avatar_ext"}).
			AddRow(postID, userID, "hello", created, sql.NullTime{Valid: false}, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, userCreated, sql.NullString{}))
	mock.ExpectQuery(`SELECT\s+pm.post_id,`).WithArgs(sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "media_id", "type", "ext", "width", "height", "created_at", "sort_order"}))

	limit := 1
	page, err := svc.Get(context.Background(), api.GetTimelineParams{Limit: &limit})
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if len(page.Items) != 1 || page.Items[0].Id != postID {
		t.Fatalf("unexpected page items: %+v", page.Items)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func newMockStore(t *testing.T) (*repository.Store, sqlmock.Sqlmock, func()) {
	t.Helper()

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	store := repository.NewStore(db)
	cleanup := func() {
		_ = db.Close()
	}
	return store, mock, cleanup
}
