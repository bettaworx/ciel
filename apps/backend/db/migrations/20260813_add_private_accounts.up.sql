-- Private accounts. A private user's activity is visible only to accepted
-- followers; everything is still written, and read paths filter it, so flipping
-- back to public restores the whole history.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- accepted_at NULL means a pending follow request. This is a column rather than
-- a follow_requests table because every existing query already joins follows:
-- adding a predicate is a smaller change than teaching them a second table.
ALTER TABLE follows ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Follows that predate this migration were all instant, so all are accepted.
UPDATE follows SET accepted_at = created_at WHERE accepted_at IS NULL;

-- The pending-request inbox. Partial, because pending rows are the rare case.
CREATE INDEX IF NOT EXISTS idx_follows_pending
  ON follows (followee_id, created_at DESC)
  WHERE accepted_at IS NULL;

-- can_view_user is the single definition of "may viewer see author's activity".
-- It exists as a SQL function because sqlc has no way to share a predicate and
-- roughly twenty queries need this one: a copy in each would drift, and a drift
-- here is a privacy leak.
--
-- A NULL viewer (anonymous) fails both the self check and the EXISTS, so
-- unauthenticated requests get the strictest answer.
--
-- ponytail: this looks users up by primary key once per row. Almost every user
-- is public, so LIMITed queries stop early and it stays cheap. If a query does
-- show up slow, inline the predicate against the users row it already joins.
CREATE OR REPLACE FUNCTION can_view_user(viewer uuid, author uuid)
RETURNS boolean LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT NOT u.is_private
      -- IS NOT DISTINCT FROM, not =: with an anonymous (NULL) viewer, `u.id =
      -- viewer` is NULL, and false OR NULL OR false is NULL rather than false.
      -- A NULL filters correctly in a WHERE clause but breaks the callers that
      -- scan this into a Go bool, so the function is kept strictly boolean.
      OR u.id IS NOT DISTINCT FROM viewer
      OR EXISTS (
           SELECT 1 FROM follows f
           WHERE f.follower_id = viewer
             AND f.followee_id = u.id
             AND f.accepted_at IS NOT NULL
         )
  FROM users u WHERE u.id = author
$$;
