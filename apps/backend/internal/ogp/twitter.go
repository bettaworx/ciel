package ogp

import (
	"context"
	"encoding/json"
	"net/url"
	"regexp"
)

// x.com and twitter.com serve no Open Graph tags to scrapers, so tweets are
// resolved through the public syndication endpoint instead. It needs no
// authentication and 404s for deleted, protected, or very old tweets.
const (
	syndicationURL     = "https://cdn.syndication.twimg.com/tweet-result"
	twitterSiteName    = "X (Twitter)"
	maxSyndicationSize = 1 << 20 // 1 MiB
)

// tweetURLPattern matches https://[mobile.](twitter.com|x.com)/<user>/status/<id>
var tweetURLPattern = regexp.MustCompile(
	`^https?://(?:mobile\.)?(?:twitter\.com|x\.com)/([^/?#]+)/status/(\d+)`,
)

// TweetRef identifies a tweet named by a URL.
type TweetRef struct {
	ScreenName string
	TweetID    string
}

// ParseTweetURL returns the tweet a URL points at, or nil if it is not a
// tweet URL.
func ParseTweetURL(raw string) *TweetRef {
	match := tweetURLPattern.FindStringSubmatch(raw)
	if match == nil {
		return nil
	}
	return &TweetRef{ScreenName: match[1], TweetID: match[2]}
}

// syndicationTweet is the subset of the syndication response we use.
type syndicationTweet struct {
	Text string `json:"text"`
	User *struct {
		Name       string `json:"name"`
		ScreenName string `json:"screen_name"`
	} `json:"user"`
	Photos []struct {
		URL    string `json:"url"`
		Width  *int   `json:"width"`
		Height *int   `json:"height"`
	} `json:"photos"`
	MediaDetails []struct {
		Type          string `json:"type"`
		MediaURLHTTPS string `json:"media_url_https"`
	} `json:"mediaDetails"`
}

// FetchTweet resolves a tweet URL to Open Graph metadata via the syndication
// endpoint. Returns nil (without an error) whenever the tweet cannot be
// resolved, so the caller can fall back to a normal scrape.
func FetchTweet(ctx context.Context, fetcher Fetcher, rawURL string) *Ogp {
	ref := ParseTweetURL(rawURL)
	if ref == nil {
		return nil
	}

	query := url.Values{"id": {ref.TweetID}, "token": {"0"}}
	resp, err := fetcher.Fetch(ctx, syndicationURL+"?"+query.Encode(), Options{
		MaxBodySize:         maxSyndicationSize,
		AllowedContentTypes: []string{"application/json", "text/json"},
		Headers:             map[string]string{"Accept": "application/json"},
	})
	if err != nil {
		return nil
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return nil
	}

	var tweet syndicationTweet
	if err := json.NewDecoder(resp.Body).Decode(&tweet); err != nil {
		return nil
	}

	// A response with neither text nor an author is not a usable tweet.
	if tweet.Text == "" && tweet.User == nil {
		return nil
	}

	return tweetToOgp(&tweet, rawURL)
}

func tweetToOgp(tweet *syndicationTweet, originalURL string) *Ogp {
	displayName := "Unknown"
	title := displayName

	if tweet.User != nil {
		displayName = firstNonEmpty(tweet.User.Name, tweet.User.ScreenName, "Unknown")
		title = displayName
		if tweet.User.ScreenName != "" {
			title = displayName + " (@" + tweet.User.ScreenName + ")"
		}
	}

	result := &Ogp{
		Title:    stringPtr(truncate(title, maxTitleLen)),
		SiteName: stringPtr(twitterSiteName),
		Url:      stringPtr(originalURL),
	}

	if tweet.Text != "" {
		result.Description = stringPtr(truncate(tweet.Text, maxDescriptionLen))
	}

	// photos[] carries dimensions, so prefer it over mediaDetails[].
	if len(tweet.Photos) > 0 {
		photo := tweet.Photos[0]
		if photo.URL != "" {
			result.Image = stringPtr(photo.URL)
			result.ImageWidth = photo.Width
			result.ImageHeight = photo.Height
		}
		return result
	}

	for _, media := range tweet.MediaDetails {
		if media.Type == "photo" && media.MediaURLHTTPS != "" {
			result.Image = stringPtr(media.MediaURLHTTPS)
			break
		}
	}

	return result
}
