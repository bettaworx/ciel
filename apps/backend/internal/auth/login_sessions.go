package auth

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type LoginSession struct {
	SessionID    string
	Username     string
	ClientNonce  string
	ServerNonce  string
	SaltB64      string
	Iterations   int
	ExpiresAtUTC time.Time
}

// LoginSessionStore defines the interface for login session storage
type LoginSessionStore interface {
	Put(session LoginSession) error
	Get(sessionID string) (LoginSession, bool)
	Delete(sessionID string) error
}

// MemoryLoginSessionStore is an in-memory implementation (for backward compatibility / testing)
type MemoryLoginSessionStore struct {
	mu       sync.Mutex
	sessions map[string]LoginSession
}

func NewMemoryLoginSessionStore() *MemoryLoginSessionStore {
	return &MemoryLoginSessionStore{sessions: map[string]LoginSession{}}
}

func (s *MemoryLoginSessionStore) Put(session LoginSession) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pruneLocked(time.Now().UTC())
	s.sessions[session.SessionID] = session
	return nil
}

func (s *MemoryLoginSessionStore) Get(sessionID string) (LoginSession, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pruneLocked(time.Now().UTC())
	sess, ok := s.sessions[sessionID]
	if !ok {
		return LoginSession{}, false
	}
	if time.Now().UTC().After(sess.ExpiresAtUTC) {
		delete(s.sessions, sessionID)
		return LoginSession{}, false
	}
	return sess, true
}

func (s *MemoryLoginSessionStore) Delete(sessionID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, sessionID)
	return nil
}

func (s *MemoryLoginSessionStore) pruneLocked(now time.Time) {
	for k, v := range s.sessions {
		if now.After(v.ExpiresAtUTC) {
			delete(s.sessions, k)
		}
	}
}

// RedisLoginSessionStore is a Redis-backed implementation
type RedisLoginSessionStore struct {
	redis *redis.Client
	ttl   time.Duration
}

func NewRedisLoginSessionStore(rdb *redis.Client, ttl time.Duration) *RedisLoginSessionStore {
	return &RedisLoginSessionStore{
		redis: rdb,
		ttl:   ttl,
	}
}

func (s *RedisLoginSessionStore) Put(session LoginSession) error {
	key := "login:session:" + session.SessionID
	data, err := json.Marshal(session)
	if err != nil {
		return err
	}

	// Calculate TTL from ExpiresAtUTC
	ttl := time.Until(session.ExpiresAtUTC)
	if ttl <= 0 {
		ttl = s.ttl
	}

	return s.redis.Set(context.Background(), key, data, ttl).Err()
}

func (s *RedisLoginSessionStore) Get(sessionID string) (LoginSession, bool) {
	key := "login:session:" + sessionID
	data, err := s.redis.Get(context.Background(), key).Result()
	if err != nil {
		return LoginSession{}, false
	}

	var session LoginSession
	if err := json.Unmarshal([]byte(data), &session); err != nil {
		return LoginSession{}, false
	}

	// Check expiration
	if time.Now().UTC().After(session.ExpiresAtUTC) {
		s.Delete(sessionID)
		return LoginSession{}, false
	}

	return session, true
}

func (s *RedisLoginSessionStore) Delete(sessionID string) error {
	key := "login:session:" + sessionID
	return s.redis.Del(context.Background(), key).Err()
}

type StepupSession struct {
	SessionID    string
	UserID       string
	Username     string
	ClientNonce  string
	ServerNonce  string
	SaltB64      string
	Iterations   int
	ExpiresAtUTC time.Time
}

// StepupSessionStore defines the interface for stepup session storage
type StepupSessionStore interface {
	Put(session StepupSession) error
	Get(sessionID string) (StepupSession, bool)
	Delete(sessionID string) error
}

// MemoryStepupSessionStore is an in-memory implementation
type MemoryStepupSessionStore struct {
	mu       sync.Mutex
	sessions map[string]StepupSession
}

func NewMemoryStepupSessionStore() *MemoryStepupSessionStore {
	return &MemoryStepupSessionStore{sessions: map[string]StepupSession{}}
}

func (s *MemoryStepupSessionStore) Put(session StepupSession) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pruneLocked(time.Now().UTC())
	s.sessions[session.SessionID] = session
	return nil
}

func (s *MemoryStepupSessionStore) Get(sessionID string) (StepupSession, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pruneLocked(time.Now().UTC())
	sess, ok := s.sessions[sessionID]
	if !ok {
		return StepupSession{}, false
	}
	if time.Now().UTC().After(sess.ExpiresAtUTC) {
		delete(s.sessions, sessionID)
		return StepupSession{}, false
	}
	return sess, true
}

func (s *MemoryStepupSessionStore) Delete(sessionID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, sessionID)
	return nil
}

func (s *MemoryStepupSessionStore) pruneLocked(now time.Time) {
	for k, v := range s.sessions {
		if now.After(v.ExpiresAtUTC) {
			delete(s.sessions, k)
		}
	}
}

// RedisStepupSessionStore is a Redis-backed implementation
type RedisStepupSessionStore struct {
	redis *redis.Client
	ttl   time.Duration
}

func NewRedisStepupSessionStore(rdb *redis.Client, ttl time.Duration) *RedisStepupSessionStore {
	return &RedisStepupSessionStore{
		redis: rdb,
		ttl:   ttl,
	}
}

func (s *RedisStepupSessionStore) Put(session StepupSession) error {
	key := "stepup:session:" + session.SessionID
	data, err := json.Marshal(session)
	if err != nil {
		return err
	}

	// Calculate TTL from ExpiresAtUTC
	ttl := time.Until(session.ExpiresAtUTC)
	if ttl <= 0 {
		ttl = s.ttl
	}

	return s.redis.Set(context.Background(), key, data, ttl).Err()
}

func (s *RedisStepupSessionStore) Get(sessionID string) (StepupSession, bool) {
	key := "stepup:session:" + sessionID
	data, err := s.redis.Get(context.Background(), key).Result()
	if err != nil {
		return StepupSession{}, false
	}

	var session StepupSession
	if err := json.Unmarshal([]byte(data), &session); err != nil {
		return StepupSession{}, false
	}

	// Check expiration
	if time.Now().UTC().After(session.ExpiresAtUTC) {
		s.Delete(sessionID)
		return StepupSession{}, false
	}

	return session, true
}

func (s *RedisStepupSessionStore) Delete(sessionID string) error {
	key := "stepup:session:" + sessionID
	return s.redis.Del(context.Background(), key).Err()
}
