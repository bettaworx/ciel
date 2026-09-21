//go:build integration
// +build integration

package integration_test

import (
	"crypto/sha256"
	"encoding/base64"
	"net/http"
	"net/url"
	"strings"
	"testing"

	"backend/internal/api"
	"backend/internal/auth"
)

// The full authorization-code flow, end to end through the real router and the
// real middleware stack. The unit tests cover the pieces; this covers that they
// are wired together — in particular that a token issued by /oauth/token is
// actually accepted by the API and is actually limited to its scopes.

const (
	testVerifier    = "abcdefghijklmnopqrstuvwxyz0123456789-._~ABCDEFG"
	testRedirectURI = "https://app.example/callback"
)

func testChallenge() string {
	sum := sha256.Sum256([]byte(testVerifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

// createClient registers an OAuth app as the given user.
func createClient(t *testing.T, app *testApp, authz map[string]string, scopes []string, confidential bool) api.OAuthClientWithSecret {
	t.Helper()
	resp := postJSON(t, app.Server.Client(), app.Server.URL+"/api/v1/me/oauth/clients", map[string]any{
		"name":         "Test App",
		"website":      "https://app.example",
		"redirectUris": []string{testRedirectURI},
		"scopes":       scopes,
		"confidential": confidential,
	}, authz)
	if resp.StatusCode != http.StatusCreated {
		body := decodeJSON[map[string]any](t, resp)
		t.Fatalf("create client: expected 201, got %d (%v)", resp.StatusCode, body)
	}
	return decodeJSON[api.OAuthClientWithSecret](t, resp)
}

// approve drives the consent step and returns the authorization code.
func approve(t *testing.T, app *testApp, authz map[string]string, clientID, scope string) string {
	t.Helper()
	resp := postJSON(t, app.Server.Client(), app.Server.URL+"/api/v1/oauth/authorize", map[string]any{
		"clientId":            clientID,
		"redirectUri":         testRedirectURI,
		"scope":               scope,
		"responseType":        "code",
		"codeChallenge":       testChallenge(),
		"codeChallengeMethod": "S256",
		"state":               "opaque-state",
		"approve":             true,
	}, authz)
	if resp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, resp)
		t.Fatalf("authorize: expected 200, got %d (%v)", resp.StatusCode, body)
	}
	out := decodeJSON[api.OAuthAuthorizeResponse](t, resp)

	u, err := url.Parse(out.RedirectUri)
	if err != nil {
		t.Fatalf("parse redirect: %v", err)
	}
	// state must come back untouched, or a client's CSRF check fails.
	if got := u.Query().Get("state"); got != "opaque-state" {
		t.Fatalf("state = %q, want it echoed verbatim", got)
	}
	code := u.Query().Get("code")
	if code == "" {
		t.Fatalf("no code in redirect %q", out.RedirectUri)
	}
	return code
}

// tokenRequest posts a form to /oauth/token.
func tokenRequest(t *testing.T, app *testApp, form url.Values) (*http.Response, map[string]any) {
	t.Helper()
	resp, err := app.Server.Client().Post(
		app.Server.URL+"/api/v1/oauth/token",
		"application/x-www-form-urlencoded",
		strings.NewReader(form.Encode()),
	)
	if err != nil {
		t.Fatalf("token request: %v", err)
	}
	return resp, decodeJSON[map[string]any](t, resp)
}

func TestOAuth_AuthorizationCodeFlow(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	user := registerUser(t, app.Server.Client(), app.Server.URL, "botowner", "Password123!")
	authz := issueBearer(t, app.TokenManager, user)

	created := createClient(t, app, authz, []string{auth.ScopeReadPosts, auth.ScopeWritePosts}, true)
	if created.ClientSecret == nil || *created.ClientSecret == "" {
		t.Fatal("a confidential client was created without a secret")
	}

	code := approve(t, app, authz, created.Client.ClientId, "read:posts write:posts")

	resp, body := tokenRequest(t, app, url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"redirect_uri":  {testRedirectURI},
		"code_verifier": {testVerifier},
		"client_id":     {created.Client.ClientId},
		"client_secret": {*created.ClientSecret},
	})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("token: expected 200, got %d (%v)", resp.StatusCode, body)
	}
	// RFC 6749 §5.1: a response carrying a bearer token must not be cached.
	if cc := resp.Header.Get("Cache-Control"); cc != "no-store" {
		t.Errorf("Cache-Control = %q, want no-store", cc)
	}

	accessToken, _ := body["access_token"].(string)
	if !strings.HasPrefix(accessToken, "ciel_at_") {
		t.Fatalf("access_token = %q, want the ciel_at_ prefix the middleware keys off", accessToken)
	}
	refreshToken, _ := body["refresh_token"].(string)
	if refreshToken == "" {
		t.Fatal("authorization_code grant returned no refresh token")
	}

	// The token has to actually work against the API, through the same
	// middleware a real request goes through.
	oauthAuthz := map[string]string{"Authorization": "Bearer " + accessToken}
	timelineResp := get(t, app.Server.Client(), app.Server.URL+"/api/v1/timeline", oauthAuthz)
	if timelineResp.StatusCode != http.StatusOK {
		t.Fatalf("GET timeline with read:posts: got %d, want 200", timelineResp.StatusCode)
	}
	_ = timelineResp.Body.Close()
}

