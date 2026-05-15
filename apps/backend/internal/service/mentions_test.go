package service

import (
	"reflect"
	"strings"
	"testing"
)

func TestExtractMentions(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		content string
		cap     int
		want    []string
	}{
		{
			name:    "empty content",
			content: "",
			cap:     50,
			want:    nil,
		},
		{
			name:    "no mentions",
			content: "Hello world, no mentions here.",
			cap:     50,
			want:    nil,
		},
		{
			name:    "single mention at start",
			content: "@alice hello",
			cap:     50,
			want:    []string{"alice"},
		},
		{
			name:    "multiple distinct mentions",
			content: "Hey @alice and @bob, please review.",
			cap:     50,
			want:    []string{"alice", "bob"},
		},
		{
			name:    "duplicate mentions dedupe to first occurrence",
			content: "@alice @bob @alice @alice",
			cap:     50,
			want:    []string{"alice", "bob"},
		},
		{
			name:    "email-like patterns do not match",
			content: "Send to foo@bar and contact admin@example.com",
			cap:     50,
			want:    nil,
		},
		{
			name:    "mention after newline",
			content: "Line one\n@alice line two",
			cap:     50,
			want:    []string{"alice"},
		},
		{
			name:    "underscore in username",
			content: "ping @my_user thanks",
			cap:     50,
			want:    []string{"my_user"},
		},
		{
			name:    "too short username (< 3 chars) is ignored",
			content: "hi @a @ab @abc",
			cap:     50,
			want:    []string{"abc"},
		},
		{
			name:    "hyphens terminate the username — capture up to but not including the hyphen",
			content: "ping @user-foo",
			cap:     50,
			want:    []string{"user"},
		},
		{
			name:    "cap limits result count",
			content: "@alice @bob @carol @dave @eve",
			cap:     2,
			want:    []string{"alice", "bob"},
		},
		{
			name:    "zero cap returns nil",
			content: "@alice",
			cap:     0,
			want:    nil,
		},
		{
			name:    "consecutive mentions separated by spaces",
			content: "@alice@bob",
			cap:     50,
			want:    []string{"alice"},
		},
		{
			name:    "punctuation around mention",
			content: "Hi, @alice! How are you @bob?",
			cap:     50,
			want:    []string{"alice", "bob"},
		},
		{
			name:    "mention enclosed in parentheses",
			content: "Reply (@alice)",
			cap:     50,
			want:    []string{"alice"},
		},
		{
			name:    "long username 32 chars",
			content: "@" + strings.Repeat("a", 32),
			cap:     50,
			want:    []string{strings.Repeat("a", 32)},
		},
		{
			name:    "username longer than 32 chars truncates to first 32",
			content: "@" + strings.Repeat("a", 35),
			cap:     50,
			want:    []string{strings.Repeat("a", 32)},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := ExtractMentions(tt.content, tt.cap)
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ExtractMentions(%q, %d) = %v, want %v", tt.content, tt.cap, got, tt.want)
			}
		})
	}
}

func TestExtractMentions_MaxMentionsPerPostCap(t *testing.T) {
	t.Parallel()

	var parts []string
	for i := 0; i < MaxMentionsPerPost+10; i++ {
		parts = append(parts, "@user"+string(rune('a'+i%26))+string(rune('a'+(i/26)%26)))
	}
	content := strings.Join(parts, " ")
	got := ExtractMentions(content, MaxMentionsPerPost)
	if len(got) != MaxMentionsPerPost {
		t.Errorf("expected exactly %d mentions, got %d", MaxMentionsPerPost, len(got))
	}
}
