package search_test

import (
	"testing"
	"time"

	"backend/internal/search"
)

func TestParseQuery(t *testing.T) {
	date := func(s string) *time.Time {
		t.Helper()
		parsed, err := time.Parse(time.RFC3339, s)
		if err != nil {
			t.Fatalf("bad test date %q: %v", s, err)
		}
		return &parsed
	}

	tests := []struct {
		name     string
		raw      string
		wantText string
		wantAll  bool
		wantUser string
		wantFrom *time.Time
		wantTo   *time.Time
	}{
		{
			name:     "plain text defaults to matching every term",
			raw:      "hello world",
			wantText: "hello world",
			wantAll:  true,
		},
		{
			name:     "from restricts the author",
			raw:      "from:alice cats",
			wantText: "cats",
			wantAll:  true,
			wantUser: "alice",
		},
		{
			name:     "from tolerates a leading at sign",
			raw:      "from:@alice",
			wantText: "",
			wantAll:  true,
			wantUser: "alice",
		},
		{
			name:     "since and until bound the date range inclusively",
			raw:      "since:2026-01-01 until:2026-01-31 cats",
			wantText: "cats",
			wantAll:  true,
			wantFrom: date("2026-01-01T00:00:00Z"),
			wantTo:   date("2026-01-31T23:59:59Z"),
		},
		{
			name:     "rfc3339 timestamps are accepted verbatim",
			raw:      "since:2026-01-01T09:30:00Z",
			wantText: "",
			wantAll:  true,
			wantFrom: date("2026-01-01T09:30:00Z"),
		},
		{
			name:     "quoted phrases keep their spaces and quotes",
			raw:      `"hello world" cats`,
			wantText: `"hello world" cats`,
			wantAll:  true,
		},
		{
			name:     "a colon inside a quoted phrase is not a directive",
			raw:      `"from:alice is a quote"`,
			wantText: `"from:alice is a quote"`,
			wantAll:  true,
		},
		{
			name:     "bare uppercase OR relaxes matching",
			raw:      "cat OR dog",
			wantText: "cat dog",
			wantAll:  false,
		},
		{
			name:     "bare uppercase AND requires every term",
			raw:      "cat AND dog",
			wantText: "cat dog",
			wantAll:  true,
		},
		{
			name:     "lowercase or stays searchable text",
			raw:      "cat or dog",
			wantText: "cat or dog",
			wantAll:  true,
		},
		{
			name:     "unknown directives stay as text",
			raw:      "http://example.com",
			wantText: "http://example.com",
			wantAll:  true,
		},
		{
			name:     "everything combined",
			raw:      `from:@bob since:2026-02-01 "exact phrase" cat OR dog`,
			wantText: `"exact phrase" cat dog`,
			wantAll:  false,
			wantUser: "bob",
			wantFrom: date("2026-02-01T00:00:00Z"),
		},
		{
			name:     "full width spaces separate tokens",
			raw:      "from:alice　cats",
			wantText: "cats",
			wantAll:  true,
			wantUser: "alice",
		},
		{
			name:     "an empty query is valid and matches everything",
			raw:      "",
			wantText: "",
			wantAll:  true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := search.ParseQuery(tc.raw, 30, 0)
			if err != nil {
				t.Fatalf("ParseQuery(%q) returned error: %v", tc.raw, err)
			}
			if got.Text != tc.wantText {
				t.Errorf("Text = %q, want %q", got.Text, tc.wantText)
			}
			if got.MatchAll != tc.wantAll {
				t.Errorf("MatchAll = %v, want %v", got.MatchAll, tc.wantAll)
			}
			if got.Username != tc.wantUser {
				t.Errorf("Username = %q, want %q", got.Username, tc.wantUser)
			}
			assertTime(t, "Since", got.Since, tc.wantFrom)
			assertTime(t, "Until", got.Until, tc.wantTo)
			if got.Limit != 30 || got.Offset != 0 {
				t.Errorf("Limit/Offset = %d/%d, want 30/0", got.Limit, got.Offset)
			}
		})
	}
}

func TestParseQueryRejectsBadInput(t *testing.T) {
	tests := []struct {
		name string
		raw  string
	}{
		{"from without a username", "from:"},
		{"from with only an at sign", "from:@"},
		{"since that is not a date", "since:yesterday"},
		{"until that is not a date", "until:2026-13-45"},
		{"since later than until", "since:2026-02-01 until:2026-01-01"},
		{"query over the length limit", string(make([]byte, search.MaxQueryLength+1))},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := search.ParseQuery(tc.raw, 30, 0); err == nil {
				t.Fatalf("ParseQuery(%q) succeeded, want an error", tc.raw)
			}
		})
	}
}

func assertTime(t *testing.T, field string, got, want *time.Time) {
	t.Helper()
	switch {
	case got == nil && want == nil:
	case got == nil:
		t.Errorf("%s = nil, want %s", field, want.Format(time.RFC3339))
	case want == nil:
		t.Errorf("%s = %s, want nil", field, got.Format(time.RFC3339))
	case !got.Equal(*want):
		t.Errorf("%s = %s, want %s", field, got.Format(time.RFC3339), want.Format(time.RFC3339))
	}
}
