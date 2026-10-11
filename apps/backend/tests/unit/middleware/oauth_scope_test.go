package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"backend/internal/auth"
	"backend/internal/middleware"

	"github.com/google/uuid"
)

// This file is the test for the OAuth authorization boundary. Everything an
// access token is allowed to reach is decided by one ordered table, so the
// cases worth writing are the ones where the table could be read one way and
// behave another: ordering between overlapping rules, prefixes that are not
// segment boundaries, and the default.

// runScope drives the middleware and reports the status plus whether the
// request reached the handler behind it.
func runScope(t *testing.T, method, reqPath string, user *auth.User) (int, bool) {
	t.Helper()

	reached := false
	h := middleware.OAuthScope()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reached = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(method, "http://example.test"+reqPath, nil)
	// Set the raw path back: parsing a full URL resolves dot segments, and
	// several cases below are specifically about paths that do not clean.
	req.URL.Path = reqPath
	if user != nil {
		req = req.WithContext(auth.WithUser(req.Context(), *user))
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec.Code, reached
}

// oauthUser is a request authenticated by an OAuth access token.
func oauthUser(scopes ...string) *auth.User {
	return &auth.User{
		ID:       uuid.New(),
		Username: "bot",
		TokenID:  uuid.New(),
		ClientID: uuid.New(),
		Scopes:   scopes,
	}
}

// personalTokenUser is a request authenticated by a personal access token,
// which has no client. It must be restricted exactly like an OAuth token —
// everything below keys off TokenID, and a ClientID test would let these
// through as first-party sessions.
func personalTokenUser(scopes ...string) *auth.User {
	return &auth.User{
		ID:       uuid.New(),
		Username: "bot",
		TokenID:  uuid.New(),
		Scopes:   scopes,
	}
}

// firstParty is a cookie or JWT session: no client id, so not scope limited.
func firstParty() *auth.User {
	return &auth.User{ID: uuid.New(), Username: "alice"}
}

func TestOAuthScope_FirstPartySessionIsNeverRestricted(t *testing.T) {
	// The whole table must be inert for a normal signed-in user. If this ever
	// fails, OAuth has broken the app for everyone who is not using it.
	cases := []struct{ method, path string }{
		{http.MethodGet, "/api/v1/timeline/home"},
		{http.MethodDelete, "/api/v1/me"},
		{http.MethodGet, "/api/v1/admin/users"},
		{http.MethodPatch, "/api/v1/me/username"},
		{http.MethodPost, "/api/v1/auth/logout"},
		{http.MethodGet, "/api/v1/anything-unrouted"},
	}
	for _, tc := range cases {
		code, reached := runScope(t, tc.method, tc.path, firstParty())
		if !reached || code != http.StatusOK {
			t.Errorf("%s %s: first-party blocked (status %d)", tc.method, tc.path, code)
		}
	}
}

func TestOAuthScope_AnonymousPassesThrough(t *testing.T) {
	// Handlers do their own authentication; this middleware only narrows what
	// an app may do for someone, so it must not start rejecting anonymous
	// reads of public endpoints.
	code, reached := runScope(t, http.MethodGet, "/api/v1/posts/abc", nil)
	if !reached || code != http.StatusOK {
		t.Errorf("anonymous request blocked (status %d)", code)
	}
}

func TestOAuthScope_DeniedRoutes(t *testing.T) {
	// Holding every scope must still not open these.
	all := oauthUser(auth.AllScopes...)

	cases := []struct{ method, path string }{
		{http.MethodGet, "/api/v1/admin/users"},
		{http.MethodPost, "/api/v1/admin/posts/x/visibility"},
		{http.MethodPost, "/api/v1/auth/login/start"},
		{http.MethodPost, "/api/v1/auth/password/change"},
		{http.MethodPost, "/api/v1/auth/session/exchange"},
		{http.MethodPost, "/api/v1/auth/mfa/disable"},
		{http.MethodGet, "/api/v1/me/oauth/clients"},
		{http.MethodPost, "/api/v1/me/oauth/clients"},
		{http.MethodDelete, "/api/v1/me"},
		{http.MethodPatch, "/api/v1/me/username"},
		{http.MethodPatch, "/api/v1/me/bot"},
		{http.MethodPost, "/api/v1/me/agreements"},
		{http.MethodPost, "/api/v1/reports"},
		{http.MethodGet, "/api/v1/setup/status"},
	}
	for _, tc := range cases {
		code, reached := runScope(t, tc.method, tc.path, all)
		if reached {
			t.Errorf("%s %s: reached handler, want denied", tc.method, tc.path)
		}
		if code != http.StatusForbidden {
			t.Errorf("%s %s: status %d, want 403", tc.method, tc.path, code)
		}
	}
}

// DELETE /api/v1/me is denied while other /me writes are merely scoped, so the
// exact-match deny has to win over the prefix rule below it.
func TestOAuthScope_DeleteMeIsNotAWriteAccountRoute(t *testing.T) {
	user := oauthUser(auth.ScopeWriteAccount, auth.ScopeReadAccount)

	if code, reached := runScope(t, http.MethodDelete, "/api/v1/me", user); reached || code != http.StatusForbidden {
		t.Errorf("DELETE /me: status %d reached %v, want 403 and not reached", code, reached)
	}
	// The neighbouring write must still work, or the deny rule is too broad.
	if code, reached := runScope(t, http.MethodPatch, "/api/v1/me/profile", user); !reached || code != http.StatusOK {
		t.Errorf("PATCH /me/profile: status %d reached %v, want 200", code, reached)
	}
}

func TestOAuthScope_ReadAndWriteAreSeparate(t *testing.T) {
	readOnly := oauthUser(auth.ScopeReadPosts, auth.ScopeReadAccount)

	if code, reached := runScope(t, http.MethodGet, "/api/v1/timeline/home", readOnly); !reached || code != http.StatusOK {
		t.Errorf("GET timeline with read:posts: status %d, want 200", code)
	}
	if code, reached := runScope(t, http.MethodPost, "/api/v1/posts", readOnly); reached || code != http.StatusForbidden {
		t.Errorf("POST posts with only read:posts: status %d reached %v, want 403", code, reached)
	}
	if code, reached := runScope(t, http.MethodGet, "/api/v1/me", readOnly); !reached || code != http.StatusOK {
		t.Errorf("GET /me with read:account: status %d, want 200", code)
	}
	if code, reached := runScope(t, http.MethodPatch, "/api/v1/me/profile", readOnly); reached || code != http.StatusForbidden {
		t.Errorf("PATCH /me/profile without write:account: status %d, want 403", code)
	}
}

// Follow requests sit under /me but are follow-graph writes, so they must be
// reachable with write:follows and not require write:account.
func TestOAuthScope_FollowRequestsAreFollowScope(t *testing.T) {
	follower := oauthUser(auth.ScopeWriteFollows)

	if code, reached := runScope(t, http.MethodPost, "/api/v1/me/follow-requests/bob/accept", follower); !reached || code != http.StatusOK {
		t.Errorf("accept follow request with write:follows: status %d, want 200", code)
	}

	accountOnly := oauthUser(auth.ScopeWriteAccount, auth.ScopeReadAccount)
	if code, _ := runScope(t, http.MethodPost, "/api/v1/me/follow-requests/bob/accept", accountOnly); code != http.StatusForbidden {
		t.Errorf("accept follow request without write:follows: status %d, want 403", code)
	}
}

// The prefix rules must compare on segment boundaries. A route whose name
// merely starts with a rule's path is a different route.
func TestOAuthScope_PrefixMatchingStopsAtSegmentBoundary(t *testing.T) {
	user := oauthUser(auth.ScopeReadPosts)

	// Unrouted today, but if one is ever added it must not inherit /posts.
	if code, reached := runScope(t, http.MethodGet, "/api/v1/postsomething", user); reached || code != http.StatusForbidden {
		t.Errorf("GET /postsomething: status %d reached %v, want 403", code, reached)
	}
	// The real route still matches, with and without a sub-path.
	for _, p := range []string{"/api/v1/posts", "/api/v1/posts/abc", "/api/v1/posts/abc/replies"} {
		if code, reached := runScope(t, http.MethodGet, p, user); !reached || code != http.StatusOK {
			t.Errorf("GET %s: status %d, want 200", p, code)
		}
	}
}

// An admin's OAuth token must not become an admin token by way of a path that
// cleans into the admin tree.
func TestOAuthScope_UncleanPathsAreRejected(t *testing.T) {
	all := oauthUser(auth.AllScopes...)

	for _, p := range []string{
		"/api/v1//admin/users",
		"/api/v1/posts/../admin/users",
		"/api/v1/timeline/home/",
	} {
		if code, reached := runScope(t, http.MethodGet, p, all); reached || code != http.StatusForbidden {
			t.Errorf("GET %q: status %d reached %v, want 403", p, code, reached)
		}
	}
}

// The default. A route the table has never heard of is refused, so a route
// added to the router without being added here fails closed.
func TestOAuthScope_UnknownRouteIsDenied(t *testing.T) {
	all := oauthUser(auth.AllScopes...)

	for _, p := range []string{"/api/v1/whatever", "/api/v1"} {
		if code, reached := runScope(t, http.MethodGet, p, all); reached || code != http.StatusForbidden {
			t.Errorf("GET %s: status %d reached %v, want 403", p, code, reached)
		}
	}
}

// Paths outside /api/v1 are not scope checked: media and emoji delivery are
// public reads, and an API client that could not load images would be useless.
func TestOAuthScope_NonAPIPathsAreNotChecked(t *testing.T) {
	none := oauthUser()

	for _, p := range []string{"/media/abc/image.webp", "/emoji/abc/image.webp", "/pwa/manifest.json"} {
		if code, reached := runScope(t, http.MethodGet, p, none); !reached || code != http.StatusOK {
			t.Errorf("GET %s: status %d, want 200", p, code)
		}
	}
}

func TestOAuthScope_NamesTheMissingScopeInTheChallenge(t *testing.T) {
	h := middleware.OAuthScope()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/posts", nil)
	req = req.WithContext(auth.WithUser(req.Context(), *oauthUser(auth.ScopeReadPosts)))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	got := rec.Header().Get("WWW-Authenticate")
	if got == "" {
		t.Fatal("no WWW-Authenticate header")
	}
	for _, want := range []string{`error="insufficient_scope"`, `scope="write:posts"`} {
		if !strings.Contains(got, want) {
			t.Errorf("WWW-Authenticate = %q, want it to contain %q", got, want)
		}
	}
}

// A denied-outright route has no scope that would have worked, so the challenge
// must not invite the client to ask for one.
func TestOAuthScope_DeniedRouteNamesNoScope(t *testing.T) {
	h := middleware.OAuthScope()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/users", nil)
	req = req.WithContext(auth.WithUser(req.Context(), *oauthUser(auth.AllScopes...)))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if got := rec.Header().Get("WWW-Authenticate"); strings.Contains(got, "scope=") {
		t.Errorf("WWW-Authenticate = %q, want no scope named", got)
	}
}

// A personal access token has no client id. If anything decided "is this
// scope-limited?" by looking at ClientID, these would all be treated as
// first-party sessions — exempt from every scope check, the admin guard and
// the step-up guard — and each personal token would carry full account access.
func TestOAuthScope_PersonalTokensAreRestrictedLikeOAuthTokens(t *testing.T) {
	readOnly := personalTokenUser(auth.ScopeReadPosts)

	if code, reached := runScope(t, http.MethodGet, "/api/v1/timeline/home", readOnly); !reached || code != http.StatusOK {
		t.Errorf("GET timeline with read:posts: status %d, want 200", code)
	}
	if code, reached := runScope(t, http.MethodPost, "/api/v1/posts", readOnly); reached || code != http.StatusForbidden {
		t.Errorf("POST posts without write:posts: status %d reached %v, want 403", code, reached)
	}

	all := personalTokenUser(auth.AllScopes...)
	for _, tc := range []struct{ method, path string }{
		{http.MethodGet, "/api/v1/admin/users"},
		{http.MethodPost, "/api/v1/auth/password/change"},
		{http.MethodGet, "/api/v1/me/oauth/tokens"},
		{http.MethodPost, "/api/v1/me/oauth/tokens"},
		{http.MethodDelete, "/api/v1/me"},
	} {
		if code, reached := runScope(t, tc.method, tc.path, all); reached || code != http.StatusForbidden {
			t.Errorf("%s %s: status %d reached %v, want 403", tc.method, tc.path, code, reached)
		}
	}
}
