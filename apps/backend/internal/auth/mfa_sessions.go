package auth

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// MfaPurpose distinguishes login MFA from step-up MFA sessions.
type MfaPurpose string

const (
	MfaPurposeLogin  MfaPurpose = "login"
	MfaPurposeStepup MfaPurpose = "stepup"
)

// MfaSession is issued after SCRAM succeeds when the account has 2FA enabled.
type MfaSession struct {
	Token        string     `json:"token"`
	UserID       string     `json:"userId"`
	Username     string     `json:"username"`
	Purpose      MfaPurpose `json:"purpose"`
	Methods      []string   `json:"methods"`
	ExpiresAtUTC time.Time  `json:"expiresAtUtc"`
}

// MfaSessionStore stores short-lived MFA challenge sessions.
type MfaSessionStore interface {
	Put(session MfaSession) error
	// Consume atomically retrieves and deletes the session.
	Consume(token string) (MfaSession, bool)
	Get(token string) (MfaSession, bool)
	Delete(token string) error
}

// MemoryMfaSessionStore is an in-memory implementation for tests.
type MemoryMfaSessionStore struct {
	mu       sync.Mutex
	sessions map[string]MfaSession
}

func NewMemoryMfaSessionStore() *MemoryMfaSessionStore {
	return &MemoryMfaSessionStore{sessions: map[string]MfaSession{}}
}

func (s *MemoryMfaSessionStore) Put(session MfaSession) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pruneLocked(time.Now().UTC())
	s.sessions[session.Token] = session
	return nil
}

func (s *MemoryMfaSessionStore) Get(token string) (MfaSession, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pruneLocked(time.Now().UTC())
	sess, ok := s.sessions[token]
	if !ok || time.Now().UTC().After(sess.ExpiresAtUTC) {
		delete(s.sessions, token)
		return MfaSession{}, false
	}
	return sess, true
}

func (s *MemoryMfaSessionStore) Consume(token string) (MfaSession, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pruneLocked(time.Now().UTC())
	sess, ok := s.sessions[token]
	if !ok || time.Now().UTC().After(sess.ExpiresAtUTC) {
		delete(s.sessions, token)
		return MfaSession{}, false
	}
	delete(s.sessions, token)
	return sess, true
}

func (s *MemoryMfaSessionStore) Delete(token string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, token)
	return nil
}

func (s *MemoryMfaSessionStore) pruneLocked(now time.Time) {
	for k, v := range s.sessions {
		if now.After(v.ExpiresAtUTC) {
			delete(s.sessions, k)
		}
	}
}

// RedisMfaSessionStore is a Redis-backed implementation.
type RedisMfaSessionStore struct {
	redis *redis.Client
	ttl   time.Duration
}

func NewRedisMfaSessionStore(rdb *redis.Client, ttl time.Duration) *RedisMfaSessionStore {
	return &RedisMfaSessionStore{redis: rdb, ttl: ttl}
}

func mfaSessionKey(token string) string {
	return "mfa:session:" + token
}

func (s *RedisMfaSessionStore) Put(session MfaSession) error {
	data, err := json.Marshal(session)
	if err != nil {
		return err
	}
	ttl := time.Until(session.ExpiresAtUTC)
	if ttl <= 0 {
		ttl = s.ttl
	}
	return s.redis.Set(context.Background(), mfaSessionKey(session.Token), data, ttl).Err()
}

func (s *RedisMfaSessionStore) Get(token string) (MfaSession, bool) {
	data, err := s.redis.Get(context.Background(), mfaSessionKey(token)).Result()
	if err != nil {
		return MfaSession{}, false
	}
	var session MfaSession
	if err := json.Unmarshal([]byte(data), &session); err != nil {
		return MfaSession{}, false
	}
	if time.Now().UTC().After(session.ExpiresAtUTC) {
		_ = s.Delete(token)
		return MfaSession{}, false
	}
	return session, true
}

func (s *RedisMfaSessionStore) Consume(token string) (MfaSession, bool) {
	key := mfaSessionKey(token)
	// GETDEL when available; fall back to GET+DEL.
	data, err := s.redis.GetDel(context.Background(), key).Result()
	if err != nil {
		return MfaSession{}, false
	}
	var session MfaSession
	if err := json.Unmarshal([]byte(data), &session); err != nil {
		return MfaSession{}, false
	}
	if time.Now().UTC().After(session.ExpiresAtUTC) {
		return MfaSession{}, false
	}
	return session, true
}

func (s *RedisMfaSessionStore) Delete(token string) error {
	return s.redis.Del(context.Background(), mfaSessionKey(token)).Err()
}

// TotpPendingSetup holds a not-yet-confirmed TOTP secret.
type TotpPendingSetup struct {
	UserID       string    `json:"userId"`
	Secret       string    `json:"secret"` // base32 plaintext (only in Redis, short TTL)
	ExpiresAtUTC time.Time `json:"expiresAtUtc"`
}

// TotpSetupStore stores pending TOTP enrollments.
type TotpSetupStore interface {
	Put(setup TotpPendingSetup) error
	Consume(userID string) (TotpPendingSetup, bool)
	Delete(userID string) error
}

type MemoryTotpSetupStore struct {
	mu    sync.Mutex
	items map[string]TotpPendingSetup
}

func NewMemoryTotpSetupStore() *MemoryTotpSetupStore {
	return &MemoryTotpSetupStore{items: map[string]TotpPendingSetup{}}
}

func (s *MemoryTotpSetupStore) Put(setup TotpPendingSetup) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[setup.UserID] = setup
	return nil
}

func (s *MemoryTotpSetupStore) Consume(userID string) (TotpPendingSetup, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	setup, ok := s.items[userID]
	if !ok || time.Now().UTC().After(setup.ExpiresAtUTC) {
		delete(s.items, userID)
		return TotpPendingSetup{}, false
	}
	delete(s.items, userID)
	return setup, true
}

func (s *MemoryTotpSetupStore) Delete(userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, userID)
	return nil
}

type RedisTotpSetupStore struct {
	redis *redis.Client
	ttl   time.Duration
}

func NewRedisTotpSetupStore(rdb *redis.Client, ttl time.Duration) *RedisTotpSetupStore {
	return &RedisTotpSetupStore{redis: rdb, ttl: ttl}
}

func totpSetupKey(userID string) string {
	return "mfa:totp:setup:" + userID
}

func (s *RedisTotpSetupStore) Put(setup TotpPendingSetup) error {
	data, err := json.Marshal(setup)
	if err != nil {
		return err
	}
	ttl := time.Until(setup.ExpiresAtUTC)
	if ttl <= 0 {
		ttl = s.ttl
	}
	return s.redis.Set(context.Background(), totpSetupKey(setup.UserID), data, ttl).Err()
}

func (s *RedisTotpSetupStore) Consume(userID string) (TotpPendingSetup, bool) {
	data, err := s.redis.GetDel(context.Background(), totpSetupKey(userID)).Result()
	if err != nil {
		return TotpPendingSetup{}, false
	}
	var setup TotpPendingSetup
	if err := json.Unmarshal([]byte(data), &setup); err != nil {
		return TotpPendingSetup{}, false
	}
	if time.Now().UTC().After(setup.ExpiresAtUTC) {
		return TotpPendingSetup{}, false
	}
	return setup, true
}

func (s *RedisTotpSetupStore) Delete(userID string) error {
	return s.redis.Del(context.Background(), totpSetupKey(userID)).Err()
}
