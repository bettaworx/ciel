//go:build integration
// +build integration

package integration_test

import (
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/realtime"

	"github.com/google/uuid"
)

// listNotifications fetches the caller's notifications, optionally filtered.
func listNotifications(t *testing.T, app *testApp, authz map[string]string, query string) api.NotificationsPage {
	t.Helper()
	resp := get(t, app.Server.Client(), app.Server.URL+"/api/v1/notifications"+query, authz)
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("list notifications: expected 200, got %d (%v)", resp.StatusCode, errBody)
	}
	return decodeJSON[api.NotificationsPage](t, resp)
}

func unreadCount(t *testing.T, app *testApp, authz map[string]string) int {
	t.Helper()
	resp := get(t, app.Server.Client(), app.Server.URL+"/api/v1/notifications/unread-count", authz)
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("unread count: expected 200, got %d (%v)", resp.StatusCode, errBody)
	}
	return decodeJSON[api.UnreadCount](t, resp).Count
}

// notificationsByType indexes a page by notification type. Each type fires at
// most once per (actor, post) here, so a plain map is enough.
func notificationsByType(page api.NotificationsPage) map[api.NotificationType]api.Notification {
	out := make(map[api.NotificationType]api.Notification, len(page.Items))
	for _, n := range page.Items {
		out[n.Type] = n
	}
	return out
}

func TestIntegration_Notifications_AllKinds(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "notif_alice", "Password123")
	bob := registerUser(t, client, base, "notif_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	if got := unreadCount(t, app, aliceAuth); got != 0 {
		t.Fatalf("expected no notifications initially, got %d", got)
	}

	target := createPost(t, client, base, aliceAuth, "hello from alice")

	// 1. Reaction
	reactResp := postJSON(t, client, base+"/api/v1/posts/"+target.Id.String()+"/reactions",
		map[string]any{"emoji": "👍"}, bobAuth)
	if reactResp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, reactResp)
		t.Fatalf("react: expected 200, got %d (%v)", reactResp.StatusCode, errBody)
	}

	// 2. Reply
	replyResp := postJSON(t, client, base+"/api/v1/posts",
		map[string]any{"content": "nice post", "parentId": target.Id.String()}, bobAuth)
	if replyResp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, replyResp)
		t.Fatalf("reply: expected 201, got %d (%v)", replyResp.StatusCode, errBody)
	}

	// 3. Mention (a standalone post, so it does not collapse into the reply)
	mentionPost := createPost(t, client, base, bobAuth, "hey @notif_alice look at this")

	// 4. Boost
	boostResp := postJSON(t, client, base+"/api/v1/posts",
		map[string]any{"referenceId": target.Id.String()}, bobAuth)
	if boostResp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, boostResp)
		t.Fatalf("boost: expected 201, got %d (%v)", boostResp.StatusCode, errBody)
	}

	page := listNotifications(t, app, aliceAuth, "")
	if len(page.Items) != 4 {
		t.Fatalf("expected 4 notifications, got %d: %+v", len(page.Items), page.Items)
	}
	if got := unreadCount(t, app, aliceAuth); got != 4 {
		t.Fatalf("expected 4 unread, got %d", got)
	}

	byType := notificationsByType(page)
	for _, want := range []api.NotificationType{api.Reaction, api.Reply, api.Mention, api.Boost} {
		n, ok := byType[want]
		if !ok {
			t.Fatalf("missing %s notification: %+v", want, page.Items)
		}
		if n.Actor == nil || n.Actor.Id != bob.Id {
			t.Errorf("%s: expected actor bob, got %+v", want, n.Actor)
		}
		if n.Post == nil {
			t.Errorf("%s: expected an embedded post", want)
		}
		if n.ReadAt != nil {
			t.Errorf("%s: expected unread, got readAt=%v", want, *n.ReadAt)
		}
	}

	// The reaction notification carries the emoji; the others do not.
	if n := byType[api.Reaction]; n.Emoji == nil || string(*n.Emoji) != "👍" {
		t.Errorf("reaction: expected emoji 👍, got %v", n.Emoji)
	}
	if n := byType[api.Reply]; n.Emoji != nil {
		t.Errorf("reply: expected no emoji, got %v", *n.Emoji)
	}
	// The mention notification points at the mentioning post, not the target.
	if n := byType[api.Mention]; n.Post != nil && n.Post.Id != mentionPost.Id {
		t.Errorf("mention: expected post %v, got %v", mentionPost.Id, n.Post.Id)
	}

	// Repeating the parameter filters on several types at once — this is what the
	// frontend's "mentions" tab uses to show mentions and replies together.
	mentionsTab := listNotifications(t, app, aliceAuth, "?type=mention&type=reply")
	if len(mentionsTab.Items) != 2 {
		t.Fatalf("multi-type filter: expected 2 items, got %d: %+v", len(mentionsTab.Items), mentionsTab.Items)
	}
	for _, n := range mentionsTab.Items {
		if n.Type != api.Mention && n.Type != api.Reply {
			t.Errorf("multi-type filter leaked a %s notification", n.Type)
		}
	}

	// Newest first.
	for i := 1; i < len(page.Items); i++ {
		if page.Items[i-1].CreatedAt.Before(page.Items[i].CreatedAt) {
			t.Fatalf("notifications are not newest-first: %+v", page.Items)
		}
	}

	// Bob triggered everything, so Bob has nothing.
	if got := unreadCount(t, app, bobAuth); got != 0 {
		t.Fatalf("actor should not be notified, got %d", got)
	}
}

