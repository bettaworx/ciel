-- Two-factor authentication: TOTP, backup codes, and WebAuthn credentials.

CREATE TABLE IF NOT EXISTS auth_totp (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret_enc BYTEA NOT NULL,
  enabled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_step BIGINT
);

CREATE TABLE IF NOT EXISTS auth_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  UNIQUE (user_id, code_hash)
);

CREATE INDEX IF NOT EXISTS idx_auth_backup_codes_user_unused
  ON auth_backup_codes (user_id) WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id BYTEA NOT NULL UNIQUE,
  public_key BYTEA NOT NULL,
  attestation_type TEXT NOT NULL DEFAULT '',
  aaguid BYTEA,
  sign_count BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] NOT NULL DEFAULT '{}',
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  backup_eligible BOOLEAN NOT NULL DEFAULT false,
  backup_state BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_auth_webauthn_credentials_user
  ON auth_webauthn_credentials (user_id);

INSERT INTO permissions (id, name, description) VALUES
  ('admin_users_mfa_reset', 'Admin users MFA reset', 'Reset all MFA factors for a user')
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, scope, effect)
VALUES ('admin', 'admin_users_mfa_reset', 'global', 'allow')
ON CONFLICT (role_id, permission_id, scope) DO NOTHING;
