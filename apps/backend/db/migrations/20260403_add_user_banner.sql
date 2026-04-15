-- Adds user banner reference.
-- Safe to run multiple times.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS banner_media_id uuid;

DO $$
BEGIN
  ALTER TABLE users
    ADD CONSTRAINT users_banner_media_fk
    FOREIGN KEY (banner_media_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
