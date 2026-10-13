package ogp

import (
	"strings"
	"testing"

	"backend/internal/ogp"
)

// The cases mirror apps/frontend/lib/ogp/parse-ogp.test.ts so the Go parser is
// held to the same fallback rules the cheerio version was.

const pageURL = "https://example.com/article"

func parse(t *testing.T, head string) *ogp.Ogp {
	t.Helper()
	return ogp.Parse(strings.NewReader("<html><head>"+head+"</head><body></body></html>"), pageURL)
}

func want(t *testing.T, head string) *ogp.Ogp {
	t.Helper()
	result := parse(t, head)
	if result == nil {
		t.Fatal("Parse returned nil, expected metadata")
	}
	return result
}

func str(t *testing.T, field *string, name string) string {
	t.Helper()
	if field == nil {
		t.Fatalf("%s was nil", name)
	}
	return *field
}

func TestParseExtractsOgTags(t *testing.T) {
	result := want(t, `
		<meta property="og:title" content="OG Title">
		<meta property="og:description" content="OG Description">
		<meta property="og:image" content="https://cdn.example.com/image.png">
		<meta property="og:site_name" content="Example Site">
		<meta property="og:url" content="https://example.com/canonical">
	`)

	if got := str(t, result.Title, "title"); got != "OG Title" {
		t.Errorf("title = %q", got)
	}
	if got := str(t, result.Description, "description"); got != "OG Description" {
		t.Errorf("description = %q", got)
	}
	if got := str(t, result.Image, "image"); got != "https://cdn.example.com/image.png" {
		t.Errorf("image = %q", got)
	}
	if got := str(t, result.SiteName, "siteName"); got != "Example Site" {
		t.Errorf("siteName = %q", got)
	}
	if got := str(t, result.Url, "url"); got != "https://example.com/canonical" {
		t.Errorf("url = %q", got)
	}
}

func TestParseFallsBackToTwitterTags(t *testing.T) {
	result := want(t, `
		<meta name="twitter:title" content="Twitter Title">
		<meta name="twitter:description" content="Twitter Description">
		<meta name="twitter:image" content="https://cdn.example.com/twitter.png">
		<meta name="twitter:site" content="@example">
	`)

	if got := str(t, result.Title, "title"); got != "Twitter Title" {
		t.Errorf("title = %q", got)
	}
	if got := str(t, result.Description, "description"); got != "Twitter Description" {
		t.Errorf("description = %q", got)
	}
	if got := str(t, result.Image, "image"); got != "https://cdn.example.com/twitter.png" {
		t.Errorf("image = %q", got)
	}
	if got := str(t, result.SiteName, "siteName"); got != "@example" {
		t.Errorf("siteName = %q", got)
	}
}

func TestParseTitlePriority(t *testing.T) {
	result := want(t, `
		<title>HTML Title</title>
		<meta name="twitter:title" content="Twitter Title">
		<meta property="og:title" content="OG Title">
	`)
	if got := str(t, result.Title, "title"); got != "OG Title" {
		t.Errorf("og:title must win, got %q", got)
	}

	result = want(t, `
		<title>HTML Title</title>
		<meta name="twitter:title" content="Twitter Title">
	`)
	if got := str(t, result.Title, "title"); got != "Twitter Title" {
		t.Errorf("twitter:title must beat <title>, got %q", got)
	}

	result = want(t, `<title>HTML Title</title>`)
	if got := str(t, result.Title, "title"); got != "HTML Title" {
		t.Errorf("<title> is the last resort, got %q", got)
	}
}

func TestParseFallsBackToMetaDescription(t *testing.T) {
	result := want(t, `
		<title>Page</title>
		<meta name="description" content="Plain description">
	`)
	if got := str(t, result.Description, "description"); got != "Plain description" {
		t.Errorf("description = %q", got)
	}
}

func TestParseReturnsNilWithoutTitle(t *testing.T) {
	if result := parse(t, `<meta property="og:description" content="No title here">`); result != nil {
		t.Errorf("expected nil without a title, got %+v", result)
	}
}

func TestParseReturnsNilForWhitespaceTitle(t *testing.T) {
	if result := parse(t, `<title>   </title>`); result != nil {
		t.Errorf("expected nil for a whitespace-only title, got %+v", result)
	}
}

func TestParseResolvesRelativeImage(t *testing.T) {
	result := want(t, `
		<meta property="og:title" content="Title">
		<meta property="og:image" content="/images/thumb.png">
	`)
	if got := str(t, result.Image, "image"); got != "https://example.com/images/thumb.png" {
		t.Errorf("image = %q", got)
	}
}

func TestParseResolvesProtocolRelativeImage(t *testing.T) {
	result := want(t, `
		<meta property="og:title" content="Title">
		<meta property="og:image" content="//cdn.example.com/thumb.png">
	`)
	if got := str(t, result.Image, "image"); got != "https://cdn.example.com/thumb.png" {
		t.Errorf("image = %q", got)
	}
}

func TestParseFallsBackToCanonicalLink(t *testing.T) {
	result := want(t, `
		<title>Title</title>
		<link rel="canonical" href="https://example.com/real-page">
	`)
	if got := str(t, result.Url, "url"); got != "https://example.com/real-page" {
		t.Errorf("url = %q", got)
	}
}

