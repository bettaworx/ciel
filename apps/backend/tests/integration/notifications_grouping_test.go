//go:build integration
// +build integration

package integration_test

import (
	"net/http"
	"testing"

	"backend/internal/api"

	"github.com/google/uuid"
)

// react has `who` react to `postID` with `emoji`.
func react(t *testing.T, app *testApp, postID api.PostId, emoji string, who map[string]string) {
	t.Helper()
	resp := postJSON(t, app.Server.Client(),
		app.Server.URL+"/api/v1/posts/"+postID.String()+"/reactions",
		map[string]any{"emoji": emoji}, who)
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("react %s: expected 200, got %d (%v)", emoji, resp.StatusCode, errBody)
	}
}

// boost has `who` plain-boost `postID`.
func boost(t *testing.T, app *testApp, postID api.PostId, who map[string]string) {
	t.Helper()
	resp := postJSON(t, app.Server.Client(), app.Server.URL+"/api/v1/posts",
		map[string]any{"referenceId": postID.String()}, who)
	if resp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("boost: expected 201, got %d (%v)", resp.StatusCode, errBody)
	}
}

func TestIntegration_Notifications_GroupsSameReaction(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "grp_alice", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	reactors := make([]map[string]string, 0, 3)
	for _, name := range []string{"grp_bob", "grp_carol", "grp_dave"} {
		u := registerUser(t, client, base, name, "Password123")
		reactors = append(reactors, issueBearer(t, app.TokenManager, u))
	}

	post := createPost(t, client, base, aliceAuth, "group me")
	for _, who := range reactors {
		react(t, app, post.Id, "👍", who)
	}

	page := listNotifications(t, app, aliceAuth, "")
	if len(page.Items) != 1 {
		t.Fatalf("three reactions with one emoji must collapse to one row, got %d: %+v", len(page.Items), page.Items)
	}
	item := page.Items[0]
	if item.Count == nil || *item.Count != 3 {
		t.Fatalf("expected count 3, got %v", item.Count)
	}
	if item.Actors == nil || len(*item.Actors) != 3 {
		t.Fatalf("expected 3 actors, got %v", item.Actors)
	}
	if item.NotificationIds == nil || len(*item.NotificationIds) != 3 {
		t.Fatalf("expected 3 notification ids, got %v", item.NotificationIds)
	}
	if item.Actor == nil {
		t.Fatal("expected a primary actor on the grouped row")
	}
	if item.Post == nil || item.Post.Id != post.Id {
		t.Fatalf("expected the reacted post to be embedded, got %+v", item.Post)
	}
	// The badge still counts notifications, not rows.
	if got := unreadCount(t, app, aliceAuth); got != 3 {
		t.Fatalf("expected 3 unread notifications behind the group, got %d", got)
	}

	// Marking every id the row covers clears the whole group.
	resp := postJSON(t, client, base+"/api/v1/notifications/read",
		map[string]any{"ids": *item.NotificationIds}, aliceAuth)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("mark group read: expected 200, got %d", resp.StatusCode)
	}
	if got := decodeJSON[api.UnreadCount](t, resp).Count; got != 0 {
		t.Fatalf("expected 0 unread after reading the group, got %d", got)
	}
	after := listNotifications(t, app, aliceAuth, "")
	if len(after.Items) != 1 || after.Items[0].ReadAt == nil {
		t.Fatalf("expected the group to report as read, got %+v", after.Items)
	}
}

func TestIntegration_Notifications_GroupingBoundaries(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "bound_alice", "Password123")
	bob := registerUser(t, client, base, "bound_bob", "Password123")
	carol := registerUser(t, client, base, "bound_carol", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)
	carolAuth := issueBearer(t, app.TokenManager, carol)

	first := createPost(t, client, base, aliceAuth, "first post")
	second := createPost(t, client, base, aliceAuth, "second post")

	// Same post, different emoji -> one row: a row covers a whole post.
	react(t, app, first.Id, "👍", bobAuth)
	react(t, app, first.Id, "🎉", carolAuth)
	// A different post is still its own row.
	react(t, app, second.Id, "👍", bobAuth)

	page := listNotifications(t, app, aliceAuth, "")
	if len(page.Items) != 2 {
		t.Fatalf("expected one row per post, got %d: %+v", len(page.Items), page.Items)
	}

	var grouped *api.Notification
	for i := range page.Items {
		if page.Items[i].Count != nil && *page.Items[i].Count == 2 {
			grouped = &page.Items[i]
		}
	}
	if grouped == nil {
		t.Fatalf("expected the first post to collapse two reactions, got %+v", page.Items)
	}
	if grouped.Post == nil || grouped.Post.Id != first.Id {
		t.Fatalf("expected the grouped row to be about the first post, got %+v", grouped.Post)
	}
	if grouped.ActorCount == nil || *grouped.ActorCount != 2 {
		t.Fatalf("expected 2 distinct actors, got %v", grouped.ActorCount)
	}

	// Each avatar carries the emoji its actor used.
	if grouped.Actors == nil || len(*grouped.Actors) != 2 {
		t.Fatalf("expected 2 actors, got %v", grouped.Actors)
	}
	emojis := map[string]bool{}
	for _, a := range *grouped.Actors {
		if a.Emoji == nil {
			t.Fatalf("expected every reaction actor to carry an emoji, got %+v", a)
		}
		emojis[string(*a.Emoji)] = true
	}
	if !emojis["👍"] || !emojis["🎉"] {
		t.Fatalf("expected both emoji across the actors, got %v", emojis)
	}
}

