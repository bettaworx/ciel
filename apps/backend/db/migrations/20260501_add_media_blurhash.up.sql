-- Add blurhash column to media table for image placeholder rendering.
-- BlurHash is a compact (typically 20-30 char) string representation of an
-- image's blur preview. Generated server-side at upload time and used by
-- clients to render a colored blur placeholder while the full image loads.

ALTER TABLE media ADD COLUMN IF NOT EXISTS blurhash TEXT;

COMMENT ON COLUMN media.blurhash IS 'BlurHash placeholder string (NULL when not generated, e.g. legacy rows or videos without a thumbnail)';
