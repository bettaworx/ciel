DROP INDEX IF EXISTS idx_post_mentions_user;
DROP TABLE IF EXISTS post_mentions;

DROP INDEX IF EXISTS idx_posts_root;
DROP INDEX IF EXISTS idx_posts_parent;

ALTER TABLE posts
    DROP CONSTRAINT IF EXISTS posts_root_not_self,
    DROP CONSTRAINT IF EXISTS posts_parent_not_self,
    DROP COLUMN IF EXISTS root_id,
    DROP COLUMN IF EXISTS parent_id;
