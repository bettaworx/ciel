//go:build integration
// +build integration

package integration_test

import (
	"net/http"
	"testing"

	"backend/internal/api"

	"github.com/google/uuid"
)

func listBookmarkLists(t *testing.T, app *testApp, authz map[string]string) api.BookmarkListsResponse {
	t.Helper()
	resp := get(t, app.Server.Client(), app.Server.URL+"/api/v1/bookmarks/lists", authz)
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("list bookmark lists: expected 200, got %d (%v)", resp.StatusCode, errBody)
	}
	return decodeJSON[api.BookmarkListsResponse](t, resp)
}

func createBookmarkList(t *testing.T, app *testApp, authz map[string]string, name string) api.BookmarkList {
	t.Helper()
	resp := postJSON(t, app.Server.Client(), app.Server.URL+"/api/v1/bookmarks/lists", map[string]any{"name": name}, authz)
	if resp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("create bookmark list %q: expected 201, got %d (%v)", name, resp.StatusCode, errBody)
	}
	return decodeJSON[api.BookmarkList](t, resp)
}

func setPostBookmarks(t *testing.T, app *testApp, authz map[string]string, postID api.PostId, listIDs []uuid.UUID) *http.Response {
	t.Helper()
	if listIDs == nil {
		listIDs = []uuid.UUID{}
	}
	return putJSON(t, app.Server.Client(), app.Server.URL+"/api/v1/posts/"+postID.String()+"/bookmarks",
		map[string]any{"listIds": listIDs}, authz)
}

func bookmarkListIDs(p api.Post) []uuid.UUID {
	if p.BookmarkListIds == nil {
		return nil
	}
	return *p.BookmarkListIds
}

// TestIntegration_Bookmarks_DefaultListExistsAndIsProtected covers the two rules
// that hold for every account: signup hands out exactly one list, and that list
// can be renamed but never deleted.
func TestIntegration_Bookmarks_DefaultListExistsAndIsProtected(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	user := registerUser(t, app.Server.Client(), app.Server.URL, "bm_default", "Password123")
	authz := issueBearer(t, app.TokenManager, user)

	lists := listBookmarkLists(t, app, authz)
	if len(lists.Items) != 1 {
		t.Fatalf("expected exactly 1 list after signup, got %d", len(lists.Items))
	}
	def := lists.Items[0]
	if !def.IsDefault {
		t.Fatal("expected the signup list to be the default one")
	}
	if def.Name != nil {
		t.Fatalf("expected the default list name to be null so the client can localise it, got %q", *def.Name)
	}
	if def.PostCount != 0 {
		t.Fatalf("expected an empty default list, got postCount=%d", def.PostCount)
	}

	// Renaming and re-iconing the default list is allowed.
	resp := patchJSON(t, app.Server.Client(), app.Server.URL+"/api/v1/bookmarks/lists/"+def.Id.String(),
		map[string]any{"name": "あとで読む", "icon": "📚"}, authz)
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("patch default list: expected 200, got %d (%v)", resp.StatusCode, errBody)
	}
	renamed := decodeJSON[api.BookmarkList](t, resp)
	if renamed.Name == nil || *renamed.Name != "あとで読む" {
		t.Fatalf("expected the rename to stick, got %v", renamed.Name)
	}
	if string(renamed.Icon) != "📚" {
		t.Fatalf("expected the icon to change, got %q", renamed.Icon)
	}
	if !renamed.IsDefault {
		t.Fatal("renaming must not clear isDefault, or the list becomes deletable")
	}

	// Deleting it must not be.
	resp = deleteReq(t, app.Server.Client(), app.Server.URL+"/api/v1/bookmarks/lists/"+def.Id.String(), authz)
	if resp.StatusCode != http.StatusConflict {
		t.Fatalf("delete default list: expected 409, got %d", resp.StatusCode)
	}
	if body := decodeJSON[api.Error](t, resp); body.Code != "bookmark_list_default" {
		t.Fatalf("expected code bookmark_list_default, got %q", body.Code)
	}
}

