DELETE FROM role_permissions WHERE permission_id IN (
  'admin:users:read', 'admin:users:write',
  'admin:invites:read', 'admin:invites:write',
  'admin:posts:read', 'admin:posts:write',
  'admin:media:read', 'admin:media:write',
  'admin:reports:read', 'admin:reports:write',
  'admin:moderation:read', 'admin:moderation:write',
  'admin:logs:read',
  'admin:agreements:read', 'admin:agreements:write'
);
DELETE FROM permissions WHERE id IN (
  'admin:users:read', 'admin:users:write',
  'admin:invites:read', 'admin:invites:write',
  'admin:posts:read', 'admin:posts:write',
  'admin:media:read', 'admin:media:write',
  'admin:reports:read', 'admin:reports:write',
  'admin:moderation:read', 'admin:moderation:write',
  'admin:logs:read',
  'admin:agreements:read', 'admin:agreements:write'
);