func TestParsePrefersOgUrlOverCanonical(t *testing.T) {
	result := want(t, `
		<title>Title</title>
		<meta property="og:url" content="https://example.com/og">
		<link rel="canonical" href="https://example.com/canonical">
	`)
	if got := str(t, result.Url, "url"); got != "https://example.com/og" {
		t.Errorf("url = %q", got)
	}
}

func TestParseTrimsWhitespace(t *testing.T) {
	result := want(t, `<meta property="og:title" content="   Spaced Title   ">`)
	if got := str(t, result.Title, "title"); got != "Spaced Title" {
		t.Errorf("title = %q", got)
	}
}

func TestParseTruncatesLongFields(t *testing.T) {
	longTitle := strings.Repeat("a", 250)
	longDescription := strings.Repeat("b", 350)
	longSiteName := strings.Repeat("c", 150)

	result := want(t, `
		<meta property="og:title" content="`+longTitle+`">
		<meta property="og:description" content="`+longDescription+`">
		<meta property="og:site_name" content="`+longSiteName+`">
	`)

	assertTruncated(t, str(t, result.Title, "title"), 200)
	assertTruncated(t, str(t, result.Description, "description"), 300)
	assertTruncated(t, str(t, result.SiteName, "siteName"), 100)
}

func assertTruncated(t *testing.T, value string, maxRunes int) {
	t.Helper()
	runes := []rune(value)
	if len(runes) != maxRunes {
		t.Errorf("length = %d, want %d", len(runes), maxRunes)
	}
	if runes[len(runes)-1] != '…' {
		t.Errorf("truncated value must end with an ellipsis, got %q", string(runes[len(runes)-1]))
	}
}

// Multi-byte text must be clipped by character, not by byte, or a Japanese
// title would be cut mid-codepoint.
func TestParseTruncatesByRune(t *testing.T) {
	result := want(t, `<meta property="og:title" content="`+strings.Repeat("あ", 250)+`">`)

	title := str(t, result.Title, "title")
	if len([]rune(title)) != 200 {
		t.Errorf("rune length = %d, want 200", len([]rune(title)))
	}
	if !strings.HasSuffix(title, "…") {
		t.Error("expected a trailing ellipsis")
	}
}

func TestParseExtractsImageDimensions(t *testing.T) {
	result := want(t, `
		<meta property="og:title" content="Title">
		<meta property="og:image" content="https://cdn.example.com/i.png">
		<meta property="og:image:width" content="1200">
		<meta property="og:image:height" content="630">
	`)

	if result.ImageWidth == nil || *result.ImageWidth != 1200 {
		t.Errorf("imageWidth = %v, want 1200", result.ImageWidth)
	}
	if result.ImageHeight == nil || *result.ImageHeight != 630 {
		t.Errorf("imageHeight = %v, want 630", result.ImageHeight)
	}
}

func TestParseFallsBackToTwitterDimensions(t *testing.T) {
	result := want(t, `
		<meta property="og:title" content="Title">
		<meta property="og:image" content="https://cdn.example.com/i.png">
		<meta name="twitter:image:width" content="800">
		<meta name="twitter:image:height" content="418">
	`)

	if result.ImageWidth == nil || *result.ImageWidth != 800 {
		t.Errorf("imageWidth = %v, want 800", result.ImageWidth)
	}
	if result.ImageHeight == nil || *result.ImageHeight != 418 {
		t.Errorf("imageHeight = %v, want 418", result.ImageHeight)
	}
}

func TestParseDropsDimensionsWithoutImage(t *testing.T) {
	result := want(t, `
		<meta property="og:title" content="Title">
		<meta property="og:image:width" content="1200">
		<meta property="og:image:height" content="630">
	`)

	if result.Image != nil {
		t.Errorf("image = %v, want nil", result.Image)
	}
	if result.ImageWidth != nil || result.ImageHeight != nil {
		t.Error("dimensions must be dropped when there is no image")
	}
}

func TestParseIgnoresNonNumericDimensions(t *testing.T) {
	result := want(t, `
		<meta property="og:title" content="Title">
		<meta property="og:image" content="https://cdn.example.com/i.png">
		<meta property="og:image:width" content="wide">
		<meta property="og:image:height" content="tall">
	`)

	if result.ImageWidth != nil || result.ImageHeight != nil {
		t.Errorf("non-numeric dimensions must be ignored, got %v x %v",
			result.ImageWidth, result.ImageHeight)
	}
}

func TestParseHandlesPartialDimensions(t *testing.T) {
	result := want(t, `
		<meta property="og:title" content="Title">
		<meta property="og:image" content="https://cdn.example.com/i.png">
		<meta property="og:image:width" content="1200">
	`)

	if result.ImageWidth == nil || *result.ImageWidth != 1200 {
		t.Errorf("imageWidth = %v, want 1200", result.ImageWidth)
	}
	if result.ImageHeight != nil {
		t.Errorf("imageHeight = %v, want nil", result.ImageHeight)
	}
}

func TestParseHandlesEmptyDocument(t *testing.T) {
	if result := ogp.Parse(strings.NewReader(""), pageURL); result != nil {
		t.Errorf("expected nil for an empty document, got %+v", result)
	}
}
