package service

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"net/url"
	"strings"

	"backend/internal/auth"
	"backend/internal/db/sqlc"

	"github.com/google/uuid"
)

const (
	// maxClientsPerOwner caps how many apps one account may register. Anyone
	// signed in can create them, so this is the thing standing between that and
	// a table full of junk. Generous enough that a real developer never meets
	// it.
	maxClientsPerOwner = 20

	maxClientNameLen    = 60
	maxClientWebsiteLen = 300
	maxRedirectURIs     = 5
	maxRedirectURILen   = 500

	// client_id is public and ends up in URLs and config files, so it is
	// readable-length rather than a UUID.
	clientIDEntropyBytes     = 16
	clientSecretEntropyBytes = 32
)

// OAuthClientWithSecret carries a freshly generated secret back to the one
// response that is allowed to contain it.
type OAuthClientWithSecret struct {
	Client sqlc.ListOAuthClientsByOwnerRow
	// Set only on creation and rotation. The server keeps a hash, so this is
	// the single moment the plaintext exists anywhere it can be read.
	Secret string
}

// CreateClient registers an OAuth2 client owned by userID.
//
// A client with no secret is a public client: it cannot keep one, which is the
// case for anything running on a user's device. PKCE is required of every
// client here, so a public client is not less safe to authorize — it just
// cannot use client_credentials, since there is nothing to authenticate it.
func (s *OAuthService) CreateClient(
	ctx context.Context, userID uuid.UUID, name, website string, redirectURIs, scopes []string, confidential bool,
) (OAuthClientWithSecret, error) {
	if s.store == nil {
		return OAuthClientWithSecret{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	name = strings.TrimSpace(name)
	if name == "" || len(name) > maxClientNameLen {
		return OAuthClientWithSecret{}, NewError(http.StatusBadRequest, "invalid_request", "name must be 1 to 60 characters")
	}
	website = strings.TrimSpace(website)
	if website != "" {
		if len(website) > maxClientWebsiteLen || !validHTTPURL(website) {
			return OAuthClientWithSecret{}, NewError(http.StatusBadRequest, "invalid_request", "website must be an http(s) URL")
		}
	}
	if err := validateRedirectURIs(redirectURIs); err != nil {
		return OAuthClientWithSecret{}, err
	}
	parsedScopes, ok := normalizeScopes(scopes)
	if !ok {
		return OAuthClientWithSecret{}, NewError(http.StatusBadRequest, "invalid_scope", "unknown or empty scope")
	}

	clientID, err := auth.RandomToken(clientIDEntropyBytes)
	if err != nil {
		return OAuthClientWithSecret{}, err
	}

	var secret string
	var secretHash []byte
	if confidential {
		secret, err = auth.RandomToken(clientSecretEntropyBytes)
		if err != nil {
			return OAuthClientWithSecret{}, err
		}
		secretHash = auth.HashRefreshToken(secret)
	}

	row, err := s.store.Q.CreateOAuthClient(ctx, sqlc.CreateOAuthClientParams{
		ClientID:         clientID,
		ClientSecretHash: secretHash,
		OwnerUserID:      userID,
		Name:             name,
		Website:          sql.NullString{String: website, Valid: website != ""},
		RedirectUris:     redirectURIs,
		Scopes:           parsedScopes,
		MaxClients:       maxClientsPerOwner,
	})
	if err != nil {
		// The cap is enforced inside the INSERT, so hitting it writes no row.
		if errors.Is(err, sql.ErrNoRows) {
			return OAuthClientWithSecret{}, NewError(http.StatusConflict, "too_many_clients", "this account has registered the maximum number of apps")
		}
		return OAuthClientWithSecret{}, err
	}

	return OAuthClientWithSecret{
		Client: sqlc.ListOAuthClientsByOwnerRow{
			ID:             row.ID,
			ClientID:       row.ClientID,
			OwnerUserID:    row.OwnerUserID,
			Name:           row.Name,
			Website:        row.Website,
			RedirectUris:   row.RedirectUris,
			Scopes:         row.Scopes,
			IsConfidential: confidential,
			CreatedAt:      row.CreatedAt,
			UpdatedAt:      row.UpdatedAt,
		},
		Secret: secret,
	}, nil
}

// ListClients returns the apps this account has registered.
func (s *OAuthService) ListClients(ctx context.Context, userID uuid.UUID) ([]sqlc.ListOAuthClientsByOwnerRow, error) {
	if s.store == nil {
		return nil, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	rows, err := s.store.Q.ListOAuthClientsByOwner(ctx, userID)
	if err != nil {
		return nil, err
	}
	if rows == nil {
		rows = []sqlc.ListOAuthClientsByOwnerRow{}
	}
	return rows, nil
}

// RotateClientSecret issues a new secret and invalidates the old one.
//
// Step-up gated at the handler. The secret is the credential that lets an app
// act as its owner, so replacing it is on a level with changing the password
// rather than with editing a display name.
func (s *OAuthService) RotateClientSecret(ctx context.Context, userID, clientUUID uuid.UUID) (OAuthClientWithSecret, error) {
	if s.store == nil {
		return OAuthClientWithSecret{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	existing, err := s.store.Q.GetOAuthClientByIDForOwner(ctx, sqlc.GetOAuthClientByIDForOwnerParams{
		ID:          clientUUID,
		OwnerUserID: userID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OAuthClientWithSecret{}, NewError(http.StatusNotFound, "not_found", "client not found")
		}
		return OAuthClientWithSecret{}, err
	}
	if len(existing.ClientSecretHash) == 0 {
		return OAuthClientWithSecret{}, NewError(http.StatusConflict, "public_client", "this client is public and has no secret")
	}

	secret, err := auth.RandomToken(clientSecretEntropyBytes)
	if err != nil {
		return OAuthClientWithSecret{}, err
	}

	row, err := s.store.Q.RotateOAuthClientSecret(ctx, sqlc.RotateOAuthClientSecretParams{
		ID:               clientUUID,
		OwnerUserID:      userID,
		ClientSecretHash: auth.HashRefreshToken(secret),
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OAuthClientWithSecret{}, NewError(http.StatusNotFound, "not_found", "client not found")
		}
		return OAuthClientWithSecret{}, err
	}

	return OAuthClientWithSecret{
		Client: sqlc.ListOAuthClientsByOwnerRow{
			ID:             row.ID,
			ClientID:       row.ClientID,
			OwnerUserID:    row.OwnerUserID,
			Name:           row.Name,
			Website:        row.Website,
			RedirectUris:   row.RedirectUris,
			Scopes:         row.Scopes,
			IsConfidential: true,
			CreatedAt:      row.CreatedAt,
			UpdatedAt:      row.UpdatedAt,
		},
		Secret: secret,
	}, nil
}

// DeleteClient removes an app. Its tokens go with it through the cascade, so
// deleting is also the blunt way to sign every user of the app out.
func (s *OAuthService) DeleteClient(ctx context.Context, userID, clientUUID uuid.UUID) error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	affected, err := s.store.Q.DeleteOAuthClient(ctx, sqlc.DeleteOAuthClientParams{
		ID:          clientUUID,
		OwnerUserID: userID,
	})
	if err != nil {
		return err
	}
	if affected == 0 {
		return NewError(http.StatusNotFound, "not_found", "client not found")
	}
	return nil
}

// ListAuthorizations returns the apps currently holding a live token for this
// account — the "connected apps" list.
func (s *OAuthService) ListAuthorizations(ctx context.Context, userID uuid.UUID) ([]sqlc.ListOAuthAuthorizationsRow, error) {
	if s.store == nil {
		return nil, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	rows, err := s.store.Q.ListOAuthAuthorizations(ctx, userID)
	if err != nil {
		return nil, err
	}
	if rows == nil {
		rows = []sqlc.ListOAuthAuthorizationsRow{}
	}
	return rows, nil
}

// RevokeAuthorization disconnects one app from this account.
func (s *OAuthService) RevokeAuthorization(ctx context.Context, userID uuid.UUID, clientPublicID string) error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	client, err := s.store.Q.GetOAuthClientByClientID(ctx, strings.TrimSpace(clientPublicID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return NewError(http.StatusNotFound, "not_found", "client not found")
		}
		return err
	}
	_, err = s.store.Q.RevokeOAuthGrant(ctx, sqlc.RevokeOAuthGrantParams{
		ClientID: client.ID,
		UserID:   userID,
	})
	return err
}

func normalizeScopes(scopes []string) ([]string, bool) {
	return auth.ParseScope(strings.Join(scopes, " "))
}

func validateRedirectURIs(uris []string) error {
	if len(uris) == 0 {
		return NewError(http.StatusBadRequest, "invalid_request", "at least one redirect URI is required")
	}
	if len(uris) > maxRedirectURIs {
		return NewError(http.StatusBadRequest, "invalid_request", "too many redirect URIs")
	}
	for _, raw := range uris {
		if len(raw) > maxRedirectURILen {
			return NewError(http.StatusBadRequest, "invalid_request", "redirect URI is too long")
		}
		u, err := url.Parse(raw)
		if err != nil || !u.IsAbs() {
			return NewError(http.StatusBadRequest, "invalid_request", "redirect URI must be absolute")
		}
		// A fragment is never sent to the server and RFC 6749 §3.1.2 forbids
		// one here, so a registered URI carrying one could never be matched.
		if u.Fragment != "" || strings.Contains(raw, "#") {
			return NewError(http.StatusBadRequest, "invalid_request", "redirect URI must not contain a fragment")
		}
		// https, or loopback over http for native apps that cannot have a
		// certificate. Plain http to any other host would put authorization
		// codes on the wire in clear text.
		if u.Scheme == "https" {
			continue
		}
		if isLoopback(u) {
			continue
		}
		return NewError(http.StatusBadRequest, "invalid_request", "redirect URI must use https, or http on a loopback address")
	}
	return nil
}

func validHTTPURL(raw string) bool {
	u, err := url.Parse(raw)
	return err == nil && u.IsAbs() && (u.Scheme == "http" || u.Scheme == "https") && u.Host != ""
}
