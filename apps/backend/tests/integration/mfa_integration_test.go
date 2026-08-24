//go:build integration
// +build integration

package integration_test

import (
	"context"
	"net/http"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/db/sqlc"
)

// newTestAppWithMFA builds the standard test app and wires MFA dependencies
// with deterministic test keys and in-process session stores.
func newTestAppWithMFA(t *testing.T) *testApp {
	t.Helper()
	app := newTestApp(t)

	key := make([]byte, 32)
	for i := range key {
		key[i] = byte(i + 7)
	}
	box, err := auth.NewSecretBox(key)
	if err != nil {
		t.Fatalf("NewSecretBox: %v", err)
	}

	waCfg := auth.WebAuthnConfig{
		RPDisplayName: "Ciel",
		RPID:          "localhost",
		RPOrigins:     []string{app.Server.URL},
	}
	wa, err := auth.NewWebAuthn(waCfg)
	if err != nil {
		t.Fatalf("NewWebAuthn: %v", err)
	}

	app.Auth.SetMFA(
		box,
		auth.NewMemoryMfaSessionStore(),
		auth.NewMemoryTotpSetupStore(),
		wa,
		auth.NewMemoryWebAuthnSessionStore(),
		"Ciel",
	)
	return app
}

// stepupToken performs a full SCRAM step-up and returns the short-lived token.
// Fails the test if the account unexpectedly requires MFA.
func stepupToken(t *testing.T, app *testApp, authz map[string]string, username, password string) string {
	t.Helper()
	union := performStepup(t, app, authz, username, password)
	authed, err := union.AsStepupAuthenticated()
	if err != nil {
		t.Fatalf("expected step-up authenticated, got mfa_required or error: %v", err)
	}
	return authed.StepupToken
}

// performStepup runs the SCRAM step-up flow and returns the raw union response.
func performStepup(t *testing.T, app *testApp, authz map[string]string, username, password string) api.StepupFinishResponse {
	t.Helper()
	client := app.Server.Client()
	base := app.Server.URL

	clientNonce := "stepup-cnonce-" + username
	startResp := postJSON(t, client, base+"/api/v1/auth/stepup/start", api.StepupStartRequest{
		ClientNonce: clientNonce,
	}, authz)
	if startResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, startResp)
		t.Fatalf("stepup start: expected 200, got %d (%v)", startResp.StatusCode, body)
	}
	start := decodeJSON[api.StepupStartResponse](t, startResp)

	finalNonce, proof := computeClientProofB64(t, username, password, clientNonce, start.ServerNonce, start.Salt, start.Iterations)
	finishResp := postJSON(t, client, base+"/api/v1/auth/stepup/finish", api.StepupFinishRequest{
		StepupSessionId:  start.StepupSessionId,
		ClientFinalNonce: finalNonce,
		ClientProof:      proof,
	}, authz)
	if finishResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, finishResp)
		t.Fatalf("stepup finish: expected 200, got %d (%v)", finishResp.StatusCode, body)
	}
	return decodeJSON[api.StepupFinishResponse](t, finishResp)
}

// totpCodeFromSecret derives the current 6-digit code for a base32 secret.
func totpCodeFromSecret(t *testing.T, secretB32 string) string {
	t.Helper()
	key, err := auth.DecodeTotpSecret(secretB32)
	if err != nil {
		t.Fatalf("DecodeTotpSecret: %v", err)
	}
	return auth.TotpCodeAt(key, time.Now().UTC().Unix())
}

// totpCodeFromSecretAhead derives the code for the NEXT 30s step. Enrollment
// confirm consumes the current step server-side (replay protection), so any
// later verification must present a strictly greater step.
func totpCodeFromSecretAhead(t *testing.T, secretB32 string) string {
	t.Helper()
	key, err := auth.DecodeTotpSecret(secretB32)
	if err != nil {
		t.Fatalf("DecodeTotpSecret: %v", err)
	}
	return auth.TotpCodeAt(key, time.Now().UTC().Add(30*time.Second).Unix())
}

