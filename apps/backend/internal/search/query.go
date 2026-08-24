package search

import (
	"fmt"
	"strings"
	"time"
)

// MaxQueryLength bounds the raw query string. Mirrors the OpenAPI schema.
const MaxQueryLength = 256

// ParseQuery turns a raw user query into a Query. The supported mini-syntax is
//
//	from:alice          restrict to a username (a leading @ is allowed)
//	#tag or tag:name    require the exact hashtag (posts) or bio hashtag (users)
//	since:2026-01-01    created on or after this date (UTC)
//	until:2026-01-31    created on or before this date (UTC, inclusive)
//	"exact phrase"      phrase match, passed through to the engine
//	OR                  relax matching to any term (default: all terms)
//	AND                 require all terms (the default, accepted for symmetry)
//
// Anything else becomes free text. OR/AND must be uppercase so the ordinary
// English words stay searchable.
//
// ponytail: OR/AND is a single strategy switch for the whole query, not a
// per-term boolean expression, so `a AND (b OR c)` cannot be expressed. If
// grouped booleans are ever needed, build them from Meilisearch's compound
// filters or by merging several searches.
func ParseQuery(raw string, limit, offset int) (Query, error) {
	if len(raw) > MaxQueryLength {
		return Query{}, fmt.Errorf("query must be at most %d characters", MaxQueryLength)
	}

	q := Query{MatchAll: true, Limit: limit, Offset: offset}
	var text []string

	for _, tok := range tokenize(raw) {
		if tok.quoted {
			// Re-quote so the engine still sees it as a phrase.
			text = append(text, `"`+tok.value+`"`)
			continue
		}
		switch tok.value {
		case "OR":
			q.MatchAll = false
			continue
		case "AND":
			q.MatchAll = true
			continue
		}

		key, value, isDirective := strings.Cut(tok.value, ":")

		// A bare #tag (or tag:) filters on the exact hashtag instead of
		// searching for the word, so "#VRChat" never matches plain "VRChat".
		if !isDirective && strings.HasPrefix(tok.value, "#") {
			if tag, ok := NormalizeTag(tok.value); ok {
				q.Tags = append(q.Tags, tag)
				continue
			}
			text = append(text, tok.value)
			continue
		}
		if isDirective && strings.EqualFold(key, "tag") {
			tag, ok := NormalizeTag(value)
			if !ok {
				return Query{}, fmt.Errorf(`"tag:" needs a hashtag name`)
			}
			q.Tags = append(q.Tags, tag)
			continue
		}
		if !isDirective {
			text = append(text, tok.value)
			continue
		}
		switch strings.ToLower(key) {
		case "from":
			username := strings.TrimPrefix(value, "@")
			if username == "" {
				return Query{}, fmt.Errorf(`"from:" needs a username`)
			}
			q.Username = username
		case "since":
			t, err := parseDate(value, false)
			if err != nil {
				return Query{}, fmt.Errorf(`"since:" %w`, err)
			}
			q.Since = &t
		case "until":
			t, err := parseDate(value, true)
			if err != nil {
				return Query{}, fmt.Errorf(`"until:" %w`, err)
			}
			q.Until = &t
		default:
			// Not a directive we know: treat the whole token as text so a
			// colon in ordinary content still searches.
			text = append(text, tok.value)
		}
	}

	if q.Since != nil && q.Until != nil && q.Since.After(*q.Until) {
		return Query{}, fmt.Errorf(`"since:" must not be later than "until:"`)
	}

	q.Text = strings.Join(text, " ")
	return q, nil
}

// parseDate accepts a plain UTC date or a full RFC 3339 timestamp. For a plain
// date, endOfDay pushes it to the last second so `until:` includes that day.
func parseDate(value string, endOfDay bool) (time.Time, error) {
	if value == "" {
		return time.Time{}, fmt.Errorf("needs a date (YYYY-MM-DD)")
	}
	if t, err := time.Parse(time.RFC3339, value); err == nil {
		return t.UTC(), nil
	}
	t, err := time.Parse("2006-01-02", value)
	if err != nil {
		return time.Time{}, fmt.Errorf("must be YYYY-MM-DD or an RFC 3339 timestamp, got %q", value)
	}
	if endOfDay {
		t = t.Add(24*time.Hour - time.Second)
	}
	return t.UTC(), nil
}

type token struct {
	value  string
	quoted bool
}

// tokenize splits on whitespace while keeping double-quoted runs intact, so a
// phrase like "hello world" survives as one token and its inner spaces and
// colons are never mistaken for separators or directives. An unterminated
// quote runs to the end of the input rather than failing.
func tokenize(raw string) []token {
	var (
		tokens  []token
		current strings.Builder
		inQuote bool
	)
	flush := func(quoted bool) {
		if current.Len() > 0 {
			tokens = append(tokens, token{value: current.String(), quoted: quoted})
		}
		current.Reset()
	}
	for _, r := range raw {
		switch {
		case r == '"':
			if inQuote {
				flush(true)
			} else {
				flush(false)
			}
			inQuote = !inQuote
		case !inQuote && (r == ' ' || r == '\t' || r == '\n' || r == '\r' || r == '　'):
			flush(false)
		default:
			current.WriteRune(r)
		}
	}
	flush(inQuote)
	return tokens
}
