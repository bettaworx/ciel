package service

import (
	"context"
	"crypto/subtle"
	"database/sql"
	"errors"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"backend/internal/auth"
	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

const (
	// AccessTokenPrefix must match middleware.OAuthAccessTokenPrefix. It is
	// duplicated rather than imported because service must not depend on
	// middleware; the pair is pinned by a test.
	AccessTokenPrefix  = "ciel_at_"
	RefreshTokenPrefix = "ciel_rt_"

	// An access token is short lived because revoking one is only as fast as
	// its expiry for anything already in flight. A refresh token carries the
	// long-lived half of the grant and can be revoked centrally.
	oauthAccessTokenTTL  = time.Hour
	oauthRefreshTokenTTL = 60 * 24 * time.Hour

	// 32 bytes of crypto/rand, base64url encoded.
	oauthTokenEntropyBytes = 32
)

// OAuthError is an RFC 6749 §5.2 error. The token and revocation endpoints must
// answer in this shape rather than the app's usual {code, message}: every OAuth
// client library in existence reads "error", and would report a perfectly
// descriptive Ciel error as an unparseable response.
type OAuthError struct {
	Code        string
	Description string
	Status      int
}

func (e *OAuthError) Error() string { return e.Code + ": " + e.Description }

func oauthErr(status int, code, description string) *OAuthError {
	return &OAuthError{Status: status, Code: code, Description: description}
}

// The subset of RFC 6749 §5.2 error codes this service raises. The remaining
// codes (invalid_request, unsupported_grant_type) are produced by the handler,
// which is where malformed requests are detected.
var (
	errInvalidClient = func(d string) *OAuthError { return oauthErr(http.StatusUnauthorized, "invalid_client", d) }
	errInvalidGrant  = func(d string) *OAuthError { return oauthErr(http.StatusBadRequest, "invalid_grant", d) }
	errInvalidScope  = func(d string) *OAuthError { return oauthErr(http.StatusBadRequest, "invalid_scope", d) }
	errServerError   = func(d string) *OAuthError { return oauthErr(http.StatusInternalServerError, "server_error", d) }
)

// OAuthService implements the authorization server.
type OAuthService struct {
	store *repository.Store
	codes *auth.AuthorizationCodeStore
}

func NewOAuthService(store *repository.Store, codes *auth.AuthorizationCodeStore) *OAuthService {
	return &OAuthService{store: store, codes: codes}
}

// TokenGrant is a successful token response.
type TokenGrant struct {
	AccessToken      string
	RefreshToken     string
	ExpiresInSeconds int
	Scopes           []string
}

// VerifyAccessToken resolves an opaque access token. Satisfies
// middleware.OAuthVerifier.
func (s *OAuthService) VerifyAccessToken(ctx context.Context, raw string) (auth.User, error) {
	if s == nil || s.store == nil {
		return auth.User{}, auth.ErrUnauthorized
	}
	if !strings.HasPrefix(raw, AccessTokenPrefix) {
		return auth.User{}, auth.ErrUnauthorized
	}

	row, err := s.store.Q.GetOAuthAccessToken(ctx, auth.HashRefreshToken(raw))
	if err != nil {
		// Unknown token and expired token are the same answer on purpose.
		return auth.User{}, auth.ErrUnauthorized
	}
	if row.RevokedAt.Valid || row.AccessExpiresAt.Before(time.Now().UTC()) {
		return auth.User{}, auth.ErrUnauthorized
	}

	out := auth.User{
		ID:       row.UserID,
		Username: row.Username,
		TokenID:  row.ID,
		Scopes:   row.Scopes,
	}
	// Absent for a personal access token, which has no app behind it.
	if row.ClientID.Valid {
		out.ClientID = row.ClientID.UUID
	}
	return out, nil
}

// AuthorizationRequest is a parsed and validated /oauth/authorize request.
type AuthorizationRequest struct {
	Client        sqlc.OauthClient
	RedirectURI   string
	Scopes        []string
	State         string
	CodeChallenge string
}

// ValidateAuthorizationRequest checks everything the consent screen needs
// before showing the user anything.
//
// The two failure classes are deliberately different (RFC 6749 §4.1.2.1): an
// unknown client or a redirect_uri that does not match a registered one must be
// reported on this site, because redirecting to an unverified URI with an error
// is itself the open redirect. Everything else may be reported back to the app.
func (s *OAuthService) ValidateAuthorizationRequest(
	ctx context.Context, clientID, redirectURI, scope, responseType, codeChallenge, codeChallengeMethod, state string,
) (AuthorizationRequest, error) {
	if s.store == nil {
		return AuthorizationRequest{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if !s.codes.Available() {
		return AuthorizationRequest{}, NewError(http.StatusServiceUnavailable, "temporarily_unavailable", "authorization codes unavailable")
	}

	client, err := s.store.Q.GetOAuthClientByClientID(ctx, strings.TrimSpace(clientID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return AuthorizationRequest{}, NewError(http.StatusBadRequest, "invalid_client", "unknown client")
		}
		return AuthorizationRequest{}, err
	}

	if !redirectURIAllowed(redirectURI, client.RedirectUris) {
		return AuthorizationRequest{}, NewError(http.StatusBadRequest, "invalid_redirect_uri", "redirect_uri does not match a registered URI")
	}

	// From here on the request is attributable to a real client at a verified
	// URI, so these are errors the app is allowed to hear about.
	if responseType != "code" {
		return AuthorizationRequest{}, NewError(http.StatusBadRequest, "unsupported_response_type", "only response_type=code is supported")
	}
	if len(state) > 512 {
		return AuthorizationRequest{}, NewError(http.StatusBadRequest, "invalid_request", "state is too long")
	}
	if codeChallengeMethod != auth.PKCEMethodS256 {
		return AuthorizationRequest{}, NewError(http.StatusBadRequest, "invalid_request", "code_challenge_method must be S256")
	}
	if !auth.ValidPKCEChallenge(codeChallenge) {
		return AuthorizationRequest{}, NewError(http.StatusBadRequest, "invalid_request", "code_challenge is not a valid S256 challenge")
	}

	scopes, ok := auth.ParseScope(scope)
	if !ok {
		return AuthorizationRequest{}, NewError(http.StatusBadRequest, "invalid_scope", "unknown or empty scope")
	}
	if !auth.IsSubset(scopes, client.Scopes) {
		return AuthorizationRequest{}, NewError(http.StatusBadRequest, "invalid_scope", "scope exceeds what this client registered")
	}

	return AuthorizationRequest{
		Client:        client,
		RedirectURI:   redirectURI,
		Scopes:        scopes,
		State:         state,
		CodeChallenge: codeChallenge,
	}, nil
}

// Approve records the user's consent and returns the URI to send them to.
func (s *OAuthService) Approve(ctx context.Context, req AuthorizationRequest, userID uuid.UUID) (string, error) {
	code, err := auth.RandomToken(oauthTokenEntropyBytes)
	if err != nil {
		return "", err
	}
	err = s.codes.Put(ctx, code, auth.AuthorizationCode{
		ClientID:      req.Client.ID,
		UserID:        userID,
		RedirectURI:   req.RedirectURI,
		Scopes:        req.Scopes,
		CodeChallenge: req.CodeChallenge,
	})
	if err != nil {
		return "", err
	}
	return buildRedirect(req.RedirectURI, map[string]string{"code": code}, req.State)
}

// Deny builds the redirect for a user who refused. The app has to be told, or
// it sits waiting for a callback that never comes.
func (s *OAuthService) Deny(req AuthorizationRequest) (string, error) {
	return buildRedirect(req.RedirectURI, map[string]string{
		"error":             "access_denied",
		"error_description": "the user refused the request",
	}, req.State)
}

// buildRedirect appends parameters to a redirect URI, preserving any query the
// registered URI already carried. state is echoed back verbatim and never
// interpreted: it is the client's CSRF token and means nothing here.
func buildRedirect(redirectURI string, params map[string]string, state string) (string, error) {
	u, err := url.Parse(redirectURI)
	if err != nil {
		return "", err
	}
	q := u.Query()
	for k, v := range params {
		q.Set(k, v)
	}
	if state != "" {
		q.Set("state", state)
	}
	u.RawQuery = q.Encode()
	return u.String(), nil
}

// ExchangeAuthorizationCode implements grant_type=authorization_code.
func (s *OAuthService) ExchangeAuthorizationCode(
	ctx context.Context, clientID, clientSecret, code, redirectURI, verifier string,
) (TokenGrant, error) {
	client, err := s.authenticateClient(ctx, clientID, clientSecret)
	if err != nil {
		return TokenGrant{}, err
	}

	// Consumed before anything is checked: a code is single use whether or not
	// the exchange succeeds, so a wrong verifier cannot be retried against a
	// live code.
	stored, err := s.codes.Consume(ctx, code)
	if err != nil {
		if errors.Is(err, auth.ErrCodeNotFound) {
			return TokenGrant{}, errInvalidGrant("authorization code is invalid, expired or already used")
		}
		return TokenGrant{}, errServerError("could not read the authorization code")
	}

	// The code was issued to one client at one URI. Both are re-checked because
	// this request comes from the app's server, not from the browser that was
	// actually shown the consent screen.
	if stored.ClientID != client.ID {
		return TokenGrant{}, errInvalidGrant("authorization code was issued to a different client")
	}
	if stored.RedirectURI != redirectURI {
		return TokenGrant{}, errInvalidGrant("redirect_uri does not match the authorization request")
	}
	if !auth.VerifyPKCE(verifier, stored.CodeChallenge) {
		return TokenGrant{}, errInvalidGrant("code_verifier does not match the code_challenge")
	}

	return s.issue(ctx, client.ID, stored.UserID, stored.Scopes, true)
}

// RefreshToken implements grant_type=refresh_token.
func (s *OAuthService) RefreshToken(ctx context.Context, clientID, clientSecret, refreshToken, scope string) (TokenGrant, error) {
	client, err := s.authenticateClient(ctx, clientID, clientSecret)
	if err != nil {
		return TokenGrant{}, err
	}

	hash := auth.HashRefreshToken(refreshToken)
	row, err := s.store.Q.ConsumeOAuthRefreshToken(ctx, hash)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return TokenGrant{}, s.handleRefreshMiss(ctx, hash)
		}
		return TokenGrant{}, errServerError("could not read the refresh token")
	}
	if !row.ClientID.Valid || row.ClientID.UUID != client.ID {
		// Someone else's refresh token, or a personal token's row — which has
		// no client and no refresh token, so naming one here is nonsense. It is
		// already revoked by the consume above, which is the right outcome
		// either way.
		return TokenGrant{}, errInvalidGrant("refresh token was issued to a different client")
	}

	scopes := row.Scopes
	if strings.TrimSpace(scope) != "" {
		requested, ok := auth.ParseScope(scope)
		if !ok {
			return TokenGrant{}, errInvalidScope("unknown scope")
		}
		// RFC 6749 §6: a refresh may narrow the grant, never widen it. Without
		// this a token could add a scope on every refresh until it held
		// everything the client is registered for.
		if !auth.IsSubset(requested, row.Scopes) {
			return TokenGrant{}, errInvalidScope("scope exceeds the original grant")
		}
		scopes = requested
	}

	return s.issue(ctx, client.ID, row.UserID, scopes, true)
}

// handleRefreshMiss decides what a failed consume meant.
//
// A refresh token that exists but is already revoked is a replay: either the
// client is retrying after a response it never received, or the token was
// stolen and one of the two parties is an attacker. There is no way to tell
// which, so the safe reading is theft — kill the whole grant and make both
// sides re-authorize. This is the detection half of refresh token rotation;
// without it, rotation only inconveniences an attacker rather than exposing it.
func (s *OAuthService) handleRefreshMiss(ctx context.Context, hash []byte) error {
	peek, err := s.store.Q.PeekOAuthRefreshToken(ctx, hash)
	if err != nil {
		return errInvalidGrant("refresh token is invalid or expired")
	}
	if peek.RevokedAt.Valid {
		// A grant is a (client, user) pair, so there is nothing wider to revoke
		// for a row with no client. Personal tokens cannot reach this path —
		// they are issued without a refresh token — but the guard keeps the
		// reuse response from depending on that staying true.
		if peek.ClientID.Valid {
			_, _ = s.store.Q.RevokeOAuthGrant(ctx, sqlc.RevokeOAuthGrantParams{
				ClientID: peek.ClientID.UUID,
				UserID:   peek.UserID,
			})
		}
		return errInvalidGrant("refresh token has already been used; the grant has been revoked")
	}
	return errInvalidGrant("refresh token is invalid or expired")
}

// ClientCredentials implements grant_type=client_credentials.
//
// There is no end user in this grant, so the token acts as the client's owner.
// That is a real privilege transfer and the reason it is capped to the client's
// registered scopes with no consent screen in between: the owner is the person
// who registered the client, so they have already consented by creating it.
// It gets no refresh token — RFC 6749 §4.4.3 — because the client can always
// ask for another with the credentials it already holds.
func (s *OAuthService) ClientCredentials(ctx context.Context, clientID, clientSecret, scope string) (TokenGrant, error) {
	client, err := s.authenticateClient(ctx, clientID, clientSecret)
	if err != nil {
		return TokenGrant{}, err
	}
	if len(client.ClientSecretHash) == 0 {
		return TokenGrant{}, errInvalidClient("client_credentials requires a confidential client")
	}

	scopes := client.Scopes
	if strings.TrimSpace(scope) != "" {
		requested, ok := auth.ParseScope(scope)
		if !ok {
			return TokenGrant{}, errInvalidScope("unknown scope")
		}
		if !auth.IsSubset(requested, client.Scopes) {
			return TokenGrant{}, errInvalidScope("scope exceeds what this client registered")
		}
		scopes = requested
	}

	return s.issue(ctx, client.ID, client.OwnerUserID, scopes, false)
}

// issue mints a token pair and records it.
func (s *OAuthService) issue(ctx context.Context, clientID, userID uuid.UUID, scopes []string, withRefresh bool) (TokenGrant, error) {
	accessRaw, err := auth.RandomToken(oauthTokenEntropyBytes)
	if err != nil {
		return TokenGrant{}, errServerError("could not generate a token")
	}
	accessToken := AccessTokenPrefix + accessRaw

	params := sqlc.CreateOAuthTokenParams{
		ClientID:        clientID,
		UserID:          userID,
		Scopes:          scopes,
		AccessTokenHash: auth.HashRefreshToken(accessToken),
		AccessExpiresAt: time.Now().UTC().Add(oauthAccessTokenTTL),
	}

	var refreshToken string
	if withRefresh {
		refreshRaw, err := auth.RandomToken(oauthTokenEntropyBytes)
		if err != nil {
			return TokenGrant{}, errServerError("could not generate a token")
		}
		refreshToken = RefreshTokenPrefix + refreshRaw
		params.RefreshTokenHash = auth.HashRefreshToken(refreshToken)
		params.RefreshExpiresAt = sql.NullTime{
			Time:  time.Now().UTC().Add(oauthRefreshTokenTTL),
			Valid: true,
		}
	}

	if _, err := s.store.Q.CreateOAuthToken(ctx, params); err != nil {
		return TokenGrant{}, errServerError("could not store the token")
	}

	return TokenGrant{
		AccessToken:      accessToken,
		RefreshToken:     refreshToken,
		ExpiresInSeconds: int(oauthAccessTokenTTL.Seconds()),
		Scopes:           scopes,
	}, nil
}

// authenticateClient resolves and, for confidential clients, authenticates the
// client making a token request.
func (s *OAuthService) authenticateClient(ctx context.Context, clientID, clientSecret string) (sqlc.OauthClient, error) {
	if s.store == nil {
		return sqlc.OauthClient{}, errServerError("database not configured")
	}
	clientID = strings.TrimSpace(clientID)
	if clientID == "" {
		return sqlc.OauthClient{}, errInvalidClient("client_id is required")
	}

	client, err := s.store.Q.GetOAuthClientByClientID(ctx, clientID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return sqlc.OauthClient{}, errInvalidClient("unknown client")
		}
		return sqlc.OauthClient{}, errServerError("could not read the client")
	}

	if len(client.ClientSecretHash) == 0 {
		// Public client: it has no secret to prove anything with, which is why
		// PKCE is mandatory for it. A secret sent by one is a sign something is
		// confused, so refuse rather than ignore it.
		if clientSecret != "" {
			return sqlc.OauthClient{}, errInvalidClient("this client is public and must not send a secret")
		}
		return client, nil
	}

	if clientSecret == "" {
		return sqlc.OauthClient{}, errInvalidClient("client_secret is required")
	}
	if subtle.ConstantTimeCompare(auth.HashRefreshToken(clientSecret), client.ClientSecretHash) != 1 {
		return sqlc.OauthClient{}, errInvalidClient("invalid client credentials")
	}
	return client, nil
}