func TestIntegration_Notifications_OnePersonManyEmojiCountsOnce(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "many_alice", "Password123")
	bob := registerUser(t, client, base, "many_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	post := createPost(t, client, base, aliceAuth, "one person, three emoji")
	for _, emoji := range []string{"👍", "🎉", "🔥"} {
		react(t, app, post.Id, emoji, bobAuth)
	}

	page := listNotifications(t, app, aliceAuth, "")
	if len(page.Items) != 1 {
		t.Fatalf("expected a single row for the post, got %d: %+v", len(page.Items), page.Items)
	}
	item := page.Items[0]

	// Three reactions, but only one person: the label counts people.
	if item.Count == nil || *item.Count != 3 {
		t.Fatalf("expected count 3, got %v", item.Count)
	}
	if item.ActorCount == nil || *item.ActorCount != 1 {
		t.Fatalf("expected actorCount 1, got %v", item.ActorCount)
	}
	// The same person appears once per reaction, which is what the avatars show.
	if item.Actors == nil || len(*item.Actors) != 3 {
		t.Fatalf("expected 3 avatars for the same person, got %v", item.Actors)
	}
	for _, a := range *item.Actors {
		if a.User.Id != bob.Id {
			t.Errorf("expected every avatar to be bob, got %v", a.User.Id)
		}
	}
}

func TestIntegration_Notifications_GroupsPlainBoostsButNotQuotes(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "bst_alice", "Password123")
	bob := registerUser(t, client, base, "bst_bob", "Password123")
	carol := registerUser(t, client, base, "bst_carol", "Password123")
	dave := registerUser(t, client, base, "bst_dave", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)
	carolAuth := issueBearer(t, app.TokenManager, carol)
	daveAuth := issueBearer(t, app.TokenManager, dave)

	post := createPost(t, client, base, aliceAuth, "boost me")

	// Two plain boosts of the same post collapse, even though each boost is its
	// own post — they group by what was boosted.
	boost(t, app, post.Id, bobAuth)
	boost(t, app, post.Id, carolAuth)

	// A quote carries its own text and must stay on its own row.
	quote := postJSON(t, client, base+"/api/v1/posts",
		map[string]any{"content": "look at this", "referenceId": post.Id.String()}, daveAuth)
	if quote.StatusCode != http.StatusCreated {
		t.Fatalf("quote: expected 201, got %d", quote.StatusCode)
	}

	page := listNotifications(t, app, aliceAuth, "")
	if len(page.Items) != 2 {
		t.Fatalf("expected a boost group plus a standalone quote, got %d: %+v", len(page.Items), page.Items)
	}

	var grouped, standalone int
	for _, n := range page.Items {
		switch {
		case n.Count != nil && *n.Count == 2:
			grouped++
			if n.Actors == nil || len(*n.Actors) != 2 {
				t.Errorf("expected 2 boost actors, got %v", n.Actors)
			}
		case n.Count == nil || *n.Count == 1:
			standalone++
		}
	}
	if grouped != 1 || standalone != 1 {
		t.Fatalf("expected exactly one group of 2 and one row of 1, got grouped=%d standalone=%d", grouped, standalone)
	}
}

func TestIntegration_Notifications_GroupShrinksWhenReactionsAreUndone(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "shrink_alice", "Password123")
	bob := registerUser(t, client, base, "shrink_bob", "Password123")
	carol := registerUser(t, client, base, "shrink_carol", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)
	carolAuth := issueBearer(t, app.TokenManager, carol)

	post := createPost(t, client, base, aliceAuth, "undo me")
	reactURL := base + "/api/v1/posts/" + post.Id.String() + "/reactions?emoji=%F0%9F%91%8D"
	react(t, app, post.Id, "👍", bobAuth)
	react(t, app, post.Id, "👍", carolAuth)

	if got := listNotifications(t, app, aliceAuth, ""); len(got.Items) != 1 || *got.Items[0].Count != 2 {
		t.Fatalf("expected one group of 2, got %+v", got.Items)
	}

	if resp := deleteReq(t, client, reactURL, carolAuth); resp.StatusCode != http.StatusOK {
		t.Fatalf("unreact: expected 200, got %d", resp.StatusCode)
	}
	page := listNotifications(t, app, aliceAuth, "")
	if len(page.Items) != 1 || page.Items[0].Count == nil || *page.Items[0].Count != 1 {
		t.Fatalf("group should shrink to 1, got %+v", page.Items)
	}

	if resp := deleteReq(t, client, reactURL, bobAuth); resp.StatusCode != http.StatusOK {
		t.Fatalf("unreact: expected 200, got %d", resp.StatusCode)
	}
	if got := listNotifications(t, app, aliceAuth, ""); len(got.Items) != 0 {
		t.Fatalf("group should disappear once empty, got %+v", got.Items)
	}
}

