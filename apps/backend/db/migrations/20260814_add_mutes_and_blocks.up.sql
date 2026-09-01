-- Personal mutes and blocks.
--
-- Named account_* rather than user_*: user_mutes is already taken by admin
-- moderation, which silences an account for everyone. These two are one
-- viewer's opinion about one other account and share nothing with it.

-- A mute hides an account from the muter's feeds. It is a preference, not a
-- denial: the muted account is never told, keeps every ability it had, and its
-- posts stay readable behind the one-tap reveal.
CREATE TABLE IF NOT EXISTS account_mutes (
  muter_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muted_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (muter_id, muted_id),
  CONSTRAINT account_mutes_no_self CHECK (muter_id <> muted_id)
);

-- A block does everything a mute does, and additionally cuts the blocked
-- account off: it can no longer see, follow, reply to, boost, quote or react to
-- the blocker.
CREATE TABLE IF NOT EXISTS account_blocks (
  blocker_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT account_blocks_no_self CHECK (blocker_id <> blocked_id)
);

-- The primary keys already answer "did viewer hide author", which is the check
-- on every feed row. These two cover the paginated settings lists, in the same
-- shape as idx_follows_*_created.
CREATE INDEX IF NOT EXISTS idx_account_mutes_muter_created
  ON account_mutes (muter_id, created_at DESC, muted_id DESC);

CREATE INDEX IF NOT EXISTS idx_account_blocks_blocker_created
  ON account_blocks (blocker_id, created_at DESC, blocked_id DESC);

-- The reverse direction. can_view_user asks "did the author block the viewer"
-- for every row it gates, and the primary key is the wrong way round for it.
CREATE INDEX IF NOT EXISTS idx_account_blocks_blocked
  ON account_blocks (blocked_id, blocker_id);

-- can_view_user gains the block check.
--
-- The block sits outside the private-account disjunction, as an AND: a block is
-- a refusal, not a visibility level, so neither a public account nor an already
-- accepted follower gets past it. Reversing that nesting would let a blocked
-- follower keep reading, which is the whole thing being prevented.
--
-- With an anonymous (NULL) viewer, b.blocked_id = viewer matches nothing, so
-- NOT EXISTS is true and the function stays strictly boolean as before.
CREATE OR REPLACE FUNCTION can_view_user(viewer uuid, author uuid)
RETURNS boolean LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT (
        NOT u.is_private
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
    )
    AND NOT EXISTS (
      SELECT 1 FROM account_blocks b
      WHERE b.blocker_id = u.id AND b.blocked_id = viewer
    )
  FROM users u WHERE u.id = author
$$;

-- is_hidden_by is the other half, and deliberately not part of can_view_user:
-- it says the viewer chose not to see this account, which is a weaker thing
-- than being refused. Rows it matches are dropped from feeds but stay readable
-- everywhere the viewer asked for them on purpose — a profile, a quoted post, a
-- reply's parent — because the reveal button has to have something to reveal.
--
-- Both mutes and blocks feed it: a block hides the blocked account from the
-- blocker exactly like a mute does, on top of cutting the other side off.
CREATE OR REPLACE FUNCTION is_hidden_by(viewer uuid, author uuid)
RETURNS boolean LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT EXISTS (
           SELECT 1 FROM account_mutes m
           WHERE m.muter_id = viewer AND m.muted_id = author
         )
      OR EXISTS (
           SELECT 1 FROM account_blocks b
           WHERE b.blocker_id = viewer AND b.blocked_id = author
         )
$$;
