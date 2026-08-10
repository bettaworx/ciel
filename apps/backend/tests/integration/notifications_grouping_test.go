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

	// Same post, different emoji -> separate groups.
	react(t, app, first.Id, "👍", bobAuth)
	react(t, app, first.Id, "🎉", carolAuth)
	// Different post, same emoji -> separate group again.
	react(t, app, second.Id, "👍", bobAuth)

	page := listNotifications(t, app, aliceAuth, "")
	if len(page.Items) != 3 {
		t.Fatalf("emoji and post both split groups, expected 3 rows, got %d: %+v", len(page.Items), page.Items)
	}
	for _, n := range page.Items {
		if n.Count == nil || *n.Count != 1 {
			t.Errorf("expected each row to stand alone, got count %v", n.Count)
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
