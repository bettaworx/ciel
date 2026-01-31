package service_test

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/cache"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

func TestReactionsService_List_UsesCache(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)

	svc := service.NewReactionsService(store, cacheImpl, nil)

	postID := api.PostId(uuid.New())
	counts := api.ReactionCounts{
		PostId: postID,
		Reactions: []api.ReactionCount{
			{Emoji: api.Emoji("👍"), Count: 2},
		},
	}
	payload, err := json.Marshal(counts)
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}
	if err := rdb.Set(context.Background(), reactionCacheKey(postID), payload, time.Hour).Err(); err != nil {
		t.Fatalf("redis set: %v", err)
	}

	got, err := svc.List(context.Background(), postID, nil)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if got.PostId != postID || len(got.Reactions) != 1 || got.Reactions[0].Count != 2 {
		t.Fatalf("unexpected counts: %+v", got)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestReactionsService_List_PopulatesCache(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)
	svc := service.NewReactionsService(store, cacheImpl, nil)

	postID := api.PostId(uuid.New())
	userID := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	expectGetPostWithAuthor(mock, postID, userID, created, userCreated)
	expectListReactionCounts(mock, postID, "👍", 3)

	got, err := svc.List(context.Background(), postID, nil)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if got.PostId != postID || len(got.Reactions) != 1 || got.Reactions[0].Count != 3 {
		t.Fatalf("unexpected counts: %+v", got)
	}

	payload, err := rdb.Get(context.Background(), reactionCacheKey(postID)).Result()
	if err != nil {
		t.Fatalf("redis get: %v", err)
	}
	var cached api.ReactionCounts
	if err := json.Unmarshal([]byte(payload), &cached); err != nil {
		t.Fatalf("json.Unmarshal: %v", err)
	}
	if cached.PostId != postID || len(cached.Reactions) != 1 || cached.Reactions[0].Count != 3 {
		t.Fatalf("unexpected cached counts: %+v", cached)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestReactionsService_Add_UpdatesCache(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)
	svc := service.NewReactionsService(store, cacheImpl, nil)

	postID := api.PostId(uuid.New())
	userID := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	stale := api.ReactionCounts{PostId: postID, Reactions: []api.ReactionCount{{Emoji: api.Emoji("👍"), Count: 1}}}
	stalePayload, err := json.Marshal(stale)
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}
	if err := rdb.Set(context.Background(), reactionCacheKey(postID), stalePayload, time.Hour).Err(); err != nil {
		t.Fatalf("redis set: %v", err)
	}

	expectGetPostWithAuthor(mock, postID, userID, created, userCreated)
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO post_reaction_events`).WithArgs(userID, postID, "👍").
		WillReturnRows(sqlmock.NewRows([]string{"user_id"}).AddRow(userID))
	mock.ExpectQuery(`INSERT INTO post_reaction_counts`).WithArgs(postID, "👍").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	mock.ExpectCommit()
	expectGetPostWithAuthor(mock, postID, userID, created, userCreated)
	expectListReactionCountsWithUserStatus(mock, postID, userID, "👍", 2, true)

	user := auth.User{ID: userID, Username: "alice"}
	if _, err := svc.Add(context.Background(), user, postID, api.ReactRequest{Emoji: api.Emoji("👍")}); err != nil {
		t.Fatalf("Add: %v", err)
	}

	payload, err := rdb.Get(context.Background(), reactionCacheKey(postID)).Result()
	if err != nil {
		t.Fatalf("redis get: %v", err)
	}
	var cached api.ReactionCounts
	if err := json.Unmarshal([]byte(payload), &cached); err != nil {
		t.Fatalf("json.Unmarshal: %v", err)
	}
	if len(cached.Reactions) != 1 || cached.Reactions[0].Count != 2 {
		t.Fatalf("unexpected cached counts: %+v", cached)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestReactionsService_Remove_UpdatesCache(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)
	svc := service.NewReactionsService(store, cacheImpl, nil)

	postID := api.PostId(uuid.New())
	userID := uuid.New()
	created := time.Unix(1_700_000_000, 0).UTC()
	userCreated := time.Unix(1_600_000_000, 0).UTC()

	stale := api.ReactionCounts{PostId: postID, Reactions: []api.ReactionCount{{Emoji: api.Emoji("👍"), Count: 2}}}
	stalePayload, err := json.Marshal(stale)
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}
	if err := rdb.Set(context.Background(), reactionCacheKey(postID), stalePayload, time.Hour).Err(); err != nil {
		t.Fatalf("redis set: %v", err)
	}

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

	payload, err := rdb.Get(context.Background(), reactionCacheKey(postID)).Result()
	if err != nil {
		t.Fatalf("redis get: %v", err)
	}
	var cached api.ReactionCounts
	if err := json.Unmarshal([]byte(payload), &cached); err != nil {
		t.Fatalf("json.Unmarshal: %v", err)
	}
	if len(cached.Reactions) != 1 || cached.Reactions[0].Count != 1 {
		t.Fatalf("unexpected cached counts: %+v", cached)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func reactionCacheKey(postID api.PostId) string {
	return "reactions:post:" + postID.String()
}
