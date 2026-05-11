DELETE FROM role_permissions WHERE permission_id = 'admin:emojis:manage';
DELETE FROM permissions WHERE id = 'admin:emojis:manage';
DROP TABLE IF EXISTS custom_emojis;
