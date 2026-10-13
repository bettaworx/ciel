package auth

import (
	"context"
	"errors"

	"github.com/google/uuid"
)

type User struct {
	ID       uuid.UUID
	Username string

	// Set only when the request authenticated with an API token — an OAuth2
	// access token, or a personal access token. A first-party session (the
	// cookie, or a bearer JWT) leaves these zero, and zero means "not
	// scope-limited" rather than "no permissions": the scope middleware is a
	// no-op for those and the app behaves exactly as it did before OAuth
	// existed.
	//
	// Nothing existing breaks by adding these, which is precisely the hazard:
	// every auth.UserFromContext caller keeps compiling and will happily treat
	// an API token as a full session. That is why the restrictions live in one
	// middleware that denies by default, plus the IsAPIToken guards on the
	// step-up and permission paths, rather than in the call sites.
	TokenID uuid.UUID
	// The app acting on the user's behalf. Zero for a personal access token,
	// which has no app — so this must never be what decides whether a request
	// is scope-limited. TokenID is.
	ClientID uuid.UUID
	Scopes   []string
}

// IsAPIToken reports whether this request came in on a scope-limited API token
// rather than a first-party session.
//
// Keyed on TokenID and not ClientID. A personal access token has no client, so
// a ClientID test would report one as a first-party session — and a first-party
// session is exempt from every scope check, the admin guard and the step-up
// guard. That single wrong field would hand every personal token full account
// access.
func (u User) IsAPIToken() bool {
	return u.TokenID != uuid.Nil
}

// HasScope reports whether the request carries the named scope. Always true for
// a first-party session, which is not scope-limited.
func (u User) HasScope(scope string) bool {
	if !u.IsAPIToken() {
		return true
	}
	return HasScope(u.Scopes, scope)
}

type contextKey int

const userContextKey contextKey = 1

var ErrUnauthorized = errors.New("unauthorized")

func WithUser(ctx context.Context, user User) context.Context {
	return context.WithValue(ctx, userContextKey, user)
}

func UserFromContext(ctx context.Context) (User, bool) {
	user, ok := ctx.Value(userContextKey).(User)
	return user, ok
}

func RequireUser(ctx context.Context) (User, error) {
	user, ok := UserFromContext(ctx)
	if !ok {
		return User{}, ErrUnauthorized
	}
	return user, nil
}
