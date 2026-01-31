package db_test

import (
	"testing"

	"backend/internal/db"
)

func TestOpen_ParsesConnectionStringWithoutValidatingConnectivity(t *testing.T) {
	databaseURL := "postgres://user:pass@does-not-need-to-resolve.invalid:5432/testdb?sslmode=disable"

	sqlDB, err := db.Open(databaseURL)
	if err != nil {
		t.Fatalf("expected Open to succeed for a well-formed URL, got error: %v", err)
	}
	if sqlDB == nil {
		t.Fatalf("expected non-nil *sql.DB")
	}

	if err := sqlDB.Close(); err != nil {
		t.Fatalf("expected Close to succeed, got error: %v", err)
	}
}
