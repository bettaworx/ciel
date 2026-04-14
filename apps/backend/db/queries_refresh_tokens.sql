-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING id, user_id, token_hash, created_at, expires_at, revoked_at;

-- name: ConsumeRefreshToken :one
-- Atomically marks the token as revoked and returns it in a single operation.
-- Returns no rows if the token does not exist, is already revoked, or has expired.
-- This prevents the TOCTOU race condition in token rotation.
UPDATE refresh_tokens
SET revoked_at = now()
WHERE token_hash = $1
  AND revoked_at IS NULL
  AND expires_at > now()
RETURNING id, user_id, token_hash, created_at, expires_at, revoked_at;

-- name: RevokeAllUserRefreshTokens :exec
UPDATE refresh_tokens
SET revoked_at = now()
WHERE user_id = $1
  AND revoked_at IS NULL;

-- name: DeleteExpiredRefreshTokens :exec
DELETE FROM refresh_tokens
WHERE expires_at < now() - INTERVAL '1 day';
