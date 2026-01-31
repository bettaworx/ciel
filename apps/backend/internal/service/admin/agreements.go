package admin

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"

	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

// AgreementsService handles admin agreement document management
type AgreementsService struct {
	store *repository.Store
}

// NewAgreementsService creates a new AgreementsService
func NewAgreementsService(store *repository.Store) *AgreementsService {
	return &AgreementsService{
		store: store,
	}
}

// CreateAgreementDocumentParams contains parameters for creating an agreement document
type CreateAgreementDocumentParams struct {
	DocumentType string
	Language     string
	Version      int32
	Title        string
	Content      string
	Status       string
	CreatedBy    uuid.UUID
}

// CreateAgreementDocument creates a new agreement document (draft)
func (s *AgreementsService) CreateAgreementDocument(ctx context.Context, params CreateAgreementDocumentParams) (sqlc.AgreementDocument, error) {
	doc, err := s.store.Q.CreateAgreementDocument(ctx, sqlc.CreateAgreementDocumentParams{
		DocumentType: params.DocumentType,
		Language:     params.Language,
		Version:      params.Version,
		Status:       params.Status,
		Title:        params.Title,
		Content:      params.Content,
		CreatedBy:    params.CreatedBy,
	})
	if err != nil {
		return sqlc.AgreementDocument{}, fmt.Errorf("failed to create agreement document: %w", err)
	}

	return doc, nil
}

// GetAgreementDocument retrieves an agreement document by ID
func (s *AgreementsService) GetAgreementDocument(ctx context.Context, id uuid.UUID) (sqlc.AgreementDocument, error) {
	doc, err := s.store.Q.GetAgreementDocument(ctx, id)
	if err != nil {
		return sqlc.AgreementDocument{}, fmt.Errorf("failed to get agreement document: %w", err)
	}

	return doc, nil
}

// ListAgreementDocumentsParams contains parameters for listing agreement documents
type ListAgreementDocumentsParams struct {
	Status       *string
	Language     *string
	DocumentType *string
	Limit        int32
	Offset       int32
}

// ListAgreementDocumentsResult contains agreement documents with pagination info
type ListAgreementDocumentsResult struct {
	Documents []sqlc.AgreementDocument
	Total     int64
}

// ListAgreementDocuments lists agreement documents with filtering
func (s *AgreementsService) ListAgreementDocuments(ctx context.Context, params ListAgreementDocumentsParams) (ListAgreementDocumentsResult, error) {
	// Prepare nullable parameters
	var status sql.NullString
	if params.Status != nil {
		status = sql.NullString{String: *params.Status, Valid: true}
	}

	var language sql.NullString
	if params.Language != nil {
		language = sql.NullString{String: *params.Language, Valid: true}
	}

	var documentType sql.NullString
	if params.DocumentType != nil {
		documentType = sql.NullString{String: *params.DocumentType, Valid: true}
	}

	// Get documents
	docs, err := s.store.Q.ListAgreementDocuments(ctx, sqlc.ListAgreementDocumentsParams{
		Status:       status,
		Language:     language,
		DocumentType: documentType,
		Limit:        params.Limit,
		Offset:       params.Offset,
	})
	if err != nil {
		return ListAgreementDocumentsResult{}, fmt.Errorf("failed to list agreement documents: %w", err)
	}

	// Get total count
	total, err := s.store.Q.CountAgreementDocuments(ctx, sqlc.CountAgreementDocumentsParams{
		Status:       status,
		Language:     language,
		DocumentType: documentType,
	})
	if err != nil {
		return ListAgreementDocumentsResult{}, fmt.Errorf("failed to count agreement documents: %w", err)
	}

	return ListAgreementDocumentsResult{
		Documents: docs,
		Total:     total,
	}, nil
}

// UpdateAgreementDocumentParams contains parameters for updating an agreement document
type UpdateAgreementDocumentParams struct {
	ID      uuid.UUID
	Title   *string
	Content *string
}

