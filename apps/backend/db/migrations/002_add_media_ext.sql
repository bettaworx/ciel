-- Adds media.ext column for determining served file extension.
-- Safe to run multiple times.

ALTER TABLE media
  ADD COLUMN IF NOT EXISTS ext text NOT NULL DEFAULT 'webp';
