package auth

import (
	"context"
	"errors"

	"github.com/google/uuid"
)

type User struct {
	ID       uuid.UUID
	Username string
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
