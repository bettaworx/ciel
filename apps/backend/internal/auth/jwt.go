package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type TokenManager struct {
	secret    []byte
	ttl       time.Duration
	stepupTTL time.Duration
	redis     *redis.Client
}

type Claims struct {
	UserID    string `json:"uid"`
	Username  string `json:"usr"`
	TokenType string `json:"token_type,omitempty"`
	jwt.RegisteredClaims
}

const (
	tokenTypeAccess  = "access"
	tokenTypeStepup  = "stepup"
	defaultStepupTTL = 5 * time.Minute
)

func NewTokenManager(secret []byte, ttl time.Duration) *TokenManager {
	return &TokenManager{secret: secret, ttl: ttl, stepupTTL: defaultStepupTTL, redis: nil}
}

// SetRedis sets the Redis client for token revocation functionality
func (m *TokenManager) SetRedis(rdb *redis.Client) {
	m.redis = rdb
}

// InvalidateUserTokens invalidates all tokens for a user by recording the revocation time in Redis
func (m *TokenManager) InvalidateUserTokens(ctx context.Context, userID string) error {
	if m.redis == nil {
		// If Redis is not available, we can't revoke tokens
		// This is acceptable as tokens will expire naturally
		return nil
	}

	key := "token:revoke:" + userID
	now := time.Now().UTC().Format(time.RFC3339)

	// Store revocation time indefinitely (or use a very long TTL)
	// We don't set TTL here because we need to check against old tokens
	return m.redis.Set(ctx, key, now, 0).Err()
}

func (m *TokenManager) Issue(user User) (token string, expiresInSeconds int, err error) {
	now := time.Now().UTC()
	exp := now.Add(m.ttl)
	claims := Claims{
		UserID:    user.ID.String(),
		Username:  user.Username,
		TokenType: tokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(exp),
		},
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := jwtToken.SignedString(m.secret)
	if err != nil {
		return "", 0, err
	}
	return signed, int(m.ttl.Seconds()), nil
}

func (m *TokenManager) SetStepupTTL(ttl time.Duration) {
	if ttl > 0 {
		m.stepupTTL = ttl
	}
}

func (m *TokenManager) IssueStepup(user User) (token string, expiresInSeconds int, err error) {
	now := time.Now().UTC()
	exp := now.Add(m.stepupTTL)
	jti, err := RandomToken(18)
	if err != nil {
		return "", 0, err
	}
	claims := Claims{
		UserID:    user.ID.String(),
		Username:  user.Username,
		TokenType: tokenTypeStepup,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jti,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(exp),
		},
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := jwtToken.SignedString(m.secret)
	if err != nil {
		return "", 0, err
	}
	return signed, int(m.stepupTTL.Seconds()), nil
}

func (m *TokenManager) Parse(token string) (User, error) {
	if token == "" {
		return User{}, ErrUnauthorized
	}

	parsed, err := jwt.ParseWithClaims(token, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return m.secret, nil
	})
	if err != nil {
		return User{}, ErrUnauthorized
	}

	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return User{}, ErrUnauthorized
	}
	if claims.TokenType == tokenTypeStepup {
		return User{}, ErrUnauthorized
	}
	if claims.TokenType != "" && claims.TokenType != tokenTypeAccess {
		return User{}, ErrUnauthorized
	}
	if claims.UserID == "" || claims.Username == "" {
		return User{}, ErrUnauthorized
	}
	uid, err := uuid.Parse(claims.UserID)
	if err != nil {
		return User{}, ErrUnauthorized
	}

	// Check if the token has been revoked (if Redis is available)
	if m.redis != nil && claims.IssuedAt != nil {
		ctx := context.Background()
		key := "token:revoke:" + claims.UserID
		revokedAfter, err := m.redis.Get(ctx, key).Result()
		if err == nil && revokedAfter != "" {
			// Parse the revocation time
			revokedTime, err := time.Parse(time.RFC3339, revokedAfter)
			if err == nil {
				// If token was issued before the revocation time, reject it
				if claims.IssuedAt.Time.Before(revokedTime) {
					return User{}, ErrUnauthorized
				}
			}
		}
	}

	return User{ID: uid, Username: claims.Username}, nil
}

func (m *TokenManager) ParseStepup(token string) (User, string, time.Time, error) {
	if token == "" {
		return User{}, "", time.Time{}, ErrUnauthorized
	}

	parsed, err := jwt.ParseWithClaims(token, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return m.secret, nil
	})
	if err != nil {
		return User{}, "", time.Time{}, ErrUnauthorized
	}

	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return User{}, "", time.Time{}, ErrUnauthorized
	}
	if claims.TokenType != tokenTypeStepup {
		return User{}, "", time.Time{}, ErrUnauthorized
	}
	if claims.UserID == "" || claims.Username == "" {
		return User{}, "", time.Time{}, ErrUnauthorized
	}
	if strings.TrimSpace(claims.ID) == "" {
		return User{}, "", time.Time{}, ErrUnauthorized
	}
	if claims.ExpiresAt == nil {
		return User{}, "", time.Time{}, ErrUnauthorized
	}
	uid, err := uuid.Parse(claims.UserID)
	if err != nil {
		return User{}, "", time.Time{}, ErrUnauthorized
	}
	return User{ID: uid, Username: claims.Username}, claims.ID, claims.ExpiresAt.Time, nil
}
