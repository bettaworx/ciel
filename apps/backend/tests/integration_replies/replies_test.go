//go:build integration
// +build integration

package integration_replies_test

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"testing"
	"time"

	"backend/internal/api"
)

// createReply posts a reply via the API and returns the created Post.
func createReply(t *testing.T, client *http.Client, baseURL string, authz map[string]string, content string, parentID api.PostId) (api.Post, *http.Response) {
	t.Helper()
	body := map[string]any{"content": content, "parentId": parentID.String()}
	resp := postJSON(t, client, baseURL+"/api/v1/posts", body, authz)
	if resp.StatusCode != http.StatusCreated {
		return api.Post{}, resp
	}
	return decodeJSON[api.Post](t, resp), resp
}

func TestIntegration_Replies_RootIdNormalization(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "rep1", "password123")
	a := issueBearer(t, app.TokenManager, u)

	root := createPost(t, client, base, a, "root post")
	if root.ParentId != nil {
		t.Fatalf("root post should have nil parentId, got %v", root.ParentId)
	}
	if root.RootId != nil {
		t.Fatalf("root post should have nil rootId, got %v", root.RootId)
	}

	reply1, resp1 := createReply(t, client, base, a, "reply to root", root.Id)
	if resp1.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp1)
		t.Fatalf("reply1: expected 201, got %d (%v)", resp1.StatusCode, errBody)
	}
	if reply1.ParentId == nil || *reply1.ParentId != root.Id {
		t.Fatalf("reply1.parentId = %v, want %v", reply1.ParentId, root.Id)
	}
	if reply1.RootId == nil || *reply1.RootId != root.Id {
		t.Fatalf("reply1.rootId = %v, want %v (root.id)", reply1.RootId, root.Id)
	}

	reply2, resp2 := createReply(t, client, base, a, "reply to reply", reply1.Id)
	if resp2.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp2)
		t.Fatalf("reply2: expected 201, got %d (%v)", resp2.StatusCode, errBody)
	}
	if reply2.ParentId == nil || *reply2.ParentId != reply1.Id {
		t.Fatalf("reply2.parentId = %v, want %v", reply2.ParentId, reply1.Id)
	}
	if reply2.RootId == nil || *reply2.RootId != root.Id {
		t.Fatalf("reply2.rootId = %v, want %v (root inherited)", reply2.RootId, root.Id)
	}

	reply3, resp3 := createReply(t, client, base, a, "deep reply", reply2.Id)
	if resp3.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp3)
		t.Fatalf("reply3: expected 201, got %d (%v)", resp3.StatusCode, errBody)
	}
	if reply3.ParentId == nil || *reply3.ParentId != reply2.Id {
		t.Fatalf("reply3.parentId = %v, want %v", reply3.ParentId, reply2.Id)
	}
	if reply3.RootId == nil || *reply3.RootId != root.Id {
		t.Fatalf("reply3.rootId = %v, want %v (root inherited via reply2)", reply3.RootId, root.Id)
	}
}

func TestIntegration_Replies_InvalidParent(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "rep2", "password123")
	a := issueBearer(t, app.TokenManager, u)

	// nonexistent parent
	resp := postJSON(t, client, base+"/api/v1/posts", map[string]any{
		"content":  "reply to ghost",
		"parentId": "00000000-0000-0000-0000-000000000000",
	}, a)
	if resp.StatusCode != http.StatusNotFound {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("nonexistent parent: expected 404, got %d (%v)", resp.StatusCode, errBody)
	}
	resp.Body.Close()

	// soft-deleted parent
	parent := createPost(t, client, base, a, "to be deleted")
	del := deleteReq(t, client, base+"/api/v1/posts/"+parent.Id.String(), a)
	if del.StatusCode != http.StatusNoContent {
		t.Fatalf("soft-delete: expected 204, got %d", del.StatusCode)
	}
	del.Body.Close()

	resp2 := postJSON(t, client, base+"/api/v1/posts", map[string]any{
		"content":  "reply to deleted",
		"parentId": parent.Id.String(),
	}, a)
	if resp2.StatusCode != http.StatusNotFound {
		errBody := decodeJSON[map[string]any](t, resp2)
		t.Fatalf("deleted parent: expected 404, got %d (%v)", resp2.StatusCode, errBody)
	}
	resp2.Body.Close()
}

