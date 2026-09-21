package middleware

import (
	"encoding/json"
	"net/http"
	"path"
	"strings"

	"backend/internal/api"
	"backend/internal/auth"
)

// apiPrefix is the only tree OAuth tokens are scope-checked against. Outside it
// live the public asset routes (/media, /emoji, /pwa/manifest.json) and the
// websocket, which authenticates from the cookie alone and therefore cannot see
// an OAuth token at all.
const apiPrefix = "/api/v1"

type ruleAction int

const (
	// actionDeny: closed to OAuth tokens no matter what scopes they hold.
	actionDeny ruleAction = iota
	// actionPublic: no scope needed.
	actionPublic
	// actionScope: needs the named scope.
	actionScope
)

type scopeRule struct {
	// "" matches any method.
	method string
	path   string
	// When true, path must match exactly rather than as a path prefix.
	exact  bool
	action ruleAction
	scope  string
}

// oauthScopeRules maps a request to the scope it needs. First match wins, so
// order is load-bearing and the deny rules come first.
//
// The table is a whitelist with a default-deny fallthrough. That is the whole
// point of doing this here rather than as a check inside each handler: there
// are ninety-odd routes under /api/v1, and the failure mode of a table that has
// fallen behind the router is a 403 on something that should have worked —
// never an unguarded endpoint. A per-handler check has the opposite failure
// mode, where the endpoint nobody remembered to annotate is wide open.
var oauthScopeRules = []scopeRule{
	// ---- Closed to OAuth entirely -------------------------------------------
	//
	// Admin is closed here and again in RequirePermission. An OAuth token
	// belonging to an administrator must not be an administrator: the user
	// consented to an app posting for them, not to it wielding their staff
	// powers.
	{path: apiPrefix + "/admin", action: actionDeny},
	// Everything that authenticates, re-authenticates, or changes how the
	// account authenticates: login, logout, refresh, password, MFA enrolment,
	// step-up, and the device-bound session tokens used for account switching.
	// A token that could call these could trade itself up for a full session.
	{path: apiPrefix + "/auth", action: actionDeny},
	{path: apiPrefix + "/setup", action: actionDeny},
	// Managing OAuth apps over OAuth would let a token mint itself a second,
	// wider token.
	{path: apiPrefix + "/me/oauth", action: actionDeny},
	// Identity-level changes. Deleting the account is the one that matters
	// most, and it is an exact match so it cannot fall through to the /me
	// write rule further down.
	{method: http.MethodDelete, path: apiPrefix + "/me", exact: true, action: actionDeny},
	{method: http.MethodPatch, path: apiPrefix + "/me/username", action: actionDeny},
	{method: http.MethodPatch, path: apiPrefix + "/me/bot", action: actionDeny},
	{method: http.MethodPost, path: apiPrefix + "/me/agreements", action: actionDeny},
	// Filing a report as somebody is putting words in their mouth to the
	// moderators. Nothing an app does needs it.
	{path: apiPrefix + "/reports", action: actionDeny},

	// ---- Public: no scope required -----------------------------------------
	{method: http.MethodGet, path: apiPrefix + "/health", action: actionPublic},
	{method: http.MethodGet, path: apiPrefix + "/server", action: actionPublic},
	{method: http.MethodGet, path: apiPrefix + "/agreements", action: actionPublic},
	{method: http.MethodGet, path: apiPrefix + "/ogp", action: actionPublic},

	// ---- Scoped -------------------------------------------------------------
	//
	// Follow requests live under /me but are follow-graph writes, so they are
	// listed before the general /me rules rather than counting as account
	// changes.
	{path: apiPrefix + "/me/follow-requests", action: actionScope, scope: auth.ScopeWriteFollows},
	{method: http.MethodGet, path: apiPrefix + "/me", action: actionScope, scope: auth.ScopeReadAccount},
	{path: apiPrefix + "/me", action: actionScope, scope: auth.ScopeWriteAccount},

	{method: http.MethodGet, path: apiPrefix + "/notifications", action: actionScope, scope: auth.ScopeReadNotifications},
	{path: apiPrefix + "/notifications", action: actionScope, scope: auth.ScopeWriteNotify},

	{method: http.MethodGet, path: apiPrefix + "/timeline", action: actionScope, scope: auth.ScopeReadPosts},
	{method: http.MethodGet, path: apiPrefix + "/search", action: actionScope, scope: auth.ScopeReadPosts},
	{method: http.MethodGet, path: apiPrefix + "/emojis", action: actionScope, scope: auth.ScopeReadPosts},

	{method: http.MethodGet, path: apiPrefix + "/bookmarks", action: actionScope, scope: auth.ScopeReadPosts},
	{path: apiPrefix + "/bookmarks", action: actionScope, scope: auth.ScopeWritePosts},

	{method: http.MethodGet, path: apiPrefix + "/posts", action: actionScope, scope: auth.ScopeReadPosts},
	{path: apiPrefix + "/posts", action: actionScope, scope: auth.ScopeWritePosts},

	// Reading a profile or its posts is the same permission as reading a
	// timeline; a public account's follower list is already public. Writing
	// under /users is always a relationship change — follow, block, mute.
	{method: http.MethodGet, path: apiPrefix + "/users", action: actionScope, scope: auth.ScopeReadPosts},
	{path: apiPrefix + "/users", action: actionScope, scope: auth.ScopeWriteFollows},

	{method: http.MethodPost, path: apiPrefix + "/media", action: actionScope, scope: auth.ScopeWriteMedia},
}

