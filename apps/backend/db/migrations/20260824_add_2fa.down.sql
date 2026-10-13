DELETE FROM role_permissions WHERE permission_id = 'admin_users_mfa_reset';
DELETE FROM permissions WHERE id = 'admin_users_mfa_reset';

DROP TABLE IF EXISTS auth_webauthn_credentials;
DROP TABLE IF EXISTS auth_backup_codes;
DROP TABLE IF EXISTS auth_totp;
