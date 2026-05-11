package service_test

import (
	"testing"

	"backend/internal/config"
	"backend/internal/service"
)

func TestBuildServerConfig_IncludesEmojiLimits(t *testing.T) {
	cfg := config.DefaultConfig()
	cfg.Media.Emoji.Static.Height = 144
	cfg.Media.Emoji.Gif.Height = 96

	serverConfig := service.BuildServerConfig(cfg)

	if serverConfig.MediaLimits.Emoji.Static.Height != 144 {
		t.Fatalf("expected emoji static height 144, got %d", serverConfig.MediaLimits.Emoji.Static.Height)
	}
	if serverConfig.MediaLimits.Emoji.Gif.Height != 96 {
		t.Fatalf("expected emoji gif height 96, got %d", serverConfig.MediaLimits.Emoji.Gif.Height)
	}
}
