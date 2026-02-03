-- name: ListItems :many
SELECT id, name, created_at
FROM items
ORDER BY id DESC;

-- name: CreateItem :one
INSERT INTO items (name)
VALUES ($1)
RETURNING id, name, created_at;

-- name: CreateUser :one
INSERT INTO users (username, terms_version, privacy_version, terms_accepted_at, privacy_accepted_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, username, display_name, bio, avatar_media_id, created_at, terms_version, privacy_version, terms_accepted_at, privacy_accepted_at;

-- name: GetUserByUsername :one
SELECT
	u.id,
	u.username,
	u.display_name,
	u.bio,
	u.avatar_media_id,
	u.created_at,
	u.terms_version,
	u.privacy_version,
	u.terms_accepted_at,
	u.privacy_accepted_at,
	m.ext AS avatar_ext
FROM users u
LEFT JOIN media m ON m.id = u.avatar_media_id
WHERE u.username = $1;

-- name: GetUserByID :one
SELECT
	u.id,
	u.username,
	u.display_name,
	u.bio,
	u.avatar_media_id,
	u.created_at,
	u.terms_version,
	u.privacy_version,
	u.terms_accepted_at,
	u.privacy_accepted_at,
	m.ext AS avatar_ext
FROM users u
LEFT JOIN media m ON m.id = u.avatar_media_id
WHERE u.id = $1;

-- name: ListUsers :many
SELECT id, username, display_name, created_at
FROM users
ORDER BY created_at ASC;

-- name: UpdateUserProfile :one
UPDATE users
SET display_name = COALESCE(sqlc.narg('display_name'), display_name),
	bio = COALESCE(sqlc.narg('bio'), bio)
WHERE id = $1
RETURNING 
	id, 
	username, 
	display_name, 
	bio, 
	avatar_media_id, 
	created_at,
	terms_version,
	privacy_version,
	terms_accepted_at,
	privacy_accepted_at;

-- name: UpdateUserAvatar :one
WITH prev AS (
	SELECT u.avatar_media_id FROM users AS u WHERE u.id = $1
),
updated AS (
	UPDATE users AS u
	SET avatar_media_id = $2
	WHERE u.id = $1
	RETURNING u.id, u.username, u.display_name, u.bio, u.avatar_media_id, u.created_at, u.terms_version, u.privacy_version, u.terms_accepted_at, u.privacy_accepted_at
)
SELECT
	updated.id,
	updated.username,
	updated.display_name,
	updated.bio,
	updated.avatar_media_id,
	updated.created_at,
	updated.terms_version,
	updated.privacy_version,
	updated.terms_accepted_at,
	updated.privacy_accepted_at,
	m.ext AS avatar_ext,
	(SELECT avatar_media_id FROM prev) AS previous_avatar_media_id
FROM updated
LEFT JOIN media m ON m.id = updated.avatar_media_id;

-- name: CreateAuthCredential :exec
INSERT INTO auth_credentials (user_id, salt, iterations, stored_key, server_key)
VALUES ($1, $2, $3, $4, $5);

-- name: GetAuthByUsername :one
SELECT
	u.id AS user_id,
	u.username,
	u.display_name,
	u.bio,
	u.avatar_media_id,
	u.created_at,
	u.terms_version,
	u.privacy_version,
	u.terms_accepted_at,
	u.privacy_accepted_at,
	m.ext AS avatar_ext,
	c.salt,
	c.iterations,
	c.stored_key,
	c.server_key
FROM users u
JOIN auth_credentials c ON c.user_id = u.id
LEFT JOIN media m ON m.id = u.avatar_media_id
WHERE u.username = $1;

-- name: GetAuthByUserID :one
SELECT
	u.id AS user_id,
	u.username,
	u.display_name,
	u.bio,
	u.avatar_media_id,
	u.created_at,
	u.terms_version,
	u.privacy_version,
	u.terms_accepted_at,
	u.privacy_accepted_at,
	m.ext AS avatar_ext,
	c.salt,
	c.iterations,
	c.stored_key,
	c.server_key
FROM users u
JOIN auth_credentials c ON c.user_id = u.id
LEFT JOIN media m ON m.id = u.avatar_media_id
WHERE u.id = $1;

-- name: UpdateAuthCredential :exec
UPDATE auth_credentials
SET salt = $2,
	iterations = $3,
	stored_key = $4,
	server_key = $5,
	created_at = now()
WHERE user_id = $1;

-- name: DeleteUserByID :exec
DELETE FROM users
WHERE id = $1;

-- name: CreatePost :one
INSERT INTO posts (user_id, content)
VALUES ($1, $2)
RETURNING id, user_id, content, created_at, deleted_at;

-- name: GetPostWithAuthorByID :one
SELECT
	p.id,
	p.user_id,
	p.content,
	p.created_at,
	p.deleted_at,
	u.username,
	u.display_name,
	u.bio,
	u.avatar_media_id,
	u.created_at AS user_created_at,
	m.ext AS avatar_ext
FROM posts p
JOIN users u ON u.id = p.user_id
LEFT JOIN media m ON m.id = u.avatar_media_id
WHERE p.id = $1;

-- name: GetPostOwnerByID :one
SELECT user_id
FROM posts
WHERE id = $1;

-- name: MarkPostDeleted :one
UPDATE posts
SET deleted_at = now()
WHERE id = $1
	AND user_id = $2
	AND deleted_at IS NULL
RETURNING id, deleted_at;

-- name: CreateMedia :one
INSERT INTO media (id, user_id, type, ext, width, height)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, user_id, type, ext, width, height, created_at;

-- name: CountOwnedMediaByIDs :one
SELECT COUNT(*)::int
FROM media
WHERE user_id = $1
	AND id = ANY($2::uuid[])
	AND type = 'image';

-- name: GetMediaByID :one
SELECT id, user_id, type, ext, width, height, created_at
FROM media
WHERE id = $1;

-- name: DeleteMediaByID :exec
DELETE FROM media
WHERE id = $1;

-- name: IsMediaAttachedToPost :one
SELECT EXISTS(
	SELECT 1 FROM post_media WHERE media_id = $1
) AS is_attached;

-- name: IsMediaPublic :one
SELECT (
	EXISTS(SELECT 1 FROM post_media WHERE media_id = $1)
	OR
	EXISTS(SELECT 1 FROM users WHERE avatar_media_id = $1)
	OR
	($1 = sqlc.narg('server_icon_media_id')::uuid)
) AS is_public;

-- name: AttachMediaToPost :exec
INSERT INTO post_media (post_id, media_id, sort_order)
VALUES ($1, $2, $3)
ON CONFLICT DO NOTHING;

-- name: ListMediaForPost :many
SELECT
	pm.post_id,
	m.id AS media_id,
	m.type,
	m.ext,
	m.width,
	m.height,
	m.created_at,
	pm.sort_order
FROM post_media pm
JOIN media m ON m.id = pm.media_id
WHERE pm.post_id = $1
	AND m.type = 'image'
ORDER BY pm.sort_order ASC, m.created_at ASC, m.id ASC
LIMIT 4;


-- name: ListMediaForPosts :many
SELECT
	pm.post_id,
	m.id AS media_id,
	m.type,
	m.ext,
	m.width,
	m.height,
	m.created_at,
	pm.sort_order
FROM post_media pm
JOIN media m ON m.id = pm.media_id
WHERE pm.post_id = ANY($1::uuid[])
	AND m.type = 'image'
ORDER BY pm.post_id ASC, pm.sort_order ASC, m.created_at ASC, m.id ASC;

-- name: ListTimelinePosts :many
SELECT
	p.id,
	p.user_id,
	p.content,
	p.created_at,
	p.deleted_at,
	u.username,
	u.display_name,
	u.bio,
	u.avatar_media_id,
	u.created_at AS user_created_at,
	m.ext AS avatar_ext
FROM posts p
JOIN users u ON u.id = p.user_id
LEFT JOIN media m ON m.id = u.avatar_media_id
WHERE p.deleted_at IS NULL
	AND (
		sqlc.narg('cursor_time')::timestamptz IS NULL
		OR p.created_at < sqlc.narg('cursor_time')
		OR (p.created_at = sqlc.narg('cursor_time') AND p.id < sqlc.narg('cursor_id'))
	)
ORDER BY p.created_at DESC, p.id DESC
LIMIT sqlc.arg('limit');

-- name: ListPostsByUsername :many
SELECT
	p.id,
	p.user_id,
	p.content,
	p.created_at,
	p.deleted_at,
	u.username,
	u.display_name,
	u.bio,
	u.avatar_media_id,
	u.created_at AS user_created_at,
	m.ext AS avatar_ext
FROM posts p
JOIN users u ON u.id = p.user_id
LEFT JOIN media m ON m.id = u.avatar_media_id
WHERE p.deleted_at IS NULL
	AND u.username = $1
	AND (
		sqlc.narg('cursor_time')::timestamptz IS NULL
		OR p.created_at < sqlc.narg('cursor_time')
		OR (p.created_at = sqlc.narg('cursor_time') AND p.id < sqlc.narg('cursor_id'))
	)
ORDER BY p.created_at DESC, p.id DESC
LIMIT sqlc.arg('limit');

-- name: GetPostsByIDs :many
SELECT
	p.id,
	p.user_id,
	p.content,
	p.created_at,
	p.deleted_at,
	u.username,
	u.display_name,
	u.bio,
	u.avatar_media_id,
	u.created_at AS user_created_at,
	m.ext AS avatar_ext
FROM posts p
JOIN users u ON u.id = p.user_id
LEFT JOIN media m ON m.id = u.avatar_media_id
WHERE p.deleted_at IS NULL
	AND p.id = ANY($1::uuid[])
ORDER BY array_position($1::uuid[], p.id);

-- name: ListReactionCounts :many
SELECT emoji, count
FROM post_reaction_counts
WHERE post_id = $1
ORDER BY emoji ASC;

-- name: ListReactionCountsWithUserStatus :many
-- Returns reaction counts with whether the specified user has reacted
SELECT 
    prc.emoji,
    prc.count,
    EXISTS(
        SELECT 1 FROM post_reaction_events pre
        WHERE pre.post_id = prc.post_id 
        AND pre.emoji = prc.emoji 
        AND pre.user_id = $2
    ) AS reacted_by_user
FROM post_reaction_counts prc
WHERE prc.post_id = $1
ORDER BY prc.emoji ASC;

-- name: AddReactionEvent :one
INSERT INTO post_reaction_events (user_id, post_id, emoji)
VALUES ($1, $2, $3)
ON CONFLICT DO NOTHING
RETURNING user_id;

-- name: IncrementReactionCount :one
INSERT INTO post_reaction_counts (post_id, emoji, count)
VALUES ($1, $2, 1)
ON CONFLICT (post_id, emoji)
DO UPDATE SET count = post_reaction_counts.count + 1
RETURNING count;

-- name: RemoveReactionEvent :one
DELETE FROM post_reaction_events
WHERE user_id = $1 AND post_id = $2 AND emoji = $3
RETURNING user_id;

-- name: DecrementReactionCount :one
UPDATE post_reaction_counts
SET count = count - 1
WHERE post_id = $1 AND emoji = $2
RETURNING count;

-- name: DeleteReactionCountIfZero :exec
DELETE FROM post_reaction_counts
WHERE post_id = $1 AND emoji = $2 AND count <= 0;

-- name: ListReactionUsers :many
SELECT
	pre.user_id,
	u.username,
	u.display_name,
	u.bio,
	u.avatar_media_id,
	u.created_at AS user_created_at,
	m.ext AS avatar_ext,
	pre.created_at AS reacted_at
FROM post_reaction_events pre
JOIN users u ON u.id = pre.user_id
LEFT JOIN media m ON m.id = u.avatar_media_id
WHERE pre.post_id = $1
	AND pre.emoji = $2
	AND (
		sqlc.narg('cursor_time')::timestamptz IS NULL
		OR pre.created_at < sqlc.narg('cursor_time')
		OR (pre.created_at = sqlc.narg('cursor_time') AND pre.user_id < sqlc.narg('cursor_id'))
	)
ORDER BY pre.created_at DESC, pre.user_id DESC
LIMIT sqlc.arg('limit');

-- name: ListRoles :many
SELECT id
FROM roles
ORDER BY id ASC;

-- name: ListPermissions :many
SELECT id
FROM permissions
ORDER BY id ASC;

-- name: GetUserRoles :many
SELECT role_id
FROM user_roles
WHERE user_id = $1
ORDER BY role_id ASC;

-- name: DeleteUserRoles :exec
DELETE FROM user_roles
WHERE user_id = $1;

-- name: AddUserRole :exec
INSERT INTO user_roles (user_id, role_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: HasUserRole :one
SELECT EXISTS(
	SELECT 1 FROM user_roles
	WHERE user_id = $1 AND role_id = $2
) AS has_role;

-- name: EnsureRoles :exec
INSERT INTO roles (id, name, description) VALUES
	('user', 'user', 'Default user role'),
	('admin', 'admin', 'Administrator role')
ON CONFLICT (id) DO NOTHING;

-- name: EnsurePermissions :exec
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

-- name: EnsureRolePermissions :exec
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

-- name: GetUserPermissionOverrides :many
SELECT permission_id, scope, effect
FROM user_permissions
WHERE user_id = $1
ORDER BY permission_id ASC, scope ASC, effect ASC;

-- name: DeleteUserPermissionOverrides :exec
DELETE FROM user_permissions
WHERE user_id = $1;

-- name: AddUserPermissionOverride :exec
INSERT INTO user_permissions (user_id, permission_id, scope, effect)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, permission_id, scope) DO UPDATE
SET effect = EXCLUDED.effect;

-- name: GetUserPermissionSummary :one
SELECT
	COALESCE(bool_or(effect = 'deny'), false) AS has_deny,
	COALESCE(bool_or(effect = 'allow'), false) AS has_allow
FROM user_permissions
WHERE user_id = $1
	AND permission_id = $2
	AND scope = $3;

-- name: GetRolePermissionSummary :one
SELECT
	COALESCE(bool_or(rp.effect = 'deny'), false) AS has_deny,
	COALESCE(bool_or(rp.effect = 'allow'), false) AS has_allow
FROM role_permissions rp
JOIN user_roles ur ON ur.role_id = rp.role_id
WHERE ur.user_id = $1
	AND rp.permission_id = $2
	AND rp.scope = $3;


-- name: EnsureServerSettings :exec
INSERT INTO server_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- name: GetServerSettings :one
SELECT id, terms_version, privacy_version
FROM server_settings
WHERE id = 1;


-- name: HasAdminUser :one
SELECT EXISTS(
  SELECT 1 FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  WHERE r.name = 'admin'
) AS has_admin;
-- ==================== Invite Codes ====================

-- name: CreateInviteCode :one
INSERT INTO invite_codes (code, created_by, max_uses, expires_at, note)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, code, created_by, created_at, last_used_at, use_count, max_uses, expires_at, disabled, note;

-- name: GetInviteCodeByCode :one
SELECT id, code, created_by, created_at, last_used_at, use_count, max_uses, expires_at, disabled, note
FROM invite_codes
WHERE code = $1 AND disabled = false;

-- name: GetInviteCodeByID :one
SELECT id, code, created_by, created_at, last_used_at, use_count, max_uses, expires_at, disabled, note
FROM invite_codes
WHERE id = $1;

-- name: ListInviteCodes :many
SELECT 
  ic.id,
  ic.code,
  ic.created_by,
  ic.created_at,
  ic.last_used_at,
  ic.use_count,
  ic.max_uses,
  ic.expires_at,
  ic.disabled,
  ic.note,
  u.username as creator_username,
  u.display_name as creator_display_name
FROM invite_codes ic
JOIN users u ON ic.created_by = u.id
ORDER BY ic.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountInviteCodes :one
SELECT COUNT(*) FROM invite_codes;

-- name: UpdateInviteCodeUsage :exec
UPDATE invite_codes
SET use_count = use_count + 1, last_used_at = now()
WHERE id = $1;

-- name: DisableInviteCode :exec
UPDATE invite_codes
SET disabled = true
WHERE id = $1;

-- name: UpdateInviteCode :one
UPDATE invite_codes
SET 
  code = COALESCE(sqlc.narg('code'), code),
  max_uses = COALESCE(sqlc.narg('max_uses'), max_uses),
  expires_at = COALESCE(sqlc.narg('expires_at'), expires_at),
  note = COALESCE(sqlc.narg('note'), note)
WHERE id = sqlc.arg('id')
RETURNING id, code, created_by, created_at, last_used_at, use_count, max_uses, expires_at, disabled, note;

-- name: DeleteInviteCode :exec
DELETE FROM invite_codes WHERE id = $1;

-- name: RecordInviteCodeUse :one
INSERT INTO invite_code_uses (invite_code_id, user_id)
VALUES ($1, $2)
RETURNING id, invite_code_id, user_id, used_at;

-- name: GetInviteCodeUsageHistory :many
SELECT 
  icu.id,
  icu.invite_code_id,
  icu.user_id,
  icu.used_at,
  u.username,
  u.display_name,
  u.avatar_media_id
FROM invite_code_uses icu
JOIN users u ON icu.user_id = u.id
WHERE icu.invite_code_id = $1
ORDER BY icu.used_at DESC;

-- name: GetInviteCodeByCodeForUpdate :one
-- Locks the invite code row for UPDATE to prevent TOCTOU race conditions.
-- This ensures that only one concurrent registration can use the same invite code.
SELECT id, code, created_by, created_at, last_used_at, use_count, max_uses, expires_at, disabled, note
FROM invite_codes
WHERE code = $1 AND disabled = false
FOR UPDATE;

-- name: CountInviteCodeUses :one
SELECT COUNT(*) FROM invite_code_uses WHERE invite_code_id = $1;

-- name: CheckInviteCodeUsedByUser :one
SELECT EXISTS(
  SELECT 1 FROM invite_code_uses
  WHERE user_id = $1
) AS used;

-- ============================================================
-- Agreement Management Queries
-- ============================================================

-- Get current server-wide agreement versions
-- name: GetAgreementVersions :one
SELECT terms_version, privacy_version
FROM server_settings
WHERE id = 1;

-- Update agreement versions (admin only)
-- name: UpdateAgreementVersions :one
UPDATE server_settings
SET 
  terms_version = COALESCE(sqlc.narg('terms_version'), terms_version),
  privacy_version = COALESCE(sqlc.narg('privacy_version'), privacy_version)
WHERE id = 1
RETURNING terms_version, privacy_version;

-- Record user's agreement
-- name: AcceptAgreements :one
UPDATE users
SET 
  terms_version = COALESCE(sqlc.narg('terms_version'), terms_version),
  privacy_version = COALESCE(sqlc.narg('privacy_version'), privacy_version),
  terms_accepted_at = CASE WHEN COALESCE(sqlc.narg('terms_version'), terms_version) > terms_version THEN NOW() ELSE terms_accepted_at END,
  privacy_accepted_at = CASE WHEN COALESCE(sqlc.narg('privacy_version'), privacy_version) > privacy_version THEN NOW() ELSE privacy_accepted_at END
WHERE id = $1
RETURNING id, username, display_name, bio, avatar_media_id, created_at,
          terms_version, privacy_version, terms_accepted_at, privacy_accepted_at;

-- Check if user needs to re-accept agreements
-- name: CheckUserAgreementStatus :one
SELECT 
  u.terms_version < s.terms_version AS needs_terms_agreement,
  u.privacy_version < s.privacy_version AS needs_privacy_agreement,
  s.terms_version AS current_terms_version,
  s.privacy_version AS current_privacy_version
FROM users u
CROSS JOIN server_settings s
WHERE u.id = $1 AND s.id = 1;

-- ==================== Admin User Notes ====================

-- name: GetAdminUserNote :one
SELECT id, user_id, content, created_by, updated_by, created_at, updated_at
FROM admin_user_notes
WHERE user_id = $1;

-- name: CreateAdminUserNote :one
INSERT INTO admin_user_notes (user_id, content, created_by, updated_by)
VALUES ($1, $2, $3, $3)
RETURNING id, user_id, content, created_by, updated_by, created_at, updated_at;

-- name: UpdateAdminUserNote :one
UPDATE admin_user_notes
SET content = $2, updated_by = $3, updated_at = NOW()
WHERE user_id = $1
RETURNING id, user_id, content, created_by, updated_by, created_at, updated_at;

-- name: DeleteAdminUserNote :exec
DELETE FROM admin_user_notes
WHERE user_id = $1;

-- ==================== Moderation Logs ====================

-- name: CreateModerationLog :one
INSERT INTO moderation_logs (admin_user_id, action, target_type, target_id, details)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, admin_user_id, action, target_type, target_id, details, created_at;

-- name: ListModerationLogs :many
SELECT ml.id, ml.admin_user_id, ml.action, ml.target_type, ml.target_id, ml.details, ml.created_at,
       u.id as admin_id, u.username as admin_username, u.display_name as admin_display_name
FROM moderation_logs ml
LEFT JOIN users u ON ml.admin_user_id = u.id
WHERE (sqlc.narg('admin_user_id')::uuid IS NULL OR ml.admin_user_id = sqlc.narg('admin_user_id'))
  AND (sqlc.narg('action')::text IS NULL OR ml.action = sqlc.narg('action'))
  AND (sqlc.narg('target_type')::text IS NULL OR ml.target_type = sqlc.narg('target_type'))
  AND (sqlc.narg('target_id')::text IS NULL OR ml.target_id = sqlc.narg('target_id'))
ORDER BY ml.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountModerationLogs :one
SELECT COUNT(*)
FROM moderation_logs ml
WHERE (sqlc.narg('admin_user_id')::uuid IS NULL OR ml.admin_user_id = sqlc.narg('admin_user_id'))
  AND (sqlc.narg('action')::text IS NULL OR ml.action = sqlc.narg('action'))
  AND (sqlc.narg('target_type')::text IS NULL OR ml.target_type = sqlc.narg('target_type'))
  AND (sqlc.narg('target_id')::text IS NULL OR ml.target_id = sqlc.narg('target_id'));

-- name: GetUserModerationLogs :many
SELECT ml.id, ml.admin_user_id, ml.action, ml.target_type, ml.target_id, ml.details, ml.created_at,
       u.id as admin_id, u.username as admin_username, u.display_name as admin_display_name
FROM moderation_logs ml
LEFT JOIN users u ON ml.admin_user_id = u.id
WHERE ml.target_type = 'user' AND ml.target_id = $1
ORDER BY ml.created_at DESC
LIMIT $2 OFFSET $3;

-- ==================== User Mutes ====================

-- name: CreateUserMute :one
INSERT INTO user_mutes (user_id, mute_type, muted_by, reason, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, user_id, mute_type, muted_by, reason, expires_at, created_at;

-- name: GetUserMutes :many
SELECT id, user_id, mute_type, muted_by, reason, expires_at, created_at
FROM user_mutes
WHERE user_id = $1
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY created_at DESC;

-- name: GetUserMutesByType :many
SELECT id, user_id, mute_type, muted_by, reason, expires_at, created_at
FROM user_mutes
WHERE user_id = $1
  AND mute_type = $2
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY created_at DESC;

-- name: CheckUserMuted :one
SELECT EXISTS(
  SELECT 1 FROM user_mutes
  WHERE user_id = $1
    AND (mute_type = $2 OR mute_type = 'all')
    AND (expires_at IS NULL OR expires_at > NOW())
) AS is_muted;

-- name: DeleteUserMutes :exec
DELETE FROM user_mutes
WHERE user_id = $1;

-- name: DeleteUserMutesByType :exec
DELETE FROM user_mutes
WHERE user_id = $1 AND mute_type = $2;

-- name: CleanupExpiredMutes :exec
DELETE FROM user_mutes
WHERE expires_at IS NOT NULL AND expires_at <= NOW();

-- ==================== Reports ====================

-- name: CreateReport :one
INSERT INTO reports (reporter_user_id, target_type, target_id, reason, details)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, reporter_user_id, target_type, target_id, reason, details, status, 
          reviewed_by, reviewed_at, resolution, created_at, updated_at;

-- name: GetReport :one
SELECT r.id, r.reporter_user_id, r.target_type, r.target_id, r.reason, r.details, r.status,
       r.reviewed_by, r.reviewed_at, r.resolution, r.created_at, r.updated_at,
       u.id as reporter_id, u.username as reporter_username, u.display_name as reporter_display_name,
       ru.id as reviewer_id, ru.username as reviewer_username, ru.display_name as reviewer_display_name
FROM reports r
JOIN users u ON r.reporter_user_id = u.id
LEFT JOIN users ru ON r.reviewed_by = ru.id
WHERE r.id = $1;

-- name: ListReports :many
SELECT r.id, r.reporter_user_id, r.target_type, r.target_id, r.reason, r.details, r.status,
       r.reviewed_by, r.reviewed_at, r.resolution, r.created_at, r.updated_at,
       u.id as reporter_id, u.username as reporter_username, u.display_name as reporter_display_name
FROM reports r
JOIN users u ON r.reporter_user_id = u.id
WHERE (sqlc.narg('status')::text IS NULL OR r.status = sqlc.narg('status'))
  AND (sqlc.narg('target_type')::text IS NULL OR r.target_type = sqlc.narg('target_type'))
ORDER BY r.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountReports :one
SELECT COUNT(*)
FROM reports r
WHERE (sqlc.narg('status')::text IS NULL OR r.status = sqlc.narg('status'))
  AND (sqlc.narg('target_type')::text IS NULL OR r.target_type = sqlc.narg('target_type'));

-- name: UpdateReportStatus :one
UPDATE reports
SET status = $2, reviewed_by = $3, reviewed_at = NOW(), resolution = $4, updated_at = NOW()
WHERE id = $1
RETURNING id, reporter_user_id, target_type, target_id, reason, details, status,
          reviewed_by, reviewed_at, resolution, created_at, updated_at;

-- ==================== Banned Words ====================

-- name: CreateBannedWord :one
INSERT INTO banned_words (pattern, applies_to, severity, created_by)
VALUES ($1, $2, $3, $4)
RETURNING id, pattern, applies_to, severity, created_by, created_at;

-- name: ListBannedWords :many
SELECT id, pattern, applies_to, severity, created_by, created_at
FROM banned_words
WHERE (sqlc.narg('applies_to')::text IS NULL OR applies_to = sqlc.narg('applies_to') OR applies_to = 'all')
ORDER BY created_at DESC;

-- name: GetBannedWord :one
SELECT id, pattern, applies_to, severity, created_by, created_at
FROM banned_words
WHERE id = $1;

-- name: DeleteBannedWord :exec
DELETE FROM banned_words
WHERE id = $1;

-- ==================== Banned Image Hashes ====================

-- name: CreateBannedImageHash :one
INSERT INTO banned_image_hashes (hash, hash_type, reason, created_by)
VALUES ($1, $2, $3, $4)
RETURNING id, hash, hash_type, reason, created_by, created_at;

-- name: ListBannedImageHashes :many
SELECT id, hash, hash_type, reason, created_by, created_at
FROM banned_image_hashes
ORDER BY created_at DESC;

-- name: GetBannedImageHash :one
SELECT id, hash, hash_type, reason, created_by, created_at
FROM banned_image_hashes
WHERE id = $1;

-- name: CheckImageHashBanned :one
SELECT EXISTS(
  SELECT 1 FROM banned_image_hashes
  WHERE hash = $1 AND hash_type = $2
) AS is_banned;

-- name: DeleteBannedImageHash :exec
DELETE FROM banned_image_hashes
WHERE id = $1;

-- ==================== IP Bans ====================

-- name: CreateIPBan :one
INSERT INTO ip_bans (ip_address, reason, banned_by, expires_at)
VALUES ($1, $2, $3, $4)
RETURNING id, ip_address, reason, banned_by, expires_at, created_at;

-- name: ListIPBans :many
SELECT id, ip_address, reason, banned_by, expires_at, created_at
FROM ip_bans
WHERE (expires_at IS NULL OR expires_at > NOW())
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountIPBans :one
SELECT COUNT(*)
FROM ip_bans
WHERE (expires_at IS NULL OR expires_at > NOW());

-- name: CheckIPBanned :one
SELECT EXISTS(
  SELECT 1 FROM ip_bans
  WHERE ip_address = $1
    AND (expires_at IS NULL OR expires_at > NOW())
) AS is_banned;

-- name: DeleteIPBan :exec
DELETE FROM ip_bans
WHERE id = $1;

-- name: DeleteIPBanByAddress :exec
DELETE FROM ip_bans
WHERE ip_address = $1;

-- name: CleanupExpiredIPBans :exec
DELETE FROM ip_bans
WHERE expires_at IS NOT NULL AND expires_at <= NOW();

-- ==================== Admin User Search ====================

-- name: SearchUsers :many
SELECT id, username, display_name, bio, avatar_media_id, created_at,
       terms_version, privacy_version, terms_accepted_at, privacy_accepted_at
FROM users
WHERE (sqlc.narg('search')::text IS NULL 
       OR username ILIKE '%' || sqlc.narg('search') || '%'
       OR display_name ILIKE '%' || sqlc.narg('search') || '%')
ORDER BY 
  CASE WHEN sqlc.narg('sort')::text = 'created_asc' THEN created_at END ASC,
  CASE WHEN sqlc.narg('sort')::text = 'username_asc' THEN username END ASC,
  CASE WHEN sqlc.narg('sort')::text = 'username_desc' THEN username END DESC,
  created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountUsers :one
SELECT COUNT(*)
FROM users
WHERE (sqlc.narg('search')::text IS NULL 
       OR username ILIKE '%' || sqlc.narg('search') || '%'
       OR display_name ILIKE '%' || sqlc.narg('search') || '%');

-- name: GetUserStats :one
SELECT 
  (SELECT COUNT(*) FROM posts WHERE posts.user_id = $1 AND posts.deleted_at IS NULL) AS posts_count,
  (SELECT COUNT(*) FROM media WHERE media.user_id = $1 AND media.deleted_at IS NULL) AS media_count,
  (SELECT COUNT(*) FROM reports WHERE reports.reporter_user_id = $1) AS reports_count;

-- name: GetDashboardStats :one
SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL) AS total_posts,
  (SELECT COUNT(*) FROM media WHERE deleted_at IS NULL) AS total_media;

-- ==================== Admin Post Management ====================

-- name: AdminListPosts :many
SELECT p.id, p.user_id, p.content, p.created_at, p.deleted_at, p.visibility, 
       p.deleted_by, p.deletion_reason,
       u.id as author_id, u.username as author_username, u.display_name as author_display_name
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE (sqlc.narg('user_id')::uuid IS NULL OR p.user_id = sqlc.narg('user_id'))
  AND (sqlc.narg('visibility')::text IS NULL OR p.visibility = sqlc.narg('visibility'))
ORDER BY p.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountAdminPosts :one
SELECT COUNT(*)
FROM posts p
WHERE (sqlc.narg('user_id')::uuid IS NULL OR p.user_id = sqlc.narg('user_id'))
  AND (sqlc.narg('visibility')::text IS NULL OR p.visibility = sqlc.narg('visibility'));

-- name: AdminDeletePost :exec
UPDATE posts
SET deleted_at = NOW(), visibility = 'deleted', deleted_by = $2, deletion_reason = $3
WHERE id = $1;

-- name: HidePost :exec
UPDATE posts
SET visibility = 'hidden'
WHERE id = $1;

-- name: UnhidePost :exec
UPDATE posts
SET visibility = 'public'
WHERE id = $1;

-- ==================== Admin Media Management ====================

-- name: AdminListMedia :many
SELECT m.id, m.user_id, m.type, m.ext, m.width, m.height, m.created_at,
       m.deleted_at, m.deleted_by, m.deletion_reason, m.phash,
       u.id as uploader_id, u.username as uploader_username,
       (SELECT COUNT(*) FROM post_media WHERE media_id = m.id) as used_in_posts_count
FROM media m
JOIN users u ON m.user_id = u.id
WHERE (sqlc.narg('user_id')::uuid IS NULL OR m.user_id = sqlc.narg('user_id'))
  AND (sqlc.narg('deleted')::boolean IS NULL 
       OR (sqlc.narg('deleted') = true AND m.deleted_at IS NOT NULL)
       OR (sqlc.narg('deleted') = false AND m.deleted_at IS NULL))
ORDER BY m.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountAdminMedia :one
SELECT COUNT(*)
FROM media m
WHERE (sqlc.narg('user_id')::uuid IS NULL OR m.user_id = sqlc.narg('user_id'))
  AND (sqlc.narg('deleted')::boolean IS NULL 
       OR (sqlc.narg('deleted') = true AND m.deleted_at IS NOT NULL)
       OR (sqlc.narg('deleted') = false AND m.deleted_at IS NULL));

-- name: AdminDeleteMedia :exec
UPDATE media
SET deleted_at = NOW(), deleted_by = $2, deletion_reason = $3
WHERE id = $1;

-- ==================== Admin Profile Management ====================

-- name: AdminDeleteUserAvatar :exec
UPDATE users
SET avatar_media_id = NULL
WHERE id = $1;

-- name: AdminDeleteUserDisplayName :exec
UPDATE users
SET display_name = NULL
WHERE id = $1;

-- name: AdminDeleteUserBio :exec
UPDATE users
SET bio = NULL
WHERE id = $1;

-- =====================================================
-- Agreement Document Management Queries
-- =====================================================

-- -----------------------------------------------------
-- Create Agreement Document
-- -----------------------------------------------------
-- name: CreateAgreementDocument :one
INSERT INTO agreement_documents (
    document_type,
    language,
    version,
    status,
    title,
    content,
    created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- -----------------------------------------------------
-- Get Agreement Document by ID
-- -----------------------------------------------------
-- name: GetAgreementDocument :one
SELECT * FROM agreement_documents
WHERE id = $1;

-- -----------------------------------------------------
-- Get Agreement Document by Type, Version, and Language
-- -----------------------------------------------------
-- name: GetAgreementDocumentByTypeVersionLanguage :one
SELECT * FROM agreement_documents
WHERE document_type = $1
  AND version = $2
  AND language = $3
  AND status = 'published';

-- -----------------------------------------------------
-- Get Latest Published Agreement Document
-- -----------------------------------------------------
-- name: GetLatestAgreementDocument :one
SELECT * FROM agreement_documents
WHERE document_type = $1
  AND language = $2
  AND status = 'published'
ORDER BY version DESC, published_at DESC
LIMIT 1;

-- -----------------------------------------------------
-- List Agreement Documents (Admin)
-- Supports filtering by status, language, type
-- -----------------------------------------------------
-- name: ListAgreementDocuments :many
SELECT * FROM agreement_documents
WHERE (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'))
  AND (sqlc.narg('language')::text IS NULL OR language = sqlc.narg('language'))
  AND (sqlc.narg('document_type')::text IS NULL OR document_type = sqlc.narg('document_type'))
ORDER BY version DESC, created_at DESC
LIMIT $1 OFFSET $2;

-- -----------------------------------------------------
-- Count Agreement Documents (Admin)
-- For pagination support
-- -----------------------------------------------------
-- name: CountAgreementDocuments :one
SELECT COUNT(*) FROM agreement_documents
WHERE (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'))
  AND (sqlc.narg('language')::text IS NULL OR language = sqlc.narg('language'))
  AND (sqlc.narg('document_type')::text IS NULL OR document_type = sqlc.narg('document_type'));

-- -----------------------------------------------------
-- Update Agreement Document (Drafts Only)
-- -----------------------------------------------------
-- name: UpdateAgreementDocument :one
UPDATE agreement_documents
SET title = COALESCE(sqlc.narg('title'), title),
    content = COALESCE(sqlc.narg('content'), content),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
  AND status = 'draft'
RETURNING *;

-- -----------------------------------------------------
-- Publish Agreement Document
-- Changes status from draft to published
-- -----------------------------------------------------
-- name: PublishAgreementDocument :one
UPDATE agreement_documents
SET status = 'published',
    published_at = CURRENT_TIMESTAMP,
    published_by = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
  AND status = 'draft'
RETURNING *;

-- -----------------------------------------------------
-- Delete Agreement Document (Drafts Only)
-- -----------------------------------------------------
-- name: DeleteAgreementDocument :exec
DELETE FROM agreement_documents
WHERE id = $1
  AND status = 'draft';

-- -----------------------------------------------------
-- Get Agreement History
-- Lists all published versions for a specific type and language
-- -----------------------------------------------------
-- name: GetAgreementHistory :many
SELECT * FROM agreement_documents
WHERE document_type = $1
  AND language = $2
  AND status = 'published'
ORDER BY version DESC, published_at DESC;

-- -----------------------------------------------------
-- Get Agreement Document for Duplication
-- Used to copy an existing document to create a new draft
-- -----------------------------------------------------
-- name: GetAgreementDocumentForDuplication :one
SELECT id, document_type, language, version, title, content
FROM agreement_documents
WHERE id = $1;

-- -----------------------------------------------------
-- Check if Agreement Version Exists
-- Prevents duplicate version numbers for same type/language
-- -----------------------------------------------------
-- name: CheckAgreementVersionExists :one
SELECT EXISTS(
    SELECT 1 FROM agreement_documents
    WHERE document_type = $1
      AND language = $2
      AND version = $3
      AND status = 'published'
) AS exists;

-- -----------------------------------------------------
-- Get All Languages for Agreement Version
-- Gets all language variants of a specific version
-- -----------------------------------------------------
-- name: GetAgreementVersionLanguages :many
SELECT * FROM agreement_documents
WHERE document_type = $1
  AND version = $2
  AND status = 'published'
ORDER BY language;

-- -----------------------------------------------------
-- Get Latest Draft for Type and Language
-- Useful for checking if a draft already exists before creating a new one
-- -----------------------------------------------------
-- name: GetLatestDraftAgreement :one
SELECT * FROM agreement_documents
WHERE document_type = $1
  AND language = $2
  AND status = 'draft'
ORDER BY created_at DESC
LIMIT 1;

-- -----------------------------------------------------
-- Get Maximum Version Number
-- Used to determine the next version number when publishing
-- -----------------------------------------------------
-- name: GetMaxAgreementVersion :one
SELECT COALESCE(MAX(version), 0) AS max_version
FROM agreement_documents
WHERE document_type = $1
  AND status = 'published';

-- -----------------------------------------------------
-- Role Management Queries
-- -----------------------------------------------------

-- name: GetRoleByID :one
SELECT id, name, description
FROM roles
WHERE id = $1;

-- name: CreateRole :exec
INSERT INTO roles (id, name, description)
VALUES ($1, $2, $3);

-- name: UpdateRole :exec
UPDATE roles
SET name = COALESCE($2, name),
    description = COALESCE($3, description)
WHERE id = $1;

-- name: DeleteRole :exec
DELETE FROM roles
WHERE id = $1;

-- name: RoleExists :one
SELECT EXISTS(
  SELECT 1 FROM roles WHERE id = $1
) AS exists;

-- -----------------------------------------------------
-- Role Permissions Queries
-- -----------------------------------------------------

-- name: GetRolePermissions :many
SELECT permission_id, scope, effect
FROM role_permissions
WHERE role_id = $1
ORDER BY permission_id ASC, scope ASC;

-- name: DeleteRolePermissions :exec
DELETE FROM role_permissions
WHERE role_id = $1;

-- name: AddRolePermission :exec
INSERT INTO role_permissions (role_id, permission_id, scope, effect)
VALUES ($1, $2, $3, $4)
ON CONFLICT (role_id, permission_id, scope) DO UPDATE
SET effect = EXCLUDED.effect;

-- -----------------------------------------------------
-- Role Users Queries
-- -----------------------------------------------------

-- name: GetRoleUsers :many
SELECT u.id, u.username, u.display_name, u.avatar_media_id
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role_id = $1
ORDER BY u.username ASC
LIMIT $2 OFFSET $3;

-- name: CountRoleUsers :one
SELECT COUNT(*) AS total
FROM user_roles
WHERE role_id = $1;

-- -----------------------------------------------------
-- Admin Role Queries for Agreement Auto-Accept
-- -----------------------------------------------------

-- name: GetUsersWithAdminRole :many
-- Get all users who have the admin role
-- Used for auto-accepting agreements when published
SELECT u.id, u.username, u.terms_version, u.privacy_version
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role_id = 'admin';

-- name: BulkUpdateUserAgreementVersions :exec
-- Bulk update agreement versions for multiple users
-- Used to auto-accept agreements for admin users when published
UPDATE users
SET 
  terms_version = CASE 
    WHEN sqlc.narg('terms_version')::int IS NOT NULL 
    THEN sqlc.narg('terms_version')::int 
    ELSE terms_version 
  END,
  privacy_version = CASE 
    WHEN sqlc.narg('privacy_version')::int IS NOT NULL 
    THEN sqlc.narg('privacy_version')::int 
    ELSE privacy_version 
  END,
  terms_accepted_at = CASE 
    WHEN sqlc.narg('terms_version')::int IS NOT NULL 
    THEN COALESCE(sqlc.narg('accepted_at')::timestamptz, now())
    ELSE terms_accepted_at 
  END,
  privacy_accepted_at = CASE 
    WHEN sqlc.narg('privacy_version')::int IS NOT NULL 
    THEN COALESCE(sqlc.narg('accepted_at')::timestamptz, now())
    ELSE privacy_accepted_at 
  END
WHERE id = ANY(sqlc.arg('user_ids')::uuid[]);
