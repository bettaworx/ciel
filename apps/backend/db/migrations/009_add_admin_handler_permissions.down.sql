DELETE FROM role_permissions WHERE permission_id IN (
  'admin:agreements:manage',
  'admin:moderation:manage_banned_content',
  'admin:moderation:manage_ip_bans',
  'admin:moderation:manage_media',
  'admin:moderation:manage_mutes',
  'admin:moderation:manage_posts',
  'admin:moderation:manage_reports',
  'admin:moderation:view_logs',
  'admin:moderation:view_reports'
);
DELETE FROM permissions WHERE id IN (
  'admin:agreements:manage',
  'admin:moderation:manage_banned_content',
  'admin:moderation:manage_ip_bans',
  'admin:moderation:manage_media',
  'admin:moderation:manage_mutes',
  'admin:moderation:manage_posts',
  'admin:moderation:manage_reports',
  'admin:moderation:view_logs',
  'admin:moderation:view_reports'
);
