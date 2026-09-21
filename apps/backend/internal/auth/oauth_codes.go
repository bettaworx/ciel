package auth

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// AuthorizationCodeTTL is how long a code stays exchangeable. RFC 6749 §4.1.2
// asks for a short lifetime and suggests ten minutes as the maximum; there is
// no reason to be at the maximum, since the exchange happens immediately after
// the redirect.
const AuthorizationCodeTTL = 2 * time.Minute

// ErrCodeNotFound means the code was never issued, has expired, or has already
// been spent. The three are deliberately indistinguishable to the caller:
// telling a client which one it was is a probing oracle.
var ErrCodeNotFound = errors.New("authorization code not found")

// AuthorizationCode is what a consented authorization request carries forward
// to the token exchange.
//
// Everything the exchange must re-check is stored here rather than re-derived,
// because the token request arrives from the app's back end and cannot be
// trusted to repeat the values the user actually saw and approved.
type AuthorizationCode struct {
	ClientID      uuid.UUID `json:"client_id"`
	UserID        uuid.UUID `json:"user_id"`
	RedirectURI   string    `json:"redirect_uri"`
	Scopes        []string  `json:"scopes"`
	CodeChallenge string    `json:"code_challenge"`
}

// AuthorizationCodeStore holds authorization codes between the consent screen
// and the token exchange.
//
// Redis only, with no in-memory sibling — unlike the login and step-up session
// stores next door. Consume must be atomic for a code to be genuinely
// single-use, and the in-memory stores read and delete in two steps, which is
// fine for a login nonce and is not fine here: two concurrent exchanges of one
// stolen code would both succeed. GETDEL gives atomicity for free, and a
// single-process map cannot give it across replicas at all.
type AuthorizationCodeStore struct {
	redis *redis.Client
}

func NewAuthorizationCodeStore(rdb *redis.Client) *AuthorizationCodeStore {
	return &AuthorizationCodeStore{redis: rdb}
}

// Available reports whether codes can be issued at all. When Redis is absent
// the authorize endpoint must fail loudly rather than mint codes nothing can
// redeem.
func (s *AuthorizationCodeStore) Available() bool {
	return s != nil && s.redis != nil
}

func codeKey(codeHash string) string {
	return "oauth:code:" + codeHash
}

// Put stores a code under the hash of its raw value.
//
// The raw code is never written down: it is the bearer credential, and a Redis
// dump should not be a pile of usable authorization codes any more than the
// users table should be a pile of usable passwords.
func (s *AuthorizationCodeStore) Put(ctx context.Context, rawCode string, code AuthorizationCode) error {
	if !s.Available() {
		return errors.New("authorization code store unavailable")
	}
	data, err := json.Marshal(code)
	if err != nil {
		return err
	}
	return s.redis.Set(ctx, codeKey(hashToken(rawCode)), data, AuthorizationCodeTTL).Err()
}

// Consume returns the code and deletes it in one operation, so a code can be
// redeemed exactly once even if two requests race.
func (s *AuthorizationCodeStore) Consume(ctx context.Context, rawCode string) (AuthorizationCode, error) {
	if !s.Available() {
		return AuthorizationCode{}, errors.New("authorization code store unavailable")
	}
	data, err := s.redis.GetDel(ctx, codeKey(hashToken(rawCode))).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return AuthorizationCode{}, ErrCodeNotFound
		}
		return AuthorizationCode{}, err
	}
	var out AuthorizationCode
	if err := json.Unmarshal([]byte(data), &out); err != nil {
		return AuthorizationCode{}, ErrCodeNotFound
	}
	return out, nil
}