// UpdateAgreementDocument updates a draft agreement document
func (s *AgreementsService) UpdateAgreementDocument(ctx context.Context, params UpdateAgreementDocumentParams) (sqlc.AgreementDocument, error) {
	// Prepare nullable parameters
	var title sql.NullString
	if params.Title != nil {
		title = sql.NullString{String: *params.Title, Valid: true}
	}

	var content sql.NullString
	if params.Content != nil {
		content = sql.NullString{String: *params.Content, Valid: true}
	}

	doc, err := s.store.Q.UpdateAgreementDocument(ctx, sqlc.UpdateAgreementDocumentParams{
		ID:      params.ID,
		Title:   title,
		Content: content,
	})
	if err != nil {
		return sqlc.AgreementDocument{}, fmt.Errorf("failed to update agreement document: %w", err)
	}

	return doc, nil
}

// PublishAgreementDocument publishes a draft agreement document
// Also updates server_settings to reflect the new current version
// All admin users automatically accept the new agreement version
// Uses a transaction to ensure all operations succeed or fail together
func (s *AgreementsService) PublishAgreementDocument(ctx context.Context, id, publishedBy uuid.UUID) (sqlc.AgreementDocument, error) {
	var doc sqlc.AgreementDocument

	// Use transaction to ensure atomicity
	err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		// Step 1: Publish the document
		var err error
		doc, err = q.PublishAgreementDocument(ctx, sqlc.PublishAgreementDocumentParams{
			ID:          id,
			PublishedBy: uuid.NullUUID{UUID: publishedBy, Valid: true},
		})
		if err != nil {
			return fmt.Errorf("failed to publish agreement document: %w", err)
		}

		slog.Info("Agreement document published",
			"document_id", id,
			"document_type", doc.DocumentType,
			"version", doc.Version,
			"language", doc.Language,
			"published_by", publishedBy)

		// Step 2: Update server_settings to reflect the new current version
		updateParams := sqlc.UpdateAgreementVersionsParams{}
		if doc.DocumentType == "terms" {
			updateParams.TermsVersion = sql.NullInt32{Int32: doc.Version, Valid: true}
		} else if doc.DocumentType == "privacy" {
			updateParams.PrivacyVersion = sql.NullInt32{Int32: doc.Version, Valid: true}
		}

		result, err := q.UpdateAgreementVersions(ctx, updateParams)
		if err != nil {
			return fmt.Errorf("failed to update agreement versions in settings: %w", err)
		}

		slog.Info("Server settings updated",
			"document_type", doc.DocumentType,
			"new_version", doc.Version,
			"current_terms_version", result.TermsVersion,
			"current_privacy_version", result.PrivacyVersion)

		// Step 3: Auto-accept for all admin users
		adminUsers, err := q.GetUsersWithAdminRole(ctx)
		if err != nil {
			return fmt.Errorf("failed to get admin users: %w", err)
		}

		if len(adminUsers) > 0 {
			adminUserIDs := make([]uuid.UUID, len(adminUsers))
			for i, u := range adminUsers {
				adminUserIDs[i] = u.ID
			}

			// Prepare bulk update parameters
			bulkParams := sqlc.BulkUpdateUserAgreementVersionsParams{
				UserIds:    adminUserIDs,
				AcceptedAt: sql.NullTime{Time: doc.PublishedAt.Time, Valid: true},
			}

			if doc.DocumentType == "terms" {
				bulkParams.TermsVersion = sql.NullInt32{Int32: doc.Version, Valid: true}
			} else if doc.DocumentType == "privacy" {
				bulkParams.PrivacyVersion = sql.NullInt32{Int32: doc.Version, Valid: true}
			}

			err = q.BulkUpdateUserAgreementVersions(ctx, bulkParams)
			if err != nil {
				return fmt.Errorf("failed to auto-accept agreement for admin users: %w", err)
			}

			slog.Info("Auto-accepted agreement for admin users",
				"document_type", doc.DocumentType,
				"version", doc.Version,
				"admin_count", len(adminUsers))
		}

		return nil
	})

	if err != nil {
		slog.Error("Failed to publish agreement document", "error", err, "document_id", id)
		return sqlc.AgreementDocument{}, err
	}

	return doc, nil
}

