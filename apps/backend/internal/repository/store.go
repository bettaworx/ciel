package repository

import (
	"context"
	"database/sql"

	"backend/internal/db/sqlc"
)

type Store struct {
	DB *sql.DB
	Q  *sqlc.Queries
}

func NewStore(db *sql.DB) *Store {
	return &Store{DB: db, Q: sqlc.New(db)}
}

func (s *Store) WithTx(ctx context.Context, fn func(q *sqlc.Queries) error) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	q := s.Q.WithTx(tx)
	if err := fn(q); err != nil {
		_ = tx.Rollback()
		return err
	}
	return tx.Commit()
}
