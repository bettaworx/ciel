-- Bookmark lists. Every user gets one default list; the rest they create.
-- name is NULL on the default list because the server has no locale: the client
-- substitutes its own translated label when it sees NULL. Renaming it stores a
-- real name, and is_default still guards it from deletion.
CREATE TABLE IF NOT EXISTS bookmark_lists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT,
  icon       TEXT        NOT NULL DEFAULT '🔖',
  is_default BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bookmark_lists_name_length CHECK (name IS NULL OR char_length(name) BETWEEN 1 AND 50)
);

-- One default list per user. Also the inference target for the ON CONFLICT below.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmark_lists_user_default
  ON bookmark_lists (user_id) WHERE is_default;

CREATE INDEX IF NOT EXISTS idx_bookmark_lists_user_created
  ON bookmark_lists (user_id, created_at, id);

-- user_id is denormalised off bookmark_lists so "which of my lists hold this
-- post" is one index hit per timeline page instead of a join.
CREATE TABLE IF NOT EXISTS bookmarks (
  list_id    UUID        NOT NULL REFERENCES bookmark_lists(id) ON DELETE CASCADE,
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_list_created
  ON bookmarks (list_id, created_at DESC, post_id DESC);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_post
  ON bookmarks (user_id, post_id);

-- Existing users predate the signup-time creation, so give them their default list.
INSERT INTO bookmark_lists (user_id, name, icon, is_default)
SELECT id, NULL, '🔖', TRUE FROM users
ON CONFLICT (user_id) WHERE is_default DO NOTHING;
