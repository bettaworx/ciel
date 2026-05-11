-- Add custom_emojis table and admin:emojis:manage permission

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

INSERT INTO permissions (id, name, description) VALUES
  ('admin:emojis:manage', 'Admin emojis manage', 'Create, update, and delete custom emojis')
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, scope, effect)
VALUES ('admin', 'admin:emojis:manage', 'global', 'allow')
ON CONFLICT (role_id, permission_id, scope) DO NOTHING;