// stepupHeaders performs a fresh SCRAM step-up and returns request headers
// carrying the bearer token and a single-use step-up token.
func stepupHeaders(t *testing.T, app *testApp, authz map[string]string, username, password string) map[string]string {
	t.Helper()
	tok := stepupToken(t, app, authz, username, password)
	return map[string]string{
		"Authorization":  authz["Authorization"],
		"X-Stepup-Token": tok,
	}
}

// enrollTotp takes an account through step-up ↁEsetup ↁEconfirm and returns
// the base32 secret plus the one-time backup codes. Each mutating call gets
// its own single-use step-up token.
func enrollTotp(t *testing.T, app *testApp, authz map[string]string, username, password string) (string, []string) {
	t.Helper()
	client := app.Server.Client()
	base := app.Server.URL

	setupResp := postJSON(t, client, base+"/api/v1/auth/mfa/totp/setup", map[string]any{}, stepupHeaders(t, app, authz, username, password))
	if setupResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, setupResp)
		t.Fatalf("totp setup: expected 200, got %d (%v)", setupResp.StatusCode, body)
	}
	setup := decodeJSON[api.TotpSetupResponse](t, setupResp)

	code := totpCodeFromSecret(t, setup.Secret)
	confirmResp := postJSON(t, client, base+"/api/v1/auth/mfa/totp/confirm", api.TotpConfirmRequest{
		Code: code,
	}, stepupHeaders(t, app, authz, username, password))
	if confirmResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, confirmResp)
		t.Fatalf("totp confirm: expected 200, got %d (%v)", confirmResp.StatusCode, body)
	}
	confirm := decodeJSON[api.TotpConfirmResponse](t, confirmResp)
	return setup.Secret, confirm.BackupCodes
}

// performLogin runs SCRAM login and returns the raw union response.
func performLogin(t *testing.T, app *testApp, username, password string) api.LoginFinishResponse {
	t.Helper()
	client := app.Server.Client()
	base := app.Server.URL

	clientNonce := "login-cnonce-" + username
	startResp := postJSON(t, client, base+"/api/v1/auth/login/start", api.LoginStartRequest{
		Username:    username,
		ClientNonce: clientNonce,
	}, nil)
	if startResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, startResp)
		t.Fatalf("login start: expected 200, got %d (%v)", startResp.StatusCode, body)
	}
	start := decodeJSON[api.LoginStartResponse](t, startResp)

	finalNonce, proof := computeClientProofB64(t, username, password, clientNonce, start.ServerNonce, start.Salt, start.Iterations)
	finishResp := postJSON(t, client, base+"/api/v1/auth/login/finish", api.LoginFinishRequest{
		LoginSessionId:   start.LoginSessionId,
		ClientFinalNonce: finalNonce,
		ClientProof:      proof,
	}, nil)
	if finishResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, finishResp)
		t.Fatalf("login finish: expected 200, got %d (%v)", finishResp.StatusCode, body)
	}
	return decodeJSON[api.LoginFinishResponse](t, finishResp)
}

func TestIntegration_MFA_TotpSetup_RequiresStepup(t *testing.T) {
	app := newTestAppWithMFA(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "mfa_guard", "Password123")
	authz := issueBearer(t, app.TokenManager, u)

	resp := postJSON(t, client, base+"/api/v1/auth/mfa/totp/setup", map[string]any{}, authz)
	if resp.StatusCode != http.StatusUnauthorized {
		body := decodeJSON[map[string]any](t, resp)
		t.Fatalf("setup without stepup: expected 401, got %d (%v)", resp.StatusCode, body)
	}
}

