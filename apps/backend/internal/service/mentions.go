package service

import (
	"regexp"
	"strings"

	"github.com/google/uuid"
)

// MaxMentionsPerPost caps the number of usernames extracted from a single post body.
// Mentions beyond this limit are silently dropped to prevent abuse.
const MaxMentionsPerPost = 50

// mentionPattern matches @username preceded by a word boundary so addresses like
// "foo@bar" do not match. The username portion follows the Username schema:
// alphanumeric plus underscore, 3 to 32 characters.
var mentionPattern = regexp.MustCompile(`(^|[^a-zA-Z0-9_])@([a-zA-Z0-9_]{3,32})`)

var uuidPattern = `[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}`

// ExtractPostReference extracts the first post UUID referenced by a URL in content.
// It matches URLs of the form {PUBLIC_BASE_URL}/posts/{uuid}.
func ExtractPostReference(content string) *uuid.UUID {
	if content == "" {
		return nil
	}
	base := strings.TrimRight(publicBaseURL(), "/")
	pattern := regexp.MustCompile(regexp.QuoteMeta(base) + `/posts/(` + uuidPattern + `)`)
	m := pattern.FindStringSubmatch(content)
	if m == nil {
		return nil
	}
	id, err := uuid.Parse(m[1])
	if err != nil {
		return nil
	}
	return &id
}

// ExtractMentions returns up to cap unique usernames mentioned in content.
// The order of the returned slice matches the first-occurrence order in content.
// Comparison is case-sensitive — ciel usernames are stored case-sensitively.
func ExtractMentions(content string, cap int) []string {
	if content == "" || cap <= 0 {
		return nil
	}
	matches := mentionPattern.FindAllStringSubmatch(content, -1)
	if len(matches) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(matches))
	out := make([]string, 0, len(matches))
	for _, m := range matches {
		name := m[2]
		if _, ok := seen[name]; ok {
			continue
		}
		seen[name] = struct{}{}
		out = append(out, name)
		if len(out) >= cap {
			break
		}
	}
	return out
}