func TestIntegration_Notifications_SelfActionsDoNotNotify(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "self_alice", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)

	post := createPost(t, client, base, aliceAuth, "talking to myself @self_alice")

	resp := postJSON(t, client, base+"/api/v1/posts/"+post.Id.String()+"/reactions",
		map[string]any{"emoji": "🎉"}, aliceAuth)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("self react: expected 200, got %d", resp.StatusCode)
	}
	replyResp := postJSON(t, client, base+"/api/v1/posts",
		map[string]any{"content": "self reply", "parentId": post.Id.String()}, aliceAuth)
	if replyResp.StatusCode != http.StatusCreated {
		t.Fatalf("self reply: expected 201, got %d", replyResp.StatusCode)
	}
	boostResp := postJSON(t, client, base+"/api/v1/posts",
		map[string]any{"referenceId": post.Id.String()}, aliceAuth)
	if boostResp.StatusCode != http.StatusCreated {
		t.Fatalf("self boost: expected 201, got %d", boostResp.StatusCode)
	}

	if got := unreadCount(t, app, aliceAuth); got != 0 {
		t.Fatalf("self actions must not notify, got %d", got)
	}
}

func TestIntegration_Notifications_ReplyWithMentionCollapsesToOne(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "collapse_alice", "Password123")
	bob := registerUser(t, client, base, "collapse_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	post := createPost(t, client, base, aliceAuth, "original")

	// Bob replies to Alice and @-mentions her in the same post.
	resp := postJSON(t, client, base+"/api/v1/posts",
		map[string]any{"content": "@collapse_alice agreed", "parentId": post.Id.String()}, bobAuth)
	if resp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("reply: expected 201, got %d (%v)", resp.StatusCode, errBody)
	}

	page := listNotifications(t, app, aliceAuth, "")
	if len(page.Items) != 1 {
		t.Fatalf("expected 1 notification, got %d: %+v", len(page.Items), page.Items)
	}
	if page.Items[0].Type != api.Reply {
		t.Fatalf("expected reply to win over mention, got %s", page.Items[0].Type)
	}
	_ = bob
}

