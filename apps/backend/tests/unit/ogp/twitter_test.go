package ogp

import (
	"context"
	"errors"
	"io"
	"strings"
	"testing"

	"backend/internal/ogp"
)

// The cases mirror apps/frontend/lib/ogp/twitter.test.ts.

// stubFetcher answers with canned bytes so the syndication mapping can be
// tested without reaching x.com.
type stubFetcher struct {
	body        string
	contentType string
	statusCode  int
	err         error
	lastURL     string
}

func (s *stubFetcher) Fetch(_ context.Context, rawURL string, _ ogp.Options) (*ogp.Response, error) {
	s.lastURL = rawURL
	if s.err != nil {
		return nil, s.err
	}

	contentType := s.contentType
	if contentType == "" {
		contentType = "application/json"
	}
	status := s.statusCode
	if status == 0 {
		status = 200
	}

	return &ogp.Response{
		Body:        io.NopCloser(strings.NewReader(s.body)),
		ContentType: contentType,
		FinalURL:    rawURL,
		StatusCode:  status,
	}, nil
}

func TestParseTweetURL(t *testing.T) {
	cases := []struct {
		name       string
		url        string
		screenName string
		tweetID    string
	}{
		{"x.com", "https://x.com/jack/status/20", "jack", "20"},
		{"twitter.com", "https://twitter.com/jack/status/20", "jack", "20"},
		{"mobile.twitter.com", "https://mobile.twitter.com/jack/status/20", "jack", "20"},
		{"mobile.x.com", "https://mobile.x.com/jack/status/20", "jack", "20"},
		{"query parameters", "https://x.com/jack/status/20?s=46&t=abc", "jack", "20"},
		{"hash fragment", "https://x.com/jack/status/20#reply", "jack", "20"},
		{"http", "http://x.com/jack/status/20", "jack", "20"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			ref := ogp.ParseTweetURL(tc.url)
			if ref == nil {
				t.Fatalf("ParseTweetURL(%q) = nil", tc.url)
			}
			if ref.ScreenName != tc.screenName {
				t.Errorf("screenName = %q, want %q", ref.ScreenName, tc.screenName)
			}
			if ref.TweetID != tc.tweetID {
				t.Errorf("tweetID = %q, want %q", ref.TweetID, tc.tweetID)
			}
		})
	}
}

func TestParseTweetURLRejectsNonTweets(t *testing.T) {
	cases := []struct {
		name string
		url  string
	}{
		{"profile page", "https://x.com/jack"},
		{"x.com home", "https://x.com/"},
		{"non-numeric status id", "https://x.com/jack/status/abc"},
		{"other site", "https://example.com/jack/status/20"},
		{"fxtwitter", "https://fxtwitter.com/jack/status/20"},
		{"vxtwitter", "https://vxtwitter.com/jack/status/20"},
		{"empty", ""},
		{"not a url", "not-a-url"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if ref := ogp.ParseTweetURL(tc.url); ref != nil {
				t.Errorf("ParseTweetURL(%q) = %+v, want nil", tc.url, ref)
			}
		})
	}
}

func TestFetchTweetMapsSyndicationResponse(t *testing.T) {
	fetcher := &stubFetcher{body: `{
		"text": "Hello world",
		"user": {"name": "Jack", "screen_name": "jack"},
		"photos": [{"url": "https://pbs.twimg.com/media/photo.jpg", "width": 1200, "height": 675}]
	}`}

	result := ogp.FetchTweet(context.Background(), fetcher, "https://x.com/jack/status/20")
	if result == nil {
		t.Fatal("FetchTweet returned nil")
	}

	if got := str(t, result.Title, "title"); got != "Jack (@jack)" {
		t.Errorf("title = %q", got)
	}
	if got := str(t, result.Description, "description"); got != "Hello world" {
		t.Errorf("description = %q", got)
	}
	if got := str(t, result.Image, "image"); got != "https://pbs.twimg.com/media/photo.jpg" {
		t.Errorf("image = %q", got)
	}
	if result.ImageWidth == nil || *result.ImageWidth != 1200 {
		t.Errorf("imageWidth = %v, want 1200", result.ImageWidth)
	}
	if result.ImageHeight == nil || *result.ImageHeight != 675 {
		t.Errorf("imageHeight = %v, want 675", result.ImageHeight)
	}
	if got := str(t, result.SiteName, "siteName"); got != "X (Twitter)" {
		t.Errorf("siteName = %q", got)
	}
	if got := str(t, result.Url, "url"); got != "https://x.com/jack/status/20" {
		t.Errorf("url must be the original tweet URL, got %q", got)
	}

	// The tweet id, not the page URL, is what gets fetched.
	if !strings.Contains(fetcher.lastURL, "id=20") {
		t.Errorf("fetched URL = %q, want it to carry id=20", fetcher.lastURL)
	}
}

