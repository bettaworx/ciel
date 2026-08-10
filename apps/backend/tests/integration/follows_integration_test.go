//go:build integration
// +build integration

package integration_test

import (
	"net/http"
	"testing"

	"backend/internal/api"
	"backend/internal/service"

	"github.com/google/uuid"
)

func follow(t *testing.T, app *testApp, authz map[string]string, username string) api.User {
	t.Helper()
	resp := postJSON(t, app.Server.Client(), app.Server.URL+"/api/v1/users/"+username+"/follow", nil, authz)
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("follow %s: expected 200, got %d (%v)", username, resp.StatusCode, errBody)
	}
	return decodeJSON[api.User](t, resp)
}

func unfollow(t *testing.T, app *testApp, authz map[string]string, username string) api.User {
	t.Helper()
	resp := deleteReq(t, app.Server.Client(), app.Server.URL+"/api/v1/users/"+username+"/follow", authz)
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("unfollow %s: expected 200, got %d (%v)", username, resp.StatusCode, errBody)
	}
	return decodeJSON[api.User](t, resp)
}

func homeTimeline(t *testing.T, app *testApp, authz map[string]string, query string) api.TimelinePage {
	t.Helper()
	resp := get(t, app.Server.Client(), app.Server.URL+"/api/v1/timeline/home"+query, authz)
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("home timeline: expected 200, got %d (%v)", resp.StatusCode, errBody)
	}
	return decodeJSON[api.TimelinePage](t, resp)
}

// homeTimelineIDs returns the post ids on a home timeline page, as a set.
func homeTimelineIDs(page api.TimelinePage) map[uuid.UUID]struct{} {
	out := make(map[uuid.UUID]struct{}, len(page.Items))
	for _, p := range page.Items {
		out[p.Id] = struct{}{}
	}
	return out
}

func boolOrFalse(b *bool) bool { return b != nil && *b }

func intOrZero(i *int) int {
	if i == nil {
		return 0
	}
	return *i
}

func TestIntegration_Follow_StateAndCounts(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "follow_alice", "Password123")
	bob := registerUser(t, client, base, "follow_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)

	// Before following, alice sees no relationship with bob.
	before := decodeJSON[api.User](t, get(t, client, base+"/api/v1/users/follow_bob", aliceAuth))
	if boolOrFalse(before.IsFollowing) {
		t.Fatal("expected isFollowing=false before following")
	}
	if got := intOrZero(before.FollowersCount); got != 0 {
		t.Fatalf("expected 0 followers before following, got %d", got)
	}

	followed := follow(t, app, aliceAuth, "follow_bob")
	if !boolOrFalse(followed.IsFollowing) {
		t.Fatal("expected isFollowing=true in the follow response")
	}
	if got := intOrZero(followed.FollowersCount); got != 1 {
		t.Fatalf("expected bob to have 1 follower, got %d", got)
	}

	// Bob sees alice as a follower, and himself as followed-by her.
	bobAuth := issueBearer(t, app.TokenManager, bob)
	aliceSeenByBob := decodeJSON[api.User](t, get(t, client, base+"/api/v1/users/follow_alice", bobAuth))
	if boolOrFalse(aliceSeenByBob.IsFollowing) {
		t.Fatal("bob does not follow alice; expected isFollowing=false")
	}
	if !boolOrFalse(aliceSeenByBob.IsFollowedBy) {
		t.Fatal("alice follows bob; expected isFollowedBy=true")
	}
	if got := intOrZero(aliceSeenByBob.FollowingCount); got != 1 {
		t.Fatalf("expected alice to follow 1 user, got %d", got)
	}

	// Anonymous callers get counts but no relationship flags.
	anon := decodeJSON[api.User](t, get(t, client, base+"/api/v1/users/follow_bob", nil))
	if anon.IsFollowing != nil || anon.IsFollowedBy != nil {
		t.Fatal("expected no relationship flags for an anonymous caller")
	}
	if got := intOrZero(anon.FollowersCount); got != 1 {
		t.Fatalf("expected follower count for anonymous caller, got %d", got)
	}
}

