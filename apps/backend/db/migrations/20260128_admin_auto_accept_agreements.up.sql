-- Migration: Update existing admin users to latest agreement versions
-- Date: 2026-01-28
-- 
-- This migration ensures that all existing admin users are automatically
-- updated to the latest agreement versions (terms and privacy).
-- This is part of the change to remove admin exemption from agreement checks
-- and instead auto-accept agreements when published.
--
-- Admin users will now automatically accept agreements when they are published,
-- but existing admins need to be brought up to date with current versions.

UPDATE users u
SET 
  terms_version = (SELECT terms_version FROM server_settings WHERE id = 1),
  privacy_version = (SELECT privacy_version FROM server_settings WHERE id = 1),
  terms_accepted_at = COALESCE(u.terms_accepted_at, now()),
  privacy_accepted_at = COALESCE(u.privacy_accepted_at, now())
FROM user_roles ur
WHERE u.id = ur.user_id 
  AND ur.role_id = 'admin'
  AND (
    u.terms_version < (SELECT terms_version FROM server_settings WHERE id = 1)
    OR u.privacy_version < (SELECT privacy_version FROM server_settings WHERE id = 1)
  );
