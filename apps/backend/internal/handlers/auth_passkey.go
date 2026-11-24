package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/api"
)

func (h API) PutAuthMfaPasskeyLogin(w http.ResponseWriter, r *http.Request, _ api.PutAuthMfaPasskeyLoginParams) {
	w.Header().Set("Cache-Control", "no-store")
	user, ok := h.requireMfaAuth(w, r)
	if !ok {
		return
	}
	if !h.requireMfaStepup(w, r, user, "passkey_login") {
		return
	}
	var req struct {
		Enabled *bool `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Enabled == nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	if err := h.Auth.SetPasskeyLogin(r.Context(), user, *req.Enabled); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h API) PostAuthLoginPasskeyOptions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	result, err := h.Auth.PasskeyLoginOptions()
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h API) PostAuthLoginPasskeyVerify(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	var req api.PasskeyLoginVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "passkey login failed"})
		return
	}
	login, refresh, err := h.Auth.PasskeyLoginVerify(r.Context(), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	setAuthCookie(w, r, login.AccessToken, login.ExpiresInSeconds)
	setRefreshCookie(w, r, refresh, 30*24*60*60)
	writeJSON(w, http.StatusOK, login)
}
