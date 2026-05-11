-- Add missing admin permissions with colon-style naming
-- These permissions are referenced in the code but were not defined in the database

-- Add colon-style admin permissions
INSERT INTO permissions (id, name, description) VALUES
  -- User management permissions
  ('admin:users:read', 'Admin users read', 'Read user information and search users'),
  ('admin:users:write', 'Admin users write', 'Modify user information and manage user notes'),
  
  -- Invite management permissions  
  ('admin:invites:read', 'Admin invites read', 'View invite codes and settings'),
  ('admin:invites:write', 'Admin invites write', 'Create and manage invite codes'),
  
  -- Post management permissions
  ('admin:posts:read', 'Admin posts read', 'View all posts'),
  ('admin:posts:write', 'Admin posts write', 'Modify post visibility and delete posts'),
  
  -- Media management permissions
  ('admin:media:read', 'Admin media read', 'View all media'),
  ('admin:media:write', 'Admin media write', 'Delete media'),
  
  -- Report management permissions
  ('admin:reports:read', 'Admin reports read', 'View user reports'),
  ('admin:reports:write', 'Admin reports write', 'Resolve and manage reports'),
  
  -- Moderation permissions
  ('admin:moderation:read', 'Admin moderation read', 'View moderation settings'),
  ('admin:moderation:write', 'Admin moderation write', 'Manage banned words, images, and IPs'),
  
  -- Logs permissions
  ('admin:logs:read', 'Admin logs read', 'View moderation logs'),
  
  -- Agreement management permissions
  ('admin:agreements:read', 'Admin agreements read', 'View agreement documents'),
  ('admin:agreements:write', 'Admin agreements write', 'Create and manage agreement documents')
ON CONFLICT (id) DO NOTHING;

-- Grant all new colon-style permissions to admin role
INSERT INTO role_permissions (role_id, permission_id, scope, effect)
SELECT 'admin', id, 'global', 'allow'
FROM permissions
WHERE id LIKE 'admin:%'
  AND id NOT IN (
    SELECT permission_id FROM role_permissions 
    WHERE role_id = 'admin' AND scope = 'global'
  )
ON CONFLICT (role_id, permission_id, scope) DO NOTHING;