func TestIntegration_Follow_IdempotentAndSelfRejected(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "idem_alice", "Password123")
	registerUser(t, client, base, "idem_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)

	follow(t, app, aliceAuth, "idem_bob")
	twice := follow(t, app, aliceAuth, "idem_bob")
	if got := intOrZero(twice.FollowersCount); got != 1 {
		t.Fatalf("following twice must not stack: expected 1 follower, got %d", got)
	}

	// Unfollowing twice is equally harmless.
	unfollow(t, app, aliceAuth, "idem_bob")
	again := unfollow(t, app, aliceAuth, "idem_bob")
	if boolOrFalse(again.IsFollowing) {
		t.Fatal("expected isFollowing=false after unfollowing")
	}
	if got := intOrZero(again.FollowersCount); got != 0 {
		t.Fatalf("expected 0 followers after unfollow, got %d", got)
	}

	// Following yourself is a client error, not a constraint violation.
	selfResp := postJSON(t, client, base+"/api/v1/users/idem_alice/follow", nil, aliceAuth)
	if selfResp.StatusCode != http.StatusBadRequest {
		t.Fatalf("self-follow: expected 400, got %d", selfResp.StatusCode)
	}

	// Unauthenticated callers cannot follow.
	anonResp := postJSON(t, client, base+"/api/v1/users/idem_bob/follow", nil, nil)
	if anonResp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("anonymous follow: expected 401, got %d", anonResp.StatusCode)
	}

	// Unknown users 404 rather than creating a dangling row.
	missingResp := postJSON(t, client, base+"/api/v1/users/nobody_here/follow", nil, aliceAuth)
	if missingResp.StatusCode != http.StatusNotFound {
		t.Fatalf("follow unknown user: expected 404, got %d", missingResp.StatusCode)
	}
}

func TestIntegration_HomeTimeline_OnlyFollowedAndSelf(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "home_alice", "Password123")
	bob := registerUser(t, client, base, "home_bob", "Password123")
	carol := registerUser(t, client, base, "home_carol", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)
	carolAuth := issueBearer(t, app.TokenManager, carol)

	follow(t, app, aliceAuth, "home_bob")

	ownPost := createPost(t, client, base, aliceAuth, "alice's own post")
	bobPost := createPost(t, client, base, bobAuth, "bob's post")
	carolPost := createPost(t, client, base, carolAuth, "carol's post, not followed")

	// A reply and a boost by the followed user must show up too.
	bobReply := decodeJSON[api.Post](t, postJSON(t, client, base+"/api/v1/posts",
		map[string]any{"content": "bob replying to carol", "parentId": carolPost.Id.String()}, bobAuth))
	bobBoost := decodeJSON[api.Post](t, postJSON(t, client, base+"/api/v1/posts",
		map[string]any{"content": "", "referenceId": carolPost.Id.String()}, bobAuth))

	ids := homeTimelineIDs(homeTimeline(t, app, aliceAuth, ""))

	for _, want := range []struct {
		id    uuid.UUID
		label string
	}{
		{ownPost.Id, "own post"},
		{bobPost.Id, "followed user's post"},
		{bobReply.Id, "followed user's reply"},
		{bobBoost.Id, "followed user's boost"},
	} {
		if _, ok := ids[want.id]; !ok {
			t.Errorf("home timeline missing %s (%s)", want.label, want.id)
		}
	}
	if _, ok := ids[carolPost.Id]; ok {
		t.Error("home timeline included a post from a user alice does not follow")
	}

	// Unfollowing takes bob's posts back out.
	unfollow(t, app, aliceAuth, "home_bob")
	after := homeTimelineIDs(homeTimeline(t, app, aliceAuth, ""))
	if _, ok := after[bobPost.Id]; ok {
		t.Error("home timeline still shows the unfollowed user's post")
	}
	if _, ok := after[ownPost.Id]; !ok {
		t.Error("home timeline dropped alice's own post after unfollowing someone else")
	}

	// The home timeline requires authentication.
	if resp := get(t, client, base+"/api/v1/timeline/home", nil); resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("anonymous home timeline: expected 401, got %d", resp.StatusCode)
	}
}

// The per-user ZSET is capped, expires, and is deleted on follow changes, so an
// empty or short cache must never be mistaken for an empty timeline.
func TestIntegration_HomeTimeline_SurvivesColdCache(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "cold_alice", "Password123")
	bob := registerUser(t, client, base, "cold_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	follow(t, app, aliceAuth, "cold_bob")
	bobPost := createPost(t, client, base, bobAuth, "post that must survive a cache wipe")

	key := service.TimelineKeyHome(alice.Id)
	if err := app.RDB.Del(t.Context(), key).Err(); err != nil {
		t.Fatalf("delete home timeline key: %v", err)
	}

	ids := homeTimelineIDs(homeTimeline(t, app, aliceAuth, ""))
	if _, ok := ids[bobPost.Id]; !ok {
		t.Fatal("home timeline came back empty on a cold cache; the DB fallback did not run")
	}

	// The miss should have rebuilt the cache.
	n, err := app.RDB.ZCard(t.Context(), key).Result()
	if err != nil {
		t.Fatalf("zcard: %v", err)
	}
	if n == 0 {
		t.Error("expected the home timeline cache to be warmed after a miss")
	}
}