// DeleteAgreementDocument deletes a draft agreement document
func (s *AgreementsService) DeleteAgreementDocument(ctx context.Context, id uuid.UUID) error {
	err := s.store.Q.DeleteAgreementDocument(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete agreement document: %w", err)
	}

	return nil
}

// GetAgreementHistory retrieves all published versions of an agreement
func (s *AgreementsService) GetAgreementHistory(ctx context.Context, documentType, language string) ([]sqlc.AgreementDocument, error) {
	docs, err := s.store.Q.GetAgreementHistory(ctx, sqlc.GetAgreementHistoryParams{
		DocumentType: documentType,
		Language:     language,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get agreement history: %w", err)
	}

	return docs, nil
}

// DuplicateAgreementDocument creates a new draft by copying an existing document
func (s *AgreementsService) DuplicateAgreementDocument(ctx context.Context, sourceID, createdBy uuid.UUID, newVersion int32) (sqlc.AgreementDocument, error) {
	// Get source document
	source, err := s.store.Q.GetAgreementDocumentForDuplication(ctx, sourceID)
	if err != nil {
		return sqlc.AgreementDocument{}, fmt.Errorf("failed to get source document: %w", err)
	}

	// Create new draft document with incremented version
	doc, err := s.CreateAgreementDocument(ctx, CreateAgreementDocumentParams{
		DocumentType: source.DocumentType,
		Language:     source.Language,
		Version:      newVersion,
		Title:        source.Title,
		Content:      source.Content,
		Status:       "draft",
		CreatedBy:    createdBy,
	})
	if err != nil {
		return sqlc.AgreementDocument{}, fmt.Errorf("failed to create duplicate document: %w", err)
	}

	return doc, nil
}

// GetMaxVersion returns the highest version number for a document type
func (s *AgreementsService) GetMaxVersion(ctx context.Context, documentType string) (int32, error) {
	maxVersion, err := s.store.Q.GetMaxAgreementVersion(ctx, documentType)
	if err != nil {
		return 0, fmt.Errorf("failed to get max version: %w", err)
	}

	// Type assert to int32 or int64 (COALESCE returns integer)
	switch v := maxVersion.(type) {
	case int32:
		return v, nil
	case int64:
		return int32(v), nil
	case nil:
		return 0, nil
	default:
		return 0, fmt.Errorf("unexpected type for max version: %T", v)
	}
}

// CheckVersionExists checks if a specific version already exists
func (s *AgreementsService) CheckVersionExists(ctx context.Context, documentType, language string, version int32) (bool, error) {
	exists, err := s.store.Q.CheckAgreementVersionExists(ctx, sqlc.CheckAgreementVersionExistsParams{
		DocumentType: documentType,
		Language:     language,
		Version:      version,
	})
	if err != nil {
		return false, fmt.Errorf("failed to check version exists: %w", err)
	}

	return exists, nil
}

// GetLatestDraft returns the latest draft for a document type and language
func (s *AgreementsService) GetLatestDraft(ctx context.Context, documentType, language string) (sqlc.AgreementDocument, error) {
	doc, err := s.store.Q.GetLatestDraftAgreement(ctx, sqlc.GetLatestDraftAgreementParams{
		DocumentType: documentType,
		Language:     language,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return sqlc.AgreementDocument{}, nil
		}
		return sqlc.AgreementDocument{}, fmt.Errorf("failed to get latest draft: %w", err)
	}

	return doc, nil
}

// GetVersionLanguages returns all language variants of a specific version
func (s *AgreementsService) GetVersionLanguages(ctx context.Context, documentType string, version int32) ([]sqlc.AgreementDocument, error) {
	docs, err := s.store.Q.GetAgreementVersionLanguages(ctx, sqlc.GetAgreementVersionLanguagesParams{
		DocumentType: documentType,
		Version:      version,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get version languages: %w", err)
	}

	return docs, nil
}
