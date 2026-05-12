-- Revert admin users' agreement versions to 0 (they will need to re-accept).
UPDATE users u
SET
  terms_version      = 0,
  privacy_version    = 0,
  terms_accepted_at  = NULL,
  privacy_accepted_at = NULL
FROM user_roles ur
WHERE u.id = ur.user_id AND ur.role_id = 'admin';
