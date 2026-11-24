//go:build integration

package integration_test

import (
	"context"
	"encoding/base64"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/tests/testutil"
)

func setupPasskey(t *testing.T, username string) (*testApp, api.User, testutil.Passkey, api.WebAuthnCredential, map[string]string) {
	t.Helper()
	app := newTestAppWithMFA(t)
	t.Cleanup(app.Close)
	wa, err := auth.NewWebAuthn(auth.WebAuthnConfig{RPDisplayName: "Ciel", RPID: "localhost", RPOrigins: []string{app.Server.URL}})
	if err != nil {
		t.Fatal(err)
	}
	app.Auth.SetMFA(nil, auth.NewRedisMfaSessionStore(app.RDB, time.Minute), nil, wa,
		auth.NewRedisWebAuthnSessionStore(app.RDB, time.Minute), nil, "")
	client, base := app.Server.Client(), app.Server.URL
	user := registerUser(t, client, base, username, "Password123")
	headers := stepupHeaders(t, app, issueBearer(t, app.TokenManager, user), username, "Password123")

	// Opt-in requires a registered key, and is off for existing accounts.
	status := decodeJSON[api.MfaStatus](t, get(t, client, base+"/api/v1/auth/mfa", headers))
	if status.PasskeyLoginEnabled {
		t.Fatal("passkey login was enabled by default")
	}
	requirePasskeyStatus(t, putJSON(t, client, base+"/api/v1/auth/mfa/passkey-login", map[string]any{"enabled": true}, headers), http.StatusBadRequest)

	key := testutil.NewPasskey(t)
	options := decodeJSON[api.WebAuthnRegisterOptionsResponse](t, postJSON(t, client, base+"/api/v1/auth/mfa/webauthn/register/options", nil, headers))
	selection := options.Options["publicKey"].(map[string]interface{})["authenticatorSelection"].(map[string]interface{})
	if selection["residentKey"] != "preferred" {
		t.Fatalf("registration should request a discoverable credential: %v", selection)
	}
	response := postJSON(t, client, base+"/api/v1/auth/mfa/webauthn/register/verify", api.WebAuthnRegisterVerifyRequest{
		SessionId: options.SessionId, Credential: key.Registration(t, options.Options, base, "localhost"), Name: "Test passkey",
	}, headers)
	if response.StatusCode != http.StatusCreated {
		t.Fatalf("registration failed: %v", decodeJSON[map[string]any](t, response))
	}
	registered := decodeJSON[api.WebAuthnRegisterVerifyResponse](t, response)
	return app, user, key, registered.Credential, headers
}

func requirePasskeyStatus(t *testing.T, response *http.Response, expected int) {
	t.Helper()
	defer response.Body.Close()
	if response.StatusCode != expected {
		body, _ := io.ReadAll(response.Body)
		t.Fatalf("expected %d, got %d: %s", expected, response.StatusCode, body)
	}
}

func passkeyOptions(t *testing.T, app *testApp) api.WebAuthnAssertionOptionsResponse {
	t.Helper()
	response := postJSON(t, app.Server.Client(), app.Server.URL+"/api/v1/auth/login/passkey/options", nil, nil)
	if response.StatusCode != http.StatusOK {
		t.Fatalf("options failed: %d", response.StatusCode)
	}
	if response.Header.Get("Cache-Control") != "no-store" {
		t.Fatal("ceremony response can be cached")
	}
	options := decodeJSON[api.WebAuthnAssertionOptionsResponse](t, response)
	pk := options.Options["publicKey"].(map[string]interface{})
	if pk["userVerification"] != "required" {
		t.Fatal("missing required user verification")
	}
	if _, ok := pk["allowCredentials"]; ok {
		t.Fatal("options disclosed credential IDs")
	}
	return options
}

func TestIntegration_PasskeyLogin_E2E(t *testing.T) {
	app, user, key, _, headers := setupPasskey(t, "passkey_login")
	client, base := app.Server.Client(), app.Server.URL
	verify := func(options api.WebAuthnAssertionOptionsResponse, count uint32) *http.Response {
		return postJSON(t, client, base+"/api/v1/auth/login/passkey/verify", api.PasskeyLoginVerifyRequest{
			SessionId: options.SessionId, Credential: key.Assertion(t, options.Options, user.Id, base, "localhost", count, 5),
		}, nil)
	}
	options := passkeyOptions(t, app)
	requirePasskeyStatus(t, verify(options, 1), http.StatusUnauthorized)
	requirePasskeyStatus(t, putJSON(t, client, base+"/api/v1/auth/mfa/passkey-login", map[string]any{"enabled": true}, headers), http.StatusNoContent)

	options = passkeyOptions(t, app)
	response := verify(options, 1)
	if response.StatusCode != http.StatusOK {
		t.Fatalf("passkey login failed: %v", decodeJSON[map[string]any](t, response))
	}
	cookies := response.Cookies()
	login := decodeJSON[api.LoginAuthenticated](t, response)
	if login.User.Id != user.Id || login.AccessToken == "" {
		t.Fatal("incorrect authenticated account")
	}
	seenAuth, seenRefresh := false, false
	for _, cookie := range cookies {
		if !cookie.HttpOnly {
			t.Fatal("session cookie is not HttpOnly")
		}
		if cookie.Name == "ciel_auth" {
			seenAuth = true
		}
		if cookie.Name == "ciel_refresh" {
			seenRefresh = true
		}
	}
	if !seenAuth || !seenRefresh {
		t.Fatal("missing authentication/refresh cookies")
	}
	claims, err := app.TokenManager.Parse(login.AccessToken)
	if err != nil || claims.ID != user.Id {
		t.Fatalf("invalid access token: %v", err)
	}
	requirePasskeyStatus(t, verify(options, 2), http.StatusUnauthorized)

	// Opting out also invalidates ceremonies started while opted in.
	options = passkeyOptions(t, app)
	requirePasskeyStatus(t, putJSON(t, client, base+"/api/v1/auth/mfa/passkey-login", map[string]any{"enabled": false}, headers), http.StatusNoContent)
	requirePasskeyStatus(t, verify(options, 2), http.StatusUnauthorized)
	var count int64
	if err := app.SQLDB.QueryRowContext(context.Background(), "SELECT sign_count FROM auth_webauthn_credentials WHERE user_id = $1", user.Id).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Fatalf("failed logins changed the counter: %d", count)
	}
}

