package auth

import (
	"context"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	// DefaultMaxAttempts limits failed MFA verifications per account window.
	DefaultMaxAttempts = 5
	// DefaultAttemptWindow is how long failures are counted before expiring.
	// Once the cap is hit the account stays locked until the whole window
	// ages out.
	DefaultAttemptWindow = 15 * time.Minute
)

// AttemptLimiter counts MFA verifications per account and locks out accounts
// that exceed the allowed number of attempts inside the window.
type AttemptLimiter interface {
	// Reserve counts one attempt and reports whether it is within the cap.
	// Callers reserve before checking the code: a separate read-then-count
	// lets a concurrent burst all pass the same read.
	Reserve(key string) bool
	// Reset clears the counter after a successful verification.
	Reset(key string)
}

type MemoryAttemptLimiter struct {
	mu     sync.Mutex
	counts map[string]attemptEntry
	max    int
	window time.Duration
}

type attemptEntry struct {
	count     int
	expiresAt time.Time
}

func NewMemoryAttemptLimiter() *MemoryAttemptLimiter {
	return &MemoryAttemptLimiter{
		counts: map[string]attemptEntry{},
		max:    DefaultMaxAttempts,
		window: DefaultAttemptWindow,
	}
}

func (l *MemoryAttemptLimiter) get(key string) (attemptEntry, bool) {
	e, ok := l.counts[key]
	if !ok || time.Now().UTC().After(e.expiresAt) {
		return attemptEntry{}, false
	}
	return e, true
}

func (l *MemoryAttemptLimiter) Reserve(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	e, ok := l.get(key)
	if !ok {
		e = attemptEntry{expiresAt: time.Now().UTC().Add(l.window)}
	}
	e.count++
	l.counts[key] = e
	return e.count <= l.max
}

func (l *MemoryAttemptLimiter) Reset(key string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.counts, key)
}

type RedisAttemptLimiter struct {
	redis  *redis.Client
	max    int
	window time.Duration
}

func NewRedisAttemptLimiter(rdb *redis.Client) *RedisAttemptLimiter {
	return &RedisAttemptLimiter{
		redis:  rdb,
		max:    DefaultMaxAttempts,
		window: DefaultAttemptWindow,
	}
}

func attemptKey(key string) string {
	return "mfa:fails:" + key
}

// reserveAttemptScript increments the counter and starts its window in one
// step, so the key can never be left without an expiry.
var reserveAttemptScript = redis.NewScript(`
local n = redis.call('INCR', KEYS[1])
if n == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return n
`)

func (l *RedisAttemptLimiter) Reserve(key string) bool {
	n, err := reserveAttemptScript.Run(context.Background(), l.redis,
		[]string{attemptKey(key)}, l.window.Milliseconds()).Int()
	if err != nil {
		return true // fail open; verification itself still requires a valid code
	}
	return n <= l.max
}

func (l *RedisAttemptLimiter) Reset(key string) {
	l.redis.Del(context.Background(), attemptKey(key))
}
