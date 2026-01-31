-- Migration: Move server configuration from database to config file
-- Date: 2026-01-22
-- 
-- IMPORTANT: Before running this migration:
-- 1. Stop your Ciel server
-- 2. Backup your database: pg_dump your_db > backup.sql
-- 3. Run the export script to create config.yaml from current server_settings
-- 4. Verify config.yaml contains the correct values
--
-- This migration removes columns from server_settings that have moved to config.yaml:
--   - setup_completed -> config.yaml: setup.completed
--   - setup_password_used -> config.yaml: setup.password_used
--   - server_name -> config.yaml: server.name
--   - server_description -> config.yaml: server.description
--   - server_icon_media_id -> config.yaml: server.icon_media_id
--   - invite_only -> config.yaml: auth.invite_only
--   - invite_code -> config.yaml: auth.invite_code
--
-- The signup_enabled column remains in the database as it's managed dynamically.

-- Remove columns that moved to config file
ALTER TABLE server_settings
  DROP COLUMN IF EXISTS setup_completed,
  DROP COLUMN IF EXISTS setup_password_used,
  DROP COLUMN IF EXISTS server_name,
  DROP COLUMN IF EXISTS server_description,
  DROP COLUMN IF EXISTS server_icon_media_id,
  DROP COLUMN IF EXISTS invite_only,
  DROP COLUMN IF EXISTS invite_code;
