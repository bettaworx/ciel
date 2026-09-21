package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/service"

	openapi_types "github.com/oapi-codegen/runtime/types"
)

// writeOAuthError answers in the RFC 6749 §5.2 shape.
//
// Only /oauth/token and /oauth/revoke use it. Every other endpoint added here
// keeps the app's usual {code, message}, because those are consumed by this
// app's own client rather than by third-party OAuth libraries.
func writeOAuthError(w http.ResponseWriter, err error) {
	var oe *service.OAuthError
	if !errors.As(err, &oe) {
		oe = &service.OAuthError{Status: http.StatusInternalServerError, Code: "server_error", Description: "unexpected error"}
	}
	w.Header().Set("Content-Type", "application/json")
	// RFC 6749 §5.1: token responses, errors included, must not be cached.
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Pragma", "no-cache")
	if oe.Code == "invalid_client" {
		// §5.2 asks for a challenge whenever client authentication failed.
		w.Header().Set("WWW-Authenticate", `Basic realm="ciel"`)
	}
	w.WriteHeader(oe.Status)
	_ = json.NewEncoder(w).Encode(api.OAuthError{
		Error:            api.OAuthErrorError(oe.Code),
		ErrorDescription: &oe.Description,
	})
}

// clientCredentialsFrom pulls client authentication out of a token request.
//
// RFC 6749 §2.3.1 says a server MUST support HTTP Basic and MAY support the
// form body. Basic wins when both are present rather than being merged: a
// request carrying two different client identities is confused, and picking the
// one the RFC names as mandatory is the predictable resolution.
func clientCredentialsFrom(r *http.Request, bodyID, bodySecret *string) (string, string) {
	if id, secret, ok := r.BasicAuth(); ok {
		return id, secret
	}
	var id, secret string
	if bodyID != nil {
		id = *bodyID
	}
	if bodySecret != nil {
		secret = *bodySecret
	}
	return id, secret
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// GetOauthAuthorizeInfo validates an authorization request for the consent screen.
func (h API) GetOauthAuthorizeInfo(w http.ResponseWriter, r *http.Request, params api.GetOauthAuthorizeInfoParams) {
	if h.OAuth == nil || h.Users == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "oauth not configured"})
		return
	}

	req, err := h.OAuth.ValidateAuthorizationRequest(
		r.Context(),
		params.ClientId,
		params.RedirectUri,
		params.Scope,
		params.ResponseType,
		params.CodeChallenge,
		params.CodeChallengeMethod,
		deref(params.State),
	)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	owner, err := h.Users.GetByID(r.Context(), req.Client.OwnerUserID, nil)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	scopes := make([]api.OAuthScope, 0, len(req.Scopes))
	for _, s := range req.Scopes {
		scopes = append(scopes, api.OAuthScope(s))
	}

	resp := api.OAuthAuthorizationInfo{
		ClientId:      req.Client.ClientID,
		ClientName:    req.Client.Name,
		OwnerUsername: owner.Username,
		OwnerIsBot:    owner.IsBot,
		Scopes:        scopes,
	}
	if req.Client.Website.Valid {
		site := req.Client.Website.String
		resp.Website = &site
	}
	writeJSON(w, http.StatusOK, resp)
}

// PostOauthAuthorize records the user's decision.
func (h API) PostOauthAuthorize(w http.ResponseWriter, r *http.Request) {
	if h.OAuth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "oauth not configured"})
		return
	}
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}

	var body api.OAuthAuthorizeRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}

	// Re-validated in full. The consent screen sends back what it displayed
	// rather than a handle to server-side state, so this is what guarantees the
	// approval covers exactly what the user saw.
	req, err := h.OAuth.ValidateAuthorizationRequest(
		r.Context(),
		body.ClientId,
		body.RedirectUri,
		body.Scope,
		string(body.ResponseType),
		body.CodeChallenge,
		string(body.CodeChallengeMethod),
		deref(body.State),
	)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	var redirect string
	if body.Approve {
		redirect, err = h.OAuth.Approve(r.Context(), req, user.ID)
	} else {
		redirect, err = h.OAuth.Deny(req)
	}
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, api.OAuthAuthorizeResponse{RedirectUri: redirect})
}

