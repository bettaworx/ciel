package service_test

import (
	"context"
	"database/sql"
	"encoding/json"
	"testing"
	"time"

	"backend/internal/cache"
	"backend/internal/service"

	dbsqlc "backend/internal/db/sqlc"

	"github.com/DATA-DOG/go-sqlmock"
	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// emojiCols is the ordered list of columns returned by custom_emojis queries.
var emojiCols = []string{"id", "shortcode", "name", "category", "license", "width", "height", "created_at", "updated_at"}

// newEmojiRows returns a sqlmock Rows with one custom emoji row.
func newEmojiRows(e dbsqlc.CustomEmoji) *sqlmock.Rows {
	return sqlmock.NewRows(emojiCols).AddRow(
		e.ID, e.Shortcode, e.Name, e.Category, e.License, e.Width, e.Height, e.CreatedAt, e.UpdatedAt,
	)
}

func makeTestEmoji(shortcode string) dbsqlc.CustomEmoji {
	return dbsqlc.CustomEmoji{
		ID:        uuid.New(),
		Shortcode: shortcode,
		Width:     192,
		Height:    128,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}
}

// --- GetByShortcode ---

func TestEmojiService_GetByShortcode_Found(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewEmojiService(store, nil, nil)

	emoji := makeTestEmoji("blobcat")
	emoji.Name = sql.NullString{String: "Blob Cat", Valid: true}

	mock.ExpectQuery(`SELECT .* FROM custom_emojis WHERE shortcode`).
		WithArgs("blobcat").
		WillReturnRows(newEmojiRows(emoji))

	got, err := svc.GetByShortcode(context.Background(), "blobcat")
	if err != nil {
		t.Fatalf("GetByShortcode: %v", err)
	}
	if got.ID != emoji.ID {
		t.Fatalf("expected ID %s, got %s", emoji.ID, got.ID)
	}
	if got.Shortcode != "blobcat" {
		t.Fatalf("expected shortcode 'blobcat', got %q", got.Shortcode)
	}
}

func TestEmojiService_GetByShortcode_NotFound(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewEmojiService(store, nil, nil)

	mock.ExpectQuery(`SELECT .* FROM custom_emojis WHERE shortcode`).
		WithArgs("missing").
		WillReturnRows(sqlmock.NewRows(emojiCols)) // empty

	_, err := svc.GetByShortcode(context.Background(), "missing")
	if err == nil {
		t.Fatal("expected error for missing emoji")
	}
	se, ok := err.(*service.Error)
	if !ok {
		t.Fatalf("expected *service.Error, got %T: %v", err, err)
	}
	if se.Status != 404 {
		t.Fatalf("expected 404, got %d", se.Status)
	}
}

// --- GetByID ---

func TestEmojiService_GetByID_Found(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewEmojiService(store, nil, nil)
	emoji := makeTestEmoji("wave")

	mock.ExpectQuery(`SELECT .* FROM custom_emojis WHERE id`).
		WithArgs(emoji.ID).
		WillReturnRows(newEmojiRows(emoji))

	got, err := svc.GetByID(context.Background(), emoji.ID)
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}
	if got.ID != emoji.ID {
		t.Fatalf("expected ID %s, got %s", emoji.ID, got.ID)
	}
}

func TestEmojiService_GetByID_NotFound(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewEmojiService(store, nil, nil)
	id := uuid.New()

	mock.ExpectQuery(`SELECT .* FROM custom_emojis WHERE id`).
		WithArgs(id).
		WillReturnRows(sqlmock.NewRows(emojiCols))

	_, err := svc.GetByID(context.Background(), id)
	if err == nil {
		t.Fatal("expected error for missing emoji")
	}
}

// --- List ---

func TestEmojiService_List_Empty(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewEmojiService(store, nil, nil)

	mock.ExpectQuery(`SELECT COUNT`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	emojis, total, err := svc.List(context.Background(), 50, 0)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if total != 0 || len(emojis) != 0 {
		t.Fatalf("expected empty, got total=%d emojis=%v", total, emojis)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unfulfilled expectations: %v", err)
	}
}

func TestEmojiService_List_QueriesDB_WhenCacheEmpty(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)

	svc := service.NewEmojiService(store, nil, cacheImpl)

	emoji := makeTestEmoji("db_emoji")

	mock.ExpectQuery(`SELECT COUNT`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
	mock.ExpectQuery(`SELECT .* FROM custom_emojis ORDER BY shortcode`).
		WillReturnRows(newEmojiRows(emoji))

	emojis, total, err := svc.List(context.Background(), 50, 0)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected total 1, got %d", total)
	}
	if len(emojis) != 1 || emojis[0].Shortcode != "db_emoji" {
		t.Fatalf("expected db emoji, got %+v", emojis)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unfulfilled expectations: %v", err)
	}
}

