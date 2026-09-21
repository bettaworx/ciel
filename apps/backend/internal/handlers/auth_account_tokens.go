package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"backend/internal/api"
	"backend/internal/auth"

	"github.com/redis/go-redis/v9"
)

// nonceTTL outlives the signature window so a replayed request always finds its
// own nonce still parked in Redis.
const nonceTTL = 2 * time.Minute

// PostAuthSessionToken issues a device-bound account token for the caller's
// current session. The browser stores it encrypted and presents it (with a
// signature) to come back to this account without the password.
func (h API) PostAuthSessionToken(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	var req api.SessionTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	publicKey, err := auth.ParseDevicePublicKey(req.PublicKey)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: err.Error()})
		return
	}
	token, err := h.Auth.IssueAccountToken(r.Context(), user.ID, publicKey)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, api.SessionTokenResponse{
		Token:            token,
		ExpiresInSeconds: int(30 * 24 * time.Hour / time.Second),
	})
}

// PostAuthSessionExchange verifies a device signature over an account token and
// returns an access token for that account — plus, when activate is set, the
// session cookies, which is how account switching happens.
//
// Deliberately unauthenticated: the whole point is to act as an account other
// than the one the cookies name.
func (h API) PostAuthSessionExchange(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	var req api.SessionExchangeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	if !claimExchangeNonce(r, h.Redis, req.Nonce) {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "invalid account token"})
		return
	}

	session, err := h.Auth.ExchangeAccountToken(r.Context(), req, time.Now().UTC())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	resp := api.SessionExchangeResponse{
		User:             session.User,
		AccessToken:      session.AccessToken,
		ExpiresInSeconds: session.ExpiresInSeconds,
	}
	if session.AccountToken != "" {
		resp.Token = &session.AccountToken
		setAuthCookie(w, r, session.AccessToken, session.ExpiresInSeconds)
		setRefreshCookie(w, r, session.CookieRefresh, 30*24*60*60)
	}
	writeJSON(w, http.StatusOK, resp)
}

// claimExchangeNonce burns the request's nonce so a captured request body
// cannot be replayed inside the signature window. Without Redis (single-node
// dev) the signature window is the only guard left, so the request is allowed
// through rather than failing every switch.
func claimExchangeNonce(r *http.Request, rdb *redis.Client, nonce string) bool {
	if rdb == nil || len(nonce) < 16 {
		return len(nonce) >= 16
	}
	sum := sha256.Sum256([]byte(nonce))
	fresh, err := rdb.SetNX(r.Context(), "session_exchange:nonce:"+hex.EncodeToString(sum[:]), 1, nonceTTL).Result()
	if err != nil {
		slog.Error("session exchange nonce check failed", "error", err)
		return false
	}
	return fresh
}
