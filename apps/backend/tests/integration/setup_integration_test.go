//go:build integration
// +build integration

package integration_test

import (
	"context"
	"net/http"
	"testing"

	"backend/internal/api"
)

// The setup wizard reloads right after creating the admin and expects to be
// signed in, so create-admin has to leave the same cookies a password login
// does. Without them the wizard bounces to /login halfway through setup.
func TestIntegration_Setup_CreateAdmin_SignsIn(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	setupToken, err := app.SetupTokens.GenerateSetupToken(context.Background())
	if err != nil {
		t.Fatalf("GenerateSetupToken: %v", err)
	}

	resp := postJSON(t, client, base+"/api/v1/setup/create-admin", map[string]any{
		"setupToken": setupToken,
		"username":   "admin",
		"password":   "Password123",
	}, nil)
	if resp.StatusCode != http.StatusCreated {
		errBody := decodeJSON[map[string]any](t, resp)
		t.Fatalf("create-admin: expected 201, got %d (%v)", resp.StatusCode, errBody)
	}
	created := decodeJSON[api.CreateAdminResponse](t, resp)
	if created.User.Username != "admin" || created.Token == "" {
		t.Fatalf("create-admin: unexpected body %+v", created)
	}

	cookies := map[string]*http.Cookie{}
	for _, c := range resp.Cookies() {
		cookies[c.Name] = c
	}
	authCookie, refreshCookie := cookies["ciel_auth"], cookies["ciel_refresh"]
	if authCookie == nil || authCookie.Value == "" || !authCookie.HttpOnly {
		t.Fatalf("create-admin: expected an HttpOnly ciel_auth cookie, got %+v", authCookie)
	}
	if refreshCookie == nil || refreshCookie.Value == "" || !refreshCookie.HttpOnly {
		t.Fatalf("create-admin: expected an HttpOnly ciel_refresh cookie, got %+v", refreshCookie)
	}

	// The cookie alone, as the reloaded page sends it.
	meReq, _ := http.NewRequest(http.MethodGet, base+"/api/v1/me", nil)
	meReq.AddCookie(&http.Cookie{Name: authCookie.Name, Value: authCookie.Value})
	meResp, err := client.Do(meReq)
	if err != nil {
		t.Fatalf("me: %v", err)
	}
	if meResp.StatusCode != http.StatusOK {
		t.Fatalf("me with setup cookie: expected 200, got %d", meResp.StatusCode)
	}
	me := decodeJSON[api.User](t, meResp)
	if me.Id != created.User.Id {
		t.Fatalf("me: expected %s, got %s", created.User.Id, me.Id)
	}

	// The refresh token is a real session row, so the admin stays signed in
	// past the access token's lifetime.
	refreshReq, _ := http.NewRequest(http.MethodPost, base+"/api/v1/auth/refresh", nil)
	refreshReq.AddCookie(&http.Cookie{Name: refreshCookie.Name, Value: refreshCookie.Value})
	refreshResp, err := client.Do(refreshReq)
	if err != nil {
		t.Fatalf("refresh: %v", err)
	}
	defer refreshResp.Body.Close()
	if refreshResp.StatusCode != http.StatusOK {
		t.Fatalf("refresh with setup cookie: expected 200, got %d", refreshResp.StatusCode)
	}
}