// Fan-out writes each new post into every follower's home timeline ZSET.
func TestIntegration_HomeTimeline_FanOutOnPost(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "fan_alice", "Password123")
	bob := registerUser(t, client, base, "fan_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	follow(t, app, aliceAuth, "fan_bob")

	post := createPost(t, client, base, bobAuth, "fanned out to alice")

	members, err := app.RDB.ZRange(t.Context(), service.TimelineKeyHome(alice.Id), 0, -1).Result()
	if err != nil {
		t.Fatalf("zrange: %v", err)
	}
	found := false
	for _, m := range members {
		if m == post.Id.String() {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected the new post in the follower's home timeline ZSET, got %v", members)
	}
}

// Several followers collapse into one row carrying all of their avatars.
// Follows have no post to key on, so grouping and its member lookup both hang
// off the nil-uuid target — easy to get wrong in only one of the two queries.
func TestIntegration_Follow_NotificationsGroup(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	target := registerUser(t, client, base, "group_target", "Password123")
	targetAuth := issueBearer(t, app.TokenManager, target)

	followers := []string{"group_f1", "group_f2", "group_f3"}
	for _, name := range followers {
		u := registerUser(t, client, base, name, "Password123")
		follow(t, app, issueBearer(t, app.TokenManager, u), "group_target")
	}

	page := listNotifications(t, app, targetAuth, "?type=follow")
	if len(page.Items) != 1 {
		t.Fatalf("expected the follows to collapse into 1 row, got %d", len(page.Items))
	}

	row := page.Items[0]
	if row.Count == nil || *row.Count != len(followers) {
		t.Fatalf("expected the row to cover %d follows, got %v", len(followers), row.Count)
	}
	if row.ActorCount == nil || *row.ActorCount != len(followers) {
		t.Fatalf("expected %d distinct actors, got %v", len(followers), row.ActorCount)
	}
	// The avatars come from ListNotificationGroupMembers; an unmatched group
	// target would leave this empty while count still looked right.
	if row.Actors == nil || len(*row.Actors) != len(followers) {
		t.Fatalf("expected %d actors on the grouped row, got %v", len(followers), row.Actors)
	}
	// Marking the row read has to cover every follow it stands for.
	if row.NotificationIds == nil || len(*row.NotificationIds) != len(followers) {
		t.Fatalf("expected %d notification ids on the row, got %v", len(followers), row.NotificationIds)
	}

	if got := unreadCount(t, app, targetAuth); got != len(followers) {
		t.Fatalf("expected %d unread notifications, got %d", len(followers), got)
	}

	// A single follower still reads as a named, ungrouped row.
	solo := registerUser(t, client, base, "group_solo_target", "Password123")
	soloAuth := issueBearer(t, app.TokenManager, solo)
	follow(t, app, issueBearer(t, app.TokenManager,
		registerUser(t, client, base, "group_solo_follower", "Password123")), "group_solo_target")

	soloPage := listNotifications(t, app, soloAuth, "?type=follow")
	if len(soloPage.Items) != 1 {
		t.Fatalf("expected 1 follow notification, got %d", len(soloPage.Items))
	}
	if c := soloPage.Items[0].Count; c != nil && *c != 1 {
		t.Fatalf("expected a group of one, got %v", c)
	}
	if soloPage.Items[0].Actor == nil ||
		string(soloPage.Items[0].Actor.Username) != "group_solo_follower" {
		t.Fatalf("expected the lone follower as the actor, got %v", soloPage.Items[0].Actor)
	}
}

// Unfollowing has to retract the follow notification. Without that, the
// post-less dedupe index would suppress the notification on a re-follow.
func TestIntegration_Follow_NotifiesAgainAfterUnfollow(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "notif_follow_alice", "Password123")
	bob := registerUser(t, client, base, "notif_follow_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	follow(t, app, aliceAuth, "notif_follow_bob")

	page := listNotifications(t, app, bobAuth, "?type=follow")
	if len(page.Items) != 1 {
		t.Fatalf("expected 1 follow notification, got %d", len(page.Items))
	}
	if page.Items[0].Type != api.Follow {
		t.Fatalf("expected a follow notification, got %q", page.Items[0].Type)
	}
	if page.Items[0].Actor == nil || page.Items[0].Actor.Id != alice.Id {
		t.Fatal("expected alice as the actor on the follow notification")
	}
	if page.Items[0].Post != nil {
		t.Fatal("a follow notification carries no post")
	}

	// Following again changes nothing, so no second notification.
	follow(t, app, aliceAuth, "notif_follow_bob")
	if got := len(listNotifications(t, app, bobAuth, "?type=follow").Items); got != 1 {
		t.Fatalf("re-following without unfollowing must not notify again, got %d", got)
	}

	unfollow(t, app, aliceAuth, "notif_follow_bob")
	if got := len(listNotifications(t, app, bobAuth, "?type=follow").Items); got != 0 {
		t.Fatalf("expected the follow notification to be retracted on unfollow, got %d", got)
	}

	// The whole point: bob hears about it when alice follows him again.
	follow(t, app, aliceAuth, "notif_follow_bob")
	if got := len(listNotifications(t, app, bobAuth, "?type=follow").Items); got != 1 {
		t.Fatalf("expected a fresh notification after re-following, got %d", got)
	}

	// Nobody notifies themselves.
	if got := len(listNotifications(t, app, aliceAuth, "?type=follow").Items); got != 0 {
		t.Fatalf("the follower must not be notified, got %d", got)
	}
}

func TestIntegration_Follow_Lists(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "list_alice", "Password123")
	bob := registerUser(t, client, base, "list_bob", "Password123")
	registerUser(t, client, base, "list_carol", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	follow(t, app, aliceAuth, "list_bob")
	follow(t, app, aliceAuth, "list_carol")
	follow(t, app, bobAuth, "list_carol")

	following := decodeJSON[api.UsersPage](t, get(t, client, base+"/api/v1/users/list_alice/following", aliceAuth))
	if len(following.Items) != 2 {
		t.Fatalf("expected alice to follow 2 users, got %d", len(following.Items))
	}
	// Newest follow first.
	if string(following.Items[0].Username) != "list_carol" {
		t.Errorf("expected the newest follow first, got %q", following.Items[0].Username)
	}
	for _, u := range following.Items {
		if !boolOrFalse(u.IsFollowing) {
			t.Errorf("alice follows %s; expected isFollowing=true", u.Username)
		}
	}

	followers := decodeJSON[api.UsersPage](t, get(t, client, base+"/api/v1/users/list_carol/followers", aliceAuth))
	if len(followers.Items) != 2 {
		t.Fatalf("expected carol to have 2 followers, got %d", len(followers.Items))
	}

	// Paging returns a cursor and does not repeat entries.
	firstPage := decodeJSON[api.UsersPage](t, get(t, client, base+"/api/v1/users/list_carol/followers?limit=1", aliceAuth))
	if len(firstPage.Items) != 1 || firstPage.NextCursor == nil {
		t.Fatalf("expected a full page of 1 with a cursor, got %d items (cursor %v)", len(firstPage.Items), firstPage.NextCursor)
	}
	secondPage := decodeJSON[api.UsersPage](t, get(t, client,
		base+"/api/v1/users/list_carol/followers?limit=1&cursor="+*firstPage.NextCursor, aliceAuth))
	if len(secondPage.Items) != 1 {
		t.Fatalf("expected 1 item on the second page, got %d", len(secondPage.Items))
	}
	if secondPage.Items[0].Id == firstPage.Items[0].Id {
		t.Error("the second page repeated the first page's entry")
	}

	// Anonymous callers can read the lists but get no relationship flags.
	anon := decodeJSON[api.UsersPage](t, get(t, client, base+"/api/v1/users/list_carol/followers", nil))
	if len(anon.Items) != 2 {
		t.Fatalf("expected 2 followers for an anonymous caller, got %d", len(anon.Items))
	}
	for _, u := range anon.Items {
		if u.IsFollowing != nil {
			t.Error("expected no isFollowing flag for an anonymous caller")
		}
	}

	if resp := get(t, client, base+"/api/v1/users/nobody_here/followers", aliceAuth); resp.StatusCode != http.StatusNotFound {
		t.Fatalf("followers of an unknown user: expected 404, got %d", resp.StatusCode)
	}
	if resp := get(t, client, base+"/api/v1/users/list_alice/following?limit=0", aliceAuth); resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("limit=0: expected 400, got %d", resp.StatusCode)
	}
}