func TestIntegration_Notifications_ReactionDedupedAcrossUndo(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "dedupe_alice", "Password123")
	bob := registerUser(t, client, base, "dedupe_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	post := createPost(t, client, base, aliceAuth, "react to me")
	reactURL := base + "/api/v1/posts/" + post.Id.String() + "/reactions"

	for i := 0; i < 3; i++ {
		if resp := postJSON(t, client, reactURL, map[string]any{"emoji": "👍"}, bobAuth); resp.StatusCode != http.StatusOK {
			t.Fatalf("react %d: expected 200, got %d", i, resp.StatusCode)
		}
		if resp := deleteReq(t, client, reactURL+"?emoji=%F0%9F%91%8D", bobAuth); resp.StatusCode != http.StatusOK {
			t.Fatalf("unreact %d: expected 200, got %d", i, resp.StatusCode)
		}
	}

	if got := unreadCount(t, app, aliceAuth); got != 1 {
		t.Fatalf("react/unreact loop must yield exactly 1 notification, got %d", got)
	}

	// A different emoji is a distinct notification.
	if resp := postJSON(t, client, reactURL, map[string]any{"emoji": "🎉"}, bobAuth); resp.StatusCode != http.StatusOK {
		t.Fatalf("second emoji: expected 200, got %d", resp.StatusCode)
	}
	if got := unreadCount(t, app, aliceAuth); got != 2 {
		t.Fatalf("expected 2 notifications for 2 distinct emojis, got %d", got)
	}
}

func TestIntegration_Notifications_MarkRead(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "read_alice", "Password123")
	bob := registerUser(t, client, base, "read_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	post := createPost(t, client, base, aliceAuth, "mark me read")
	for _, emoji := range []string{"👍", "🎉", "🔥"} {
		if resp := postJSON(t, client, base+"/api/v1/posts/"+post.Id.String()+"/reactions",
			map[string]any{"emoji": emoji}, bobAuth); resp.StatusCode != http.StatusOK {
			t.Fatalf("react %s: expected 200, got %d", emoji, resp.StatusCode)
		}
	}
	if got := unreadCount(t, app, aliceAuth); got != 3 {
		t.Fatalf("expected 3 unread, got %d", got)
	}

	page := listNotifications(t, app, aliceAuth, "")
	resp := postJSON(t, client, base+"/api/v1/notifications/read",
		map[string]any{"ids": []string{page.Items[0].Id.String()}}, aliceAuth)
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("mark read: expected 200, got %d (%v)", resp.StatusCode, errBody)
	}
	if got := decodeJSON[api.UnreadCount](t, resp).Count; got != 2 {
		t.Fatalf("expected 2 unread after marking one, got %d", got)
	}

	unreadPage := listNotifications(t, app, aliceAuth, "?unreadOnly=true")
	if len(unreadPage.Items) != 2 {
		t.Fatalf("unreadOnly: expected 2 items, got %d", len(unreadPage.Items))
	}
	for _, n := range unreadPage.Items {
		if n.Id == page.Items[0].Id {
			t.Fatalf("unreadOnly returned the notification we just read")
		}
	}

	// An empty body marks everything read.
	if resp := postJSON(t, client, base+"/api/v1/notifications/read", map[string]any{}, aliceAuth); resp.StatusCode != http.StatusOK {
		t.Fatalf("mark all read: expected 200, got %d", resp.StatusCode)
	}
	if got := unreadCount(t, app, aliceAuth); got != 0 {
		t.Fatalf("expected 0 unread after marking all, got %d", got)
	}

	// Read notifications keep their readAt timestamp in the full list.
	full := listNotifications(t, app, aliceAuth, "")
	for _, n := range full.Items {
		if n.ReadAt == nil {
			t.Fatalf("expected every notification read, got %+v", n)
		}
	}
}

