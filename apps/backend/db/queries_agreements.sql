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
  AND (sqlc.narg('type')::text IS NULL OR document_type = sqlc.narg('document_type'))
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
  AND (sqlc.narg('type')::text IS NULL OR document_type = sqlc.narg('document_type'));

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