// PostOauthToken issues tokens.
func (h API) PostOauthToken(w http.ResponseWriter, r *http.Request) {
	if h.OAuth == nil {
		writeOAuthError(w, &service.OAuthError{Status: http.StatusServiceUnavailable, Code: "server_error", Description: "oauth not configured"})
		return
	}
	if err := r.ParseForm(); err != nil {
		writeOAuthError(w, &service.OAuthError{Status: http.StatusBadRequest, Code: "invalid_request", Description: "malformed form body"})
		return
	}

	form := r.PostForm
	bodyID := form.Get("client_id")
	bodySecret := form.Get("client_secret")
	clientID, clientSecret := clientCredentialsFrom(r, &bodyID, &bodySecret)

	var grant service.TokenGrant
	var err error

	switch form.Get("grant_type") {
	case "authorization_code":
		grant, err = h.OAuth.ExchangeAuthorizationCode(
			r.Context(), clientID, clientSecret,
			form.Get("code"), form.Get("redirect_uri"), form.Get("code_verifier"),
		)
	case "refresh_token":
		grant, err = h.OAuth.RefreshToken(
			r.Context(), clientID, clientSecret, form.Get("refresh_token"), form.Get("scope"),
		)
	case "client_credentials":
		grant, err = h.OAuth.ClientCredentials(r.Context(), clientID, clientSecret, form.Get("scope"))
	default:
		writeOAuthError(w, &service.OAuthError{
			Status:      http.StatusBadRequest,
			Code:        "unsupported_grant_type",
			Description: "supported grant types are authorization_code, refresh_token and client_credentials",
		})
		return
	}
	if err != nil {
		writeOAuthError(w, err)
		return
	}

	resp := api.OAuthTokenResponse{
		AccessToken: grant.AccessToken,
		TokenType:   api.OAuthTokenResponseTokenTypeBearer,
		ExpiresIn:   grant.ExpiresInSeconds,
		Scope:       auth.FormatScope(grant.Scopes),
	}
	if grant.RefreshToken != "" {
		resp.RefreshToken = &grant.RefreshToken
	}

	// A bearer token in a cached response is a bearer token handed to whoever
	// reads the cache next.
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Pragma", "no-cache")
	writeJSON(w, http.StatusOK, resp)
}

// PostOauthRevoke implements RFC 7009.
func (h API) PostOauthRevoke(w http.ResponseWriter, r *http.Request) {
	if h.OAuth == nil {
		writeOAuthError(w, &service.OAuthError{Status: http.StatusServiceUnavailable, Code: "server_error", Description: "oauth not configured"})
		return
	}
	if err := r.ParseForm(); err != nil {
		writeOAuthError(w, &service.OAuthError{Status: http.StatusBadRequest, Code: "invalid_request", Description: "malformed form body"})
		return
	}

	bodyID := r.PostForm.Get("client_id")
	bodySecret := r.PostForm.Get("client_secret")
	clientID, clientSecret := clientCredentialsFrom(r, &bodyID, &bodySecret)

	if err := h.OAuth.Revoke(r.Context(), clientID, clientSecret, r.PostForm.Get("token")); err != nil {
		writeOAuthError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)
}

// ---- First-party app management -----------------------------------------
//
// These are consumed by Ciel's own settings screens, so they use the app's
// normal error shape rather than the OAuth one. They are also closed to OAuth
// tokens by the scope middleware: managing apps over OAuth would let a token
// mint itself a wider one.

func (h API) GetMeOauthClients(w http.ResponseWriter, r *http.Request) {
	user, ok := h.oauthCaller(w, r)
	if !ok {
		return
	}
	rows, err := h.OAuth.ListClients(r.Context(), user.ID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	items := make([]api.OAuthClient, 0, len(rows))
	for _, row := range rows {
		items = append(items, api.OAuthClient{
			Id:             openapi_types.UUID(row.ID),
			ClientId:       row.ClientID,
			Name:           row.Name,
			Website:        nullStringPtr(row.Website),
			RedirectUris:   row.RedirectUris,
			Scopes:         toAPIScopes(row.Scopes),
			IsConfidential: row.IsConfidential,
			CreatedAt:      row.CreatedAt,
		})
	}
	writeJSON(w, http.StatusOK, api.OAuthClientPage{Items: items})
}

func (h API) PostMeOauthClients(w http.ResponseWriter, r *http.Request) {
	user, ok := h.oauthCaller(w, r)
	if !ok {
		return
	}
	var body api.CreateOAuthClientRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}

	scopes := make([]string, 0, len(body.Scopes))
	for _, s := range body.Scopes {
		scopes = append(scopes, string(s))
	}
	confidential := body.Confidential != nil && *body.Confidential

	created, err := h.OAuth.CreateClient(
		r.Context(), user.ID, body.Name, deref(body.Website), body.RedirectUris, scopes, confidential,
	)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toAPIClientWithSecret(created))
}

