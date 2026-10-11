ALTER TABLE posts
    ADD COLUMN parent_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    ADD COLUMN root_id   UUID REFERENCES posts(id) ON DELETE SET NULL,
    ADD CONSTRAINT posts_parent_not_self CHECK (parent_id IS NULL OR parent_id <> id),
    ADD CONSTRAINT posts_root_not_self   CHECK (root_id   IS NULL OR root_id   <> id);

CREATE INDEX IF NOT EXISTS idx_posts_parent ON posts(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_root   ON posts(root_id)   WHERE root_id   IS NOT NULL;

CREATE TABLE IF NOT EXISTS post_mentions (
    post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, mentioned_user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_mentions_user
    ON post_mentions(mentioned_user_id, post_id);
