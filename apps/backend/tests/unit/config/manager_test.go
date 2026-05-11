package config_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"backend/internal/config"
)

func TestManager_RepairsLegacyEmojiConfig(t *testing.T) {
	dir := t.TempDir()
	configPath := filepath.Join(dir, "config.yaml")
	raw := `
media:
  emoji:
    height: 96
    quality: 77
`
	if err := os.WriteFile(configPath, []byte(raw), 0o644); err != nil {
		t.Fatalf("write config: %v", err)
	}

	manager, err := config.NewManager(configPath)
	if err != nil {
		t.Fatalf("NewManager: %v", err)
	}

	cfg := manager.Get()
	if cfg.Media.Emoji.Static.Height != 96 || cfg.Media.Emoji.Gif.Height != 96 {
		t.Fatalf("expected legacy height to repair both variants, got static=%d gif=%d", cfg.Media.Emoji.Static.Height, cfg.Media.Emoji.Gif.Height)
	}
	if cfg.Media.Emoji.Static.Quality != 77 || cfg.Media.Emoji.Gif.Quality != 77 {
		t.Fatalf("expected legacy quality to repair both variants, got static=%d gif=%d", cfg.Media.Emoji.Static.Quality, cfg.Media.Emoji.Gif.Quality)
	}

	rewritten, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatalf("read rewritten config: %v", err)
	}
	text := string(rewritten)
	if !strings.Contains(text, "static:") || !strings.Contains(text, "gif:") {
		t.Fatalf("expected rewritten config to contain emoji variants, got:\n%s", text)
	}
}

func TestManager_PrefersStructuredEmojiConfig(t *testing.T) {
	dir := t.TempDir()
	configPath := filepath.Join(dir, "config.yaml")
	raw := `
media:
  emoji:
    height: 96
    quality: 77
    static:
      height: 144
      quality: 88
    gif:
      height: 72
      quality: 61
`
	if err := os.WriteFile(configPath, []byte(raw), 0o644); err != nil {
		t.Fatalf("write config: %v", err)
	}

	manager, err := config.NewManager(configPath)
	if err != nil {
		t.Fatalf("NewManager: %v", err)
	}

	cfg := manager.Get()
	if cfg.Media.Emoji.Static.Height != 144 || cfg.Media.Emoji.Static.Quality != 88 {
		t.Fatalf("expected structured static config to win, got %+v", cfg.Media.Emoji.Static)
	}
	if cfg.Media.Emoji.Gif.Height != 72 || cfg.Media.Emoji.Gif.Quality != 61 {
		t.Fatalf("expected structured gif config to win, got %+v", cfg.Media.Emoji.Gif)
	}
}