// Revoke implements RFC 7009.
//
// Always reports success, even for a token that was never valid. Reporting
// "unknown token" would make this endpoint an oracle for testing whether a
// stolen string is a live token, which the RFC (§2.2) calls out directly.
func (s *OAuthService) Revoke(ctx context.Context, clientID, clientSecret, token string) error {
	if _, err := s.authenticateClient(ctx, clientID, clientSecret); err != nil {
		return err
	}
	hash := auth.HashRefreshToken(token)
	switch {
	case strings.HasPrefix(token, RefreshTokenPrefix):
		_, _ = s.store.Q.RevokeOAuthTokenByRefreshHash(ctx, hash)
	case strings.HasPrefix(token, AccessTokenPrefix):
		_, _ = s.store.Q.RevokeOAuthTokenByAccessHash(ctx, hash)
	default:
		// Neither shape. Nothing to do, and nothing to say about it.
	}
	return nil
}

// RevokeAllForUser kills every OAuth grant an account has issued. Called from
// the credential-change paths: a password reset that left connected apps
// running would not actually take the account back.
func (s *OAuthService) RevokeAllForUser(ctx context.Context, userID uuid.UUID) error {
	if s == nil || s.store == nil {
		return nil
	}
	_, err := s.store.Q.RevokeAllOAuthTokensForUser(ctx, userID)
	return err
}