// A code is single use whether or not the exchange succeeded, so a second
// attempt must fail even with everything else correct.
func TestOAuth_AuthorizationCodeIsSingleUse(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	user := registerUser(t, app.Server.Client(), app.Server.URL, "botowner", "Password123!")
	authz := issueBearer(t, app.TokenManager, user)
	created := createClient(t, app, authz, []string{auth.ScopeReadPosts}, true)
	code := approve(t, app, authz, created.Client.ClientId, "read:posts")

	form := url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"redirect_uri":  {testRedirectURI},
		"code_verifier": {testVerifier},
		"client_id":     {created.Client.ClientId},
		"client_secret": {*created.ClientSecret},
	}

	resp, body := tokenRequest(t, app, form)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("first exchange: got %d (%v)", resp.StatusCode, body)
	}

	resp2, body2 := tokenRequest(t, app, form)
	if resp2.StatusCode == http.StatusOK {
		t.Fatal("the same authorization code was exchanged twice")
	}
	if body2["error"] != "invalid_grant" {
		t.Errorf("error = %v, want invalid_grant", body2["error"])
	}
}

// A wrong verifier must not be retryable against a live code: the code is
// consumed before it is checked.
func TestOAuth_WrongVerifierBurnsTheCode(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	user := registerUser(t, app.Server.Client(), app.Server.URL, "botowner", "Password123!")
	authz := issueBearer(t, app.TokenManager, user)
	created := createClient(t, app, authz, []string{auth.ScopeReadPosts}, true)
	code := approve(t, app, authz, created.Client.ClientId, "read:posts")

	bad := url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"redirect_uri":  {testRedirectURI},
		"code_verifier": {strings.Repeat("z", 50)},
		"client_id":     {created.Client.ClientId},
		"client_secret": {*created.ClientSecret},
	}
	resp, _ := tokenRequest(t, app, bad)
	if resp.StatusCode == http.StatusOK {
		t.Fatal("a wrong code_verifier was accepted")
	}

	// Now the correct verifier, same code. It must already be gone.
	good := url.Values{}
	for k, v := range bad {
		good[k] = v
	}
	good.Set("code_verifier", testVerifier)
	resp2, body2 := tokenRequest(t, app, good)
	if resp2.StatusCode == http.StatusOK {
		t.Fatal("the code survived a failed exchange and was retryable")
	}
	if body2["error"] != "invalid_grant" {
		t.Errorf("error = %v, want invalid_grant", body2["error"])
	}
}