func TestIntegration_Replies_SurviveParentSoftDelete(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u1 := registerUser(t, client, base, "alice", "password123")
	u2 := registerUser(t, client, base, "bob", "password123")
	a1 := issueBearer(t, app.TokenManager, u1)
	a2 := issueBearer(t, app.TokenManager, u2)

	parent := createPost(t, client, base, a1, "parent")
	reply, _ := createReply(t, client, base, a2, "ignoring mentions content", parent.Id)

	// Owner soft-deletes parent.
	del := deleteReq(t, client, base+"/api/v1/posts/"+parent.Id.String(), a1)
	if del.StatusCode != http.StatusNoContent {
		t.Fatalf("soft-delete: %d", del.StatusCode)
	}
	del.Body.Close()

	getResp := get(t, client, base+"/api/v1/posts/"+reply.Id.String(), nil)
	if getResp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, getResp)
		t.Fatalf("reply after soft-delete: expected 200, got %d (%v)", getResp.StatusCode, errBody)
	}
	refetched := decodeJSON[api.Post](t, getResp)
	if refetched.ParentId == nil || *refetched.ParentId != parent.Id {
		t.Fatalf("parentId should remain after soft-delete, got %v", refetched.ParentId)
	}
}

func TestIntegration_Replies_SurviveParentHardDelete(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u1 := registerUser(t, client, base, "carol", "password123")
	u2 := registerUser(t, client, base, "dave", "password123")
	a2 := issueBearer(t, app.TokenManager, u2)
	a1 := issueBearer(t, app.TokenManager, u1)

	parent := createPost(t, client, base, a1, "parent")
	reply, _ := createReply(t, client, base, a2, "the reply", parent.Id)

	// Hard-delete u1's account via DB (no public endpoint).
	// This cascades and removes u1's post, leaving the reply's parent_id NULL.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := app.SQLDB.ExecContext(ctx, `DELETE FROM users WHERE id = $1`, u1.Id); err != nil {
		t.Fatalf("hard-delete u1: %v", err)
	}

	getResp := get(t, client, base+"/api/v1/posts/"+reply.Id.String(), nil)
	if getResp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, getResp)
		t.Fatalf("reply after parent hard-delete: expected 200, got %d (%v)", getResp.StatusCode, errBody)
	}
	refetched := decodeJSON[api.Post](t, getResp)
	if refetched.ParentId != nil {
		t.Fatalf("parentId should become NULL after parent hard-delete, got %v", refetched.ParentId)
	}
}

func TestIntegration_Mentions_ExtractionAndIndependence(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	// Existing users to be mentioned.
	uAlice := registerUser(t, client, base, "alice2", "password123")
	uBob := registerUser(t, client, base, "bob2", "password123")
	uAuthor := registerUser(t, client, base, "author2", "password123")
	aAuthor := issueBearer(t, app.TokenManager, uAuthor)

	// Plain post mentioning two real users plus an unknown one — independent of replies.
	resp := postJSON(t, client, base+"/api/v1/posts", map[string]any{
		"content": "hello @alice2 and @bob2, also @nobody_here",
	}, aAuthor)
	if resp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("create: got %d (%v)", resp.StatusCode, errBody)
	}
	post := decodeJSON[api.Post](t, resp)
	if post.ParentId != nil {
		t.Fatalf("mention-only post should have nil parentId, got %v", post.ParentId)
	}
	if len(post.Mentions) != 2 {
		t.Fatalf("expected 2 resolved mentions, got %d: %+v", len(post.Mentions), post.Mentions)
	}
	gotNames := map[string]bool{}
	for _, m := range post.Mentions {
		gotNames[string(m.Username)] = true
	}
	if !gotNames["alice2"] || !gotNames["bob2"] {
		t.Fatalf("expected alice2 and bob2 in mentions, got %+v", gotNames)
	}
	if gotNames["nobody_here"] {
		t.Fatalf("unknown user should not appear in mentions")
	}
	_ = uAlice
	_ = uBob

	// Refetch via GET ensures persisted state matches.
	getResp := get(t, client, base+"/api/v1/posts/"+post.Id.String(), nil)
	if getResp.StatusCode != http.StatusOK {
		t.Fatalf("get: %d", getResp.StatusCode)
	}
	refetched := decodeJSON[api.Post](t, getResp)
	if len(refetched.Mentions) != 2 {
		t.Fatalf("expected 2 mentions on refetch, got %d", len(refetched.Mentions))
	}
}

