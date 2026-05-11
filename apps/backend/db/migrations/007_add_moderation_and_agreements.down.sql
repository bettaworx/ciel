DELETE FROM role_permissions WHERE permission_id IN (
  'admin_users_view', 'admin_users_search', 'admin_users_notes', 'admin_users_mute',
  'admin_posts_view', 'admin_posts_delete', 'admin_posts_hide', 'admin_posts_bulk',
  'admin_media_view', 'admin_media_delete', 'admin_media_bulk',
  'admin_profile_delete',
  'admin_reports_view', 'admin_reports_review',
  'admin_moderation_words', 'admin_moderation_images', 'admin_moderation_ips',
  'admin_logs_view', 'admin_bulk_actions',
  'admin_agreements_view', 'admin_agreements_create', 'admin_agreements_edit',
  'admin_agreements_publish', 'admin_agreements_delete'
);
DELETE FROM permissions WHERE id IN (
  'admin_users_view', 'admin_users_search', 'admin_users_notes', 'admin_users_mute',
  'admin_posts_view', 'admin_posts_delete', 'admin_posts_hide', 'admin_posts_bulk',
  'admin_media_view', 'admin_media_delete', 'admin_media_bulk',
  'admin_profile_delete',
  'admin_reports_view', 'admin_reports_review',
  'admin_moderation_words', 'admin_moderation_images', 'admin_moderation_ips',
  'admin_logs_view', 'admin_bulk_actions',
  'admin_agreements_view', 'admin_agreements_create', 'admin_agreements_edit',
  'admin_agreements_publish', 'admin_agreements_delete'
);

DROP TABLE IF EXISTS agreement_documents;
DROP TABLE IF EXISTS ip_bans;
DROP TABLE IF EXISTS banned_image_hashes;
DROP TABLE IF EXISTS banned_words;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS user_mutes;
DROP TABLE IF EXISTS moderation_logs;
DROP TABLE IF EXISTS admin_user_notes;

ALTER TABLE media
  DROP COLUMN IF EXISTS deleted_at,
  DROP COLUMN IF EXISTS deleted_by,
  DROP COLUMN IF EXISTS deletion_reason,
  DROP COLUMN IF EXISTS phash;

ALTER TABLE posts
  DROP COLUMN IF EXISTS visibility,
  DROP COLUMN IF EXISTS deleted_by,
  DROP COLUMN IF EXISTS deletion_reason;
