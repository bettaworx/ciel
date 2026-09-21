package service

import "testing"

// redirect_uri matching is the single check standing between an authorization
// code and whoever asked for it to be delivered somewhere else. It is tested
// in-package because the predicate is unexported and is the thing worth
// pinning, not the handler around it.

func TestRedirectURIAllowed_ExactMatch(t *testing.T) {
	registered := []string{"https://app.example/callback"}

	if !redirectURIAllowed("https://app.example/callback", registered) {
		t.Error("the registered URI was rejected")
	}
	if redirectURIAllowed("", registered) {
		t.Error("an empty redirect_uri was accepted")
	}
}

// Every one of these is a real-world way an open redirect gets in. A prefix or
// "starts with" comparison accepts most of them.
func TestRedirectURIAllowed_RejectsNearMisses(t *testing.T) {
	registered := []string{"https://app.example/callback"}

	attempts := []struct {
		name string
		uri  string
	}{
		{"appended path", "https://app.example/callback/evil"},
		{"appended query", "https://app.example/callback?next=https://evil.example"},
		{"different host", "https://evil.example/callback"},
		{"host prefix", "https://app.example.evil.example/callback"},
		{"userinfo trick", "https://app.example@evil.example/callback"},
		{"scheme downgrade", "http://app.example/callback"},
		{"different port", "https://app.example:8443/callback"},
		{"trailing slash", "https://app.example/callback/"},
		{"case-changed path", "https://app.example/CALLBACK"},
		{"fragment appended", "https://app.example/callback#x"},
	}
	for _, tc := range attempts {
		if redirectURIAllowed(tc.uri, registered) {
			t.Errorf("%s: %q was accepted against %q", tc.name, tc.uri, registered[0])
		}
	}
}

// RFC 8252 §7.3: a native app listens on an ephemeral loopback port it cannot
// know at registration time, so the port — and only the port — is ignored.
func TestRedirectURIAllowed_LoopbackIgnoresPort(t *testing.T) {
	registered := []string{"http://127.0.0.1:1234/cb"}

	for _, uri := range []string{
		"http://127.0.0.1:1234/cb",
		"http://127.0.0.1:55871/cb",
		"http://127.0.0.1/cb",
	} {
		if !redirectURIAllowed(uri, registered) {
			t.Errorf("%q rejected; loopback port must be ignored", uri)
		}
	}

	// Everything else about the URI must still match exactly.
	for _, uri := range []string{
		"http://127.0.0.1:1234/other",
		"http://127.0.0.2:1234/cb",
		"https://127.0.0.1:1234/cb",
		"http://evil.example:1234/cb",
		"http://127.0.0.1:1234/cb?x=1",
	} {
		if redirectURIAllowed(uri, registered) {
			t.Errorf("%q accepted; only the port may differ for loopback", uri)
		}
	}
}

func TestRedirectURIAllowed_IPv6Loopback(t *testing.T) {
	registered := []string{"http://[::1]:1234/cb"}

	if !redirectURIAllowed("http://[::1]:9999/cb", registered) {
		t.Error("IPv6 loopback with a different port was rejected")
	}
	if redirectURIAllowed("http://[::2]:1234/cb", registered) {
		t.Error("a non-loopback IPv6 host was accepted")
	}
}

// The port exemption must not leak to ordinary hosts: "localhost" is a name,
// not a loopback literal, and treating any http host as loopback would let a
// plaintext redirect through.
func TestRedirectURIAllowed_PortExemptionIsLoopbackOnly(t *testing.T) {
	registered := []string{"https://app.example:443/cb"}
	if redirectURIAllowed("https://app.example:8443/cb", registered) {
		t.Error("the loopback port exemption leaked to a normal host")
	}
}

func TestValidateRedirectURIs(t *testing.T) {
	cases := []struct {
		name string
		uris []string
		ok   bool
	}{
		{"https", []string{"https://app.example/cb"}, true},
		{"loopback http", []string{"http://127.0.0.1:1234/cb"}, true},
		{"ipv6 loopback http", []string{"http://[::1]/cb"}, true},
		{"plain http to a host", []string{"http://app.example/cb"}, false},
		{"localhost by name is not a loopback literal", []string{"http://localhost:1234/cb"}, false},
		{"relative", []string{"/cb"}, false},
		{"fragment", []string{"https://app.example/cb#frag"}, false},
		{"empty list", nil, false},
		{"too many", []string{
			"https://a.example/cb", "https://b.example/cb", "https://c.example/cb",
			"https://d.example/cb", "https://e.example/cb", "https://f.example/cb",
		}, false},
	}
	for _, tc := range cases {
		err := validateRedirectURIs(tc.uris)
		if tc.ok && err != nil {
			t.Errorf("%s: rejected with %v", tc.name, err)
		}
		if !tc.ok && err == nil {
			t.Errorf("%s: accepted, want rejected", tc.name)
		}
	}
}

// Token prefixes are what let the auth middleware tell an opaque OAuth token
// from a session JWT before validating either. They are duplicated in the
// middleware package to keep service free of a dependency on it, so pin that
// the two agree on the value.
func TestAccessTokenPrefixIsDistinct(t *testing.T) {
	if AccessTokenPrefix == RefreshTokenPrefix {
		t.Fatal("access and refresh tokens share a prefix; they must be distinguishable")
	}
	if AccessTokenPrefix == "" || RefreshTokenPrefix == "" {
		t.Fatal("token prefixes must not be empty")
	}
}
