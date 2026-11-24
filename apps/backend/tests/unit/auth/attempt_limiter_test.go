package auth_test

import (
	"sync"
	"sync/atomic"
	"testing"

	"backend/internal/auth"

	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

// A burst of concurrent attempts must not get more than DefaultMaxAttempts
// guesses through: each attempt is counted before the code is checked.
func TestAttemptLimiter_ConcurrentBurstIsCapped(t *testing.T) {
	mr := miniredis.RunT(t)
	limiters := map[string]auth.AttemptLimiter{
		"memory": auth.NewMemoryAttemptLimiter(),
		"redis":  auth.NewRedisAttemptLimiter(redis.NewClient(&redis.Options{Addr: mr.Addr()})),
	}
	for name, l := range limiters {
		t.Run(name, func(t *testing.T) {
			var allowed atomic.Int32
			var wg sync.WaitGroup
			for i := 0; i < 50; i++ {
				wg.Add(1)
				go func() {
					defer wg.Done()
					if l.Reserve("user-1") {
						allowed.Add(1)
					}
				}()
			}
			wg.Wait()
			if got := allowed.Load(); got != auth.DefaultMaxAttempts {
				t.Fatalf("allowed %d attempts, want %d", got, auth.DefaultMaxAttempts)
			}
			if name == "redis" && mr.TTL("mfa:fails:user-1") <= 0 {
				t.Fatal("redis counter has no expiry")
			}

			l.Reset("user-1")
			if !l.Reserve("user-1") {
				t.Fatal("attempt after Reset was refused")
			}
			if !l.Reserve("user-2") {
				t.Fatal("another account was locked out")
			}
		})
	}
}
