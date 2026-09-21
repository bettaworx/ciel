-- Adds device-bound account tokens for switching between signed-in accounts
-- without re-entering credentials.
--
-- A row with device_public_key IS NULL is an ordinary refresh token backing the
-- ciel_refresh cookie. A row with device_public_key IS NOT NULL is an account
-- token held (encrypted) by the browser: it is only accepted together with a
-- signature made by the matching non-extractable private key, and it must never
-- be usable through the plain cookie refresh path.

ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS device_public_key BYTEA;
