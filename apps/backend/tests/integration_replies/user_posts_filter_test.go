//go:build integration
// +build integration

package integration_replies_test

import (
	"net/http"
	"testing"

	"backend/internal/api"
)

func TestIntegration_UserPosts_ExcludeForeignReplies(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	uAlice := registerUser(t, client, base, "ef_alice", "password123")
	uBob := registerUser(t, client, base, "ef_bob", "password123")
	aAlice := issueBearer(t, app.TokenManager, uAlice)
	aBob := issueBearer(t, app.TokenManager, uBob)

	// alice: root post
	aliceRoot := createPost(t, client, base, aAlice, "alice root")
	// bob: root post that alice will reply to
	bobRoot := createPost(t, client, base, aBob, "bob root")
	// alice: reply to own post (should appear in filtered results)
	aliceSelfReply, _ := createReply(t, client, base, aAlice, "alice self-reply", aliceRoot.Id)
	// alice: reply to bob's post (should be excluded when filter is active)
	aliceForeignReply, _ := createReply(t, client, base, aAlice, "alice replies to bob", bobRoot.Id)

	// Without filter: all 3 of alice's posts (root + self-reply + foreign reply).
	allResp := get(t, client, base+"/api/v1/users/ef_alice/posts", nil)
	if allResp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, allResp)
		t.Fatalf("all posts: expected 200, got %d (%v)", allResp.StatusCode, errBody)
	}
	allPage := decodeJSON[api.UserPostsPage](t, allResp)
	if len(allPage.Items) != 3 {
		t.Fatalf("all posts: expected 3 items, got %d", len(allPage.Items))
	}

	// With excludeForeignReplies=true: only root + self-reply (not the reply to bob).
	filteredResp := get(t, client, base+"/api/v1/users/ef_alice/posts?excludeForeignReplies=true", nil)
	if filteredResp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, filteredResp)
		t.Fatalf("filtered posts: expected 200, got %d (%v)", filteredResp.StatusCode, errBody)
	}
	filteredPage := decodeJSON[api.UserPostsPage](t, filteredResp)
	if len(filteredPage.Items) != 2 {
		t.Fatalf("filtered posts: expected 2 items (root + self-reply), got %d", len(filteredPage.Items))
	}

	ids := make(map[string]bool, len(filteredPage.Items))
	for _, item := range filteredPage.Items {
		ids[item.Id.String()] = true
	}
	if !ids[aliceRoot.Id.String()] {
		t.Errorf("root post missing from filtered results")
	}
	if !ids[aliceSelfReply.Id.String()] {
		t.Errorf("self-reply missing from filtered results")
	}
	if ids[aliceForeignReply.Id.String()] {
		t.Errorf("reply to bob should not appear in filtered results")
	}
}

func TestIntegration_UserPosts_ExcludeForeignReplies_OnlyRootPosts(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	uAlice := registerUser(t, client, base, "ef2_alice", "password123")
	uBob := registerUser(t, client, base, "ef2_bob", "password123")
	aAlice := issueBearer(t, app.TokenManager, uAlice)
	aBob := issueBearer(t, app.TokenManager, uBob)

	// Alice posts only root posts — filter should change nothing.
	aliceRoot1 := createPost(t, client, base, aAlice, "alice root 1")
	aliceRoot2 := createPost(t, client, base, aAlice, "alice root 2")
	// Bob posts something alice doesn't reply to.
	createPost(t, client, base, aBob, "bob post")

	filteredResp := get(t, client, base+"/api/v1/users/ef2_alice/posts?excludeForeignReplies=true", nil)
	if filteredResp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, filteredResp)
		t.Fatalf("expected 200, got %d (%v)", filteredResp.StatusCode, errBody)
	}
	page := decodeJSON[api.UserPostsPage](t, filteredResp)
	if len(page.Items) != 2 {
		t.Fatalf("expected 2 root posts, got %d", len(page.Items))
	}
	ids := map[string]bool{
		page.Items[0].Id.String(): true,
		page.Items[1].Id.String(): true,
	}
	if !ids[aliceRoot1.Id.String()] || !ids[aliceRoot2.Id.String()] {
		t.Errorf("both root posts should appear: got %v", ids)
	}
}

func TestIntegration_UserPosts_ExcludeForeignReplies_AllReplysForeign(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	uAlice := registerUser(t, client, base, "ef3_alice", "password123")
	uBob := registerUser(t, client, base, "ef3_bob", "password123")
	aAlice := issueBearer(t, app.TokenManager, uAlice)
	aBob := issueBearer(t, app.TokenManager, uBob)

	bobRoot := createPost(t, client, base, aBob, "bob root")
	// Alice only replies to bob — filter should exclude all.
	createReply(t, client, base, aAlice, "alice reply 1 to bob", bobRoot.Id)
	createReply(t, client, base, aAlice, "alice reply 2 to bob", bobRoot.Id)

	filteredResp := get(t, client, base+"/api/v1/users/ef3_alice/posts?excludeForeignReplies=true", nil)
	if filteredResp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, filteredResp)
		t.Fatalf("expected 200, got %d (%v)", filteredResp.StatusCode, errBody)
	}
	page := decodeJSON[api.UserPostsPage](t, filteredResp)
	if len(page.Items) != 0 {
		t.Fatalf("expected 0 items when all replies are foreign, got %d", len(page.Items))
	}
}
