package search

import (
	"context"

	"github.com/google/uuid"
)

// NoOp is the provider used when search is not configured. Writes are dropped
// so callers on the write path need no branching, and reads fail with
// ErrUnavailable so handlers can answer 503.
type NoOp struct{}

var _ Provider = NoOp{}

func (NoOp) Name() string                                         { return "none" }
func (NoOp) EnsureIndexes(context.Context) error                  { return nil }
func (NoOp) IndexPosts(context.Context, ...PostDoc) error         { return nil }
func (NoOp) DeletePosts(context.Context, ...uuid.UUID) error      { return nil }
func (NoOp) DeletePostsByAuthor(context.Context, uuid.UUID) error { return nil }
func (NoOp) IndexUsers(context.Context, ...UserDoc) error         { return nil }
func (NoOp) DeleteUsers(context.Context, ...uuid.UUID) error      { return nil }

func (NoOp) SearchPosts(context.Context, Query) (Result, error) {
	return Result{}, ErrUnavailable
}

func (NoOp) SearchUsers(context.Context, Query) (Result, error) {
	return Result{}, ErrUnavailable
}

func (NoOp) PostCount(context.Context) (int64, error) { return 0, nil }
func (NoOp) UserCount(context.Context) (int64, error) { return 0, nil }
