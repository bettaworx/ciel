package service

import (
	"reflect"
	"strings"
	"testing"

	"github.com/google/uuid"
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

func TestExtractPostReference(t *testing.T) {
	t.Parallel()

	base := publicBaseURL()
	validID := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")

	tests := []struct {
		name    string
		content string
		want    *uuid.UUID
	}{
		{
			name:    "empty content",
			content: "",
			want:    nil,
		},
		{
			name:    "no URL",
			content: "just a normal post",
			want:    nil,
		},
		{
			name:    "unrelated URL",
			content: "check out https://example.com/foo",
			want:    nil,
		},
		{
			name:    "valid post URL",
			content: "look at this " + base + "/posts/" + validID.String(),
			want:    &validID,
		},
		{
			name:    "post URL in middle of text",
			content: "I saw " + base + "/posts/" + validID.String() + " and it was great",
			want:    &validID,
		},
		{
			name:    "multiple post URLs returns first",
			content: base + "/posts/" + validID.String() + " and " + base + "/posts/00000000-0000-0000-0000-000000000001",
			want:    &validID,
		},
		{
			name:    "invalid UUID format",
			content: base + "/posts/not-a-uuid",
			want:    nil,
		},
		{
			name:    "API posts path without base URL",
			content: "/posts/" + validID.String(),
			want:    nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ExtractPostReference(tt.content)
			if tt.want == nil && got != nil {
				t.Errorf("ExtractPostReference(%q) = %v, want nil", tt.content, got)
			} else if tt.want != nil && (got == nil || *got != *tt.want) {
				t.Errorf("ExtractPostReference(%q) = %v, want %v", tt.content, got, tt.want)
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
