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

	// The visibility check runs before the cache is read: the cached blob is
	// keyed by post alone and says nothing about who may see it. Only this one
	// query is expected, so the counts still come from Redis.
	expectGetPostWithAuthor(mock, postID, uuid.New(), time.Unix(1_700_000_000, 0).UTC(), time.Unix(1_600_000_000, 0).UTC())

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

func TestReactionsService_List_UsesPostAndUserCaches(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)

	svc := service.NewReactionsService(store, cacheImpl, nil)

	postID := api.PostId(uuid.New())
	userID := api.UserId(uuid.New())
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
		t.Fatalf("redis set counts: %v", err)
	}
	selfPayload, err := json.Marshal([]api.Emoji{api.Emoji("👍")})
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}
	if err := rdb.Set(context.Background(), userReactionCacheKey(userID, postID), selfPayload, time.Hour).Err(); err != nil {
		t.Fatalf("redis set user reactions: %v", err)
	}

	// See the note in TestReactionsService_List_UsesCache: the privacy gate is
	// the one query allowed to precede the cache read.
	expectGetPostWithAuthor(mock, postID, uuid.New(), time.Unix(1_700_000_000, 0).UTC(), time.Unix(1_600_000_000, 0).UTC())

	got, err := svc.List(context.Background(), postID, &userID)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if got.PostId != postID || len(got.Reactions) != 1 || !got.Reactions[0].ReactedByCurrentUser {
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
	expectNotBlocked(mock)
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

	// Remove looks up the post author first, to find the notification to drop.
	// Here the author is the reacting user, so no notification was ever created.
	expectGetPostWithAuthor(mock, postID, userID, created, userCreated)
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

func TestReactionsService_ListForPosts_UsesPostAndUserCaches(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)
	svc := service.NewReactionsService(store, cacheImpl, nil)

	postID := api.PostId(uuid.New())
	userID := api.UserId(uuid.New())
	cachedCounts := api.ReactionCounts{
		PostId: postID,
		Reactions: []api.ReactionCount{
			{Emoji: api.Emoji("👍"), Count: 4, ReactedByCurrentUser: true},
		},
	}
	payload, err := json.Marshal(cachedCounts)
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}
	if err := rdb.Set(context.Background(), reactionCacheKey(postID), payload, time.Hour).Err(); err != nil {
		t.Fatalf("redis set counts: %v", err)
	}
	selfPayload, err := json.Marshal([]api.Emoji{api.Emoji("👍")})
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}
	if err := rdb.Set(context.Background(), userReactionCacheKey(userID, postID), selfPayload, time.Hour).Err(); err != nil {
		t.Fatalf("redis set user reactions: %v", err)
	}

	got, err := svc.ListForPosts(context.Background(), []api.PostId{postID}, &userID)
	if err != nil {
		t.Fatalf("ListForPosts: %v", err)
	}
	reactions := got[postID]
	if len(reactions) != 1 || reactions[0].Count != 4 || !reactions[0].ReactedByCurrentUser {
		t.Fatalf("unexpected reactions: %+v", reactions)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestReactionsService_ListForPosts_PopulatesCachesFromDB(t *testing.T) {
	store, mock, cleanup := newMockStore(t)
	defer cleanup()

	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cacheImpl := cache.NewRedisCache(rdb)
	svc := service.NewReactionsService(store, cacheImpl, nil)

	postID := api.PostId(uuid.New())
	userID := api.UserId(uuid.New())

	mock.ExpectQuery(`SELECT post_id, emoji, count`).
		WithArgs(sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "emoji", "count"}).AddRow(postID, "👍", 2))
	mock.ExpectQuery(`SELECT post_id, emoji\s+FROM post_reaction_events`).
		WithArgs(userID, sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"post_id", "emoji"}).AddRow(postID, "👍"))

	got, err := svc.ListForPosts(context.Background(), []api.PostId{postID}, &userID)
	if err != nil {
		t.Fatalf("ListForPosts: %v", err)
	}
	reactions := got[postID]
	if len(reactions) != 1 || reactions[0].Count != 2 || !reactions[0].ReactedByCurrentUser {
		t.Fatalf("unexpected reactions: %+v", reactions)
	}

	countPayload, err := rdb.Get(context.Background(), reactionCacheKey(postID)).Result()
	if err != nil {
		t.Fatalf("redis get counts: %v", err)
	}
	var cachedCounts api.ReactionCounts
	if err := json.Unmarshal([]byte(countPayload), &cachedCounts); err != nil {
		t.Fatalf("json.Unmarshal counts: %v", err)
	}
	if len(cachedCounts.Reactions) != 1 || cachedCounts.Reactions[0].ReactedByCurrentUser {
		t.Fatalf("unexpected cached counts: %+v", cachedCounts)
	}

	selfPayload, err := rdb.Get(context.Background(), userReactionCacheKey(userID, postID)).Result()
	if err != nil {
		t.Fatalf("redis get user reactions: %v", err)
	}
	var cachedSelf []api.Emoji
	if err := json.Unmarshal([]byte(selfPayload), &cachedSelf); err != nil {
		t.Fatalf("json.Unmarshal self: %v", err)
	}
	if len(cachedSelf) != 1 || cachedSelf[0] != api.Emoji("👍") {
		t.Fatalf("unexpected cached self reactions: %+v", cachedSelf)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func reactionCacheKey(postID api.PostId) string {
	return "reactions:post:" + postID.String()
}

func userReactionCacheKey(userID api.UserId, postID api.PostId) string {
	return "reactions:user:" + userID.String() + ":post:" + postID.String()
}