func TestIntegration_PasskeyLogin_PrivacyAndAuthorization(t *testing.T) {
	app, user, key, _, headers := setupPasskey(t, "passkey_private")
	client, base := app.Server.Client(), app.Server.URL
	requirePasskeyStatus(t, get(t, client, base+"/api/v1/auth/mfa", nil), http.StatusUnauthorized)
	requirePasskeyStatus(t, putJSON(t, client, base+"/api/v1/auth/mfa/passkey-login", map[string]any{"enabled": true}, nil), http.StatusUnauthorized)
	requirePasskeyStatus(t, putJSON(t, client, base+"/api/v1/auth/mfa/passkey-login", map[string]any{"enabled": true}, map[string]string{"Authorization": headers["Authorization"]}), http.StatusUnauthorized)
	requirePasskeyStatus(t, putJSON(t, client, base+"/api/v1/auth/mfa/passkey-login", map[string]any{}, headers), http.StatusBadRequest)

	var previous string
	for _, enabled := range []bool{false, true} {
		requirePasskeyStatus(t, putJSON(t, client, base+"/api/v1/auth/mfa/passkey-login", map[string]any{"enabled": enabled}, headers), http.StatusNoContent)
		statusResponse := get(t, client, base+"/api/v1/auth/mfa", headers)
		if statusResponse.Header.Get("Cache-Control") != "no-store" {
			t.Fatal("private status can be cached")
		}
		if status := decodeJSON[api.MfaStatus](t, statusResponse); status.PasskeyLoginEnabled != enabled {
			t.Fatal("incorrect owner preference")
		}
		profile := get(t, client, base+"/api/v1/users/passkey_private", nil)
		data, err := io.ReadAll(profile.Body)
		_ = profile.Body.Close()
		if err != nil {
			t.Fatal(err)
		}
		if strings.Contains(strings.ToLower(string(data)), "passkeyloginenabled") {
			t.Fatal("private preference leaked in public profile")
		}

		options := passkeyOptions(t, app)
		credential := key.Assertion(t, options.Options, user.Id, base, "localhost", 1, 5)
		credential["response"].(map[string]interface{})["signature"] = base64.RawURLEncoding.EncodeToString([]byte("invalid"))
		response := postJSON(t, client, base+"/api/v1/auth/login/passkey/verify", api.PasskeyLoginVerifyRequest{SessionId: options.SessionId, Credential: credential}, nil)
		if response.StatusCode != http.StatusUnauthorized || len(response.Cookies()) != 0 {
			t.Fatal("invalid signature accepted")
		}
		body, err := io.ReadAll(response.Body)
		_ = response.Body.Close()
		if err != nil {
			t.Fatal(err)
		}
		if previous != "" && previous != string(body) {
			t.Fatalf("opt-in leaked through error response: %q vs %q", previous, body)
		}
		previous = string(body)
	}
	// Another user's session and step-up cannot modify this user's preference.
	other := registerUser(t, client, base, "passkey_other", "Password123")
	otherHeaders := stepupHeaders(t, app, issueBearer(t, app.TokenManager, other), "passkey_other", "Password123")
	requirePasskeyStatus(t, putJSON(t, client, base+"/api/v1/auth/mfa/passkey-login", map[string]any{"enabled": false, "userId": user.Id}, otherHeaders), http.StatusNoContent)
	status := decodeJSON[api.MfaStatus](t, get(t, client, base+"/api/v1/auth/mfa", headers))
	if !status.PasskeyLoginEnabled {
		t.Fatal("another account changed the private preference")
	}
}

func TestIntegration_PasskeyLogin_CredentialRemoval(t *testing.T) {
	for _, scenario := range []string{"last_key", "disable_all", "admin_reset"} {
		t.Run(scenario, func(t *testing.T) {
			app, user, _, credential, headers := setupPasskey(t, "passkey_remove")
			client, base := app.Server.Client(), app.Server.URL
			requirePasskeyStatus(t, putJSON(t, client, base+"/api/v1/auth/mfa/passkey-login", map[string]any{"enabled": true}, headers), http.StatusNoContent)
			switch scenario {
			case "last_key":
				requirePasskeyStatus(t, deleteReq(t, client, base+"/api/v1/auth/mfa/webauthn/credentials/"+credential.Id.String(), headers), http.StatusNoContent)
			case "disable_all":
				requirePasskeyStatus(t, postJSON(t, client, base+"/api/v1/auth/mfa/disable", nil, headers), http.StatusNoContent)
			case "admin_reset":
				if err := app.Auth.ResetUserMFA(context.Background(), auth.User{ID: user.Id}, user.Id); err != nil {
					t.Fatal(err)
				}
			}
			status, err := app.Auth.GetMfaStatus(context.Background(), auth.User{ID: user.Id})
			if err != nil {
				t.Fatal(err)
			}
			if status.PasskeyLoginEnabled || len(status.WebauthnCredentials) != 0 {
				t.Fatal("credential reset did not clear opt-in")
			}
		})
	}
}
