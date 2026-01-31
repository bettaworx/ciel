package auth_test

import (
	"testing"
	"time"

	"backend/internal/auth"
)

func TestLoginSessionStore_OneTimeDelete(t *testing.T) {
	s := auth.NewMemoryLoginSessionStore()
	s.Put(auth.LoginSession{SessionID: "sid", Username: "u", ExpiresAtUTC: time.Now().UTC().Add(1 * time.Hour)})
	_, ok := s.Get("sid")
	if !ok {
		t.Fatalf("expected session to exist")
	}
	s.Delete("sid")
	_, ok = s.Get("sid")
	if ok {
		t.Fatalf("expected session to be deleted")
	}
}

func TestLoginSessionStore_ExpiredIsRejectedAndPruned(t *testing.T) {
	s := auth.NewMemoryLoginSessionStore()
	s.Put(auth.LoginSession{SessionID: "expired", Username: "u", ExpiresAtUTC: time.Now().UTC().Add(-1 * time.Second)})
	_, ok := s.Get("expired")
	if ok {
		t.Fatalf("expected expired session to be rejected")
	}
}
