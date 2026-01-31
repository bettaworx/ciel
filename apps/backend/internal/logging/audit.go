package logging

import (
	"context"
	"log/slog"
	"strings"
)

// Audit emits a structured audit log entry.
func Audit(ctx context.Context, event, outcome string, attrs ...slog.Attr) {
	if ctx == nil {
		ctx = context.Background()
	}
	level := slog.LevelInfo
	switch strings.ToLower(strings.TrimSpace(outcome)) {
	case "fail", "failed", "failure", "error":
		level = slog.LevelWarn
	}
	logger := slog.Default().With(
		"type", "audit",
		"event", event,
		"outcome", outcome,
	)
	if len(attrs) == 0 {
		logger.Log(ctx, level, "audit")
		return
	}
	logger.LogAttrs(ctx, level, "audit", attrs...)
}
