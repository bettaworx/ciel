-- Notifications delivered to a user (reaction, mention, reply, boost, ...)
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL,
  actor_user_id UUID        REFERENCES users(id) ON DELETE CASCADE,
  post_id       UUID        REFERENCES posts(id) ON DELETE CASCADE,
  subtype       TEXT        NOT NULL DEFAULT '',
  data          JSONB       NOT NULL DEFAULT '{}',
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keyset pagination for the notification list
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC, id DESC);

-- Unread badge count
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (user_id) WHERE read_at IS NULL;

-- One notification per (recipient, type, actor, post, subtype): re-reacting after
-- an undo must not stack up duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe
  ON notifications (user_id, type, actor_user_id, post_id, subtype)
  WHERE actor_user_id IS NOT NULL AND post_id IS NOT NULL;
