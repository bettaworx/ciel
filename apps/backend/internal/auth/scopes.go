package auth

import (
	"sort"
	"strings"
)

// OAuth2 scopes.
//
// Deliberately coarse. A scope is only useful if the person on the consent
// screen can tell what it means, and a list of thirty is read by nobody — so
// these are grouped by the thing an app touches and split read from write,
// which is the distinction people actually reason about ("it can read my
// timeline" vs "it can post as me").
//
// There is no admin scope, and there is never going to be one here: admin
// endpoints are closed to OAuth tokens outright in the scope middleware, so an
// administrator's bot token is not an administrator. Moderation tooling that
// needs those endpoints belongs on a first-party session.
const (
	ScopeReadAccount       = "read:account"
	ScopeWriteAccount      = "write:account"
	ScopeReadPosts         = "read:posts"
	ScopeWritePosts        = "write:posts"
	ScopeReadNotifications = "read:notifications"
	ScopeWriteNotify       = "write:notifications"
	ScopeWriteFollows      = "write:follows"
	ScopeWriteMedia        = "write:media"
)

// AllScopes is every scope a client may register or request.
var AllScopes = []string{
	ScopeReadAccount,
	ScopeWriteAccount,
	ScopeReadPosts,
	ScopeWritePosts,
	ScopeReadNotifications,
	ScopeWriteNotify,
	ScopeWriteFollows,
	ScopeWriteMedia,
}

var scopeSet = func() map[string]struct{} {
	m := make(map[string]struct{}, len(AllScopes))
	for _, s := range AllScopes {
		m[s] = struct{}{}
	}
	return m
}()

// IsKnownScope reports whether s is a scope this server issues.
func IsKnownScope(s string) bool {
	_, ok := scopeSet[s]
	return ok
}

// ParseScope splits an OAuth2 scope parameter, which RFC 6749 §3.3 defines as a
// space-delimited list. Duplicates are collapsed and the result is sorted, so
// two requests for the same permissions produce the same stored value.
//
// An unknown scope is an error rather than something to drop: silently granting
// less than the client asked for produces a token that fails later, somewhere
// with far less context than the token request.
func ParseScope(raw string) ([]string, bool) {
	fields := strings.Fields(raw)
	if len(fields) == 0 {
		return nil, false
	}
	seen := make(map[string]struct{}, len(fields))
	out := make([]string, 0, len(fields))
	for _, f := range fields {
		if !IsKnownScope(f) {
			return nil, false
		}
		if _, dup := seen[f]; dup {
			continue
		}
		seen[f] = struct{}{}
		out = append(out, f)
	}
	sort.Strings(out)
	return out, true
}

// FormatScope renders scopes back into the space-delimited wire form.
func FormatScope(scopes []string) string {
	return strings.Join(scopes, " ")
}

// HasScope reports whether granted contains want.
func HasScope(granted []string, want string) bool {
	for _, s := range granted {
		if s == want {
			return true
		}
	}
	return false
}

// IsSubset reports whether every scope in want is present in allowed.
//
// Used in two places that must both hold: a client may not request more than it
// registered, and a refresh may not ask for more than the original grant. The
// second is the one that matters — without it a token could widen itself on
// every refresh until it held everything.
func IsSubset(want, allowed []string) bool {
	for _, w := range want {
		if !HasScope(allowed, w) {
			return false
		}
	}
	return true
}