func TestIntegration_MFA_Totp_Enroll_And_Login_E2E(t *testing.T) {
	app := newTestAppWithMFA(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "mfa_e2e", "Password123")
	authz := issueBearer(t, app.TokenManager, u)
	secret, backupCodes := enrollTotp(t, app, authz, "mfa_e2e", "Password123")
	if len(backupCodes) != int(auth.BackupCodeCount) {
		t.Fatalf("expected %d backup codes, got %d", auth.BackupCodeCount, len(backupCodes))
	}

	// Login now requires MFA.
	loginUnion := performLogin(t, app, "mfa_e2e", "Password123")
	mfa, err := loginUnion.AsLoginMfaRequired()
	if err != nil {
		t.Fatalf("expected mfa_required, got: %v", err)
	}
	hasTotp := false
	for _, m := range mfa.Methods {
		if m == api.Totp {
			hasTotp = true
		}
	}
	if !hasTotp {
		t.Fatalf("expected totp method, got %v", mfa.Methods)
	}

	// Wrong code is rejected and the session stays usable.
	wrongResp := postJSON(t, client, base+"/api/v1/auth/mfa/verify", api.MfaCodeVerifyRequest{
		MfaToken: mfa.MfaToken,
		Code:     "000000",
	}, nil)
	if wrongResp.StatusCode != http.StatusUnauthorized {
		body := decodeJSON[map[string]any](t, wrongResp)
		t.Fatalf("wrong code: expected 401, got %d (%v)", wrongResp.StatusCode, body)
	}

	// Correct code completes the login.
	okResp := postJSON(t, client, base+"/api/v1/auth/mfa/verify", api.MfaCodeVerifyRequest{
		MfaToken: mfa.MfaToken,
		Code:     totpCodeFromSecretAhead(t, secret),
	}, nil)
	if okResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, okResp)
		t.Fatalf("verify: expected 200, got %d (%v)", okResp.StatusCode, body)
	}
	okUnion := decodeJSON[api.LoginFinishResponse](t, okResp)
	authed, err := okUnion.AsLoginAuthenticated()
	if err != nil {
		t.Fatalf("expected authenticated: %v", err)
	}
	if authed.AccessToken == "" || string(authed.User.Username) != "mfa_e2e" {
		t.Fatalf("bad authenticated payload: %s", authed.AccessToken)
	}
}

func TestIntegration_MFA_BackupCode_Login_And_ReusePrevented(t *testing.T) {
	app := newTestAppWithMFA(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "mfa_backup", "Password123")
	authz := issueBearer(t, app.TokenManager, u)
	_, codes := enrollTotp(t, app, authz, "mfa_backup", "Password123")

	loginUnion := performLogin(t, app, "mfa_backup", "Password123")
	mfa, err := loginUnion.AsLoginMfaRequired()
	if err != nil {
		t.Fatalf("expected mfa_required: %v", err)
	}

	firstResp := postJSON(t, client, base+"/api/v1/auth/mfa/verify", api.MfaCodeVerifyRequest{
		MfaToken: mfa.MfaToken,
		Code:     codes[0],
	}, nil)
	if firstResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, firstResp)
		t.Fatalf("backup code login: expected 200, got %d (%v)", firstResp.StatusCode, body)
	}

	// The same code cannot be used again on a fresh login session.
	retryLogin := performLogin(t, app, "mfa_backup", "Password123")
	retryMfa, err := retryLogin.AsLoginMfaRequired()
	if err != nil {
		t.Fatalf("expected mfa_required: %v", err)
	}
	reuseResp := postJSON(t, client, base+"/api/v1/auth/mfa/verify", api.MfaCodeVerifyRequest{
		MfaToken: retryMfa.MfaToken,
		Code:     codes[0],
	}, nil)
	if reuseResp.StatusCode != http.StatusUnauthorized {
		body := decodeJSON[map[string]any](t, reuseResp)
		t.Fatalf("reuse: expected 401, got %d (%v)", reuseResp.StatusCode, body)
	}
}

func TestIntegration_MFA_Status_Endpoint(t *testing.T) {
	app := newTestAppWithMFA(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "mfa_status", "Password123")
	authz := issueBearer(t, app.TokenManager, u)

	before := get(t, client, base+"/api/v1/auth/mfa", authz)
	if before.StatusCode != http.StatusOK {
		t.Fatalf("status: expected 200, got %d", before.StatusCode)
	}
	statusBefore := decodeJSON[api.MfaStatus](t, before)
	if statusBefore.TotpEnabled {
		t.Fatal("expected totp disabled initially")
	}

	enrollTotp(t, app, authz, "mfa_status", "Password123")

	after := get(t, client, base+"/api/v1/auth/mfa", authz)
	if after.StatusCode != http.StatusOK {
		t.Fatalf("status: expected 200, got %d", after.StatusCode)
	}
	statusAfter := decodeJSON[api.MfaStatus](t, after)
	if !statusAfter.TotpEnabled {
		t.Fatal("expected totp enabled after enrollment")
	}
	if statusAfter.BackupCodesRemaining != int(auth.BackupCodeCount) {
		t.Fatalf("expected all backup codes remaining, got %d", statusAfter.BackupCodesRemaining)
	}
}