// TestIntegration_Bookmarks_SetMembershipAndTimelineState is the end-to-end path
// the post card drives: save a post into several lists, see it come back on the
// timeline, then clear it.
func TestIntegration_Bookmarks_SetMembershipAndTimelineState(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	user := registerUser(t, client, base, "bm_saver", "Password123")
	authz := issueBearer(t, app.TokenManager, user)

	def := listBookmarkLists(t, app, authz).Items[0]
	extra := createBookmarkList(t, app, authz, "Reading")
	if extra.IsDefault {
		t.Fatal("a created list must not be flagged as the default one")
	}

	post := createPost(t, client, base, authz, "bookmark me")

	resp := setPostBookmarks(t, app, authz, post.Id, []uuid.UUID{def.Id, extra.Id})
	if resp.StatusCode != http.StatusOK {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("set bookmarks: expected 200, got %d (%v)", resp.StatusCode, errBody)
	}
	if got := len(decodeJSON[api.PostBookmarks](t, resp).ListIds); got != 2 {
		t.Fatalf("expected the response to echo 2 lists, got %d", got)
	}

	// The timeline is where the filled icon comes from, so the ids have to
	// survive post hydration, not just the write path.
	page := homeTimeline(t, app, authz, "")
	var seen []uuid.UUID
	for _, p := range page.Items {
		if p.Id == post.Id {
			seen = bookmarkListIDs(p)
		}
	}
	if len(seen) != 2 {
		t.Fatalf("expected 2 bookmarkListIds on the timeline post, got %v", seen)
	}

	// Counts follow membership.
	for _, l := range listBookmarkLists(t, app, authz).Items {
		if l.PostCount != 1 {
			t.Fatalf("expected list %v to hold 1 post, got %d", l.Id, l.PostCount)
		}
	}

	// The list page returns the post itself.
	resp = get(t, client, base+"/api/v1/bookmarks/lists/"+extra.Id.String()+"/posts", authz)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("list posts: expected 200, got %d", resp.StatusCode)
	}
	listed := decodeJSON[api.UserPostsPage](t, resp)
	if len(listed.Items) != 1 || listed.Items[0].Id != post.Id {
		t.Fatalf("expected the bookmarked post back, got %d items", len(listed.Items))
	}

	// An empty set is how the client says "unsave".
	resp = setPostBookmarks(t, app, authz, post.Id, nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("clear bookmarks: expected 200, got %d", resp.StatusCode)
	}
	for _, l := range listBookmarkLists(t, app, authz).Items {
		if l.PostCount != 0 {
			t.Fatalf("expected list %v to be empty after clearing, got %d", l.Id, l.PostCount)
		}
	}
}

// TestIntegration_Bookmarks_ListsArePrivate checks that a list id belonging to
// somebody else is unusable and unreadable, and reads as 404 rather than 403 so
// its existence is not confirmed.
func TestIntegration_Bookmarks_ListsArePrivate(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	owner := registerUser(t, client, base, "bm_owner", "Password123")
	intruder := registerUser(t, client, base, "bm_intruder", "Password123")
	ownerAuth := issueBearer(t, app.TokenManager, owner)
	intruderAuth := issueBearer(t, app.TokenManager, intruder)

	ownerList := createBookmarkList(t, app, ownerAuth, "Private")
	intruderList := listBookmarkLists(t, app, intruderAuth).Items[0]
	post := createPost(t, client, base, ownerAuth, "not yours")

	// Saving into someone else's list fails...
	resp := setPostBookmarks(t, app, intruderAuth, post.Id, []uuid.UUID{ownerList.Id})
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("save into another user's list: expected 404, got %d", resp.StatusCode)
	}

	// ...and so does slipping it in alongside one of your own, or the whole
	// request would half-apply.
	resp = setPostBookmarks(t, app, intruderAuth, post.Id, []uuid.UUID{intruderList.Id, ownerList.Id})
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("mixed list ids: expected 404, got %d", resp.StatusCode)
	}
	if got := listBookmarkLists(t, app, intruderAuth).Items[0].PostCount; got != 0 {
		t.Fatalf("a rejected save must not have applied partially, got postCount=%d", got)
	}

	// Reading and deleting are scoped the same way.
	resp = get(t, client, base+"/api/v1/bookmarks/lists/"+ownerList.Id.String()+"/posts", intruderAuth)
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("read another user's list: expected 404, got %d", resp.StatusCode)
	}
	resp = deleteReq(t, client, base+"/api/v1/bookmarks/lists/"+ownerList.Id.String(), intruderAuth)
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("delete another user's list: expected 404, got %d", resp.StatusCode)
	}

	// The owner can still delete it, and that takes the bookmarks with it.
	if resp = deleteReq(t, client, base+"/api/v1/bookmarks/lists/"+ownerList.Id.String(), ownerAuth); resp.StatusCode != http.StatusNoContent {
		t.Fatalf("owner delete: expected 204, got %d", resp.StatusCode)
	}
	if got := len(listBookmarkLists(t, app, ownerAuth).Items); got != 1 {
		t.Fatalf("expected only the default list left, got %d", got)
	}
}

// TestIntegration_Bookmarks_RequireAuth guards the whole surface: none of it
// means anything without a caller.
func TestIntegration_Bookmarks_RequireAuth(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	resp := get(t, app.Server.Client(), app.Server.URL+"/api/v1/bookmarks/lists", nil)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("anonymous list: expected 401, got %d", resp.StatusCode)
	}
	resp.Body.Close()

	resp = postJSON(t, app.Server.Client(), app.Server.URL+"/api/v1/bookmarks/lists", map[string]any{"name": "x"}, nil)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("anonymous create: expected 401, got %d", resp.StatusCode)
	}
	resp.Body.Close()
}