// Refresh rotates, and replaying a spent refresh token takes the whole grant
// down rather than only failing.
func TestOAuth_RefreshRotationDetectsReuse(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	user := registerUser(t, app.Server.Client(), app.Server.URL, "botowner", "Password123!")
	authz := issueBearer(t, app.TokenManager, user)
	created := createClient(t, app, authz, []string{auth.ScopeReadPosts}, true)
	code := approve(t, app, authz, created.Client.ClientId, "read:posts")

	_, first := tokenRequest(t, app, url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"redirect_uri":  {testRedirectURI},
		"code_verifier": {testVerifier},
		"client_id":     {created.Client.ClientId},
		"client_secret": {*created.ClientSecret},
	})
	oldRefresh, _ := first["refresh_token"].(string)

	refreshForm := url.Values{
		"grant_type":    {"refresh_token"},
		"refresh_token": {oldRefresh},
		"client_id":     {created.Client.ClientId},
		"client_secret": {*created.ClientSecret},
	}

	resp, second := tokenRequest(t, app, refreshForm)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("refresh: got %d (%v)", resp.StatusCode, second)
	}
	newRefresh, _ := second["refresh_token"].(string)
	if newRefresh == "" || newRefresh == oldRefresh {
		t.Fatal("refresh did not rotate the token")
	}
	newAccess, _ := second["access_token"].(string)

	// Replay the spent one.
	resp2, body2 := tokenRequest(t, app, refreshForm)
	if resp2.StatusCode == http.StatusOK {
		t.Fatal("a spent refresh token was accepted")
	}
	if body2["error"] != "invalid_grant" {
		t.Errorf("error = %v, want invalid_grant", body2["error"])
	}

	// The whole grant must be gone, not just the replayed token: there is no
	// way to tell a stolen token from a retried one, and theft is the reading
	// that fails safe.
	replayed := map[string]string{"Authorization": "Bearer " + newAccess}
	after := get(t, app.Server.Client(), app.Server.URL+"/api/v1/timeline", replayed)
	defer func() { _ = after.Body.Close() }()
	if after.StatusCode != http.StatusUnauthorized {
		t.Errorf("access token after reuse detection: got %d, want 401", after.StatusCode)
	}
}

// The scope boundary, exercised through the real stack rather than against the
// table directly.
func TestOAuth_TokenIsLimitedToItsScopes(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	user := registerUser(t, app.Server.Client(), app.Server.URL, "botowner", "Password123!")
	authz := issueBearer(t, app.TokenManager, user)
	created := createClient(t, app, authz, []string{auth.ScopeReadPosts}, true)
	code := approve(t, app, authz, created.Client.ClientId, "read:posts")

	_, body := tokenRequest(t, app, url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"redirect_uri":  {testRedirectURI},
		"code_verifier": {testVerifier},
		"client_id":     {created.Client.ClientId},
		"client_secret": {*created.ClientSecret},
	})
	accessToken, _ := body["access_token"].(string)
	oauthAuthz := map[string]string{"Authorization": "Bearer " + accessToken}

	// In scope.
	ok := get(t, app.Server.Client(), app.Server.URL+"/api/v1/timeline", oauthAuthz)
	if ok.StatusCode != http.StatusOK {
		t.Errorf("GET timeline: got %d, want 200", ok.StatusCode)
	}
	_ = ok.Body.Close()

	// Out of scope: read:posts does not carry write:posts.
	posted := postJSON(t, app.Server.Client(), app.Server.URL+"/api/v1/posts",
		map[string]any{"content": "hello"}, oauthAuthz)
	defer func() { _ = posted.Body.Close() }()
	if posted.StatusCode != http.StatusForbidden {
		t.Errorf("POST posts without write:posts: got %d, want 403", posted.StatusCode)
	}

	// Closed outright, whatever the scopes: the owner's admin powers are not
	// the app's, and managing apps over OAuth would let a token widen itself.
	for _, path := range []string{"/api/v1/admin/users", "/api/v1/me/oauth/clients"} {
		resp := get(t, app.Server.Client(), app.Server.URL+path, oauthAuthz)
		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("GET %s with an OAuth token: got %d, want 403", path, resp.StatusCode)
		}
		_ = resp.Body.Close()
	}
}