func TestIntegration_MFA_Stepup_Second_Factor(t *testing.T) {
	app := newTestAppWithMFA(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "mfa_stepup2", "Password123")
	authz := issueBearer(t, app.TokenManager, u)
	secret, _ := enrollTotp(t, app, authz, "mfa_stepup2", "Password123")

	// Step-up now returns mfa_required.
	union := performStepup(t, app, authz, "mfa_stepup2", "Password123")
	mfa, err := union.AsStepupMfaRequired()
	if err != nil {
		t.Fatalf("expected stepup mfa_required: %v", err)
	}

	verifyResp := postJSON(t, client, base+"/api/v1/auth/stepup/mfa/verify", api.MfaCodeVerifyRequest{
		MfaToken: mfa.MfaToken,
		Code:     totpCodeFromSecretAhead(t, secret),
	}, authz)
	if verifyResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, verifyResp)
		t.Fatalf("stepup mfa verify: expected 200, got %d (%v)", verifyResp.StatusCode, body)
	}
	verifyUnion := decodeJSON[api.StepupFinishResponse](t, verifyResp)
	authed, err := verifyUnion.AsStepupAuthenticated()
	if err != nil {
		t.Fatalf("expected stepup authenticated: %v", err)
	}
	if authed.StepupToken == "" {
		t.Fatal("expected stepup token")
	}
}

func TestIntegration_MFA_Disable_Restores_PasswordOnlyLogin(t *testing.T) {
	app := newTestAppWithMFA(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "mfa_disable", "Password123")
	authz := issueBearer(t, app.TokenManager, u)
	secret, _ := enrollTotp(t, app, authz, "mfa_disable", "Password123")

	// Second factor active: completing step-up requires the TOTP code.
	union := performStepup(t, app, authz, "mfa_disable", "Password123")
	mfa, err := union.AsStepupMfaRequired()
	if err != nil {
		t.Fatalf("expected stepup mfa_required: %v", err)
	}
	verifyResp := postJSON(t, client, base+"/api/v1/auth/stepup/mfa/verify", api.MfaCodeVerifyRequest{
		MfaToken: mfa.MfaToken,
		Code:     totpCodeFromSecretAhead(t, secret),
	}, authz)
	if verifyResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, verifyResp)
		t.Fatalf("stepup mfa verify: expected 200, got %d (%v)", verifyResp.StatusCode, body)
	}
	stepTok := decodeJSON[api.StepupFinishResponse](t, verifyResp)
	authedStep, err := stepTok.AsStepupAuthenticated()
	if err != nil {
		t.Fatalf("expected stepup authenticated: %v", err)
	}

	headers := map[string]string{
		"Authorization":  authz["Authorization"],
		"X-Stepup-Token": authedStep.StepupToken,
	}
	disableResp := postJSON(t, client, base+"/api/v1/auth/mfa/disable", map[string]any{}, headers)
	if disableResp.StatusCode != http.StatusNoContent {
		body := decodeJSON[map[string]any](t, disableResp)
		t.Fatalf("disable: expected 204, got %d (%v)", disableResp.StatusCode, body)
	}

	// Login no longer requires MFA.
	loginUnion := performLogin(t, app, "mfa_disable", "Password123")
	if _, err := loginUnion.AsLoginAuthenticated(); err != nil {
		t.Fatalf("expected direct authentication after disable: %v", err)
	}
}

