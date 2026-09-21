package search

import (
	"strings"
	"unicode"
)

// tagForbidden are the characters that end a hashtag in the frontend's MFM
// parser, mirrored here so the index sees exactly the tags users can click.
const tagForbidden = ".,!?#'\":/[](){}【】、「」（）！？"

// ExtractHashtags pulls the hashtags out of free text (a post body or a user
// bio) so they can be indexed as exact-match filters.
//
// The rules mirror the MFM parser that renders them on the frontend: a '#'
// counts when the character before it is not an ASCII letter or digit (so
// 今日は#日本語タグ works while abc#def does not), the tag body runs until a
// forbidden character or whitespace, and an all-digit tag is not a tag.
// Returned tags are lowercased and de-duplicated; matching is case-insensitive
// because "#VRChat" and "#vrchat" are the same tag to a reader.
func ExtractHashtags(text string) []string {
	var (
		tags []string
		seen = map[string]struct{}{}
	)
	runes := []rune(text)
	for i := 0; i < len(runes); i++ {
		if runes[i] != '#' || (i > 0 && isAsciiWordRune(runes[i-1])) {
			continue
		}
		j := i + 1
		for j < len(runes) && isTagRune(runes[j]) {
			j++
		}
		tag, ok := canonicalTag(string(runes[i+1 : j]))
		if ok {
			if _, dup := seen[tag]; !dup {
				seen[tag] = struct{}{}
				tags = append(tags, tag)
			}
		}
		i = j - 1
	}
	return tags
}

// NormalizeTag validates and canonicalizes a tag as typed in a search query:
// an optional leading '#' is stripped and the rest is lowercased.
func NormalizeTag(raw string) (string, bool) {
	return canonicalTag(strings.TrimPrefix(raw, "#"))
}

func canonicalTag(s string) (string, bool) {
	runes := []rune(s)
	if len(runes) == 0 || len(runes) > 100 {
		return "", false
	}
	allDigits := true
	for _, r := range runes {
		if !isTagRune(r) {
			return "", false
		}
		if !isAsciiWordRune(r) {
			allDigits = false
		} else if r < '0' || r > '9' {
			allDigits = false
		}
	}
	if allDigits {
		return "", false
	}
	return strings.ToLower(s), true
}

func isTagRune(r rune) bool {
	if unicode.IsSpace(r) || strings.ContainsRune(tagForbidden, r) {
		return false
	}
	return unicode.IsGraphic(r)
}

func isAsciiWordRune(r rune) bool {
	return (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9')
}
