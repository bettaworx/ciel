package service

import (
	"context"
	"net/http"
	"strings"
	"time"

	"backend/internal/auth"
	"backend/internal/db/sqlc"

	"github.com/google/uuid"
)

const (
	// A personal token exists to be pasted into a bot's configuration and left
	// there, so an hour — the OAuth access token lifetime — would be useless.
	// A year rather than never: a credential that cannot expire is one nobody
	// ever notices they left behind, and the list shows the date so it is not a
	// surprise.
	personalTokenTTL = 365 * 24 * time.Hour

	maxPersonalTokensPerUser = 20
	maxPersonalTokenNameLen  = 60
)

// PersonalAccessToken is one issued token, without the secret.
type PersonalAccessToken struct {
	ID        uuid.UUID
	Name      string
	Scopes    []string
	ExpiresAt time.Time
	CreatedAt time.Time
}

// IssuedPersonalAccessToken carries the secret back to the one response allowed
// to contain it.
type IssuedPersonalAccessToken struct {
	Token PersonalAccessToken
	// The server stores only a hash, so this is the single moment the token
	// exists anywhere it can be read.
	Secret string
}

// CreatePersonalAccessToken issues a token that acts as the given user.
//
// The OAuth flow's consent screen is what makes a third-party grant deliberate.
// Here the owner is both parties, so there is nobody to ask — the equivalent
// friction is the step-up prompt the handler puts in front of this.
func (s *OAuthService) CreatePersonalAccessToken(
	ctx context.Context, userID uuid.UUID, name string, scopes []string,
) (IssuedPersonalAccessToken, error) {
	if s.store == nil {
		return IssuedPersonalAccessToken{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	name = strings.TrimSpace(name)
	if name == "" || len(name) > maxPersonalTokenNameLen {
		return IssuedPersonalAccessToken{}, NewError(http.StatusBadRequest, "invalid_request", "name must be 1 to 60 characters")
	}

	parsedScopes, ok := normalizeScopes(scopes)
	if !ok {
		return IssuedPersonalAccessToken{}, NewError(http.StatusBadRequest, "invalid_scope", "unknown or empty scope")
	}

	// Not race-free the way the client cap is, because there is no INSERT ...
	// SELECT to hang it off: the insert has no natural subquery to guard. Two
	// simultaneous creates could both pass and leave the user one over.
	//
	// ponytail: read-then-insert cap. The consequence of losing the race is one
	// extra token for the person who asked for both, which is not a security
	// boundary — this is here to stop the table filling up, not to stop the
	// owner having tokens. Make it an INSERT ... SELECT like CreateOAuthClient
	// if that ever stops being true.
	count, err := s.store.Q.CountPersonalAccessTokens(ctx, userID)
	if err != nil {
		return IssuedPersonalAccessToken{}, err
	}
	if count >= maxPersonalTokensPerUser {
		return IssuedPersonalAccessToken{}, NewError(http.StatusConflict, "too_many_tokens", "this account has the maximum number of access tokens")
	}

	raw, err := auth.RandomToken(oauthTokenEntropyBytes)
	if err != nil {
		return IssuedPersonalAccessToken{}, err
	}
	// The same prefix an OAuth access token carries, because it is the same
	// kind of credential and the auth middleware tells them from session JWTs
	// by exactly this.
	secret := AccessTokenPrefix + raw

	row, err := s.store.Q.CreatePersonalAccessToken(ctx, sqlc.CreatePersonalAccessTokenParams{
		UserID:          userID,
		Name:            name,
		Scopes:          parsedScopes,
		AccessTokenHash: auth.HashRefreshToken(secret),
		AccessExpiresAt: time.Now().UTC().Add(personalTokenTTL),
	})
	if err != nil {
		return IssuedPersonalAccessToken{}, err
	}

	return IssuedPersonalAccessToken{
		Token: PersonalAccessToken{
			ID:        row.ID,
			Name:      row.Name.String,
			Scopes:    row.Scopes,
			ExpiresAt: row.AccessExpiresAt,
			CreatedAt: row.CreatedAt,
		},
		Secret: secret,
	}, nil
}

// ListPersonalAccessTokens returns the account's live personal tokens.
func (s *OAuthService) ListPersonalAccessTokens(ctx context.Context, userID uuid.UUID) ([]PersonalAccessToken, error) {
	if s.store == nil {
		return nil, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	rows, err := s.store.Q.ListPersonalAccessTokens(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]PersonalAccessToken, 0, len(rows))
	for _, row := range rows {
		out = append(out, PersonalAccessToken{
			ID:        row.ID,
			Name:      row.Name.String,
			Scopes:    row.Scopes,
			ExpiresAt: row.AccessExpiresAt,
			CreatedAt: row.CreatedAt,
		})
	}
	return out, nil
}

// RevokePersonalAccessToken revokes one of the account's own tokens.
func (s *OAuthService) RevokePersonalAccessToken(ctx context.Context, userID, tokenID uuid.UUID) error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	affected, err := s.store.Q.RevokePersonalAccessToken(ctx, sqlc.RevokePersonalAccessTokenParams{
		ID:     tokenID,
		UserID: userID,
	})
	if err != nil {
		return err
	}
	// The query is scoped to the owner, so somebody else's token id matches
	// nothing and reports not found rather than confirming it exists.
	if affected == 0 {
		return NewError(http.StatusNotFound, "not_found", "token not found")
	}
	return nil
}
