package search

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/meilisearch/meilisearch-go"
)

const (
	postsIndex = "ciel_posts"
	usersIndex = "ciel_users"
)

// Meilisearch is the Meilisearch Community Edition provider.
type Meilisearch struct {
	client meilisearch.ServiceManager
}

var _ Provider = (*Meilisearch)(nil)

func NewMeilisearch(host, apiKey string) *Meilisearch {
	var opts []meilisearch.Option
	if apiKey != "" {
		opts = append(opts, meilisearch.WithAPIKey(apiKey))
	}
	return &Meilisearch{client: meilisearch.New(host, opts...)}
}

func (m *Meilisearch) Name() string { return "meilisearch" }

// EnsureIndexes creates both indexes and applies their settings. Meilisearch
// rejects a create for an existing index, which is expected on every restart
// after the first, so that error is tolerated; the settings update that
// follows is what actually has to succeed.
func (m *Meilisearch) EnsureIndexes(ctx context.Context) error {
	// Posts are searched by content only. The author and hashtags are filters
	// (from:, #tag), not matchable fields, because finding people is what the
	// users index is for and tags must match exactly.
	if err := m.ensureIndex(ctx, postsIndex, &meilisearch.Settings{
		SearchableAttributes: []string{"content"},
		FilterableAttributes: []string{"userId", "createdAt", "tags"},
		SortableAttributes:   []string{"createdAt"},
		// Meilisearch's default rules with sort moved to the front. Left in its
		// default fifth position sort only breaks ties, so the createdAt:desc
		// that SearchPosts asks for would leave older posts on top. Search is
		// expected to read chronologically, the same as a timeline.
		//
		// The rest of the list must stay in default order, and matches what
		// the untouched users index reports. Do not substitute the legacy
		// "attribute" rule: this version splits it into attributeRank and
		// wordPosition, and it silently accepts the old name.
		RankingRules: []string{"sort", "words", "typo", "proximity", "attributeRank", "wordPosition", "exactness"},
	}); err != nil {
		return err
	}
	return m.ensureIndex(ctx, usersIndex, &meilisearch.Settings{
		SearchableAttributes: []string{"username", "displayName", "bio"},
		FilterableAttributes: []string{"createdAt", "tags"},
		SortableAttributes:   []string{"createdAt"},
	})
}

func (m *Meilisearch) ensureIndex(ctx context.Context, uid string, settings *meilisearch.Settings) error {
	if _, err := m.client.CreateIndexWithContext(ctx, &meilisearch.IndexConfig{
		Uid:        uid,
		PrimaryKey: "id",
	}); err != nil && !isIndexAlreadyExists(err) {
		return fmt.Errorf("create index %s: %w", uid, err)
	}
	if _, err := m.client.Index(uid).UpdateSettingsWithContext(ctx, settings); err != nil {
		return fmt.Errorf("update settings for %s: %w", uid, err)
	}
	return nil
}

func isIndexAlreadyExists(err error) bool {
	var apiErr *meilisearch.Error
	if errors.As(err, &apiErr) && apiErr.MeilisearchApiError.Code == "index_already_exists" {
		return true
	}
	return strings.Contains(err.Error(), "index_already_exists")
}

// Document writes intentionally discard the returned task: Meilisearch queues
// the work and we do not want request handlers waiting on it.
func (m *Meilisearch) IndexPosts(ctx context.Context, docs ...PostDoc) error {
	if len(docs) == 0 {
		return nil
	}
	_, err := m.client.Index(postsIndex).AddDocumentsWithContext(ctx, docs, nil)
	return err
}

func (m *Meilisearch) IndexUsers(ctx context.Context, docs ...UserDoc) error {
	if len(docs) == 0 {
		return nil
	}
	_, err := m.client.Index(usersIndex).AddDocumentsWithContext(ctx, docs, nil)
	return err
}

func (m *Meilisearch) DeletePosts(ctx context.Context, ids ...uuid.UUID) error {
	return m.deleteDocuments(ctx, postsIndex, ids)
}

func (m *Meilisearch) DeleteUsers(ctx context.Context, ids ...uuid.UUID) error {
	return m.deleteDocuments(ctx, usersIndex, ids)
}

