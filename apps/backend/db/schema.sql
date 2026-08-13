-- Minimal schema for sqlc + PostgreSQL

-- UUID v4 generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_media_id UUID,
  banner_media_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  terms_version INT NOT NULL DEFAULT 0,
  privacy_version INT NOT NULL DEFAULT 0,
  terms_accepted_at TIMESTAMPTZ,
  privacy_accepted_at TIMESTAMPTZ,
  -- Private accounts: activity is visible only to accepted followers. Nothing
  -- is withheld at write time, so flipping back to false restores the history.
  is_private BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS auth_credentials (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  salt BYTEA NOT NULL,
  iterations INT NOT NULL,
  stored_key BYTEA NOT NULL,
  server_key BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE permission_effect AS ENUM ('allow', 'deny');

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'global',
  effect permission_effect NOT NULL,
  PRIMARY KEY (role_id, permission_id, scope)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions (permission_id);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles (role_id);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'global',
  effect permission_effect NOT NULL,
  PRIMARY KEY (user_id, permission_id, scope)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions (permission_id);

CREATE TABLE IF NOT EXISTS server_settings (
  id INT PRIMARY KEY CHECK (id = 1),
  terms_version INT NOT NULL DEFAULT 1,
  privacy_version INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  root_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  reference_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL,
  visibility TEXT NOT NULL DEFAULT 'public',
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deletion_reason TEXT,
  CHECK (visibility IN ('public', 'hidden', 'deleted')),
  CHECK (parent_id IS NULL OR parent_id <> id),
  CHECK (root_id IS NULL OR root_id <> id),
  CHECK (reference_id IS NULL OR reference_id <> id)
);

-- Uploaded media (images and videos). Images stored as WebP, videos as MP4.
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  ext TEXT NOT NULL DEFAULT 'webp',
  width INT NOT NULL,
  height INT NOT NULL,
  duration REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deletion_reason TEXT,
  phash TEXT,
  blurhash TEXT
);

