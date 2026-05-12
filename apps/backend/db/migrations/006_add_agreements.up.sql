-- Migration 006: Add terms and privacy agreement system
-- This adds version tracking for terms of service and privacy policy

-- Add version tracking to server_settings (server-wide current versions)
ALTER TABLE server_settings ADD COLUMN IF NOT EXISTS terms_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE server_settings ADD COLUMN IF NOT EXISTS privacy_version INTEGER NOT NULL DEFAULT 1;

-- Add indexes for lookups
CREATE INDEX IF NOT EXISTS idx_server_settings_terms_version 
  ON server_settings(terms_version);
CREATE INDEX IF NOT EXISTS idx_server_settings_privacy_version 
  ON server_settings(privacy_version);

-- Add user agreement tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- Add indexes for agreement checks (important for performance)
CREATE INDEX IF NOT EXISTS idx_users_terms_version 
  ON users(terms_version) WHERE terms_version > 0;
CREATE INDEX IF NOT EXISTS idx_users_privacy_version 
  ON users(privacy_version) WHERE privacy_version > 0;

-- Comments for documentation
COMMENT ON COLUMN server_settings.terms_version IS 'Current version of terms of service (admin-managed)';
COMMENT ON COLUMN server_settings.privacy_version IS 'Current version of privacy policy (admin-managed)';
COMMENT ON COLUMN users.terms_version IS 'Version of terms the user has agreed to';
COMMENT ON COLUMN users.privacy_version IS 'Version of privacy policy the user has agreed to';
COMMENT ON COLUMN users.terms_accepted_at IS 'Timestamp when user last accepted terms';
COMMENT ON COLUMN users.privacy_accepted_at IS 'Timestamp when user last accepted privacy policy';
