package auth

import (
	"testing"
	"time"
)

// Ceremonies that are never verified are never consumed; Put must drop the
// expired ones so unauthenticated option requests cannot grow the map forever.
func TestMemoryWebAuthnSessionStore_PutPrunesExpired(t *testing.T) {
	s := NewMemoryWebAuthnSessionStore()
	now := time.Now().UTC()
	for _, id := range []string{"old1", "old2"} {
		if err := s.Put(WebAuthnSessionData{SessionID: id, ExpiresAtUTC: now.Add(-time.Second)}); err != nil {
			t.Fatal(err)
		}
	}
	if err := s.Put(WebAuthnSessionData{SessionID: "live", ExpiresAtUTC: now.Add(time.Minute)}); err != nil {
		t.Fatal(err)
	}
	if len(s.sessions) != 1 {
		t.Fatalf("sessions = %d, want 1 (expired entries kept)", len(s.sessions))
	}
	if _, ok := s.Consume("live"); !ok {
		t.Fatal("live session was pruned")
	}
}
