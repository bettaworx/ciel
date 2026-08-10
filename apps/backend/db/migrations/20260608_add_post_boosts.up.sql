-- Add reference_id column for boosts/quotes
ALTER TABLE posts
    ADD COLUMN reference_id UUID REFERENCES posts(id) ON DELETE SET NULL;

-- Prevent self-reference
ALTER TABLE posts
    ADD CONSTRAINT posts_reference_not_self
    CHECK (reference_id IS NULL OR reference_id <> id);

-- Index for counting boosts of a post
CREATE INDEX idx_posts_reference
    ON posts(reference_id)
    WHERE reference_id IS NOT NULL AND deleted_at IS NULL;

-- Prevent duplicate pure boosts (same user boosting same post with no content)
CREATE UNIQUE INDEX idx_posts_unique_pure_boost
    ON posts(user_id, reference_id)
    WHERE reference_id IS NOT NULL AND content = '' AND deleted_at IS NULL;