// OAuthScope enforces OAuth2 scopes.
//
// It must run after OptionalAuth, which is what puts the token's scopes into
// the request context.
func OAuthScope() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := auth.UserFromContext(r.Context())
			// Anonymous requests and first-party sessions are not scope
			// limited. Handlers still do their own authentication; this
			// middleware only narrows what an app may do on someone's behalf.
			if !ok || !user.IsOAuth() {
				next.ServeHTTP(w, r)
				return
			}

			reqPath := r.URL.Path
			if !strings.HasPrefix(reqPath, apiPrefix) {
				next.ServeHTTP(w, r)
				return
			}

			// chi routes on the raw path and does not normalise it, so a path
			// that cleans to something different is one where this middleware
			// and the router could disagree about which handler runs. Refuse
			// it rather than pick a winner: "/api/v1//admin/users" must not be
			// a way past the admin deny rule.
			if path.Clean(reqPath) != reqPath {
				writeInsufficientScope(w, "")
				return
			}

			rule, found := matchScopeRule(r.Method, reqPath)
			if !found || rule.action == actionDeny {
				writeInsufficientScope(w, "")
				return
			}
			if rule.action == actionScope && !auth.HasScope(user.Scopes, rule.scope) {
				writeInsufficientScope(w, rule.scope)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// matchScopeRule returns the first rule matching the request.
func matchScopeRule(method, reqPath string) (scopeRule, bool) {
	for _, rule := range oauthScopeRules {
		if rule.method != "" && rule.method != method {
			continue
		}
		if rule.exact {
			if reqPath == rule.path {
				return rule, true
			}
			continue
		}
		if pathMatchesPrefix(reqPath, rule.path) {
			return rule, true
		}
	}
	return scopeRule{}, false
}

// pathMatchesPrefix reports whether reqPath is prefix, or lies beneath it.
//
// Compares on segment boundaries, not bytes: "/api/v1/posts" must not match a
// route called "/api/v1/postsomething". Plain strings.HasPrefix would, and that
// is the standard way this class of table ends up granting more than it reads
// like it does.
func pathMatchesPrefix(reqPath, prefix string) bool {
	if !strings.HasPrefix(reqPath, prefix) {
		return false
	}
	return len(reqPath) == len(prefix) || reqPath[len(prefix)] == '/'
}

// writeInsufficientScope answers a request the token is not allowed to make.
//
// 403 rather than 401: the token is valid and re-authenticating would not help,
// which is exactly the distinction RFC 6750 §3.1 draws. The scope is named in
// WWW-Authenticate when there is one to name, so a client can tell the user
// what to re-authorize; a denied-outright route names nothing, because there is
// no scope that would have worked.
func writeInsufficientScope(w http.ResponseWriter, scope string) {
	challenge := `Bearer realm="ciel", error="insufficient_scope"`
	if scope != "" {
		challenge += `, scope="` + scope + `"`
	}
	w.Header().Set("WWW-Authenticate", challenge)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)
	_ = json.NewEncoder(w).Encode(api.Error{
		Code:    "insufficient_scope",
		Message: "the access token does not permit this request",
	})
}