func TestFetchTweetFallsBackToMediaDetails(t *testing.T) {
	fetcher := &stubFetcher{body: `{
		"text": "Photo tweet",
		"user": {"name": "Jack", "screen_name": "jack"},
		"mediaDetails": [
			{"type": "video", "media_url_https": "https://pbs.twimg.com/media/video.jpg"},
			{"type": "photo", "media_url_https": "https://pbs.twimg.com/media/photo.jpg"}
		]
	}`}

	result := ogp.FetchTweet(context.Background(), fetcher, "https://x.com/jack/status/20")
	if result == nil {
		t.Fatal("FetchTweet returned nil")
	}

	if got := str(t, result.Image, "image"); got != "https://pbs.twimg.com/media/photo.jpg" {
		t.Errorf("non-photo media must be skipped, got %q", got)
	}
	// mediaDetails carries no dimensions.
	if result.ImageWidth != nil || result.ImageHeight != nil {
		t.Error("dimensions must stay nil when falling back to mediaDetails")
	}
}

func TestFetchTweetHandlesSparseUser(t *testing.T) {
	cases := []struct {
		name      string
		body      string
		wantTitle string
	}{
		{
			name:      "no user at all",
			body:      `{"text": "Anonymous"}`,
			wantTitle: "Unknown",
		},
		{
			name:      "name but no handle",
			body:      `{"text": "x", "user": {"name": "Jack"}}`,
			wantTitle: "Jack",
		},
		{
			name:      "handle only",
			body:      `{"text": "x", "user": {"screen_name": "jack"}}`,
			wantTitle: "jack (@jack)",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			result := ogp.FetchTweet(
				context.Background(),
				&stubFetcher{body: tc.body},
				"https://x.com/jack/status/20",
			)
			if result == nil {
				t.Fatal("FetchTweet returned nil")
			}
			if got := str(t, result.Title, "title"); got != tc.wantTitle {
				t.Errorf("title = %q, want %q", got, tc.wantTitle)
			}
		})
	}
}

func TestFetchTweetTruncatesLongText(t *testing.T) {
	result := ogp.FetchTweet(
		context.Background(),
		&stubFetcher{body: `{"text": "` + strings.Repeat("a", 400) + `", "user": {"screen_name": "jack"}}`},
		"https://x.com/jack/status/20",
	)
	if result == nil {
		t.Fatal("FetchTweet returned nil")
	}

	assertTruncated(t, str(t, result.Description, "description"), 300)
}

func TestFetchTweetOmitsEmptyText(t *testing.T) {
	result := ogp.FetchTweet(
		context.Background(),
		&stubFetcher{body: `{"text": "", "user": {"screen_name": "jack"}}`},
		"https://x.com/jack/status/20",
	)
	if result == nil {
		t.Fatal("FetchTweet returned nil")
	}
	if result.Description != nil {
		t.Errorf("description = %v, want nil", result.Description)
	}
}

// Every failure mode returns nil rather than an error so the caller can fall
// through to a normal scrape.
func TestFetchTweetReturnsNilOnFailure(t *testing.T) {
	cases := []struct {
		name    string
		url     string
		fetcher *stubFetcher
	}{
		{
			name:    "not a tweet URL",
			url:     "https://example.com/page",
			fetcher: &stubFetcher{body: `{"text": "never read"}`},
		},
		{
			name:    "fetch error",
			url:     "https://x.com/jack/status/20",
			fetcher: &stubFetcher{err: errors.New("network down")},
		},
		{
			name:    "deleted tweet",
			url:     "https://x.com/jack/status/20",
			fetcher: &stubFetcher{statusCode: 404, body: `{}`},
		},
		{
			name:    "malformed JSON",
			url:     "https://x.com/jack/status/20",
			fetcher: &stubFetcher{body: `{not json`},
		},
		{
			name:    "neither text nor user",
			url:     "https://x.com/jack/status/20",
			fetcher: &stubFetcher{body: `{"favorite_count": 3}`},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if result := ogp.FetchTweet(context.Background(), tc.fetcher, tc.url); result != nil {
				t.Errorf("FetchTweet = %+v, want nil", result)
			}
		})
	}
}
