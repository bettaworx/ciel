-- Add admin:access permission for dashboard and general admin access
INSERT INTO permissions (id, name, description) VALUES
  ('admin:access', 'Admin access', 'Basic admin access for dashboard and general admin features')
ON CONFLICT (id) DO NOTHING;

-- Grant to admin role
INSERT INTO role_permissions (role_id, permission_id, scope, effect) VALUES
  ('admin', 'admin:access', 'global', 'allow')
ON CONFLICT (role_id, permission_id, scope) DO NOTHING;
