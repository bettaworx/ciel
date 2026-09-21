-- Personal access tokens.
--
-- The same thing an OAuth grant produces — a scope-limited bearer token acting
-- as one account — minus the app. The owner is both the party granting access
-- and the party using it, so there is no client to authenticate and no consent
-- screen to show: they are consenting to themselves.
--
-- They live in oauth_tokens rather than a table of their own because every
-- other part of the system already treats that table as "the scope-limited
-- tokens": verification, scope enforcement, revocation and the sweeper all work
-- unchanged. A second table would have to be taught to each of them, and the
-- one that got missed would be the one with no scope checks.
ALTER TABLE oauth_tokens ALTER COLUMN client_id DROP NOT NULL;

-- What the owner called it. NULL for tokens issued through an OAuth grant,
-- where the client's name is the label instead.
ALTER TABLE oauth_tokens ADD COLUMN IF NOT EXISTS name TEXT;

-- Drives the personal token list. Partial on client_id IS NULL so it indexes
-- only the personal tokens, which are the rare case.
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_personal
  ON oauth_tokens (user_id, created_at DESC)
  WHERE client_id IS NULL AND revoked_at IS NULL;
