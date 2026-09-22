package db_test

import (
	"os"
	"strings"
	"testing"
)

func TestDrawingsMigrationEnforcesExclusivePostMode(t *testing.T) {
	raw, err := os.ReadFile("../../../db/migrations/20260924_add_drawings.up.sql")
	if err != nil {
		t.Fatal(err)
	}
	sql := strings.ToLower(string(raw))
	for _, required := range []string{
		"unique (drawing_id)",
		"drawing_id is null or content = ''",
		"post_media_reject_drawing",
		"drawing_id is null and deleted_at is null",
	} {
		if !strings.Contains(sql, required) {
			t.Errorf("migration does not contain %q", required)
		}
	}
}
