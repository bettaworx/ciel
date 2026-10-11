CREATE INDEX IF NOT EXISTS idx_posts_parent_created
    ON posts(parent_id, created_at ASC, id ASC)
    WHERE parent_id IS NOT NULL AND deleted_at IS NULL;
