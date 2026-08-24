-- name: GetTotpByUserID :one
SELECT user_id, secret_enc, enabled_at, last_used_step
FROM auth_totp
WHERE user_id = $1;

-- name: UpsertTotp :exec
INSERT INTO auth_totp (user_id, secret_enc, enabled_at, last_used_step)
VALUES ($1, $2, now(), NULL)
ON CONFLICT (user_id) DO UPDATE
SET secret_enc = EXCLUDED.secret_enc,
    enabled_at = now(),
    last_used_step = NULL;

-- name: UpdateTotpLastUsedStep :execrows
UPDATE auth_totp
SET last_used_step = $2
WHERE user_id = $1
  AND (last_used_step IS NULL OR last_used_step < $2);

-- name: DeleteTotpByUserID :exec
DELETE FROM auth_totp
WHERE user_id = $1;

-- name: InsertBackupCode :exec
INSERT INTO auth_backup_codes (user_id, code_hash)
VALUES ($1, $2);

-- name: DeleteBackupCodesByUserID :exec
DELETE FROM auth_backup_codes
WHERE user_id = $1;

-- name: CountUnusedBackupCodes :one
SELECT COUNT(*)::int AS count
FROM auth_backup_codes
WHERE user_id = $1
  AND used_at IS NULL;

-- name: ConsumeBackupCode :one
UPDATE auth_backup_codes
SET used_at = now()
WHERE id = (
  SELECT id
  FROM auth_backup_codes
  WHERE user_id = $1
    AND code_hash = $2
    AND used_at IS NULL
  LIMIT 1
  FOR UPDATE
)
RETURNING id, user_id, code_hash, created_at, used_at;

-- name: ListWebAuthnCredentialsByUserID :many
SELECT id, user_id, credential_id, public_key, attestation_type, aaguid,
       sign_count, transports, name, created_at, last_used_at,
       backup_eligible, backup_state
FROM auth_webauthn_credentials
WHERE user_id = $1
ORDER BY created_at ASC, id ASC;

-- name: GetWebAuthnCredentialByID :one
SELECT id, user_id, credential_id, public_key, attestation_type, aaguid,
       sign_count, transports, name, created_at, last_used_at,
       backup_eligible, backup_state
FROM auth_webauthn_credentials
WHERE id = $1;

-- name: GetWebAuthnCredentialByCredentialID :one
SELECT id, user_id, credential_id, public_key, attestation_type, aaguid,
       sign_count, transports, name, created_at, last_used_at,
       backup_eligible, backup_state
FROM auth_webauthn_credentials
WHERE credential_id = $1;

-- name: InsertWebAuthnCredential :one
INSERT INTO auth_webauthn_credentials (
  user_id, credential_id, public_key, attestation_type, aaguid,
  sign_count, transports, name, backup_eligible, backup_state
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, user_id, credential_id, public_key, attestation_type, aaguid,
          sign_count, transports, name, created_at, last_used_at,
          backup_eligible, backup_state;

-- name: UpdateWebAuthnCredentialSignCount :exec
UPDATE auth_webauthn_credentials
SET sign_count = $2,
    last_used_at = now(),
    backup_state = $3
WHERE id = $1;

-- name: UpdateWebAuthnCredentialName :one
UPDATE auth_webauthn_credentials
SET name = $2
WHERE id = $1 AND user_id = $3
RETURNING id, user_id, credential_id, public_key, attestation_type, aaguid,
          sign_count, transports, name, created_at, last_used_at,
          backup_eligible, backup_state;

-- name: DeleteWebAuthnCredential :execrows
DELETE FROM auth_webauthn_credentials
WHERE id = $1 AND user_id = $2;

-- name: DeleteWebAuthnCredentialsByUserID :exec
DELETE FROM auth_webauthn_credentials
WHERE user_id = $1;

-- name: CountWebAuthnCredentialsByUserID :one
SELECT COUNT(*)::int AS count
FROM auth_webauthn_credentials
WHERE user_id = $1;

-- name: UserHasMfa :one
SELECT
  EXISTS(SELECT 1 FROM auth_totp WHERE user_id = $1) AS has_totp,
  EXISTS(SELECT 1 FROM auth_webauthn_credentials WHERE user_id = $1) AS has_webauthn,
  (
    SELECT COUNT(*)::int
    FROM auth_backup_codes
    WHERE user_id = $1 AND used_at IS NULL
  ) AS backup_codes_remaining;
