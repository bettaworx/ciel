package service_test

import (
	"context"
	"database/sql"
	"strings"
	"testing"
	"time"

	"backend/internal/cache"
	"backend/internal/db/sqlc"
	"backend/internal/service"

	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

func TestPublicBaseURL_Default(t *testing.T) {
	t.Setenv("PUBLIC_BASE_URL", "")
	if got := service.PublicBaseURL(); got != "http://localhost:6137" {
		t.Fatalf("expected default base url, got %q", got)
	}
}

func TestPublicBaseURL_TrimsWhitespaceAndTrailingSlash(t *testing.T) {
	t.Setenv("PUBLIC_BASE_URL", "  https://example.com/base/  ")
	if got := service.PublicBaseURL(); got != "https://example.com/base" {
		t.Fatalf("expected trimmed base url, got %q", got)
	}
}

func TestMediaImageURL_DefaultsExtAndNormalizes(t *testing.T) {
	t.Setenv("PUBLIC_BASE_URL", "https://example.com/")
	id := uuid.MustParse("00000000-0000-0000-0000-000000000000")

	url := service.MediaImageURL(id, "")
	if !strings.HasSuffix(url, "/media/00000000-0000-0000-0000-000000000000/image.webp") {
		t.Fatalf("expected default webp url, got %q", url)
	}

	url = service.MediaImageURL(id, " .PNG ")
	if !strings.HasSuffix(url, "/media/00000000-0000-0000-0000-000000000000/image.png") {
		t.Fatalf("expected normalized png url, got %q", url)
	}
}

func TestMapPostRow_DeletedAtNull(t *testing.T) {
	pid := uuid.New()
	uid := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	row := sqlc.GetPostWithAuthorByIDRow{
		ID:            pid,
		UserID:        uid,
		Content:       "hello",
		CreatedAt:     created,
		DeletedAt:     sql.NullTime{Valid: false},
		Username:      "alice",
		UserCreatedAt: userCreated,
	}

	post := service.MapPostRow(row)
	if post.Id != pid {
		t.Fatalf("expected post id %s, got %s", pid, post.Id)
	}
	if post.Author.Id != uid {
		t.Fatalf("expected author id %s, got %s", uid, post.Author.Id)
	}
	if post.DeletedAt != nil {
		t.Fatalf("expected DeletedAt nil")
	}
}

func TestMapPostRow_DeletedAtValid(t *testing.T) {
	pid := uuid.New()
	uid := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()
	deleted := time.Unix(1_700_000_123, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	row := sqlc.GetPostWithAuthorByIDRow{
		ID:            pid,
		UserID:        uid,
		Content:       "hello",
		CreatedAt:     created,
		DeletedAt:     sql.NullTime{Time: deleted, Valid: true},
		Username:      "alice",
		UserCreatedAt: userCreated,
	}

	post := service.MapPostRow(row)
	if post.DeletedAt == nil {
		t.Fatalf("expected DeletedAt non-nil")
	}
	if !post.DeletedAt.Equal(deleted) {
		t.Fatalf("expected DeletedAt %s, got %s", deleted, post.DeletedAt)
	}
}

func TestEncodeDecodeCursor_RoundTrip(t *testing.T) {
	id := uuid.New()
	c := service.TimelineCursor{Score: 12345, ID: id.String()}

	enc := service.EncodeCursor(c)
	dec, err := service.DecodeCursor(&enc)
	if err != nil {
		t.Fatalf("expected decode to succeed, got %v", err)
	}
	if dec == nil {
		t.Fatalf("expected cursor")
	}
	if dec.Score != c.Score || dec.ID != c.ID {
		t.Fatalf("expected %+v, got %+v", c, *dec)
	}
}

func TestDecodeCursor_EmptyIsNil(t *testing.T) {
	empty := ""
	dec, err := service.DecodeCursor(&empty)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if dec != nil {
		t.Fatalf("expected nil cursor")
	}
}

func TestDecodeCursor_InvalidCases(t *testing.T) {
	cases := []string{
		"not-base64",
		"e30", // {} (missing fields)
	}
	for _, c := range cases {
		c := c
		if _, err := service.DecodeCursor(&c); err == nil {
			t.Fatalf("expected error for %q", c)
		}
	}

	bad := service.EncodeCursor(service.TimelineCursor{Score: -1, ID: uuid.New().String()})
	if _, err := service.DecodeCursor(&bad); err == nil {
		t.Fatalf("expected error for negative score")
	}

	badID := service.EncodeCursor(service.TimelineCursor{Score: 1, ID: "not-a-uuid"})
	if _, err := service.DecodeCursor(&badID); err == nil {
		t.Fatalf("expected error for invalid uuid")
	}
}

func TestTimelineService_ListFromRedis_OrdersAndPaginates(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	// TimelineService fields are unexported; instantiate via constructor.
	cacheImpl := cache.NewRedisCache(rdb)
	svc := service.NewTimelineService(nil, cacheImpl)
	key := service.TimelineKeyGlobal()

	id1 := uuid.New()
	id2 := uuid.New()
	id3 := uuid.New()

	if err := rdb.ZAdd(context.Background(), key,
		reids(3000, id1),
		reids(2000, id2),
		reids(1000, id3),
	).Err(); err != nil {
		t.Fatalf("ZAdd: %v", err)
	}

	ids, next, ok := svc.ListFromRedis(context.Background(), 2, nil)
	if !ok {
		t.Fatalf("expected ok")
	}
	if len(ids) != 2 {
		t.Fatalf("expected 2 ids, got %d", len(ids))
	}
	if ids[0] != id1 || ids[1] != id2 {
		t.Fatalf("unexpected order: %v", ids)
	}
	if next == nil || next.Score != 2000 {
		t.Fatalf("expected next cursor at score 2000, got %+v", next)
	}

	ids2, _, ok := svc.ListFromRedis(context.Background(), 2, next)
	if !ok {
		t.Fatalf("expected ok")
	}
	if len(ids2) != 1 || ids2[0] != id3 {
		t.Fatalf("expected [id3], got %v", ids2)
	}
}

func TestTimelineService_ListFromRedis_TieBreaksByID(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)
	svc := service.NewTimelineService(nil, cacheImpl)
	key := service.TimelineKeyGlobal()

	idA := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	idB := uuid.MustParse("00000000-0000-0000-0000-000000000002")

	if err := rdb.ZAdd(context.Background(), key,
		reids(1000, idA),
		reids(1000, idB),
	).Err(); err != nil {
		t.Fatalf("ZAdd: %v", err)
	}

	cursor := &service.TimelineCursor{Score: 1000, ID: idB.String()}
	ids, _, ok := svc.ListFromRedis(context.Background(), 10, cursor)
	if !ok {
		t.Fatalf("expected ok")
	}
	if len(ids) != 1 || ids[0] != idA {
		t.Fatalf("expected [idA], got %v", ids)
	}
}

func reids(score int64, id uuid.UUID) redis.Z {
	return redis.Z{Score: float64(score), Member: id.String()}
}
