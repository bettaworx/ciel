package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

// Cache provides an abstraction over caching operations.
// This interface allows services to use caching without depending directly on Redis.
type Cache interface {
	// Get retrieves a value by key
	Get(ctx context.Context, key string) (string, error)

	// Set stores a value with an optional TTL (0 = no expiration)
	Set(ctx context.Context, key string, value string, ttl time.Duration) error

	// SetNX sets a key only if it doesn't exist (returns true if set, false if already exists)
	SetNX(ctx context.Context, key string, value string, ttl time.Duration) (bool, error)

	// Delete removes a key
	Delete(ctx context.Context, keys ...string) error

	// ZRevRangeByScore retrieves sorted set members in reverse score order
	ZRevRangeByScoreWithScores(ctx context.Context, key string, opt *ZRangeBy) ([]Z, error)

	// ZRem removes members from a sorted set
	ZRem(ctx context.Context, key string, members ...interface{}) error

	// ZAdd adds members to a sorted set
	ZAdd(ctx context.Context, key string, members ...Z) error

	// SAdd adds members to a set
	SAdd(ctx context.Context, key string, members ...interface{}) error

	// SRem removes members from a set
	SRem(ctx context.Context, key string, members ...interface{}) error
}

// ZRangeBy specifies range query parameters for sorted sets
type ZRangeBy struct {
	Min    string
	Max    string
	Offset int64
	Count  int64
}

// Z represents a scored member in a sorted set
type Z struct {
	Score  float64
	Member interface{}
}

// RedisCache implements Cache using Redis
type RedisCache struct {
	client *redis.Client
}

// NewRedisCache creates a new Redis-backed cache
func NewRedisCache(client *redis.Client) *RedisCache {
	return &RedisCache{client: client}
}

func (c *RedisCache) Get(ctx context.Context, key string) (string, error) {
	return c.client.Get(ctx, key).Result()
}

func (c *RedisCache) Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	return c.client.Set(ctx, key, value, ttl).Err()
}

func (c *RedisCache) SetNX(ctx context.Context, key string, value string, ttl time.Duration) (bool, error) {
	return c.client.SetNX(ctx, key, value, ttl).Result()
}

func (c *RedisCache) Delete(ctx context.Context, keys ...string) error {
	return c.client.Del(ctx, keys...).Err()
}

func (c *RedisCache) ZRevRangeByScoreWithScores(ctx context.Context, key string, opt *ZRangeBy) ([]Z, error) {
	redisOpt := &redis.ZRangeBy{
		Min:    opt.Min,
		Max:    opt.Max,
		Offset: opt.Offset,
		Count:  opt.Count,
	}
	results, err := c.client.ZRevRangeByScoreWithScores(ctx, key, redisOpt).Result()
	if err != nil {
		return nil, err
	}

	zs := make([]Z, len(results))
	for i, r := range results {
		zs[i] = Z{Score: r.Score, Member: r.Member}
	}
	return zs, nil
}

func (c *RedisCache) ZRem(ctx context.Context, key string, members ...interface{}) error {
	return c.client.ZRem(ctx, key, members...).Err()
}

func (c *RedisCache) ZAdd(ctx context.Context, key string, members ...Z) error {
	zs := make([]redis.Z, len(members))
	for i, m := range members {
		zs[i] = redis.Z{Score: m.Score, Member: m.Member}
	}
	return c.client.ZAdd(ctx, key, zs...).Err()
}

func (c *RedisCache) SAdd(ctx context.Context, key string, members ...interface{}) error {
	return c.client.SAdd(ctx, key, members...).Err()
}

func (c *RedisCache) SRem(ctx context.Context, key string, members ...interface{}) error {
	return c.client.SRem(ctx, key, members...).Err()
}

// NoOpCache is a cache implementation that does nothing (for when caching is disabled)
type NoOpCache struct{}

// NewNoOpCache creates a cache that performs no operations
func NewNoOpCache() *NoOpCache {
	return &NoOpCache{}
}

func (c *NoOpCache) Get(ctx context.Context, key string) (string, error) {
	return "", redis.Nil
}

func (c *NoOpCache) Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	return nil
}

func (c *NoOpCache) SetNX(ctx context.Context, key string, value string, ttl time.Duration) (bool, error) {
	return true, nil
}

func (c *NoOpCache) Delete(ctx context.Context, keys ...string) error {
	return nil
}

func (c *NoOpCache) ZRevRangeByScoreWithScores(ctx context.Context, key string, opt *ZRangeBy) ([]Z, error) {
	return nil, redis.Nil
}

func (c *NoOpCache) ZRem(ctx context.Context, key string, members ...interface{}) error {
	return nil
}

func (c *NoOpCache) ZAdd(ctx context.Context, key string, members ...Z) error {
	return nil
}

func (c *NoOpCache) SAdd(ctx context.Context, key string, members ...interface{}) error {
	return nil
}

func (c *NoOpCache) SRem(ctx context.Context, key string, members ...interface{}) error {
	return nil
}
