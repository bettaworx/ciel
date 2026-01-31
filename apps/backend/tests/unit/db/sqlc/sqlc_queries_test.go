package sqlc_test

import (
	"context"
	"database/sql"
	"testing"

	"backend/internal/db/sqlc"
)

type fakeDBTX struct{}

func (fakeDBTX) ExecContext(context.Context, string, ...interface{}) (sql.Result, error) {
	return nil, nil
}
func (fakeDBTX) PrepareContext(context.Context, string) (*sql.Stmt, error) { return nil, nil }
func (fakeDBTX) QueryContext(context.Context, string, ...interface{}) (*sql.Rows, error) {
	return nil, nil
}
func (fakeDBTX) QueryRowContext(context.Context, string, ...interface{}) *sql.Row { return &sql.Row{} }

func TestSQLC_New_ReturnsQueries(t *testing.T) {
	base := fakeDBTX{}
	q := sqlc.New(base)
	if q == nil {
		t.Fatalf("expected non-nil queries")
	}
}

func TestSQLC_WithTx_ReturnsNewQueriesInstance(t *testing.T) {
	base := fakeDBTX{}
	q := sqlc.New(base)

	tx := new(sql.Tx)
	qt := q.WithTx(tx)
	if qt == nil {
		t.Fatalf("expected non-nil queries")
	}
	if qt == q {
		t.Fatalf("expected a new Queries instance")
	}
}