func (m *Meilisearch) DeletePostsByAuthor(ctx context.Context, userID uuid.UUID) error {
	filter := fmt.Sprintf("userId = %s", quoteFilterValue(userID.String()))
	_, err := m.client.Index(postsIndex).DeleteDocumentsByFilterWithContext(ctx, filter, nil)
	return err
}

func (m *Meilisearch) deleteDocuments(ctx context.Context, index string, ids []uuid.UUID) error {
	if len(ids) == 0 {
		return nil
	}
	identifiers := make([]string, 0, len(ids))
	for _, id := range ids {
		identifiers = append(identifiers, id.String())
	}
	_, err := m.client.Index(index).DeleteDocumentsWithContext(ctx, identifiers, nil)
	return err
}

// Post search is chronological: newest first, always. Relevance decides what
// matches, not what order it comes back in. User search is deliberately left
// on relevance, since newest-account-first is useless for finding people.
func (m *Meilisearch) SearchPosts(ctx context.Context, q Query) (Result, error) {
	return m.search(ctx, postsIndex, q, "createdAt:desc")
}

func (m *Meilisearch) SearchUsers(ctx context.Context, q Query) (Result, error) {
	// from: has no meaning when the documents are the users themselves.
	q.AuthorID = nil
	return m.search(ctx, usersIndex, q)
}

func (m *Meilisearch) search(ctx context.Context, index string, q Query, sort ...string) (Result, error) {
	strategy := meilisearch.Last
	if q.MatchAll {
		strategy = meilisearch.All
	}
	req := &meilisearch.SearchRequest{
		Limit:                int64(q.Limit),
		Offset:               int64(q.Offset),
		MatchingStrategy:     strategy,
		AttributesToRetrieve: []string{"id"},
		Sort:                 sort, // nil for user search, so the field is omitted
	}
	if filter := buildFilter(q); filter != "" {
		req.Filter = filter
	}

	resp, err := m.client.Index(index).SearchWithContext(ctx, q.Text, req)
	if err != nil {
		return Result{}, err
	}

	var hits []struct {
		ID string `json:"id"`
	}
	if err := resp.Hits.DecodeInto(&hits); err != nil {
		return Result{}, fmt.Errorf("decode hits: %w", err)
	}
	ids := make([]uuid.UUID, 0, len(hits))
	for _, hit := range hits {
		id, err := uuid.Parse(hit.ID)
		if err != nil {
			// A malformed id means the index drifted; skip it rather than
			// failing the whole search.
			continue
		}
		ids = append(ids, id)
	}
	return Result{IDs: ids, EstimatedTotal: resp.EstimatedTotalHits}, nil
}

// buildFilter renders the Query filters as a Meilisearch filter expression.
func buildFilter(q Query) string {
	var clauses []string
	if q.AuthorID != nil {
		clauses = append(clauses, fmt.Sprintf("userId = %s", quoteFilterValue(q.AuthorID.String())))
	}
	if q.Since != nil {
		clauses = append(clauses, fmt.Sprintf("createdAt >= %d", q.Since.Unix()))
	}
	if q.Until != nil {
		clauses = append(clauses, fmt.Sprintf("createdAt <= %d", q.Until.Unix()))
	}
	// Each tag becomes its own clause, so multiple tags AND together: the
	// document must carry every one of them.
	for _, tag := range q.Tags {
		clauses = append(clauses, fmt.Sprintf("tags = %s", quoteFilterValue(tag)))
	}
	return strings.Join(clauses, " AND ")
}

// quoteFilterValue escapes a value for a Meilisearch filter literal. Usernames
// are already restricted to [a-zA-Z0-9_], but the filter is a query language,
// so quote and escape rather than relying on that.
func quoteFilterValue(v string) string {
	return `"` + strings.NewReplacer(`\`, `\\`, `"`, `\"`).Replace(v) + `"`
}

func (m *Meilisearch) PostCount(ctx context.Context) (int64, error) {
	return m.count(ctx, postsIndex)
}

func (m *Meilisearch) UserCount(ctx context.Context) (int64, error) {
	return m.count(ctx, usersIndex)
}

func (m *Meilisearch) count(ctx context.Context, index string) (int64, error) {
	stats, err := m.client.Index(index).GetStatsWithContext(ctx, nil)
	if err != nil {
		return 0, err
	}
	return stats.NumberOfDocuments, nil
}
