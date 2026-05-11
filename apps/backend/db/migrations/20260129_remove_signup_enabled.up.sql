-- Migration: Remove signup_enabled from server_settings
-- Date: 2026-01-28
-- 
-- This column was moved to config.yaml as auth.invite_only (inverted boolean).
-- The invite_only setting is now managed via config file instead of database.
-- Admin UI updates config.yaml directly when changing signup settings.
--
-- signup_enabled (database) → invite_only (config.yaml)
-- enabled=true → invite_only=false
-- enabled=false → invite_only=true

ALTER TABLE server_settings DROP COLUMN IF EXISTS signup_enabled;
