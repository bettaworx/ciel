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
  (SELECT COUNT(*) FROM posts WHERE user_id = $1 AND deleted_at IS NULL) AS posts_count,
  (SELECT COUNT(*) FROM media WHERE user_id = $1 AND deleted_at IS NULL) AS media_count,
  (SELECT COUNT(*) FROM reports WHERE reporter_user_id = $1) AS reports_count;

-- name: GetDashboardStats :one
SELECT
  (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_users,
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
