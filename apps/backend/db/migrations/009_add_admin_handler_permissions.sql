-- Add admin permissions referenced in handlers but missing in DB
INSERT INTO permissions (id, name, description) VALUES
  ('admin:agreements:manage', 'Admin agreements manage', 'Create, update, publish, and delete agreement documents'),
  ('admin:moderation:manage_banned_content', 'Admin moderation manage banned content', 'Manage banned words, images, and hashes'),
  ('admin:moderation:manage_ip_bans', 'Admin moderation manage IP bans', 'Create and remove IP bans'),
  ('admin:moderation:manage_media', 'Admin moderation manage media', 'Review and delete uploaded media'),
  ('admin:moderation:manage_mutes', 'Admin moderation manage mutes', 'Create and remove user mutes'),
  ('admin:moderation:manage_posts', 'Admin moderation manage posts', 'Review, hide, and delete posts'),
  ('admin:moderation:manage_reports', 'Admin moderation manage reports', 'Resolve and manage reports'),
  ('admin:moderation:view_logs', 'Admin moderation view logs', 'View moderation logs'),
  ('admin:moderation:view_reports', 'Admin moderation view reports', 'View reports and report details')
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, scope, effect)
SELECT 'admin', id, 'global', 'allow'
FROM permissions
WHERE id LIKE 'admin:%'
  AND id NOT IN (
    SELECT permission_id FROM role_permissions
    WHERE role_id = 'admin' AND scope = 'global'
  )
ON CONFLICT (role_id, permission_id, scope) DO NOTHING;
