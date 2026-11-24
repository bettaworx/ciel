DROP INDEX IF EXISTS idx_posts_unique_pure_boost;
DROP INDEX IF EXISTS idx_posts_reference;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_reference_not_self;
ALTER TABLE posts DROP COLUMN IF EXISTS reference_id;
