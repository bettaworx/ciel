package search

import (
	"reflect"
	"testing"
	"time"
)

func unix(seconds int64) *time.Time {
	t := time.Unix(seconds, 0)
	return &t
}

func TestExtractHashtags(t *testing.T) {
	tests := []struct {
		name string
		text string
		want []string
	}{
		{"simple", "loving #VRChat today", []string{"vrchat"}},
		{"case is normalized", "#VRChat and #vrchat", []string{"vrchat"}},
		{"multiple distinct", "#a #b #C", []string{"a", "b", "c"}},
		{"japanese letters count", "今日は#日本語タグで遊ぶ", []string{"日本語タグで遊ぶ"}},
		{"hyphens stay in the tag", "#covid-19 is over", []string{"covid-19"}},
		{"underscores and digits", "#v2_beta", []string{"v2_beta"}},
		{"all digits are not a tag", "#2026 was a year", nil},
		{"mid-ascii-word hash is not a tag", "abc#def stays out", nil},
		{"bare hash", "# alone", nil},
		{"punctuation ends the tag", "#tag, right?", []string{"tag"}},
		{"no hashtags at all", "just words here", nil},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := ExtractHashtags(tc.text)
			if !reflect.DeepEqual(got, tc.want) {
				t.Errorf("ExtractHashtags(%q) = %q, want %q", tc.text, got, tc.want)
			}
		})
	}
}

func TestNormalizeTag(t *testing.T) {
	tests := []struct {
		raw   string
		want  string
		valid bool
	}{
		{raw: "#VRChat", want: "vrchat", valid: true},
		{raw: "vrchat", want: "vrchat", valid: true},
		{raw: "#日本語", want: "日本語", valid: true},
		{raw: "#covid-19", want: "covid-19", valid: true},
		{raw: "#2026", valid: false},
		{raw: "#", valid: false},
		{raw: "", valid: false},
		{raw: "#bad space", valid: false},
		{raw: "#colon:inside", valid: false},
	}
	for _, tc := range tests {
		got, ok := NormalizeTag(tc.raw)
		if ok != tc.valid {
			t.Errorf("NormalizeTag(%q) valid = %v, want %v", tc.raw, ok, tc.valid)
			continue
		}
		if ok && got != tc.want {
			t.Errorf("NormalizeTag(%q) = %q, want %q", tc.raw, got, tc.want)
		}
	}
}

func TestBuildFilterWithTags(t *testing.T) {
	tag := "vrchat"
	got := buildFilter(Query{Tags: []string{tag}, Since: nil})
	if got != `tags = "vrchat"` {
		t.Errorf("buildFilter = %q, want %q", got, `tags = "vrchat"`)
	}

	combined := buildFilter(Query{
		Tags:   []string{"a", "b"},
		Since:  unix(1000),
		Until:  unix(2000),
	})
	want := `createdAt >= 1000 AND createdAt <= 2000 AND tags = "a" AND tags = "b"`
	if combined != want {
		t.Errorf("buildFilter = %q, want %q", combined, want)
	}
}
