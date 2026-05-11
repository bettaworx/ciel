-- Adds user profile fields and avatar reference.
-- Safe to run multiple times.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_media_id uuid;

DO $$
BEGIN
  ALTER TABLE users
    ADD CONSTRAINT users_avatar_media_fk
    FOREIGN KEY (avatar_media_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