func (h API) DeleteMeOauthClientsClientUuid(w http.ResponseWriter, r *http.Request, clientUuid openapi_types.UUID) {
	user, ok := h.oauthCaller(w, r)
	if !ok {
		return
	}
	if err := h.OAuth.DeleteClient(r.Context(), user.ID, clientUuid); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h API) PostMeOauthClientsClientUuidSecret(
	w http.ResponseWriter, r *http.Request, clientUuid openapi_types.UUID, _ api.PostMeOauthClientsClientUuidSecretParams,
) {
	user, ok := h.oauthCaller(w, r)
	if !ok {
		return
	}
	if h.Tokens == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "token manager not configured"})
		return
	}
	// The secret lets an app act as this account. Replacing it belongs with
	// changing the password, not with editing a profile field.
	if !requireStepup(w, r, h.Tokens, h.Redis, user, "oauth_client_secret_rotate", stepupSingleUse) {
		return
	}

	rotated, err := h.OAuth.RotateClientSecret(r.Context(), user.ID, clientUuid)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toAPIClientWithSecret(rotated))
}

func (h API) GetMeOauthAuthorizations(w http.ResponseWriter, r *http.Request) {
	user, ok := h.oauthCaller(w, r)
	if !ok {
		return
	}
	rows, err := h.OAuth.ListAuthorizations(r.Context(), user.ID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	items := make([]api.OAuthAuthorization, 0, len(rows))
	for _, row := range rows {
		items = append(items, api.OAuthAuthorization{
			ClientId:     row.ClientID,
			ClientName:   row.Name,
			Website:      nullStringPtr(row.Website),
			Scopes:       toAPIScopes(row.Scopes),
			AuthorizedAt: row.AuthorizedAt,
		})
	}
	writeJSON(w, http.StatusOK, api.OAuthAuthorizationPage{Items: items})
}

func (h API) DeleteMeOauthAuthorizationsClientId(w http.ResponseWriter, r *http.Request, clientId string) {
	user, ok := h.oauthCaller(w, r)
	if !ok {
		return
	}
	if err := h.OAuth.RevokeAuthorization(r.Context(), user.ID, clientId); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// oauthCaller resolves the signed-in user for the first-party management
// endpoints, answering the request itself when it cannot.
func (h API) oauthCaller(w http.ResponseWriter, r *http.Request) (auth.User, bool) {
	if h.OAuth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "oauth not configured"})
		return auth.User{}, false
	}
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return auth.User{}, false
	}
	// Belt and braces with the scope middleware, which already denies
	// /me/oauth to OAuth tokens. Repeated here because the consequence of this
	// one route being reachable is a token that can widen itself.
	if user.IsOAuth() {
		writeJSON(w, http.StatusForbidden, api.Error{Code: "forbidden", Message: "not available to OAuth tokens"})
		return auth.User{}, false
	}
	return user, true
}

func toAPIScopes(scopes []string) []api.OAuthScope {
	out := make([]api.OAuthScope, 0, len(scopes))
	for _, s := range scopes {
		out = append(out, api.OAuthScope(s))
	}
	return out
}

func toAPIClientWithSecret(c service.OAuthClientWithSecret) api.OAuthClientWithSecret {
	out := api.OAuthClientWithSecret{
		Client: api.OAuthClient{
			Id:             openapi_types.UUID(c.Client.ID),
			ClientId:       c.Client.ClientID,
			Name:           c.Client.Name,
			Website:        nullStringPtr(c.Client.Website),
			RedirectUris:   c.Client.RedirectUris,
			Scopes:         toAPIScopes(c.Client.Scopes),
			IsConfidential: c.Client.IsConfidential,
			CreatedAt:      c.Client.CreatedAt,
		},
	}
	if strings.TrimSpace(c.Secret) != "" {
		out.ClientSecret = &c.Secret
	}
	return out
}

// nullStringPtr turns a nullable column into the optional field the API uses,
// collapsing an empty string to absent so clients get one shape for "not set".
func nullStringPtr(v sql.NullString) *string {
	if !v.Valid || strings.TrimSpace(v.String) == "" {
		return nil
	}
	out := v.String
	return &out
}
