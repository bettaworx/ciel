-- Follow relationships. Following is instant: there is no pending/accepted state.
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT follows_no_self CHECK (follower_id <> followee_id)
);

-- The primary key already serves "who does X follow" lookups and the
-- isFollowing check. These two cover the paginated list endpoints.
CREATE INDEX IF NOT EXISTS idx_follows_followee_created
  ON follows (followee_id, created_at DESC, follower_id DESC);

CREATE INDEX IF NOT EXISTS idx_follows_follower_created
  ON follows (follower_id, created_at DESC, followee_id DESC);

-- idx_notifications_dedupe only covers rows with a post. Follow notifications
-- carry no post, so without this pair they would stack up on re-follow.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe_no_post
  ON notifications (user_id, type, actor_user_id, subtype)
  WHERE actor_user_id IS NOT NULL AND post_id IS NULL;
