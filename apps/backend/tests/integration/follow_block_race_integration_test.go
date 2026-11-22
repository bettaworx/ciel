//go:build integration
// +build integration

package integration_test

import (
	"context"
	"testing"
	"time"

	"backend/internal/db/sqlc"
)

// Follow checks for a block before its transaction, so the insert itself must
// refuse when a block exists, in either direction.
func TestIntegration_FollowUser_RefusesWhenBlocked(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	alice := registerUser(t, client, app.Server.URL, "race_alice", "Password123")
	bob := registerUser(t, client, app.Server.URL, "race_bob", "Password123")
	ctx := context.Background()
	q := sqlc.New(app.SQLDB)

	if err := q.BlockUser(ctx, sqlc.BlockUserParams{BlockerID: bob.Id, BlockedID: alice.Id}); err != nil {
		t.Fatal(err)
	}
	for _, p := range []sqlc.FollowUserParams{
		{FollowerID: alice.Id, FolloweeID: bob.Id, Accepted: true},
		{FollowerID: bob.Id, FolloweeID: alice.Id, Accepted: true},
	} {
		n, err := q.FollowUser(ctx, p)
		if err != nil {
			t.Fatal(err)
		}
		if n != 0 {
			t.Fatalf("FollowUser(%v -> %v) inserted %d rows despite a block", p.FollowerID, p.FolloweeID, n)
		}
	}
}

// Block and Follow take the same lock for a pair, whichever side calls it, so
// a follow cannot be inserted while a block is between its insert and delete.
func TestIntegration_LockFollowPair_SerializesBothDirections(t *testing.T) {
	app := newTestApp(t)
	defer app.Close()

	client := app.Server.Client()
	alice := registerUser(t, client, app.Server.URL, "lock_alice", "Password123")
	bob := registerUser(t, client, app.Server.URL, "lock_bob", "Password123")
	ctx := context.Background()

	tx, err := app.SQLDB.BeginTx(ctx, nil)
	if err != nil {
		t.Fatal(err)
	}
	if err := sqlc.New(tx).LockFollowPair(ctx, sqlc.LockFollowPairParams{UserID: alice.Id, OtherID: bob.Id}); err != nil {
		t.Fatal(err)
	}

	acquired := make(chan error, 1)
	go func() {
		tx2, err := app.SQLDB.BeginTx(ctx, nil)
		if err != nil {
			acquired <- err
			return
		}
		defer func() { _ = tx2.Rollback() }()
		// The reversed pair must map to the same lock.
		acquired <- sqlc.New(tx2).LockFollowPair(ctx, sqlc.LockFollowPairParams{UserID: bob.Id, OtherID: alice.Id})
	}()

	select {
	case err := <-acquired:
		t.Fatalf("second transaction took the lock while the first held it (err=%v)", err)
	case <-time.After(300 * time.Millisecond):
	}
	if err := tx.Commit(); err != nil {
		t.Fatal(err)
	}
	select {
	case err := <-acquired:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("second transaction never got the lock after the first committed")
	}
}