func TestIntegration_Notifications_MarkReadCannotTouchOtherUsers(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "scope_alice", "Password123")
	bob := registerUser(t, client, base, "scope_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	post := createPost(t, client, base, aliceAuth, "scoped")
	if resp := postJSON(t, client, base+"/api/v1/posts/"+post.Id.String()+"/reactions",
		map[string]any{"emoji": "👍"}, bobAuth); resp.StatusCode != http.StatusOK {
		t.Fatalf("react: expected 200, got %d", resp.StatusCode)
	}

	page := listNotifications(t, app, aliceAuth, "")
	if len(page.Items) != 1 {
		t.Fatalf("expected 1 notification for alice, got %d", len(page.Items))
	}

	// Bob knows Alice's notification ID but must not be able to mark it read.
	if resp := postJSON(t, client, base+"/api/v1/notifications/read",
		map[string]any{"ids": []string{page.Items[0].Id.String()}}, bobAuth); resp.StatusCode != http.StatusOK {
		t.Fatalf("bob mark read: expected 200, got %d", resp.StatusCode)
	}
	if got := unreadCount(t, app, aliceAuth); got != 1 {
		t.Fatalf("another user marked alice's notification read, unread=%d", got)
	}

	// Bob cannot see it either.
	if len(listNotifications(t, app, bobAuth, "").Items) != 0 {
		t.Fatalf("bob must not see alice's notifications")
	}
}

func TestIntegration_Notifications_Unauthorized(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	for _, path := range []string{"/api/v1/notifications", "/api/v1/notifications/unread-count"} {
		if resp := get(t, client, base+path, nil); resp.StatusCode != http.StatusUnauthorized {
			t.Fatalf("%s: expected 401, got %d", path, resp.StatusCode)
		}
	}
	if resp := postJSON(t, client, base+"/api/v1/notifications/read", map[string]any{}, nil); resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("mark read: expected 401, got %d", resp.StatusCode)
	}
}

func TestIntegration_Notifications_DeletedPostIsExcluded(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "del_alice", "Password123")
	bob := registerUser(t, client, base, "del_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	post := createPost(t, client, base, aliceAuth, "will be deleted")
	if resp := postJSON(t, client, base+"/api/v1/posts/"+post.Id.String()+"/reactions",
		map[string]any{"emoji": "👍"}, bobAuth); resp.StatusCode != http.StatusOK {
		t.Fatalf("react: expected 200, got %d", resp.StatusCode)
	}
	if len(listNotifications(t, app, aliceAuth, "").Items) != 1 {
		t.Fatalf("expected the notification before deletion")
	}

	if resp := deleteReq(t, client, base+"/api/v1/posts/"+post.Id.String(), aliceAuth); resp.StatusCode != http.StatusNoContent {
		t.Fatalf("delete post: expected 204, got %d", resp.StatusCode)
	}

	if got := listNotifications(t, app, aliceAuth, ""); len(got.Items) != 0 {
		t.Fatalf("notifications for deleted posts must be hidden, got %+v", got.Items)
	}
}

func TestIntegration_Notifications_TypeFilterAndPagination(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "page_alice", "Password123")
	bob := registerUser(t, client, base, "page_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	post := createPost(t, client, base, aliceAuth, "paginate me")
	for _, emoji := range []string{"👍", "🎉", "🔥"} {
		if resp := postJSON(t, client, base+"/api/v1/posts/"+post.Id.String()+"/reactions",
			map[string]any{"emoji": emoji}, bobAuth); resp.StatusCode != http.StatusOK {
			t.Fatalf("react %s: expected 200, got %d", emoji, resp.StatusCode)
		}
	}
	if resp := postJSON(t, client, base+"/api/v1/posts",
		map[string]any{"content": "a reply", "parentId": post.Id.String()}, bobAuth); resp.StatusCode != http.StatusCreated {
		t.Fatalf("reply: expected 201, got %d", resp.StatusCode)
	}

	reactions := listNotifications(t, app, aliceAuth, "?type=reaction")
	if len(reactions.Items) != 3 {
		t.Fatalf("type filter: expected 3 reactions, got %d", len(reactions.Items))
	}
	for _, n := range reactions.Items {
		if n.Type != api.Reaction {
			t.Fatalf("type filter leaked a %s notification", n.Type)
		}
	}

	first := listNotifications(t, app, aliceAuth, "?limit=2")
	if len(first.Items) != 2 || first.NextCursor == nil {
		t.Fatalf("expected a full first page with a cursor, got %d items cursor=%v", len(first.Items), first.NextCursor)
	}
	second := listNotifications(t, app, aliceAuth, "?limit=2&cursor="+*first.NextCursor)
	if len(second.Items) != 2 {
		t.Fatalf("expected 2 items on page 2, got %d", len(second.Items))
	}
	seen := map[uuid.UUID]bool{}
	for _, n := range append(append([]api.Notification{}, first.Items...), second.Items...) {
		if seen[n.Id] {
			t.Fatalf("notification %v returned on both pages", n.Id)
		}
		seen[n.Id] = true
	}
	if len(seen) != 4 {
		t.Fatalf("expected 4 distinct notifications across pages, got %d", len(seen))
	}
}

