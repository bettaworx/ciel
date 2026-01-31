package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"
	"regexp"
	"sync"
	"time"

	"backend/internal/cache"

	"github.com/redis/go-redis/v9"
)

// setupTokenEntry stores token data with expiration
type setupTokenEntry struct {
	createdAt time.Time
	expiresAt time.Time
}

// SetupTokenManager manages temporary tokens for initial setup
type SetupTokenManager struct {
	cache       cache.Cache
	memoryStore map[string]setupTokenEntry // Fallback when Redis unavailable
	mu          sync.RWMutex               // Protects memoryStore
}

// setupTokenPattern matches valid setup tokens (64 hex characters)
var setupTokenPattern = regexp.MustCompile(`^[a-f0-9]{64}$`)

// NewSetupTokenManager creates a new SetupTokenManager
func NewSetupTokenManager(cache cache.Cache) *SetupTokenManager {
	mgr := &SetupTokenManager{
		cache:       cache,
		memoryStore: make(map[string]setupTokenEntry),
	}

	// If cache is not available, log a warning
	if cache == nil {
		slog.Warn("SetupTokenManager initialized without cache; using in-memory fallback (not suitable for multi-instance deployments)")
	}

	return mgr
}

// GenerateSetupToken creates a temporary token valid for 10 minutes
func (m *SetupTokenManager) GenerateSetupToken(ctx context.Context) (string, error) {
	// Generate random token (32 bytes = 64 hex characters)
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", fmt.Errorf("failed to generate random token: %w", err)
	}
	token := hex.EncodeToString(tokenBytes)

	// Try cache first, fall back to memory if unavailable
	if m.cache != nil {
		key := fmt.Sprintf("setup:token:%s", token)
		err := m.cache.Set(ctx, key, fmt.Sprintf("%d", time.Now().Unix()), 10*time.Minute)
		if err != nil {
			slog.Warn("failed to store setup token in cache; falling back to memory", "error", err)
			// Fall through to memory store
		} else {
			return token, nil
		}
	}

	// Use memory store as fallback
	m.mu.Lock()
	defer m.mu.Unlock()

	// Clean up expired tokens
	m.cleanupExpiredTokensLocked()

	m.memoryStore[token] = setupTokenEntry{
		createdAt: time.Now(),
		expiresAt: time.Now().Add(10 * time.Minute),
	}

	return token, nil
}

// ValidateSetupToken checks if the token is valid and deletes it (one-time use)
func (m *SetupTokenManager) ValidateSetupToken(ctx context.Context, token string) (bool, error) {
	// Validate token format (must be 64 hex characters)
	// This prevents Redis protocol injection attacks
	if !setupTokenPattern.MatchString(token) {
		return false, nil
	}

	// Try cache first
	if m.cache != nil {
		key := fmt.Sprintf("setup:token:%s", token)

		// Check if token exists
		val, err := m.cache.Get(ctx, key)
		if errors.Is(err, redis.Nil) {
			// Token doesn't exist in cache, check memory store
			return m.validateFromMemory(token)
		}
		if err != nil {
			slog.Warn("failed to validate setup token in cache; falling back to memory", "error", err)
			return m.validateFromMemory(token)
		}

		// Token exists and is valid in cache
		if val == "" {
			return false, nil
		}

		// Delete the token from cache (one-time use)
		if err := m.cache.Delete(ctx, key); err != nil {
			slog.Warn("failed to delete setup token from cache", "error", err)
			// Don't return error here, token was valid
		}

		return true, nil
	}

	// Use memory store if cache unavailable
	return m.validateFromMemory(token)
}

// validateFromMemory checks and deletes token from memory store
func (m *SetupTokenManager) validateFromMemory(token string) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, exists := m.memoryStore[token]
	if !exists {
		return false, nil
	}

	// Check if token expired
	if time.Now().After(entry.expiresAt) {
		delete(m.memoryStore, token)
		return false, nil
	}

	// Token is valid, delete it (one-time use)
	delete(m.memoryStore, token)
	return true, nil
}

// cleanupExpiredTokensLocked removes expired tokens from memory (caller must hold lock)
func (m *SetupTokenManager) cleanupExpiredTokensLocked() {
	now := time.Now()
	for token, entry := range m.memoryStore {
		if now.After(entry.expiresAt) {
			delete(m.memoryStore, token)
		}
	}
}
