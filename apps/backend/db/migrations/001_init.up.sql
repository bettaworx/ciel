CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_credentials (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  salt BYTEA NOT NULL,
  iterations INT NOT NULL,
  stored_key BYTEA NOT NULL,
  server_key BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_user_created ON media (user_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS post_media (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_post_media_post_order ON post_media (post_id, sort_order ASC, media_id ASC);
CREATE INDEX IF NOT EXISTS idx_posts_timeline ON posts (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts (user_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS post_reaction_events (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id, emoji)
);

CREATE TABLE IF NOT EXISTS post_reaction_counts (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, emoji)
);

CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  use_count INT NOT NULL DEFAULT 0,
  max_uses INT,
  expires_at TIMESTAMPTZ,
  disabled BOOLEAN NOT NULL DEFAULT false,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code) WHERE disabled = false;
CREATE INDEX IF NOT EXISTS idx_invite_codes_creator ON invite_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_at ON invite_codes(created_at DESC);

CREATE TABLE IF NOT EXISTS invite_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code_id UUID NOT NULL REFERENCES invite_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_invite_uses_code ON invite_code_uses(invite_code_id);
CREATE INDEX IF NOT EXISTS idx_invite_uses_user ON invite_code_uses(user_id);
