-- Add video support to media table
-- This migration adds the duration column for video files

ALTER TABLE media ADD COLUMN IF NOT EXISTS duration REAL;

COMMENT ON COLUMN media.duration IS 'Video duration in seconds (NULL for images)';