func TestIntegration_Admin_MFA_Reset(t *testing.T) {
	app := newTestAppWithMFA(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	adminUser := registerUser(t, client, base, "mfa_reset_admin", "Password123")
	target := registerUser(t, client, base, "mfa_reset_target", "Password123")

	q := sqlc.New(app.SQLDB)
	if err := q.AddUserRole(context.Background(), sqlc.AddUserRoleParams{UserID: adminUser.Id, RoleID: "admin"}); err != nil {
		t.Fatalf("AddUserRole: %v", err)
	}

	targetAuthz := issueBearer(t, app.TokenManager, target)
	enrollTotp(t, app, targetAuthz, "mfa_reset_target", "Password123")

	// Non-admin cannot reset.
	denied := deleteReq(t, client, base+"/api/v1/admin/users/"+target.Id.String()+"/mfa", targetAuthz)
	if denied.StatusCode != http.StatusForbidden {
		body := decodeJSON[map[string]any](t, denied)
		t.Fatalf("non-admin reset: expected 403, got %d (%v)", denied.StatusCode, body)
	}

	adminAuthz := issueBearer(t, app.TokenManager, adminUser)
	resetResp := deleteReq(t, client, base+"/api/v1/admin/users/"+target.Id.String()+"/mfa", adminAuthz)
	if resetResp.StatusCode != http.StatusNoContent {
		body := decodeJSON[map[string]any](t, resetResp)
		t.Fatalf("reset: expected 204, got %d (%v)", resetResp.StatusCode, body)
	}

	// Target logs in with password only again.
	loginUnion := performLogin(t, app, "mfa_reset_target", "Password123")
	if _, err := loginUnion.AsLoginAuthenticated(); err != nil {
		t.Fatalf("expected direct authentication after admin reset: %v", err)
	}
}

func TestIntegration_MFA_WebAuthn_Register_Options_Shaped(t *testing.T) {
	app := newTestAppWithMFA(t)
	defer app.Close()

	client := app.Server.Client()
	base := app.Server.URL

	u := registerUser(t, client, base, "webauthn_opts", "Password123")
	authz := issueBearer(t, app.TokenManager, u)

	stepTok := stepupToken(t, app, authz, "webauthn_opts", "Password123")
	headers := map[string]string{
		"Authorization":  authz["Authorization"],
		"X-Stepup-Token": stepTok,
	}

	optsResp := postJSON(t, client, base+"/api/v1/auth/mfa/webauthn/register/options", map[string]any{}, headers)
	if optsResp.StatusCode != http.StatusOK {
		body := decodeJSON[map[string]any](t, optsResp)
		t.Fatalf("register options: expected 200, got %d (%v)", optsResp.StatusCode, body)
	}
	opts := decodeJSON[api.WebAuthnRegisterOptionsResponse](t, optsResp)
	if opts.SessionId == "" || opts.Options == nil {
		t.Fatal("expected sessionId and options")
	}
	if len(opts.Options) == 0 {
		t.Fatal("expected non-empty creation options")
	}

	// Garbage attestation is rejected without corrupting state.
	// The step-up token was consumed by the options call, so mint a new one.
	verifyHeaders := stepupHeaders(t, app, authz, "webauthn_opts", "Password123")
	badResp := postJSON(t, client, base+"/api/v1/auth/mfa/webauthn/register/verify", map[string]any{
		"sessionId": opts.SessionId,
		"name":      "Test Key",
		"credential": map[string]any{
			"id":    "AAAAAAAAAAAAAAAAAAAAAA",
			"rawId": "AAAAAAAAAAAAAAAAAAAAAA",
			"type":  "public-key",
			"response": map[string]any{
				"clientDataJSON":    "e30",
				"attestationObject": "AAAA",
			},
		},
	}, verifyHeaders)
	if badResp.StatusCode != http.StatusBadRequest {
		body := decodeJSON[map[string]any](t, badResp)
		t.Fatalf("bad attestation: expected 400, got %d (%v)", badResp.StatusCode, body)
	}

	// After the failed enrollment attempt the account has no factors:
	// login is direct.
	loginUnion := performLogin(t, app, "webauthn_opts", "Password123")
	if _, err := loginUnion.AsLoginAuthenticated(); err != nil {
		t.Fatalf("expected direct login (no factors enrolled): %v", err)
	}
}
