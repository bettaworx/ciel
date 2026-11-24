//go:build integration
// +build integration

package integration_test

import (
	"context"
	"fmt"
	"os"
	"slices"
	"testing"
	"time"

	"backend/internal/search"

	"github.com/google/uuid"
)

// TestMeilisearchProvider runs every Provider method against a real
// Meilisearch, so a client library upgrade that changes the wire format or the
// error shape fails here instead of in production.
//
// It needs MEILISEARCH_TEST_HOST (and MEILISEARCH_TEST_API_KEY when the
// instance has a master key). The provider writes to the fixed production
// index names, so this deliberately does not read MEILISEARCH_HOST: pointing
// it at a dev instance has to be a conscious choice. Documents are keyed by a
// per-run token and removed afterwards.
func TestMeilisearchProvider(t *testing.T) {
	host := os.Getenv("MEILISEARCH_TEST_HOST")
	if host == "" {
		t.Skip("MEILISEARCH_TEST_HOST not set")
	}
	ctx := context.Background()
	m := search.NewMeilisearch(host, os.Getenv("MEILISEARCH_TEST_API_KEY"))

	// The second call takes the "index already exists" path.
	for range 2 {
		if err := m.EnsureIndexes(ctx); err != nil {
			t.Fatalf("EnsureIndexes: %v", err)
		}
	}

	basePosts := waitCount(t, m.PostCount)
	baseUsers := waitCount(t, m.UserCount)

	// Meilisearch tokenizes on non-alphanumerics, so the token has to be one
	// word for the searches below to match it as a single term.
	token := "ciel" + uuid.NewString()[:8]
	tag := "tag" + token
	alice, bob := uuid.New(), uuid.New()
	t0 := time.Now().Add(-time.Hour).Truncate(time.Second)

	// Indexed out of chronological order, so the order the search returns
	// comes from the createdAt sort rather than from insertion.
	p1 := search.PostDoc{ID: uuid.NewString(), Content: token + " alpha", UserID: alice.String(), CreatedAt: t0.Unix()}
	p3 := search.PostDoc{ID: uuid.NewString(), Content: token + " gamma", Tags: []string{tag}, UserID: bob.String(), CreatedAt: t0.Add(20 * time.Second).Unix()}
	p2 := search.PostDoc{ID: uuid.NewString(), Content: token + " beta", Tags: []string{tag}, UserID: alice.String(), CreatedAt: t0.Add(10 * time.Second).Unix()}
	posts := []search.PostDoc{p1, p3, p2}
	u1 := search.UserDoc{ID: alice.String(), Username: "alice_" + token[4:], DisplayName: "Alice", Bio: token + " likes cats", CreatedAt: t0.Unix()}
	u2 := search.UserDoc{ID: bob.String(), Username: "bob_" + token[4:], DisplayName: "Bob", Bio: token + " likes dogs", CreatedAt: t0.Unix()}

	t.Cleanup(func() {
		ctx := context.Background()
		_ = m.DeletePosts(ctx, ids(p1.ID, p2.ID, p3.ID)...)
		_ = m.DeleteUsers(ctx, alice, bob)
	})

	if err := m.IndexPosts(ctx, posts...); err != nil {
		t.Fatalf("IndexPosts: %v", err)
	}
	if err := m.IndexUsers(ctx, u1, u2); err != nil {
		t.Fatalf("IndexUsers: %v", err)
	}
	// Writes are queued, not applied, when Index* returns.
	waitFor(t, "post count", func() (bool, error) {
		n, err := m.PostCount(ctx)
		return n == basePosts+3, err
	})
	waitFor(t, "user count", func() (bool, error) {
		n, err := m.UserCount(ctx)
		return n == baseUsers+2, err
	})

	since, until := t0.Add(5*time.Second), t0.Add(15*time.Second)
	postCases := []struct {
		name string
		q    search.Query
		want []string
	}{
		{"newest first", search.Query{Text: token, MatchAll: true}, []string{p3.ID, p2.ID, p1.ID}},
		{"every term must match", search.Query{Text: token + " alpha", MatchAll: true}, []string{p1.ID}},
		{"relaxed matching drops trailing terms", search.Query{Text: token + " alpha"}, []string{p3.ID, p2.ID, p1.ID}},
		{"author filter", search.Query{Text: token, MatchAll: true, AuthorID: &alice}, []string{p2.ID, p1.ID}},
		{"since and until", search.Query{Text: token, MatchAll: true, Since: &since, Until: &until}, []string{p2.ID}},
		{"tag filter", search.Query{Text: token, MatchAll: true, Tags: []string{tag}}, []string{p3.ID, p2.ID}},
		{"limit and offset", search.Query{Text: token, MatchAll: true, Limit: 1, Offset: 1}, []string{p2.ID}},
	}
	for _, tc := range postCases {
		t.Run("SearchPosts/"+tc.name, func(t *testing.T) {
			q := tc.q
			if q.Limit == 0 {
				q.Limit = 20
			}
			res, err := m.SearchPosts(ctx, q)
			if err != nil {
				t.Fatalf("SearchPosts: %v", err)
			}
			if got := idStrings(res.IDs); !slices.Equal(got, tc.want) {
				t.Fatalf("got %v, want %v", got, tc.want)
			}
			if tc.q.Limit == 0 && res.EstimatedTotal != int64(len(tc.want)) {
				t.Fatalf("EstimatedTotal = %d, want %d", res.EstimatedTotal, len(tc.want))
			}
		})
	}

	t.Run("SearchUsers ignores the author filter", func(t *testing.T) {
		res, err := m.SearchUsers(ctx, search.Query{Text: token + " cats", MatchAll: true, AuthorID: &bob, Limit: 20})
		if err != nil {
			t.Fatalf("SearchUsers: %v", err)
		}
		if got := idStrings(res.IDs); !slices.Equal(got, []string{alice.String()}) {
			t.Fatalf("got %v, want [%s]", got, alice)
		}
	})

	// Deletes run last: each one is checked through the search it affects.
	if err := m.DeletePosts(ctx, ids(p1.ID)...); err != nil {
		t.Fatalf("DeletePosts: %v", err)
	}
	waitForPosts(t, m, token, []string{p3.ID, p2.ID})

	if err := m.DeletePostsByAuthor(ctx, bob); err != nil {
		t.Fatalf("DeletePostsByAuthor: %v", err)
	}
	waitForPosts(t, m, token, []string{p2.ID})

	if err := m.DeleteUsers(ctx, alice); err != nil {
		t.Fatalf("DeleteUsers: %v", err)
	}
	waitFor(t, "user deleted", func() (bool, error) {
		res, err := m.SearchUsers(ctx, search.Query{Text: token, MatchAll: true, Limit: 20})
		return slices.Equal(idStrings(res.IDs), []string{bob.String()}), err
	})
}

