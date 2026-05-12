ALTER TABLE users DROP CONSTRAINT IF EXISTS users_avatar_media_fk;
ALTER TABLE users
  DROP COLUMN IF EXISTS display_name,
  DROP COLUMN IF EXISTS bio,
  DROP COLUMN IF EXISTS avatar_media_id;