func TestIntegration_Notifications_RealtimeReachesOnlyRecipient(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	alice := registerUser(t, client, base, "ws_alice", "Password123")
	bob := registerUser(t, client, base, "ws_bob", "Password123")
	aliceAuth := issueBearer(t, app.TokenManager, alice)
	bobAuth := issueBearer(t, app.TokenManager, bob)

	// Register hub clients directly: the WebSocket handshake is not what we are
	// testing here, only the per-user routing the hub does.
	aliceClient := realtime.NewClient(app.Hub, nil, alice.Id.String(), nil)
	bobClient := realtime.NewClient(app.Hub, nil, bob.Id.String(), nil)
	anonClient := realtime.NewClient(app.Hub, nil, "", nil)
	app.Hub.Register(aliceClient)
	app.Hub.Register(bobClient)
	app.Hub.Register(anonClient)

	post := createPost(t, client, base, aliceAuth, "watch the socket")
	drain(aliceClient, bobClient, anonClient)

	if resp := postJSON(t, client, base+"/api/v1/posts/"+post.Id.String()+"/reactions",
		map[string]any{"emoji": "👍"}, bobAuth); resp.StatusCode != http.StatusOK {
		t.Fatalf("react: expected 200, got %d", resp.StatusCode)
	}

	notification := awaitNotificationEvent(t, aliceClient)
	if notification.Type != api.Reaction {
		t.Fatalf("expected a reaction notification, got %s", notification.Type)
	}
	if notification.Actor == nil || notification.Actor.Id != bob.Id {
		t.Fatalf("expected actor bob, got %+v", notification.Actor)
	}
	if notification.Post == nil || notification.Post.Id != post.Id {
		t.Fatalf("expected the reacted post to be embedded, got %+v", notification.Post)
	}

	// Neither the actor nor anonymous clients get the notification event.
	assertNoNotificationEvent(t, "bob", bobClient)
	assertNoNotificationEvent(t, "anonymous", anonClient)
}

// drain discards any events already queued on the given clients.
func drain(clients ...*realtime.Client) {
	for _, c := range clients {
		for {
			select {
			case <-c.SendChan():
			case <-time.After(50 * time.Millisecond):
				goto next
			}
		}
	next:
	}
}

func awaitNotificationEvent(t *testing.T, c *realtime.Client) api.Notification {
	t.Helper()
	deadline := time.After(2 * time.Second)
	for {
		select {
		case payload := <-c.SendChan():
			var event realtime.Event
			if err := json.Unmarshal(payload, &event); err != nil {
				t.Fatalf("unmarshal event: %v", err)
			}
			if event.Type != realtime.EventNotificationCreated {
				continue // post_created / reaction_updated also flow through here
			}
			if event.Notification == nil {
				t.Fatalf("notification_created without a payload")
			}
			return *event.Notification
		case <-deadline:
			t.Fatalf("timed out waiting for notification_created")
			return api.Notification{}
		}
	}
}

func assertNoNotificationEvent(t *testing.T, name string, c *realtime.Client) {
	t.Helper()
	deadline := time.After(300 * time.Millisecond)
	for {
		select {
		case payload := <-c.SendChan():
			var event realtime.Event
			if err := json.Unmarshal(payload, &event); err != nil {
				continue
			}
			if event.Type == realtime.EventNotificationCreated {
				t.Fatalf("%s must not receive a targeted notification", name)
			}
		case <-deadline:
			return
		}
	}
}
