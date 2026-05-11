-- Migration 005: Add server setup functionality
-- This migration adds columns to server_settings table for initial server setup

-- Add columns for server setup state and configuration
ALTER TABLE server_settings ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE server_settings ADD COLUMN IF NOT EXISTS setup_password_used BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE server_settings ADD COLUMN IF NOT EXISTS server_name TEXT DEFAULT 'Ciel';
ALTER TABLE server_settings ADD COLUMN IF NOT EXISTS server_description TEXT;
ALTER TABLE server_settings ADD COLUMN IF NOT EXISTS server_icon_media_id UUID REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE server_settings ADD COLUMN IF NOT EXISTS invite_only BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE server_settings ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- Create index for invite code lookups
CREATE INDEX IF NOT EXISTS idx_server_settings_invite_code ON server_settings (invite_code) WHERE invite_code IS NOT NULL;
