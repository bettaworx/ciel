package auth_test

import (
	"crypto/sha256"
	"encoding/base64"
	"strings"
	"testing"

	"backend/internal/auth"
)

// challengeFor builds the S256 challenge for a verifier the way a correct
// client would, so the happy path is not testing the implementation against
// itself.
func challengeFor(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

const goodVerifier = "abcdefghijklmnopqrstuvwxyz0123456789-._~ABCDEFG"

func TestVerifyPKCE_AcceptsMatchingVerifier(t *testing.T) {
	if !auth.VerifyPKCE(goodVerifier, challengeFor(goodVerifier)) {
		t.Fatal("correct verifier rejected")
	}
}

func TestVerifyPKCE_RejectsWrongVerifier(t *testing.T) {
	other := strings.Repeat("z", 50)
	if auth.VerifyPKCE(other, challengeFor(goodVerifier)) {
		t.Fatal("wrong verifier accepted")
	}
}

// The "plain" method is not implemented, so handing the verifier over as its
// own challenge — which is exactly what plain does — must fail.
func TestVerifyPKCE_RejectsPlainStyleChallenge(t *testing.T) {
	if auth.VerifyPKCE(goodVerifier, goodVerifier) {
		t.Fatal("plain-style challenge accepted; only S256 is supported")
	}
}

func TestVerifyPKCE_RejectsEmpty(t *testing.T) {
	if auth.VerifyPKCE("", challengeFor(goodVerifier)) {
		t.Error("empty verifier accepted")
	}
	if auth.VerifyPKCE(goodVerifier, "") {
		t.Error("empty challenge accepted")
	}
}

// The length floor is what carries the entropy: a short verifier hashes and
// compares perfectly well while being trivially brute-forced from the
// challenge, so it has to be refused before it is compared.
func TestVerifyPKCE_RejectsShortVerifier(t *testing.T) {
	short := "tooshort"
	if auth.VerifyPKCE(short, challengeFor(short)) {
		t.Fatal("a verifier below the RFC 7636 minimum length was accepted")
	}
}

func TestValidPKCEVerifier_Grammar(t *testing.T) {
	cases := []struct {
		name     string
		verifier string
		want     bool
	}{
		{"minimum length", strings.Repeat("a", 43), true},
		{"maximum length", strings.Repeat("a", 128), true},
		{"one below minimum", strings.Repeat("a", 42), false},
		{"one above maximum", strings.Repeat("a", 129), false},
		{"all unreserved characters", goodVerifier, true},
		{"slash is not unreserved", strings.Repeat("a", 42) + "/", false},
		{"plus is not unreserved", strings.Repeat("a", 42) + "+", false},
		{"space", strings.Repeat("a", 42) + " ", false},
	}
	for _, tc := range cases {
		if got := auth.ValidPKCEVerifier(tc.verifier); got != tc.want {
			t.Errorf("%s: ValidPKCEVerifier = %v, want %v", tc.name, got, tc.want)
		}
	}
}

func TestValidPKCEChallenge(t *testing.T) {
	if !auth.ValidPKCEChallenge(challengeFor(goodVerifier)) {
		t.Error("a real S256 challenge was rejected")
	}
	for _, bad := range []string{"", "short", strings.Repeat("a", 42), strings.Repeat("a", 44), strings.Repeat("!", 43)} {
		if auth.ValidPKCEChallenge(bad) {
			t.Errorf("malformed challenge %q accepted", bad)
		}
	}
}

func TestParseScope(t *testing.T) {
	got, ok := auth.ParseScope("write:posts read:posts")
	if !ok {
		t.Fatal("valid scope string rejected")
	}
	// Sorted, so the same permissions always store the same value.
	if len(got) != 2 || got[0] != "read:posts" || got[1] != "write:posts" {
		t.Errorf("ParseScope = %v, want sorted [read:posts write:posts]", got)
	}
}

func TestParseScope_CollapsesDuplicates(t *testing.T) {
	got, ok := auth.ParseScope("read:posts read:posts read:posts")
	if !ok || len(got) != 1 {
		t.Errorf("ParseScope = %v (ok=%v), want one entry", got, ok)
	}
}

// An unknown scope is refused rather than dropped. Silently granting less than
// was asked for produces a token that fails later, far from this decision.
func TestParseScope_RejectsUnknownScope(t *testing.T) {
	for _, raw := range []string{"read:everything", "read:posts admin:all", "", "   "} {
		if _, ok := auth.ParseScope(raw); ok {
			t.Errorf("ParseScope(%q) accepted", raw)
		}
	}
}

func TestParseScope_RejectsAdminScope(t *testing.T) {
	// There is no admin scope and there must not be one: admin endpoints are
	// closed to OAuth outright, so a token claiming one would be misleading.
	if _, ok := auth.ParseScope("admin:all"); ok {
		t.Fatal("an admin scope was accepted")
	}
}

func TestIsSubset(t *testing.T) {
	allowed := []string{auth.ScopeReadPosts, auth.ScopeWritePosts}

	if !auth.IsSubset([]string{auth.ScopeReadPosts}, allowed) {
		t.Error("a narrower set was not recognised as a subset")
	}
	if !auth.IsSubset(allowed, allowed) {
		t.Error("an identical set was not recognised as a subset")
	}
	// This is the check that stops a refresh from widening a grant.
	if auth.IsSubset([]string{auth.ScopeReadPosts, auth.ScopeWriteMedia}, allowed) {
		t.Error("a wider set was accepted as a subset")
	}
}

func TestAllScopesAreKnown(t *testing.T) {
	for _, s := range auth.AllScopes {
		if !auth.IsKnownScope(s) {
			t.Errorf("%q is in AllScopes but IsKnownScope says otherwise", s)
		}
	}
	if auth.IsKnownScope("read:everything") {
		t.Error("an invented scope was reported as known")
	}
}

func TestFormatScopeRoundTrips(t *testing.T) {
	parsed, ok := auth.ParseScope(auth.FormatScope(auth.AllScopes))
	if !ok {
		t.Fatal("FormatScope produced something ParseScope rejects")
	}
	if len(parsed) != len(auth.AllScopes) {
		t.Errorf("round trip lost scopes: %d in, %d out", len(auth.AllScopes), len(parsed))
	}
}
