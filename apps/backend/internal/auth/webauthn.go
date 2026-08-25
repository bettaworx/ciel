package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// WebAuthnUser adapts a Ciel user + credentials to webauthn.User.
type WebAuthnUser struct {
	ID          uuid.UUID
	Name        string
	DisplayName string
	Credentials []webauthn.Credential
}

func (u *WebAuthnUser) WebAuthnID() []byte          { return u.ID[:] }
func (u *WebAuthnUser) WebAuthnName() string         { return u.Name }
func (u *WebAuthnUser) WebAuthnDisplayName() string  { return u.DisplayName }
func (u *WebAuthnUser) WebAuthnCredentials() []webauthn.Credential {
	return u.Credentials
}

// WebAuthnConfig holds Relying Party settings.
type WebAuthnConfig struct {
	RPDisplayName string
	RPID          string
	RPOrigins     []string
}

// WebAuthnConfigFromEnv builds config from environment variables.
// WEBAUTHN_RP_ID overrides; otherwise host of PUBLIC_BASE_URL is used.
// Origins come from ALLOWED_ORIGINS (same as CORS), falling back to localhost.
func WebAuthnConfigFromEnv() (WebAuthnConfig, error) {
	display := os.Getenv("WEBAUTHN_RP_DISPLAY_NAME")
	if display == "" {
		display = "Ciel"
	}
	rpid := strings.TrimSpace(os.Getenv("WEBAUTHN_RP_ID"))
	if rpid == "" {
		base := strings.TrimSpace(os.Getenv("PUBLIC_BASE_URL"))
		if base == "" {
			rpid = "localhost"
		} else {
			u, err := url.Parse(base)
			if err != nil || u.Hostname() == "" {
				return WebAuthnConfig{}, fmt.Errorf("invalid PUBLIC_BASE_URL for WebAuthn RP ID")
			}
			rpid = u.Hostname()
		}
	}
	origins := getWebAuthnOrigins()
	return WebAuthnConfig{
		RPDisplayName: display,
		RPID:          rpid,
		RPOrigins:     origins,
	}, nil
}

func getWebAuthnOrigins() []string {
	if custom := os.Getenv("ALLOWED_ORIGINS"); custom != "" {
		parts := strings.Split(custom, ",")
		out := make([]string, 0, len(parts))
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" {
				out = append(out, p)
			}
		}
		if len(out) > 0 {
			return out
		}
	}
	return []string{
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"https://localhost:3000",
		"https://127.0.0.1:3000",
	}
}

// NewWebAuthn creates a configured webauthn.WebAuthn instance.
func NewWebAuthn(cfg WebAuthnConfig) (*webauthn.WebAuthn, error) {
	return webauthn.New(&webauthn.Config{
		RPDisplayName: cfg.RPDisplayName,
		RPID:          cfg.RPID,
		RPOrigins:     cfg.RPOrigins,
	})
}

// WebAuthnSessionData is stored between options and verify.
type WebAuthnSessionData struct {
	SessionID    string                `json:"sessionId"`
	UserID       string                `json:"userId"`
	Purpose      string                `json:"purpose"` // register | assert
	MfaToken     string                `json:"mfaToken,omitempty"`
	SessionData  webauthn.SessionData  `json:"sessionData"`
	ExpiresAtUTC time.Time             `json:"expiresAtUtc"`
}

// WebAuthnSessionStore stores in-flight WebAuthn ceremonies.
type WebAuthnSessionStore interface {
	Put(session WebAuthnSessionData) error
	Consume(sessionID string) (WebAuthnSessionData, bool)
	Delete(sessionID string) error
}

type MemoryWebAuthnSessionStore struct {
	mu       sync.Mutex
	sessions map[string]WebAuthnSessionData
}

func NewMemoryWebAuthnSessionStore() *MemoryWebAuthnSessionStore {
	return &MemoryWebAuthnSessionStore{sessions: map[string]WebAuthnSessionData{}}
}

func (s *MemoryWebAuthnSessionStore) Put(session WebAuthnSessionData) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[session.SessionID] = session
	return nil
}

func (s *MemoryWebAuthnSessionStore) Consume(sessionID string) (WebAuthnSessionData, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	sess, ok := s.sessions[sessionID]
	if !ok || time.Now().UTC().After(sess.ExpiresAtUTC) {
		delete(s.sessions, sessionID)
		return WebAuthnSessionData{}, false
	}
	delete(s.sessions, sessionID)
	return sess, true
}

func (s *MemoryWebAuthnSessionStore) Delete(sessionID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, sessionID)
	return nil
}

type RedisWebAuthnSessionStore struct {
	redis *redis.Client
	ttl   time.Duration
}

func NewRedisWebAuthnSessionStore(rdb *redis.Client, ttl time.Duration) *RedisWebAuthnSessionStore {
	return &RedisWebAuthnSessionStore{redis: rdb, ttl: ttl}
}

func webauthnSessionKey(id string) string {
	return "mfa:webauthn:session:" + id
}

func (s *RedisWebAuthnSessionStore) Put(session WebAuthnSessionData) error {
	data, err := json.Marshal(session)
	if err != nil {
		return err
	}
	ttl := time.Until(session.ExpiresAtUTC)
	if ttl <= 0 {
		ttl = s.ttl
	}
	return s.redis.Set(context.Background(), webauthnSessionKey(session.SessionID), data, ttl).Err()
}

func (s *RedisWebAuthnSessionStore) Consume(sessionID string) (WebAuthnSessionData, bool) {
	data, err := s.redis.GetDel(context.Background(), webauthnSessionKey(sessionID)).Result()
	if err != nil {
		return WebAuthnSessionData{}, false
	}
	var session WebAuthnSessionData
	if err := json.Unmarshal([]byte(data), &session); err != nil {
		return WebAuthnSessionData{}, false
	}
	if time.Now().UTC().After(session.ExpiresAtUTC) {
		return WebAuthnSessionData{}, false
	}
	return session, true
}

func (s *RedisWebAuthnSessionStore) Delete(sessionID string) error {
	return s.redis.Del(context.Background(), webauthnSessionKey(sessionID)).Err()
}

// CredentialToProtocol converts library credential for allowCredentials lists.
func CredentialDescriptor(cred webauthn.Credential) protocol.CredentialDescriptor {
	return protocol.CredentialDescriptor{
		Type:         protocol.PublicKeyCredentialType,
		CredentialID: cred.ID,
		Transport:    cred.Transport,
	}
}
