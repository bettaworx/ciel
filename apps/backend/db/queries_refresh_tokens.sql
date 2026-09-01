-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING id, user_id, token_hash, created_at, expires_at, revoked_at;

-- name: ConsumeRefreshToken :one
-- Atomically marks the token as revoked and returns it in a single operation.
-- Returns no rows if the token does not exist, is already revoked, or has expired.
-- This prevents the TOCTOU race condition in token rotation.
-- Account tokens (device_public_key IS NOT NULL) are excluded: they are only
-- valid through /auth/session/exchange, which verifies the device signature.
UPDATE refresh_tokens
SET revoked_at = now()
WHERE token_hash = $1
  AND revoked_at IS NULL
  AND expires_at > now()
  AND device_public_key IS NULL
RETURNING id, user_id, token_hash, created_at, expires_at, revoked_at;

-- name: RevokeAllUserRefreshTokens :exec
UPDATE refresh_tokens
SET revoked_at = now()
WHERE user_id = $1
  AND revoked_at IS NULL;

-- name: DeleteExpiredRefreshTokens :exec
DELETE FROM refresh_tokens
WHERE expires_at < now() - INTERVAL '1 day';

-- name: CreateAccountToken :one
INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_public_key)
VALUES ($1, $2, $3, $4)
RETURNING id, user_id, token_hash, created_at, expires_at, revoked_at, device_public_key;

-- name: FindAccountToken :one
-- Looks an account token up regardless of state, so the caller can both verify
-- the device signature and detect replay of an already-consumed token.
SELECT id, user_id, token_hash, created_at, expires_at, revoked_at, device_public_key
FROM refresh_tokens
WHERE token_hash = $1
  AND device_public_key IS NOT NULL;

-- name: ConsumeAccountToken :one
-- Rotation for the switch path only. Reads (unread badges) must not consume the
-- token: concurrent tabs would race and lock the account out.
UPDATE refresh_tokens
SET revoked_at = now()
WHERE token_hash = $1
  AND revoked_at IS NULL
  AND expires_at > now()
  AND device_public_key IS NOT NULL
RETURNING id, user_id, token_hash, created_at, expires_at, revoked_at, device_public_key;
