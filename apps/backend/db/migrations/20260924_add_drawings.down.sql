DROP INDEX IF EXISTS idx_posts_unique_pure_boost;
CREATE UNIQUE INDEX idx_posts_unique_pure_boost
    ON posts(user_id, reference_id)
    WHERE reference_id IS NOT NULL AND content = '' AND deleted_at IS NULL;

DROP TRIGGER IF EXISTS posts_reject_drawing_with_media ON posts;
DROP FUNCTION IF EXISTS reject_drawing_on_post_with_media();
DROP TRIGGER IF EXISTS post_media_reject_drawing ON post_media;
DROP FUNCTION IF EXISTS reject_drawing_post_media();

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_drawing_content_empty;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_drawing_unique;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_drawing_owner_fk;
ALTER TABLE posts DROP COLUMN IF EXISTS drawing_id;
DROP TABLE IF EXISTS drawings;