DO $$
BEGIN
  ALTER TABLE users
    ADD CONSTRAINT users_avatar_media_fk
    FOREIGN KEY (avatar_media_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE users
    ADD CONSTRAINT users_banner_media_fk
    FOREIGN KEY (banner_media_id) REFERENCES media(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Avatar foreign key (must be added after media table exists).
-- Server icon foreign key (must be added after media table exists).
-- For sqlc compatibility, we declare it as if it exists in users/server_settings already.
-- In production, ensure migrations handle this properly.

CREATE INDEX IF NOT EXISTS idx_media_user_created ON media (user_id, created_at DESC, id DESC);

-- Post attachments (ordered).
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
CREATE INDEX IF NOT EXISTS idx_posts_parent ON posts(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_parent_created ON posts(parent_id, created_at ASC, id ASC) WHERE parent_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_root ON posts(root_id) WHERE root_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_reference ON posts(reference_id) WHERE reference_id IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_unique_pure_boost ON posts(user_id, reference_id) WHERE reference_id IS NOT NULL AND content = '' AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS post_mentions (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, mentioned_user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_mentions_user ON post_mentions(mentioned_user_id, post_id);

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

-- Invite codes for user registration
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

-- Invite code usage history
CREATE TABLE IF NOT EXISTS invite_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code_id UUID NOT NULL REFERENCES invite_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_invite_uses_code ON invite_code_uses(invite_code_id);
CREATE INDEX IF NOT EXISTS idx_invite_uses_user ON invite_code_uses(user_id);

-- Admin user notes
CREATE TABLE IF NOT EXISTS admin_user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Moderation logs
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User mutes
CREATE TABLE IF NOT EXISTS user_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mute_type TEXT NOT NULL,
  muted_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Banned words
CREATE TABLE IF NOT EXISTS banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL UNIQUE,
  applies_to TEXT NOT NULL DEFAULT 'all',
  severity TEXT NOT NULL DEFAULT 'block',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Banned image hashes
CREATE TABLE IF NOT EXISTS banned_image_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash TEXT NOT NULL UNIQUE,
  hash_type TEXT NOT NULL DEFAULT 'phash',
  reason TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IP bans
CREATE TABLE IF NOT EXISTS ip_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT,
  banned_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agreement documents (full content management)
CREATE TABLE IF NOT EXISTS agreement_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  version INTEGER NOT NULL,
  language TEXT NOT NULL DEFAULT 'ja',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  published_by UUID REFERENCES users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changelog TEXT,
  UNIQUE(document_type, version, language)
);

-- Custom emojis uploaded by admins
CREATE TABLE IF NOT EXISTS custom_emojis (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcode  TEXT        NOT NULL UNIQUE,
  name       TEXT,
  category   TEXT,
  license    TEXT,
  width      INT         NOT NULL,
  height     INT         NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_emojis_shortcode ON custom_emojis (shortcode);

-- Refresh tokens for persistent session management (30-day TTL, rotate on use)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  BYTEA       NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
  ON refresh_tokens (user_id) WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires
  ON refresh_tokens (expires_at) WHERE revoked_at IS NULL;

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

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (user_id) WHERE read_at IS NULL;

-- One notification per (recipient, type, actor, post, subtype): re-reacting after
-- an undo must not stack up duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe
  ON notifications (user_id, type, actor_user_id, post_id, subtype)
  WHERE actor_user_id IS NOT NULL AND post_id IS NOT NULL;

-- idx_notifications_dedupe only covers rows with a post. Follow notifications
-- carry no post, so without this pair they would stack up on re-follow.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe_no_post
  ON notifications (user_id, type, actor_user_id, subtype)
  WHERE actor_user_id IS NOT NULL AND post_id IS NULL;

-- Follow relationships. Following a public user is instant; following a private
-- user inserts a row with accepted_at NULL, which is a pending follow request
-- and must never be treated as a follow.
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT follows_no_self CHECK (follower_id <> followee_id)
);

-- The pending-request inbox. Partial, because pending rows are the rare case.
CREATE INDEX IF NOT EXISTS idx_follows_pending
  ON follows (followee_id, created_at DESC)
  WHERE accepted_at IS NULL;

-- The primary key already serves "who does X follow" lookups and the
-- isFollowing check. These two cover the paginated list endpoints.
CREATE INDEX IF NOT EXISTS idx_follows_followee_created
  ON follows (followee_id, created_at DESC, follower_id DESC);

CREATE INDEX IF NOT EXISTS idx_follows_follower_created
  ON follows (follower_id, created_at DESC, followee_id DESC);

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

-- One default list per user. Also the inference target for ON CONFLICT.
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

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

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
--
-- The block check sits outside the private-account disjunction, as an AND: a
-- block is a refusal, not a visibility level, so neither a public account nor an
-- already accepted follower gets past it. Reversing that nesting would let a
-- blocked follower keep reading, which is the whole thing being prevented.
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
    -- Same NULL reasoning: b.blocked_id = viewer matches nothing when viewer is
    -- NULL, so NOT EXISTS is true and the result stays strictly boolean.
    AND NOT EXISTS (
      SELECT 1 FROM account_blocks b
      WHERE b.blocker_id = u.id AND b.blocked_id = viewer
    )
  FROM users u WHERE u.id = author
$$;

-- is_hidden_by is the other half of the visibility story, and deliberately not
-- part of can_view_user: it says the viewer chose not to see this account,
-- which is a weaker thing than being refused.
--
-- Rows it matches are dropped from feeds but stay readable everywhere the
-- viewer asked for them on purpose — a profile, a quoted post, a reply's parent
-- — because the reveal button has to have something to reveal. Putting this in
-- can_view_user would make those places return nothing and break the cushion.
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

-- ============================================================================
-- INITIAL DATA
-- ============================================================================
-- This section contains initial data that should be present in all databases.
-- These INSERTs use ON CONFLICT DO NOTHING to be idempotent.
-- 
-- When adding new permissions or roles:
-- 1. Add them to a new migration file in db/migrations/
-- 2. Also add them here so new databases get the complete dataset
-- ============================================================================

-- Roles
INSERT INTO roles (id, name, description) VALUES
  ('user', 'user', 'Default user role'),
  ('admin', 'admin', 'Administrator role')
ON CONFLICT (id) DO NOTHING;

-- Base permissions (user actions)
INSERT INTO permissions (id, name, description) VALUES
  ('admin_access', 'Admin access', 'Access admin endpoints'),
  ('admin_user_ban', 'Admin user ban', 'Ban or unban users'),
  ('admin_signup_toggle', 'Admin signup toggle', 'Toggle new user registrations'),
  ('admin_roles_read', 'Admin roles read', 'Read role list'),
  ('admin_permissions_read', 'Admin permissions read', 'Read permission list'),
  ('admin_user_roles_manage', 'Admin user roles manage', 'Manage user roles'),
  ('admin_user_permissions_manage', 'Admin user permissions manage', 'Manage user permission overrides'),
  ('posts_create', 'Posts create', 'Create posts'),
  ('posts_delete', 'Posts delete', 'Delete own posts'),
  ('media_upload', 'Media upload', 'Upload media'),
  ('reactions_add', 'Reactions add', 'Add reactions'),
  ('reactions_remove', 'Reactions remove', 'Remove reactions')
ON CONFLICT (id) DO NOTHING;

-- Admin permissions (colon-style naming for granular access control)
INSERT INTO permissions (id, name, description) VALUES
  -- Dashboard and general access
  ('admin:access', 'Admin access', 'Basic admin access for dashboard and general admin features'),
  
  -- User management
  ('admin:users:read', 'Admin users read', 'Read user information and search users'),
  ('admin:users:write', 'Admin users write', 'Modify user information and manage user notes'),
  
  -- Invite management
  ('admin:invites:read', 'Admin invites read', 'View invite codes and settings'),
  ('admin:invites:write', 'Admin invites write', 'Create and manage invite codes'),
  
  -- Agreement management
  ('admin:agreements:manage', 'Admin agreements manage', 'Create, update, publish, and delete agreement documents'),
  
  -- Moderation - Banned content
  ('admin:moderation:manage_banned_content', 'Admin moderation manage banned content', 'Manage banned words, images, and hashes'),
  
  -- Moderation - IP bans
  ('admin:moderation:manage_ip_bans', 'Admin moderation manage IP bans', 'Create and remove IP bans'),
  
  -- Moderation - Media
  ('admin:moderation:manage_media', 'Admin moderation manage media', 'Review and delete uploaded media'),
  
  -- Moderation - Mutes
  ('admin:moderation:manage_mutes', 'Admin moderation manage mutes', 'Create and remove user mutes'),
  
  -- Moderation - Posts
  ('admin:moderation:manage_posts', 'Admin moderation manage posts', 'Review, hide, and delete posts'),
  
  -- Moderation - Reports
  ('admin:moderation:manage_reports', 'Admin moderation manage reports', 'Resolve and manage reports'),
  ('admin:moderation:view_reports', 'Admin moderation view reports', 'View reports and report details'),
  
  -- Moderation - Logs
  ('admin:moderation:view_logs', 'Admin moderation view logs', 'View moderation logs'),

  -- Emoji management
  ('admin:emojis:manage', 'Admin emojis manage', 'Create, update, and delete custom emojis')
ON CONFLICT (id) DO NOTHING;

-- Grant permissions to user role
INSERT INTO role_permissions (role_id, permission_id, scope, effect) VALUES
  ('user', 'posts_create', 'global', 'allow'),
  ('user', 'posts_delete', 'global', 'allow'),
  ('user', 'media_upload', 'global', 'allow'),
  ('user', 'reactions_add', 'global', 'allow'),
  ('user', 'reactions_remove', 'global', 'allow')
ON CONFLICT (role_id, permission_id, scope) DO NOTHING;

-- Grant all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id, scope, effect)
SELECT 'admin', id, 'global', 'allow'
FROM permissions
WHERE id NOT IN (
  SELECT permission_id FROM role_permissions 
  WHERE role_id = 'admin' AND scope = 'global'
)
ON CONFLICT (role_id, permission_id, scope) DO NOTHING;

-- Server settings default
INSERT INTO server_settings (id, terms_version, privacy_version)
VALUES (1, 1, 1)
ON CONFLICT (id) DO NOTHING;


