package db_test

import (
	"os"
	"strings"
	"testing"
)

func TestAuthzMigrationAddsSignupEnabledBeforeInsert(t *testing.T) {
	sqlBytes, err := os.ReadFile("../../../db/migrations/003_add_authz.up.sql")
	if err != nil {
		t.Fatalf("read migration: %v", err)
	}

	sql := strings.ToLower(string(sqlBytes))
	alterIdx := strings.Index(sql, "alter table server_settings")
	insertIdx := strings.Index(sql, "insert into server_settings")
	if alterIdx < 0 {
		t.Fatalf("expected migration to alter existing server_settings")
	}
	if !strings.Contains(sql[alterIdx:], "add column if not exists signup_enabled") {
		t.Fatalf("expected migration to add signup_enabled when server_settings already exists")
	}
	if insertIdx < 0 {
		t.Fatalf("expected migration to insert default server_settings row")
	}
	if alterIdx > insertIdx {
		t.Fatalf("expected signup_enabled column to be added before inserting server_settings")
	}
}