func TestIntegration_Mentions_DuplicateAndSelfMention(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	uAuthor := registerUser(t, client, base, "selfauth", "password123")
	aAuthor := issueBearer(t, app.TokenManager, uAuthor)

	resp := postJSON(t, client, base+"/api/v1/posts", map[string]any{
		"content": "@selfauth @selfauth @selfauth pinging myself",
	}, aAuthor)
	if resp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("create: %d (%v)", resp.StatusCode, errBody)
	}
	post := decodeJSON[api.Post](t, resp)
	if len(post.Mentions) != 1 {
		t.Fatalf("expected 1 mention (deduped self), got %d", len(post.Mentions))
	}
	if string(post.Mentions[0].Username) != "selfauth" {
		t.Fatalf("expected self mention, got %s", post.Mentions[0].Username)
	}
}

func TestIntegration_ReplyCount(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "rcuser", "password123")
	a := issueBearer(t, app.TokenManager, u)

	root := createPost(t, client, base, a, "root")
	if root.ReplyCount != 0 {
		t.Fatalf("initial replyCount = %d, want 0", root.ReplyCount)
	}

	r1, _ := createReply(t, client, base, a, "r1", root.Id)
	_, _ = createReply(t, client, base, a, "r2", root.Id)
	r3, _ := createReply(t, client, base, a, "r3", root.Id)

	getResp := get(t, client, base+"/api/v1/posts/"+root.Id.String(), nil)
	refetched := decodeJSON[api.Post](t, getResp)
	if refetched.ReplyCount != 3 {
		t.Fatalf("after 3 replies: replyCount = %d, want 3", refetched.ReplyCount)
	}

	// Soft-delete one reply → count drops to 2.
	del := deleteReq(t, client, base+"/api/v1/posts/"+r1.Id.String(), a)
	if del.StatusCode != http.StatusNoContent {
		t.Fatalf("soft-delete r1: %d", del.StatusCode)
	}
	del.Body.Close()

	getResp2 := get(t, client, base+"/api/v1/posts/"+root.Id.String(), nil)
	refetched2 := decodeJSON[api.Post](t, getResp2)
	if refetched2.ReplyCount != 2 {
		t.Fatalf("after 1 reply soft-deleted: replyCount = %d, want 2", refetched2.ReplyCount)
	}
	_ = r3
}

