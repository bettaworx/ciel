package service

import "testing"

func TestProfileSanitizersAllowSocialTokensOnlyInBio(t *testing.T) {
	input := "https://example.com #ciel @alice"
	if got := sanitizeBio(input); got != input {
		t.Fatalf("sanitizeBio() = %q, want %q", got, input)
	}
	if got := sanitizeDisplayName(input); got != "#ciel @alice" {
		t.Fatalf("sanitizeDisplayName() = %q, want %q", got, "#ciel @alice")
	}
}
