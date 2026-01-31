-- Adds RBAC tables and server settings.
-- Safe to run multiple times.

DO $$
BEGIN
  CREATE TYPE permission_effect AS ENUM ('allow', 'deny');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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
  signup_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO roles (id, name, description) VALUES
  ('user', 'user', 'Default user role'),
  ('admin', 'admin', 'Administrator role')
ON CONFLICT (id) DO NOTHING;

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

INSERT INTO role_permissions (role_id, permission_id, scope, effect) VALUES
  ('user', 'posts_create', 'global', 'allow'),
  ('user', 'posts_delete', 'global', 'allow'),
  ('user', 'media_upload', 'global', 'allow'),
  ('user', 'reactions_add', 'global', 'allow'),
  ('user', 'reactions_remove', 'global', 'allow'),
  ('admin', 'admin_access', 'global', 'allow'),
  ('admin', 'admin_user_ban', 'global', 'allow'),
  ('admin', 'admin_signup_toggle', 'global', 'allow'),
  ('admin', 'admin_roles_read', 'global', 'allow'),
  ('admin', 'admin_permissions_read', 'global', 'allow'),
  ('admin', 'admin_user_roles_manage', 'global', 'allow'),
  ('admin', 'admin_user_permissions_manage', 'global', 'allow'),
  ('admin', 'posts_create', 'global', 'allow'),
  ('admin', 'posts_delete', 'global', 'allow'),
  ('admin', 'media_upload', 'global', 'allow'),
  ('admin', 'reactions_add', 'global', 'allow'),
  ('admin', 'reactions_remove', 'global', 'allow')
ON CONFLICT (role_id, permission_id, scope) DO NOTHING;

INSERT INTO server_settings (id, signup_enabled)
VALUES (1, TRUE)
ON CONFLICT (id) DO NOTHING;
