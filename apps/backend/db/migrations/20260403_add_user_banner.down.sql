ALTER TABLE users DROP CONSTRAINT IF EXISTS users_banner_media_fk;
ALTER TABLE users DROP COLUMN IF EXISTS banner_media_id;
