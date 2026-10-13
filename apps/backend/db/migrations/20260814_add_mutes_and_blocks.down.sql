-- is_hidden_by has no callers left once the tables go.
DROP FUNCTION IF EXISTS is_hidden_by(uuid, uuid);

-- Restore can_view_user to its pre-block definition. It has to be rewritten
-- rather than dropped: the queries that call it stay, and dropping the tables
-- below would otherwise leave it referencing account_blocks.
CREATE OR REPLACE FUNCTION can_view_user(viewer uuid, author uuid)
RETURNS boolean LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT NOT u.is_private
      OR u.id IS NOT DISTINCT FROM viewer
      OR EXISTS (
           SELECT 1 FROM follows f
           WHERE f.follower_id = viewer
             AND f.followee_id = u.id
             AND f.accepted_at IS NOT NULL
         )
  FROM users u WHERE u.id = author
$$;

DROP TABLE IF EXISTS account_blocks;
DROP TABLE IF EXISTS account_mutes;
