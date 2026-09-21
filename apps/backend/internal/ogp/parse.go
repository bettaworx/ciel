package ogp

import (
	"io"
	"net/url"
	"strconv"
	"strings"

	"golang.org/x/net/html"

	"backend/internal/api"
)

// Ogp is the metadata a page yielded. It is an alias of the generated API
// model so handlers can return it directly and callers need not import both
// this package and internal/api.
type Ogp = api.Ogp

// Field length caps. Long remote titles and descriptions are truncated rather
// than rejected, since a clipped preview is still useful.
const (
	maxTitleLen       = 200
	maxDescriptionLen = 300
	maxSiteNameLen    = 100
)

// Parse extracts Open Graph metadata from an HTML document.
//
// Fallback order per field:
//  1. og:* meta tags
//  2. twitter:* meta tags
//  3. plain HTML (<title>, meta[name=description], link[rel=canonical])
//
// Returns nil when no title could be found — without one there is nothing
// worth rendering.
func Parse(body io.Reader, pageURL string) *Ogp {
	doc, err := html.Parse(body)
	if err != nil {
		return nil
	}

	metas := map[string]string{}
	var htmlTitle, canonical string
	collect(doc, metas, &htmlTitle, &canonical)

	title := firstNonEmpty(metas["og:title"], metas["twitter:title"], htmlTitle)
	if title == "" {
		return nil
	}

	result := &Ogp{Title: stringPtr(truncate(title, maxTitleLen))}

	if description := firstNonEmpty(
		metas["og:description"],
		metas["twitter:description"],
		metas["description"],
	); description != "" {
		result.Description = stringPtr(truncate(description, maxDescriptionLen))
	}

	if siteName := firstNonEmpty(metas["og:site_name"], metas["twitter:site"]); siteName != "" {
		result.SiteName = stringPtr(truncate(siteName, maxSiteNameLen))
	}

	if canonicalURL := firstNonEmpty(metas["og:url"], canonical); canonicalURL != "" {
		result.Url = stringPtr(canonicalURL)
	}

	// The image URL may be relative to the page it was found on.
	if image := firstNonEmpty(metas["og:image"], metas["twitter:image"]); image != "" {
		if absolute := resolveURL(image, pageURL); absolute != "" {
			result.Image = stringPtr(absolute)

			width := parseDimension(metas["og:image:width"], metas["twitter:image:width"])
			height := parseDimension(metas["og:image:height"], metas["twitter:image:height"])
			result.ImageWidth = width
			result.ImageHeight = height
		}
	}

	return result
}

// collect walks the document once, gathering every meta tag keyed by its
// property or name, the first <title>, and link[rel=canonical].
func collect(node *html.Node, metas map[string]string, htmlTitle, canonical *string) {
	if node.Type == html.ElementNode {
		switch node.Data {
		case "meta":
			key := firstNonEmpty(attr(node, "property"), attr(node, "name"))
			content := strings.TrimSpace(attr(node, "content"))
			// First occurrence wins, matching how browsers read OG tags.
			if key != "" && content != "" {
				if _, seen := metas[strings.ToLower(key)]; !seen {
					metas[strings.ToLower(key)] = content
				}
			}
		case "title":
			if *htmlTitle == "" {
				*htmlTitle = strings.TrimSpace(text(node))
			}
		case "link":
			if *canonical == "" && strings.EqualFold(attr(node, "rel"), "canonical") {
				*canonical = strings.TrimSpace(attr(node, "href"))
			}
		}
	}

	for child := node.FirstChild; child != nil; child = child.NextSibling {
		collect(child, metas, htmlTitle, canonical)
	}
}

func attr(node *html.Node, name string) string {
	for _, a := range node.Attr {
		if strings.EqualFold(a.Key, name) {
			return a.Val
		}
	}
	return ""
}

func text(node *html.Node) string {
	var builder strings.Builder
	for child := node.FirstChild; child != nil; child = child.NextSibling {
		if child.Type == html.TextNode {
			builder.WriteString(child.Data)
		}
	}
	return builder.String()
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

// resolveURL turns a possibly relative reference into an absolute URL,
// returning "" when either side is unparsable.
func resolveURL(reference, base string) string {
	ref, err := url.Parse(reference)
	if err != nil {
		return ""
	}

	if ref.IsAbs() {
		return ref.String()
	}

	baseURL, err := url.Parse(base)
	if err != nil {
		return ""
	}

	return baseURL.ResolveReference(ref).String()
}

func parseDimension(values ...string) *int {
	for _, value := range values {
		parsed, err := strconv.Atoi(strings.TrimSpace(value))
		if err == nil && parsed > 0 {
			return &parsed
		}
	}
	return nil
}

// truncate clips to maxRunes characters, replacing the last one with an
// ellipsis so the reader can tell the text was cut.
func truncate(value string, maxRunes int) string {
	runes := []rune(value)
	if len(runes) <= maxRunes {
		return value
	}
	return string(runes[:maxRunes-1]) + "…"
}

func stringPtr(value string) *string { return &value }
