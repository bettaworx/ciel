// Package search provides full-text search over posts and users behind a
// provider abstraction, so the backing engine can be swapped without touching
// the service layer. The provider is selected at startup from SEARCH_PROVIDER.
package search

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
)

// ErrUnavailable is returned by search operations when no provider is
// configured. Handlers map it to 503 so the rest of the app keeps working.
var ErrUnavailable = errors.New("search provider not configured")

// PostDoc is the indexed representation of a post. Only the fields needed for
// matching and filtering are stored; the API response is hydrated from the
// database, so the index never becomes a second source of truth.
//
// The author is stored as an id rather than a username so that renaming a user
// does not invalidate every post they ever wrote.
type PostDoc struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	UserID    string `json:"userId"`
	CreatedAt int64  `json:"createdAt"` // unix seconds
}

// UserDoc is the indexed representation of a user.
type UserDoc struct {
	ID          string `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	Bio         string `json:"bio"`
	CreatedAt   int64  `json:"createdAt"` // unix seconds
}

// Query is a parsed search request. Text is passed to the engine as-is
// (quoted phrases included); the remaining fields become filters.
//
// Username is what the user typed after `from:`. The service resolves it to
// AuthorID before handing the query to a provider, which only ever looks at
// AuthorID.
type Query struct {
	Text     string
	MatchAll bool // true: every term must match. false: relaxed matching.
	Username string
	AuthorID *uuid.UUID
	Since    *time.Time
	Until    *time.Time
	Limit    int
	Offset   int
}

// Result holds matching document IDs in the order the engine ranked them:
// newest first for posts, relevance order for users.
type Result struct {
	IDs            []uuid.UUID
	EstimatedTotal int64
}

// Provider is the search engine abstraction. Index* and Delete* are called on
// the write path and must be cheap; implementations should not block on the
// engine finishing its indexing work.
type Provider interface {
	// Name identifies the implementation for logging.
	Name() string
	// EnsureIndexes creates the indexes and applies their settings. Idempotent.
	EnsureIndexes(ctx context.Context) error

	IndexPosts(ctx context.Context, docs ...PostDoc) error
	DeletePosts(ctx context.Context, ids ...uuid.UUID) error
	// DeletePostsByAuthor drops every post by one author. Deleting a user
	// cascades their posts out of the database, leaving no row to reindex.
	DeletePostsByAuthor(ctx context.Context, userID uuid.UUID) error
	IndexUsers(ctx context.Context, docs ...UserDoc) error
	DeleteUsers(ctx context.Context, ids ...uuid.UUID) error

	SearchPosts(ctx context.Context, q Query) (Result, error)
	SearchUsers(ctx context.Context, q Query) (Result, error)

	// PostCount and UserCount report indexed document counts, used to decide
	// whether the startup backfill needs to run.
	PostCount(ctx context.Context) (int64, error)
	UserCount(ctx context.Context) (int64, error)
}

// New builds the provider named by SEARCH_PROVIDER. An unset or "none" value
// yields a no-op provider, matching how the app degrades when Redis or the
// database is missing.
func New() (Provider, error) {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("SEARCH_PROVIDER"))) {
	case "", "none", "disabled":
		return NoOp{}, nil
	case "meilisearch", "meili":
		host := strings.TrimSpace(os.Getenv("MEILISEARCH_HOST"))
		if host == "" {
			return NoOp{}, errors.New("MEILISEARCH_HOST must be set when SEARCH_PROVIDER=meilisearch")
		}
		return NewMeilisearch(host, os.Getenv("MEILISEARCH_API_KEY")), nil
	default:
		return NoOp{}, fmt.Errorf("unknown SEARCH_PROVIDER %q (expected \"meilisearch\" or \"none\")", os.Getenv("SEARCH_PROVIDER"))
	}
}

// Enabled reports whether the provider actually performs searches.
func Enabled(p Provider) bool {
	if p == nil {
		return false
	}
	_, noop := p.(NoOp)
	return !noop
}
