package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/api"
	"backend/internal/auth"

	"github.com/google/uuid"
)

func (h API) requireMfaAuth(w http.ResponseWriter, r *http.Request) (auth.User, bool) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return auth.User{}, false
	}
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return auth.User{}, false
	}
	return user, true
}

// requireMfaStepup guards MFA enrollment changes with step-up.
func (h API) requireMfaStepup(w http.ResponseWriter, r *http.Request, user auth.User, action string) bool {
	if !requireStepup(w, r, h.Tokens, h.Redis, user, action) {
		return false
	}
	return true
}

func (h API) GetAuthMfa(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	status, err := h.Auth.GetMfaStatus(r.Context(), user)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, status)
}

func (h API) PostAuthMfaTotpSetup(w http.ResponseWriter, r *http.Request, _ api.PostAuthMfaTotpSetupParams) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	if !h.requireMfaStepup(w, r, user, "mfa_totp_setup") {
		return
	}
	resp, err := h.Auth.TotpSetup(r.Context(), user)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h API) PostAuthMfaTotpConfirm(w http.ResponseWriter, r *http.Request, _ api.PostAuthMfaTotpConfirmParams) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	if !h.requireMfaStepup(w, r, user, "mfa_totp_confirm") {
		return
	}
	var req api.TotpConfirmRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	resp, err := h.Auth.TotpConfirm(r.Context(), user, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h API) DeleteAuthMfaTotp(w http.ResponseWriter, r *http.Request, _ api.DeleteAuthMfaTotpParams) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	if !h.requireMfaStepup(w, r, user, "mfa_totp_disable") {
		return
	}
	if err := h.Auth.TotpDisable(r.Context(), user); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h API) PostAuthMfaBackupCodesRegenerate(w http.ResponseWriter, r *http.Request, _ api.PostAuthMfaBackupCodesRegenerateParams) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	if !h.requireMfaStepup(w, r, user, "mfa_backup_regenerate") {
		return
	}
	resp, err := h.Auth.RegenerateBackupCodes(r.Context(), user)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h API) PostAuthMfaDisable(w http.ResponseWriter, r *http.Request, _ api.PostAuthMfaDisableParams) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	if !h.requireMfaStepup(w, r, user, "mfa_disable") {
		return
	}
	if err := h.Auth.DisableAllMFA(r.Context(), user); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h API) PostAuthMfaVerify(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	var req api.MfaCodeVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	login, _, refresh, err := h.Auth.VerifyMfaCode(r.Context(), req, auth.MfaPurposeLogin)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	setAuthCookie(w, r, login.AccessToken, login.ExpiresInSeconds)
	setRefreshCookie(w, r, refresh, 30*24*60*60)
	writeJSON(w, http.StatusOK, mustLoginAuthenticated(login))
}

func (h API) PostAuthStepupMfaVerify(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	var req api.MfaCodeVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	// Bind the mfaToken to the authenticated caller.
	_, stepup, _, err := h.Auth.VerifyMfaCodeBoundUser(r.Context(), req, auth.MfaPurposeStepup, user.ID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, mustStepupAuthenticated(stepup))
}

// mustStepupAuthenticated wraps StepupAuthenticated into the union type.
func mustStepupAuthenticated(v api.StepupAuthenticated) api.StepupFinishResponse {
	var out api.StepupFinishResponse
	if err := out.FromStepupAuthenticated(v); err != nil {
		panic(err)
	}
	return out
}

func (h API) PostAuthMfaWebauthnOptions(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	var req api.MfaWebAuthnOptionsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	resp, err := h.Auth.WebAuthnAssertionOptions(r.Context(), req.MfaToken, auth.MfaPurposeLogin)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h API) PostAuthMfaWebauthnVerify(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	var req api.MfaWebAuthnVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	login, _, refresh, err := h.Auth.WebAuthnAssertionVerify(r.Context(), req.MfaToken, req.Credential, auth.MfaPurposeLogin)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	setAuthCookie(w, r, login.AccessToken, login.ExpiresInSeconds)
	setRefreshCookie(w, r, refresh, 30*24*60*60)
	writeJSON(w, http.StatusOK, mustLoginAuthenticated(login))
}

func (h API) PostAuthStepupMfaWebauthnOptions(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	var req api.MfaWebAuthnOptionsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	// Validate the mfaToken belongs to the caller.
	resp, err := h.Auth.WebAuthnAssertionOptionsBoundUser(r.Context(), req.MfaToken, auth.MfaPurposeStepup, user.ID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h API) PostAuthStepupMfaWebauthnVerify(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	var req api.MfaWebAuthnVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	_, stepup, _, err := h.Auth.WebAuthnAssertionVerifyBoundUser(r.Context(), req.MfaToken, req.Credential, auth.MfaPurposeStepup, user.ID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, mustStepupAuthenticated(stepup))
}

func (h API) GetAuthMfaWebauthnCredentials(w http.ResponseWriter, r *http.Request) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	creds, err := h.Auth.ListWebAuthnCredentials(r.Context(), user)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	if creds == nil {
		creds = []api.WebAuthnCredential{}
	}
	writeJSON(w, http.StatusOK, creds)
}

func (h API) PostAuthMfaWebauthnRegisterOptions(w http.ResponseWriter, r *http.Request, _ api.PostAuthMfaWebauthnRegisterOptionsParams) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	if !h.requireMfaStepup(w, r, user, "webauthn_register") {
		return
	}
	resp, err := h.Auth.WebAuthnRegisterOptions(r.Context(), user)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h API) PostAuthMfaWebauthnRegisterVerify(w http.ResponseWriter, r *http.Request, _ api.PostAuthMfaWebauthnRegisterVerifyParams) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	if !h.requireMfaStepup(w, r, user, "webauthn_register") {
		return
	}
	var req api.WebAuthnRegisterVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	resp, err := h.Auth.WebAuthnRegisterVerify(r.Context(), user, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, resp)
}

func (h API) PatchAuthMfaWebauthnCredentialsCredentialId(w http.ResponseWriter, r *http.Request, credentialId uuid.UUID) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	var req api.WebAuthnCredentialUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	cred, err := h.Auth.RenameWebAuthnCredential(r.Context(), user, credentialId, string(req.Name))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, cred)
}

func (h API) DeleteAuthMfaWebauthnCredentialsCredentialId(w http.ResponseWriter, r *http.Request, credentialId uuid.UUID, _ api.DeleteAuthMfaWebauthnCredentialsCredentialIdParams) {
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	if !h.requireMfaStepup(w, r, user, "webauthn_delete") {
		return
	}
	if err := h.Auth.DeleteWebAuthnCredential(r.Context(), user, credentialId); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