// backdateNotifications moves every notification an actor sent to a fixed time,
// so grouping can be tested across a day boundary without waiting for one.
func backdateNotifications(t *testing.T, app *testApp, recipient, actor uuid.UUID, at string) {
	t.Helper()
	res, err := app.SQLDB.Exec(
		`UPDATE notifications SET created_at = $1::timestamptz WHERE user_id = $2 AND actor_user_id = $3`,
		at, recipient, actor)
	if err != nil {
		t.Fatalf("backdate notifications: %v", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		t.Fatalf("backdate notifications: nothing matched for actor %v", actor)
	}
}

func TestIntegration_Notifications_SplitsGroupsAtDayBoundary(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "day_alice", "Password123")
	bob := registerUser(t, client, base, "day_bob", "Password123")
	carol := registerUser(t, client, base, "day_carol", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)
	carolAuth := issueBearer(t, app.TokenManager, carol)

	post := createPost(t, client, base, aliceAuth, "two days of reactions")
	react(t, app, post.Id, "👍", bobAuth)
	react(t, app, post.Id, "👍", carolAuth)

	// Same UTC day, different Tokyo days: 23:00 and 01:00 JST either side of
	// midnight. Whether these merge is decided purely by the tz argument.
	backdateNotifications(t, app, alice.Id, bob.Id, "2026-08-10 14:00:00+00")
	backdateNotifications(t, app, alice.Id, carol.Id, "2026-08-10 16:00:00+00")

	tokyo := listNotifications(t, app, aliceAuth, "?tz=Asia%2FTokyo")
	if len(tokyo.Items) != 2 {
		t.Fatalf("expected the day boundary to split the group in two, got %d: %+v", len(tokyo.Items), tokyo.Items)
	}
	for _, n := range tokyo.Items {
		if n.Count == nil || *n.Count != 1 {
			t.Errorf("expected each side of the boundary to cover one notification, got %v", n.Count)
		}
		if n.NotificationIds == nil || len(*n.NotificationIds) != 1 {
			t.Errorf("expected one covered id per row, got %v", n.NotificationIds)
		}
	}

	// The very same rows are one group in UTC, where they share a day.
	utc := listNotifications(t, app, aliceAuth, "?tz=UTC")
	if len(utc.Items) != 1 {
		t.Fatalf("expected one group within a single UTC day, got %d: %+v", len(utc.Items), utc.Items)
	}
	if c := utc.Items[0].Count; c == nil || *c != 2 {
		t.Fatalf("expected the UTC group to cover both reactions, got %v", c)
	}
	// The members lookup buckets by day too, so the row must carry both ids.
	if ids := utc.Items[0].NotificationIds; ids == nil || len(*ids) != 2 {
		t.Fatalf("expected the UTC group to cover both ids, got %v", ids)
	}

	// An unknown zone is the caller's mistake, not a failed query.
	if resp := get(t, client, base+"/api/v1/notifications?tz=Not%2FAZone", aliceAuth); resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400 for an unknown time zone, got %d", resp.StatusCode)
	}
}

func TestIntegration_Notifications_GroupedPaginationHasNoGaps(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "page_grp_alice", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bob := registerUser(t, client, base, "page_grp_bob", "Password123")
	carol := registerUser(t, client, base, "page_grp_carol", "Password123")
	bobAuth := issueBearer(t, app.TokenManager, bob)
	carolAuth := issueBearer(t, app.TokenManager, carol)

	// Three posts, each reacted to by both users: three groups of two.
	const wantGroups = 3
	for i := 0; i < wantGroups; i++ {
		p := createPost(t, client, base, aliceAuth, "grouped paging")
		react(t, app, p.Id, "👍", bobAuth)
		react(t, app, p.Id, "👍", carolAuth)
	}

	seen := map[uuid.UUID]bool{}
	cursor := ""
	for page := 0; page < 5; page++ {
		query := "?limit=2"
		if cursor != "" {
			query += "&cursor=" + cursor
		}
		got := listNotifications(t, app, aliceAuth, query)
		for _, n := range got.Items {
			if seen[n.Id] {
				t.Fatalf("notification %v returned on two pages", n.Id)
			}
			seen[n.Id] = true
			if n.Count == nil || *n.Count != 2 {
				t.Errorf("expected every row to be a group of 2, got %v", n.Count)
			}
		}
		if got.NextCursor == nil {
			break
		}
		cursor = *got.NextCursor
	}
	if len(seen) != wantGroups {
		t.Fatalf("expected %d grouped rows across pages, got %d", wantGroups, len(seen))
	}
}
