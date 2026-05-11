DROP INDEX IF EXISTS idx_server_settings_invite_code;
ALTER TABLE server_settings
  DROP COLUMN IF EXISTS setup_completed,
  DROP COLUMN IF EXISTS setup_password_used,
  DROP COLUMN IF EXISTS server_name,
  DROP COLUMN IF EXISTS server_description,
  DROP COLUMN IF EXISTS server_icon_media_id,
  DROP COLUMN IF EXISTS invite_only,
  DROP COLUMN IF EXISTS invite_code;
