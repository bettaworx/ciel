DROP INDEX IF EXISTS idx_users_terms_version;
DROP INDEX IF EXISTS idx_users_privacy_version;
DROP INDEX IF EXISTS idx_server_settings_terms_version;
DROP INDEX IF EXISTS idx_server_settings_privacy_version;
ALTER TABLE users
  DROP COLUMN IF EXISTS terms_version,
  DROP COLUMN IF EXISTS privacy_version,
  DROP COLUMN IF EXISTS terms_accepted_at,
  DROP COLUMN IF EXISTS privacy_accepted_at;
ALTER TABLE server_settings
  DROP COLUMN IF EXISTS terms_version,
  DROP COLUMN IF EXISTS privacy_version;