// redirectURIAllowed reports whether uri exactly matches one of the registered
// URIs.
//
// Exact string comparison, with one exception. RFC 8252 §7.3 has native apps
// listen on an ephemeral loopback port, which they cannot know at registration
// time, so the port is ignored for loopback addresses and everything else about
// the URI still has to match. No prefix matching, no wildcards, no "starts
// with": a redirect_uri check that accepts a prefix is how authorization codes
// get delivered to attackers.
func redirectURIAllowed(uri string, registered []string) bool {
	if uri == "" {
		return false
	}
	for _, candidate := range registered {
		if candidate == uri {
			return true
		}
		if loopbackMatch(candidate, uri) {
			return true
		}
	}
	return false
}

func loopbackMatch(registered, given string) bool {
	a, err := url.Parse(registered)
	if err != nil || !isLoopback(a) {
		return false
	}
	b, err := url.Parse(given)
	if err != nil || !isLoopback(b) {
		return false
	}
	return a.Scheme == b.Scheme &&
		a.Hostname() == b.Hostname() &&
		a.Path == b.Path &&
		a.RawQuery == b.RawQuery
}

func isLoopback(u *url.URL) bool {
	if u.Scheme != "http" {
		return false
	}
	ip := net.ParseIP(u.Hostname())
	return ip != nil && ip.IsLoopback()
}