// client_credentials acts as the client's owner and, per RFC 6749 §4.4.3, gets
// no refresh token.
func TestOAuth_ClientCredentials(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	user := registerUser(t, app.Server.Client(), app.Server.URL, "botowner", "Password123!")
	authz := issueBearer(t, app.TokenManager, user)
	created := createClient(t, app, authz, []string{auth.ScopeReadPosts}, true)

	resp, body := tokenRequest(t, app, url.Values{
		"grant_type":    {"client_credentials"},
		"client_id":     {created.Client.ClientId},
		"client_secret": {*created.ClientSecret},
	})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("client_credentials: got %d (%v)", resp.StatusCode, body)
	}
	if _, present := body["refresh_token"]; present {
		t.Error("client_credentials returned a refresh token")
	}

	accessToken, _ := body["access_token"].(string)
	meResp := get(t, app.Server.Client(), app.Server.URL+"/api/v1/timeline",
		map[string]string{"Authorization": "Bearer " + accessToken})
	defer func() { _ = meResp.Body.Close() }()
	if meResp.StatusCode != http.StatusOK {
		t.Errorf("client_credentials token rejected by the API: got %d", meResp.StatusCode)
	}
}

// A public client has no secret to authenticate with, so it must not be able to
// use client_credentials at all.
func TestOAuth_PublicClientCannotUseClientCredentials(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	user := registerUser(t, app.Server.Client(), app.Server.URL, "botowner", "Password123!")
	authz := issueBearer(t, app.TokenManager, user)
	created := createClient(t, app, authz, []string{auth.ScopeReadPosts}, false)
	if created.ClientSecret != nil {
		t.Fatal("a public client was issued a secret")
	}

	resp, body := tokenRequest(t, app, url.Values{
		"grant_type": {"client_credentials"},
		"client_id":  {created.Client.ClientId},
	})
	if resp.StatusCode == http.StatusOK {
		t.Fatal("a public client obtained a client_credentials token")
	}
	if body["error"] != "invalid_client" {
		t.Errorf("error = %v, want invalid_client", body["error"])
	}
}

// Revocation, and the RFC 7009 rule that an unknown token still answers 200 so
// the endpoint cannot be used to test whether a string is live.
func TestOAuth_Revoke(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	user := registerUser(t, app.Server.Client(), app.Server.URL, "botowner", "Password123!")
	authz := issueBearer(t, app.TokenManager, user)
	created := createClient(t, app, authz, []string{auth.ScopeReadPosts}, true)
	code := approve(t, app, authz, created.Client.ClientId, "read:posts")

	_, body := tokenRequest(t, app, url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"redirect_uri":  {testRedirectURI},
		"code_verifier": {testVerifier},
		"client_id":     {created.Client.ClientId},
		"client_secret": {*created.ClientSecret},
	})
	accessToken, _ := body["access_token"].(string)

	revokeResp, err := app.Server.Client().Post(
		app.Server.URL+"/api/v1/oauth/revoke",
		"application/x-www-form-urlencoded",
		strings.NewReader(url.Values{
			"token":         {accessToken},
			"client_id":     {created.Client.ClientId},
			"client_secret": {*created.ClientSecret},
		}.Encode()),
	)
	if err != nil {
		t.Fatalf("revoke: %v", err)
	}
	_ = revokeResp.Body.Close()
	if revokeResp.StatusCode != http.StatusOK {
		t.Fatalf("revoke: got %d, want 200", revokeResp.StatusCode)
	}

	after := get(t, app.Server.Client(), app.Server.URL+"/api/v1/timeline",
		map[string]string{"Authorization": "Bearer " + accessToken})
	defer func() { _ = after.Body.Close() }()
	if after.StatusCode != http.StatusUnauthorized {
		t.Errorf("revoked token still works: got %d, want 401", after.StatusCode)
	}

	// An unknown token is not an error: saying so would make this an oracle.
	unknownResp, err := app.Server.Client().Post(
		app.Server.URL+"/api/v1/oauth/revoke",
		"application/x-www-form-urlencoded",
		strings.NewReader(url.Values{
			"token":         {"ciel_at_not-a-real-token"},
			"client_id":     {created.Client.ClientId},
			"client_secret": {*created.ClientSecret},
		}.Encode()),
	)
	if err != nil {
		t.Fatalf("revoke unknown: %v", err)
	}
	_ = unknownResp.Body.Close()
	if unknownResp.StatusCode != http.StatusOK {
		t.Errorf("revoking an unknown token: got %d, want 200", unknownResp.StatusCode)
	}
}

