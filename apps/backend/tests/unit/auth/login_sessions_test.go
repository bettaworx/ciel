package auth_test

import (
	"testing"
	"time"

	"backend/internal/auth"
)

func TestLoginSessionStore_OneTimeDelete(t *testing.T) {
	s := auth.NewMemoryLoginSessionStore()
	if err := s.Put(auth.LoginSession{SessionID: "sid", Username: "u", ExpiresAtUTC: time.Now().UTC().Add(1 * time.Hour)}); err != nil {
		t.Fatal(err)
	}
	_, ok := s.Get("sid")
	if !ok {
		t.Fatalf("expected session to exist")
	}
	if err := s.Delete("sid"); err != nil {
		t.Fatal(err)
	}
	_, ok = s.Get("sid")
	if ok {
		t.Fatalf("expected session to be deleted")
	}
}

func TestLoginSessionStore_ExpiredIsRejectedAndPruned(t *testing.T) {
	s := auth.NewMemoryLoginSessionStore()
	if err := s.Put(auth.LoginSession{SessionID: "expired", Username: "u", ExpiresAtUTC: time.Now().UTC().Add(-1 * time.Second)}); err != nil {
		t.Fatal(err)
	}
	_, ok := s.Get("expired")
	if ok {
		t.Fatalf("expected expired session to be rejected")
	}
}
