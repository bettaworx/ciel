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

// AttemptLimiter tracks failed MFA verifications per account and locks out
// accounts that exceed the allowed number of attempts inside the window.
type AttemptLimiter interface {
	// Blocked reports whether the key has exceeded the attempt cap.
	Blocked(key string) bool
	// Fail records one failed attempt.
	Fail(key string)
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

func (l *MemoryAttemptLimiter) Blocked(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	e, ok := l.get(key)
	return ok && e.count >= l.max
}

func (l *MemoryAttemptLimiter) Fail(key string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now().UTC()
	e, ok := l.get(key)
	if !ok {
		l.counts[key] = attemptEntry{count: 1, expiresAt: now.Add(l.window)}
		return
	}
	e.count++
	l.counts[key] = e
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

func (l *RedisAttemptLimiter) count(ctx context.Context, key string) (int, error) {
	n, err := l.redis.Get(ctx, attemptKey(key)).Int()
	if err != nil {
		return 0, err
	}
	return n, nil
}

func (l *RedisAttemptLimiter) Blocked(key string) bool {
	n, err := l.count(context.Background(), key)
	if err != nil {
		return false // redis.Nil → not counted; other errors fail open here,
		// verification itself still requires a valid code.
	}
	return n >= l.max
}

func (l *RedisAttemptLimiter) Fail(key string) {
	ctx := context.Background()
	n, err := l.redis.Incr(ctx, attemptKey(key)).Result()
	if err != nil {
		return
	}
	if n == 1 {
		l.redis.Expire(ctx, attemptKey(key), l.window)
	}
}

func (l *RedisAttemptLimiter) Reset(key string) {
	l.redis.Del(context.Background(), attemptKey(key))
}
