package repository_test

import (
	"context"
	"errors"
	"testing"

	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestStore_WithTx_CommitsOnSuccess(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	mock.ExpectBegin()
	mock.ExpectCommit()

	s := repository.NewStore(db)
	err = s.WithTx(context.Background(), func(q *sqlc.Queries) error {
		if q == nil {
			return errors.New("nil queries")
		}
		return nil
	})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestStore_WithTx_RollsBackOnError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	mock.ExpectBegin()
	mock.ExpectRollback()

	s := repository.NewStore(db)
	sentinel := errors.New("boom")
	if err := s.WithTx(context.Background(), func(q *sqlc.Queries) error { return sentinel }); !errors.Is(err, sentinel) {
		t.Fatalf("expected sentinel error, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
