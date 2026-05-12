ALTER TABLE server_settings
  ADD COLUMN IF NOT EXISTS setup_completed       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS setup_password_used   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS server_name           TEXT DEFAULT 'Ciel',
  ADD COLUMN IF NOT EXISTS server_description    TEXT,
  ADD COLUMN IF NOT EXISTS server_icon_media_id  UUID,
  ADD COLUMN IF NOT EXISTS invite_only           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS invite_code           TEXT;