func waitForPosts(t *testing.T, m *search.Meilisearch, token string, want []string) {
	t.Helper()
	waitFor(t, fmt.Sprintf("posts %v", want), func() (bool, error) {
		res, err := m.SearchPosts(context.Background(), search.Query{Text: token, MatchAll: true, Limit: 20})
		return slices.Equal(idStrings(res.IDs), want), err
	})
}

// waitCount reads a count once the index is queryable; a fresh instance may
// still be processing the index creation that EnsureIndexes queued.
func waitCount(t *testing.T, count func(context.Context) (int64, error)) int64 {
	t.Helper()
	var n int64
	waitFor(t, "index ready", func() (bool, error) {
		var err error
		n, err = count(context.Background())
		return err == nil, err
	})
	return n
}

func waitFor(t *testing.T, what string, cond func() (bool, error)) {
	t.Helper()
	deadline := time.Now().Add(30 * time.Second)
	var lastErr error
	for time.Now().Before(deadline) {
		ok, err := cond()
		if ok && err == nil {
			return
		}
		lastErr = err
		time.Sleep(200 * time.Millisecond)
	}
	t.Fatalf("timed out waiting for %s: %v", what, lastErr)
}

func ids(ss ...string) []uuid.UUID {
	out := make([]uuid.UUID, len(ss))
	for i, s := range ss {
		out[i] = uuid.MustParse(s)
	}
	return out
}

func idStrings(us []uuid.UUID) []string {
	out := make([]string, len(us))
	for i, u := range us {
		out[i] = u.String()
	}
	return out
}
