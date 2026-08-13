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

	mock.ExpectQuery(`SELECT\s+p.id,`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "content", "parent_id", "root_id", "reference_id", "created_at", "deleted_at", "username", "display_name", "bio", "avatar_media_id", "user_created_at", "is_private", "avatar_ext", "parent_private", "parent_hidden"}).
			AddRow(postID, userID, "hello", uuid.NullUUID{}, uuid.NullUUID{}, uuid.NullUUID{}, created, sql.NullTime{Valid: false}, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, userCreated, false, sql.NullString{}, false, false))
	mock.ExpectQuery(`SELECT\s+pm.post_id,`).WithArgs(sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "media_id", "type", "ext", "width", "height", "created_at", "sort_order"}))
	expectCountReplies(mock)

	limit := 1
	page, err := svc.Get(context.Background(), api.GetTimelineParams{Limit: &limit}, nil)
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

	mock.ExpectQuery(`SELECT\s+p.id,`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "content", "parent_id", "root_id", "reference_id", "created_at", "deleted_at", "username", "display_name", "bio", "avatar_media_id", "user_created_at", "is_private", "avatar_ext", "parent_private", "parent_hidden"}).
			AddRow(postID, userID, "hello", uuid.NullUUID{}, uuid.NullUUID{}, uuid.NullUUID{}, created, sql.NullTime{Valid: false}, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, userCreated, false, sql.NullString{}, false, false))
	mock.ExpectQuery(`SELECT\s+pm.post_id,`).WithArgs(sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "media_id", "type", "ext", "width", "height", "created_at", "sort_order"}))
	expectCountReplies(mock)

	limit := 1
	page, err := svc.Get(context.Background(), api.GetTimelineParams{Limit: &limit}, nil)
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

// A global ZSET that cannot fill a whole page means the cache is short, not that
// the feed ended — the key is only ever written by post creation, so a Redis
// restart leaves it holding an arbitrary tail. Serving it as-is dropped
// NextCursor and stopped infinite scroll at a fixed point.
func TestTimelineService_Get_PartialRedisPageFallsBackAndKeepsCursor(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)

	svc := service.NewTimelineService(store, cacheImpl)
	key := service.TimelineKeyGlobal()

	cachedID := uuid.New()
	userID := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	// One entry, but a page holds two: the cache cannot fill it.
	if err := rdb.ZAdd(context.Background(), key, redis.Z{Score: float64(created.UnixMilli()), Member: cachedID.String()}).Err(); err != nil {
		t.Fatalf("ZAdd: %v", err)
	}

	dbIDs := []uuid.UUID{cachedID, uuid.New()}
	rows := sqlmock.NewRows([]string{"id", "user_id", "content", "parent_id", "root_id", "reference_id", "created_at", "deleted_at", "username", "display_name", "bio", "avatar_media_id", "user_created_at", "is_private", "avatar_ext", "parent_private", "parent_hidden"})
	for _, id := range dbIDs {
		rows.AddRow(id, userID, "hello", uuid.NullUUID{}, uuid.NullUUID{}, uuid.NullUUID{}, created, sql.NullTime{Valid: false}, "alice", sql.NullString{}, sql.NullString{}, uuid.NullUUID{}, userCreated, false, sql.NullString{}, false, false)
	}
	mock.ExpectQuery(`SELECT\s+p.id,`).WillReturnRows(rows)
	mock.ExpectQuery(`SELECT\s+pm.post_id,`).WithArgs(sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "media_id", "type", "ext", "width", "height", "created_at", "sort_order"}))
	expectCountReplies(mock)
	// The first-page miss also rebuilds the ZSET.
	mock.ExpectQuery(`SELECT p\.id, p\.created_at`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).
			AddRow(dbIDs[0], created).
			AddRow(dbIDs[1], created))

	limit := 2
	page, err := svc.Get(context.Background(), api.GetTimelineParams{Limit: &limit}, nil)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if len(page.Items) != 2 {
		t.Fatalf("expected the database page, got %d items", len(page.Items))
	}
	if page.NextCursor == nil {
		t.Fatal("NextCursor is nil: a short cache page was mistaken for the end of the feed")
	}
	if got, err := rdb.ZCard(context.Background(), key).Result(); err != nil || got != 2 {
		t.Fatalf("global ZSET not warmed: card=%d err=%v", got, err)
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
