-- OAuth2 authorization server.
--
-- Exists so a bot can be handed a token scoped to what it actually does,
-- instead of the account password or a full-privilege session JWT. Two tables:
-- the apps, and the grants. Authorization codes are not here — they live in
-- Redis, because single-use has to be atomic and GETDEL gives that for free
-- while a row would need a consume-and-check round trip.

CREATE TABLE IF NOT EXISTS oauth_clients (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The public identifier the app sends. Separate from id so it can be shown,
  -- logged and pasted into config without exposing a primary key.
  client_id          TEXT        NOT NULL UNIQUE,
  -- NULL means a public client: it cannot keep a secret, so PKCE is the only
  -- thing standing between an intercepted code and a token, and is mandatory.
  client_secret_hash BYTEA,
  owner_user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name               TEXT        NOT NULL,
  -- Shown on the consent screen. Seeing where an app lives is one of the few
  -- signals a user has against a lookalike asking for their account.
  website            TEXT,
  -- Matched exactly, never by prefix. See redirect_uris validation in the
  -- service: a prefix match here is the classic open-redirect token theft.
  redirect_uris      TEXT[]      NOT NULL,
  -- The ceiling on what this client may ever request. A request for anything
  -- outside it is rejected rather than silently trimmed.
  scopes             TEXT[]      NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_clients_owner
  ON oauth_clients (owner_user_id);

-- One row per issued grant. A refresh does not overwrite the row: it revokes it
-- and inserts a new one, so a replayed refresh token still finds its row and is
-- recognisable as a reuse rather than as an unknown token. That is the whole
-- reason the old hash is kept instead of rotated in place.
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          UUID        NOT NULL REFERENCES oauth_clients(id) ON DELETE CASCADE,
  -- Always set. For client_credentials this is the client's owner: that grant
  -- has no end user, and the owner is the account the token acts as.
  user_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scopes             TEXT[]      NOT NULL,
  access_token_hash  BYTEA       NOT NULL UNIQUE,
  access_expires_at  TIMESTAMPTZ NOT NULL,
  -- NULL for client_credentials, which RFC 6749 §4.4.3 says gets no refresh
  -- token: the client can just ask for another with the credentials it holds.
  refresh_token_hash BYTEA       UNIQUE,
  refresh_expires_at TIMESTAMPTZ,
  revoked_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drives the connected-apps list and the per-app revoke.
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_client
  ON oauth_tokens (user_id, client_id) WHERE revoked_at IS NULL;

-- Drives the sweeper.
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires
  ON oauth_tokens (access_expires_at) WHERE revoked_at IS NULL;