func TestEmojiService_List_UsesCache(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)

	svc := service.NewEmojiService(store, nil, cacheImpl)

	emoji := makeTestEmoji("cached_emoji")
	cached := []dbsqlc.CustomEmoji{emoji}
	raw, _ := json.Marshal(cached)
	if err := rdb.Set(context.Background(), "emojis:list", string(raw), time.Hour).Err(); err != nil {
		t.Fatalf("redis set: %v", err)
	}

	// Only COUNT goes to DB when cache is warm.
	mock.ExpectQuery(`SELECT COUNT`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	emojis, total, err := svc.List(context.Background(), 50, 0)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected total 1, got %d", total)
	}
	if len(emojis) != 1 || emojis[0].Shortcode != "cached_emoji" {
		t.Fatalf("expected cached emoji, got %+v", emojis)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unfulfilled expectations: %v", err)
	}
}

// --- Delete ---

func TestEmojiService_Delete_NotFound(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	svc := service.NewEmojiService(store, nil, nil)
	id := uuid.New()

	mock.ExpectQuery(`SELECT .* FROM custom_emojis WHERE id`).
		WithArgs(id).
		WillReturnRows(sqlmock.NewRows(emojiCols))

	err := svc.Delete(context.Background(), id)
	if err == nil {
		t.Fatal("expected error for missing emoji")
	}
	se, ok := err.(*service.Error)
	if !ok {
		t.Fatalf("expected *service.Error, got %T", err)
	}
	if se.Status != 404 {
		t.Fatalf("expected 404, got %d", se.Status)
	}
}

func TestEmojiService_Delete_Success(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	// mediaSvc=nil: DeleteEmojiImage call is guarded; os.RemoveAll on non-existent path is safe.
	svc := service.NewEmojiService(store, nil, nil)
	emoji := makeTestEmoji("gone")

	mock.ExpectQuery(`SELECT .* FROM custom_emojis WHERE id`).
		WithArgs(emoji.ID).
		WillReturnRows(newEmojiRows(emoji))
	mock.ExpectExec(`DELETE FROM custom_emojis`).
		WithArgs(emoji.ID).
		WillReturnResult(sqlmock.NewResult(1, 1))

	if err := svc.Delete(context.Background(), emoji.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unfulfilled expectations: %v", err)
	}
}

func TestEmojiService_Delete_InvalidatesCache(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)

	svc := service.NewEmojiService(store, nil, cacheImpl)

	// Prime cache.
	if err := rdb.Set(context.Background(), "emojis:list", `[]`, time.Hour).Err(); err != nil {
		t.Fatalf("redis set: %v", err)
	}

	emoji := makeTestEmoji("evict")

	mock.ExpectQuery(`SELECT .* FROM custom_emojis WHERE id`).
		WithArgs(emoji.ID).
		WillReturnRows(newEmojiRows(emoji))
	mock.ExpectExec(`DELETE FROM custom_emojis`).
		WithArgs(emoji.ID).
		WillReturnResult(sqlmock.NewResult(1, 1))

	if err := svc.Delete(context.Background(), emoji.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}

	// Cache key should be evicted.
	exists, err := rdb.Exists(context.Background(), "emojis:list").Result()
	if err != nil {
		t.Fatalf("redis exists: %v", err)
	}
	if exists != 0 {
		t.Fatal("expected cache key to be deleted after Delete")
	}
}

// --- URL helper ---

func TestEmojiImageURL(t *testing.T) {
	t.Setenv("PUBLIC_BASE_URL", "https://example.com/")
	id := uuid.MustParse("11111111-1111-1111-1111-111111111111")

	got := service.EmojiImageURL(id)
	want := "https://example.com/emoji/11111111-1111-1111-1111-111111111111/image.webp"
	if got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
}