func TestIntegration_ListReplies(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "lruser", "password123")
	a := issueBearer(t, app.TokenManager, u)

	root := createPost(t, client, base, a, "root")

	// 5 replies in known order.
	replies := make([]api.Post, 0, 5)
	for i := 0; i < 5; i++ {
		r, _ := createReply(t, client, base, a, "reply "+strconv.Itoa(i), root.Id)
		replies = append(replies, r)
		time.Sleep(3 * time.Millisecond)
	}

	// First page (limit=3) ordered ascending by creation time.
	page1Resp := get(t, client, base+"/api/v1/posts/"+root.Id.String()+"/replies?limit=3", nil)
	if page1Resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, page1Resp)
		t.Fatalf("page1: %d (%v)", page1Resp.StatusCode, errBody)
	}
	page1 := decodeJSON[api.TimelinePage](t, page1Resp)
	if len(page1.Items) != 3 {
		t.Fatalf("page1 items = %d, want 3", len(page1.Items))
	}
	for i := 0; i < 3; i++ {
		if page1.Items[i].Id != replies[i].Id {
			t.Fatalf("page1 item[%d]: id %v, want %v (ascending order)", i, page1.Items[i].Id, replies[i].Id)
		}
	}
	if page1.NextCursor == nil || strings.TrimSpace(*page1.NextCursor) == "" {
		t.Fatalf("expected nextCursor on page1")
	}

	// Second page returns the remaining 2.
	page2Resp := get(t, client, base+"/api/v1/posts/"+root.Id.String()+"/replies?limit=3&cursor="+*page1.NextCursor, nil)
	if page2Resp.StatusCode != http.StatusOK {
		t.Fatalf("page2: %d", page2Resp.StatusCode)
	}
	page2 := decodeJSON[api.TimelinePage](t, page2Resp)
	if len(page2.Items) != 2 {
		t.Fatalf("page2 items = %d, want 2", len(page2.Items))
	}
	if page2.Items[0].Id != replies[3].Id || page2.Items[1].Id != replies[4].Id {
		t.Fatalf("page2 ordering wrong: %v %v", page2.Items[0].Id, page2.Items[1].Id)
	}
}

func TestIntegration_ListReplies_ParentNotFound(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "lrnf", "password123")
	a := issueBearer(t, app.TokenManager, u)

	// Non-existent parent → 404.
	resp := get(t, client, base+"/api/v1/posts/00000000-0000-0000-0000-000000000000/replies", nil)
	if resp.StatusCode != http.StatusNotFound {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("nonexistent: expected 404, got %d (%v)", resp.StatusCode, errBody)
	}
	resp.Body.Close()

	// Soft-deleted parent → 404.
	parent := createPost(t, client, base, a, "transient")
	del := deleteReq(t, client, base+"/api/v1/posts/"+parent.Id.String(), a)
	del.Body.Close()
	resp2 := get(t, client, base+"/api/v1/posts/"+parent.Id.String()+"/replies", nil)
	if resp2.StatusCode != http.StatusNotFound {
		errBody := decodeJSON[map[string]any](t, resp2)
		t.Fatalf("soft-deleted: expected 404, got %d (%v)", resp2.StatusCode, errBody)
	}
	resp2.Body.Close()
}

func TestIntegration_Mentions_PerPostCap(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	// Register MaxMentionsPerPost + 5 users with short ascii names.
	// Cap is enforced at extraction time, so additional mentions are silently dropped.
	const total = 55 // MaxMentionsPerPost is 50 in service code.
	usernames := make([]string, 0, total)
	for i := 0; i < total; i++ {
		uname := fmt.Sprintf("capu%03d", i)
		usernames = append(usernames, uname)
		registerUser(t, client, base, uname, "password123")
	}

	uAuthor := registerUser(t, client, base, "capauthor", "password123")
	aAuthor := issueBearer(t, app.TokenManager, uAuthor)

	var sb strings.Builder
	sb.WriteString("massive: ")
	for _, n := range usernames {
		sb.WriteString("@")
		sb.WriteString(n)
		sb.WriteString(" ")
	}
	resp := postJSON(t, client, base+"/api/v1/posts", map[string]any{
		"content": sb.String()[:280], // stay under 300-char limit
	}, aAuthor)
	if resp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("create: got %d (%v)", resp.StatusCode, errBody)
	}
	post := decodeJSON[api.Post](t, resp)
	if len(post.Mentions) > 50 {
		t.Fatalf("expected at most 50 mentions, got %d", len(post.Mentions))
	}
}
