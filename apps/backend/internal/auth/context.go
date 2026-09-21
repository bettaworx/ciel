package auth

import (
	"context"
	"errors"

	"github.com/google/uuid"
)

type User struct {
	ID       uuid.UUID
	Username string

	// Set only when the request authenticated with an OAuth2 access token.
	// A first-party session — the cookie, or a bearer JWT — leaves both zero,
	// and zero means "not scope-limited" rather than "no permissions": the
	// scope middleware is a no-op for those and the app behaves exactly as it
	// did before OAuth existed.
	//
	// Nothing existing breaks by adding these, which is precisely the hazard:
	// every auth.UserFromContext caller keeps compiling and will happily treat
	// an OAuth request as a full session. That is why the restrictions live in
	// one middleware that denies by default, plus the IsOAuth guards on the
	// step-up and permission paths, rather than in the call sites.
	ClientID uuid.UUID
	Scopes   []string
}

// IsOAuth reports whether this request came in on an OAuth2 access token rather
// than a first-party session.
func (u User) IsOAuth() bool {
	return u.ClientID != uuid.Nil
}

// HasScope reports whether the request carries the named scope. Always true for
// a first-party session, which is not scope-limited.
func (u User) HasScope(scope string) bool {
	if !u.IsOAuth() {
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
