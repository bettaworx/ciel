-- Migration 007: Add comprehensive moderation system and agreement documents
-- This migration adds:
-- 1. Admin user notes
-- 2. Moderation logs (audit trail for all admin actions)
-- 3. User mutes (lighter than bans)
-- 4. Reports system (user-submitted reports)
-- 5. Banned words
-- 6. Banned image hashes
-- 7. IP bans (DB storage)
-- 8. Agreement documents (full content management for Terms/Privacy)

-- ==================== 1. Admin User Notes ====================

CREATE TABLE IF NOT EXISTS admin_user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_user_notes_user ON admin_user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_notes_updated ON admin_user_notes(updated_at DESC);

COMMENT ON TABLE admin_user_notes IS 'Admin-only notes about users (not visible to users)';
COMMENT ON COLUMN admin_user_notes.content IS 'Admin note content about this user';

-- ==================== 2. Moderation Logs ====================

CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (action IN (
    'ban_user', 'unban_user', 'mute_user', 'unmute_user',
    'delete_post', 'hide_post', 'unhide_post', 'bulk_delete_posts',
    'delete_media', 'bulk_delete_media',
    'delete_avatar', 'delete_display_name', 'delete_bio',
    'ban_ip', 'unban_ip',
    'create_banned_word', 'delete_banned_word',
    'create_banned_image', 'delete_banned_image',
    'approve_report', 'dismiss_report',
    'publish_agreement', 'other'
  )),
  CHECK (target_type IN ('user', 'post', 'media', 'report', 'ip', 'word', 'image', 'agreement', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin ON moderation_logs(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target ON moderation_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action ON moderation_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON moderation_logs(created_at DESC);

COMMENT ON TABLE moderation_logs IS 'Audit log of all moderation actions';
COMMENT ON COLUMN moderation_logs.details IS 'JSON object with action-specific details (reason, ttl, etc)';

-- ==================== 3. User Mutes ====================

CREATE TABLE IF NOT EXISTS user_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mute_type TEXT NOT NULL,
  muted_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (mute_type IN ('posts_create', 'media_upload', 'reactions_add', 'all'))
);

CREATE INDEX IF NOT EXISTS idx_user_mutes_user ON user_mutes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mutes_type ON user_mutes(user_id, mute_type);
CREATE INDEX IF NOT EXISTS idx_user_mutes_expires ON user_mutes(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE user_mutes IS 'User mutes (lighter restriction than bans)';
COMMENT ON COLUMN user_mutes.mute_type IS 'Type of mute: posts_create, media_upload, reactions_add, or all';
COMMENT ON COLUMN user_mutes.expires_at IS 'Expiration time (NULL = permanent)';

-- ==================== 4. Reports System ====================

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (target_type IN ('post', 'user')),
  CHECK (reason IN ('spam', 'harassment', 'inappropriate_content', 'other')),
  CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed'))
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reviewer ON reports(reviewed_by);

COMMENT ON TABLE reports IS 'User-submitted reports of posts or users';
COMMENT ON COLUMN reports.resolution IS 'Admin description of how the report was handled';

-- ==================== 5. Banned Words ====================

CREATE TABLE IF NOT EXISTS banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL UNIQUE,
  applies_to TEXT NOT NULL DEFAULT 'all',
  severity TEXT NOT NULL DEFAULT 'block',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (applies_to IN ('posts', 'profiles', 'all')),
  CHECK (severity IN ('block', 'flag'))
);

CREATE INDEX IF NOT EXISTS idx_banned_words_applies ON banned_words(applies_to);

COMMENT ON TABLE banned_words IS 'Banned word patterns for automatic moderation';
COMMENT ON COLUMN banned_words.pattern IS 'Word or regex pattern to block';
COMMENT ON COLUMN banned_words.severity IS 'block = reject content, flag = allow but flag for review';

-- ==================== 6. Banned Image Hashes ====================

CREATE TABLE IF NOT EXISTS banned_image_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash TEXT NOT NULL UNIQUE,
  hash_type TEXT NOT NULL DEFAULT 'phash',
  reason TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (hash_type IN ('phash', 'md5'))
);

CREATE INDEX IF NOT EXISTS idx_banned_image_hashes_hash ON banned_image_hashes(hash, hash_type);

COMMENT ON TABLE banned_image_hashes IS 'Banned image hashes for automatic moderation';
COMMENT ON COLUMN banned_image_hashes.hash_type IS 'phash = perceptual hash, md5 = MD5 hash';

-- ==================== 7. IP Bans ====================

CREATE TABLE IF NOT EXISTS ip_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT,
  banned_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_bans_ip ON ip_bans(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_bans_expires ON ip_bans(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE ip_bans IS 'IP address bans';
COMMENT ON COLUMN ip_bans.expires_at IS 'Expiration time (NULL = permanent)';

-- ==================== 8. Post Visibility ====================

-- Add visibility column to posts table for hiding posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add check constraint for visibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_visibility_check'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_visibility_check 
      CHECK (visibility IN ('public', 'hidden', 'deleted'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);

COMMENT ON COLUMN posts.visibility IS 'public = visible to all, hidden = only visible to author, deleted = soft deleted';
COMMENT ON COLUMN posts.deleted_by IS 'Admin who deleted this post (NULL if deleted by author)';
COMMENT ON COLUMN posts.deletion_reason IS 'Reason for deletion (admin-provided)';

-- Update deleted posts to have visibility='deleted'
UPDATE posts SET visibility = 'deleted' WHERE deleted_at IS NOT NULL AND visibility = 'public';

-- ==================== 9. Media Deletion ====================

-- Add deletion tracking to media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE media ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE media ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS phash TEXT;

CREATE INDEX IF NOT EXISTS idx_media_deleted ON media(deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_phash ON media(phash) WHERE phash IS NOT NULL;

COMMENT ON COLUMN media.deleted_at IS 'Soft deletion timestamp';
COMMENT ON COLUMN media.deleted_by IS 'Admin who deleted this media';
COMMENT ON COLUMN media.phash IS 'Perceptual hash for image matching';

-- ==================== 10. Agreement Documents ====================

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changelog TEXT,
  UNIQUE(document_type, version, language),
  CHECK (version >= 1),
  CHECK (document_type IN ('terms', 'privacy')),
  CHECK (language IN ('ja', 'en')),
  CHECK (status IN ('draft', 'published'))
);

CREATE INDEX IF NOT EXISTS idx_agreement_documents_type_version 
  ON agreement_documents(document_type, version DESC);
CREATE INDEX IF NOT EXISTS idx_agreement_documents_status 
  ON agreement_documents(document_type, status, version DESC);
CREATE INDEX IF NOT EXISTS idx_agreement_documents_language 
  ON agreement_documents(document_type, language, version DESC);
CREATE INDEX IF NOT EXISTS idx_agreement_documents_published 
  ON agreement_documents(published_at DESC) WHERE status = 'published';

COMMENT ON TABLE agreement_documents IS 
  'Full content storage for Terms of Service and Privacy Policy with version history';
COMMENT ON COLUMN agreement_documents.content IS 
  'Markdown-formatted document content';
COMMENT ON COLUMN agreement_documents.changelog IS 
  'Admin-provided summary of changes in this version';
COMMENT ON COLUMN agreement_documents.status IS 
  'draft = work in progress, published = publicly visible';

-- ==================== 11. New Permissions ====================

-- Add new permissions for moderation features
INSERT INTO permissions (id, name, description) VALUES
  -- User management
  ('admin_users_view', 'Admin users view', 'View user details and statistics'),
  ('admin_users_search', 'Admin users search', 'Search and list users'),
  ('admin_users_notes', 'Admin users notes', 'View and edit admin notes on users'),
  ('admin_users_mute', 'Admin users mute', 'Mute users (restrict actions)'),
  
  -- Post management
  ('admin_posts_view', 'Admin posts view', 'View all posts including deleted'),
  ('admin_posts_delete', 'Admin posts delete', 'Delete any post'),
  ('admin_posts_hide', 'Admin posts hide', 'Hide posts (make private)'),
  ('admin_posts_bulk', 'Admin posts bulk', 'Bulk delete posts'),
  
  -- Media management
  ('admin_media_view', 'Admin media view', 'View all media including deleted'),
  ('admin_media_delete', 'Admin media delete', 'Delete any media'),
  ('admin_media_bulk', 'Admin media bulk', 'Bulk delete media'),
  
  -- Profile management
  ('admin_profile_delete', 'Admin profile delete', 'Delete user profile fields'),
  
  -- Reports management
  ('admin_reports_view', 'Admin reports view', 'View user reports'),
  ('admin_reports_review', 'Admin reports review', 'Review and resolve reports'),
  
  -- Automatic moderation
  ('admin_moderation_words', 'Admin moderation words', 'Manage banned words'),
  ('admin_moderation_images', 'Admin moderation images', 'Manage banned image hashes'),
  ('admin_moderation_ips', 'Admin moderation IPs', 'Manage IP bans'),
  
  -- Logs
  ('admin_logs_view', 'Admin logs view', 'View moderation logs'),
  
  -- Bulk actions
  ('admin_bulk_actions', 'Admin bulk actions', 'Perform bulk moderation actions'),
  
  -- Agreement documents
  ('admin_agreements_view', 'Admin agreements view', 'View agreement documents'),
  ('admin_agreements_create', 'Admin agreements create', 'Create draft agreement documents'),
  ('admin_agreements_edit', 'Admin agreements edit', 'Edit draft agreement documents'),
  ('admin_agreements_publish', 'Admin agreements publish', 'Publish agreement documents'),
  ('admin_agreements_delete', 'Admin agreements delete', 'Delete draft agreement documents')
ON CONFLICT (id) DO NOTHING;

-- Grant all new permissions to admin role
INSERT INTO role_permissions (role_id, permission_id, scope, effect)
SELECT 'admin', id, 'global', 'allow'
FROM permissions
WHERE id LIKE 'admin_%'
  AND id NOT IN (
    SELECT permission_id FROM role_permissions 
    WHERE role_id = 'admin' AND scope = 'global'
  )
ON CONFLICT (role_id, permission_id, scope) DO NOTHING;