// Disconnecting an app from Settings must actually stop its tokens working.
func TestOAuth_RevokeAuthorizationDisconnectsTheApp(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	user := registerUser(t, app.Server.Client(), app.Server.URL, "botowner", "Password123!")
	authz := issueBearer(t, app.TokenManager, user)
	created := createClient(t, app, authz, []string{auth.ScopeReadPosts}, true)
	code := approve(t, app, authz, created.Client.ClientId, "read:posts")

	_, body := tokenRequest(t, app, url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"redirect_uri":  {testRedirectURI},
		"code_verifier": {testVerifier},
		"client_id":     {created.Client.ClientId},
		"client_secret": {*created.ClientSecret},
	})
	accessToken, _ := body["access_token"].(string)

	listed := get(t, app.Server.Client(), app.Server.URL+"/api/v1/me/oauth/authorizations", authz)
	page := decodeJSON[api.OAuthAuthorizationPage](t, listed)
	if len(page.Items) != 1 {
		t.Fatalf("connected apps = %d, want 1", len(page.Items))
	}

	req, err := http.NewRequest(http.MethodDelete,
		app.Server.URL+"/api/v1/me/oauth/authorizations/"+url.PathEscape(created.Client.ClientId), nil)
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	for k, v := range authz {
		req.Header.Set(k, v)
	}
	delResp, err := app.Server.Client().Do(req)
	if err != nil {
		t.Fatalf("disconnect: %v", err)
	}
	_ = delResp.Body.Close()
	if delResp.StatusCode != http.StatusNoContent {
		t.Fatalf("disconnect: got %d, want 204", delResp.StatusCode)
	}

	after := get(t, app.Server.Client(), app.Server.URL+"/api/v1/timeline",
		map[string]string{"Authorization": "Bearer " + accessToken})
	defer func() { _ = after.Body.Close() }()
	if after.StatusCode != http.StatusUnauthorized {
		t.Errorf("token after disconnect: got %d, want 401", after.StatusCode)
	}
}

// A redirect_uri that was not registered must be refused before the user is
// shown anything, because redirecting to an unverified URI to report the error
// is itself the open redirect.
func TestOAuth_UnregisteredRedirectURIIsRefused(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	user := registerUser(t, app.Server.Client(), app.Server.URL, "botowner", "Password123!")
	authz := issueBearer(t, app.TokenManager, user)
	created := createClient(t, app, authz, []string{auth.ScopeReadPosts}, true)

	resp := postJSON(t, app.Server.Client(), app.Server.URL+"/api/v1/oauth/authorize", map[string]any{
		"clientId":            created.Client.ClientId,
		"redirectUri":         "https://evil.example/callback",
		"scope":               "read:posts",
		"responseType":        "code",
		"codeChallenge":       testChallenge(),
		"codeChallengeMethod": "S256",
		"approve":             true,
	}, authz)
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("unregistered redirect_uri: got %d, want 400", resp.StatusCode)
	}
}
