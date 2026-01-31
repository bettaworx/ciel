package handlers

import (
	"net/http"
	"time"

	"backend/internal/api"

	openapi_types "github.com/oapi-codegen/runtime/types"
)

// GetAgreementsTypeLatest handles GET /agreements/{type}/latest
func (h API) GetAgreementsTypeLatest(w http.ResponseWriter, r *http.Request, agreementType api.AgreementType, params api.GetAgreementsTypeLatestParams) {
	var language string
	if params.Language != nil {
		language = string(*params.Language)
	} else {
		language = "en" // Default to English
	}

	// Get agreement history to find latest published document
	history, err := h.AdminAgreements.GetAgreementHistory(r.Context(), string(agreementType), language)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Find the latest published document
	var latestPublished *api.AgreementDocument
	for _, doc := range history {
		if doc.Status == "published" {
			if latestPublished == nil || doc.Version > int32(latestPublished.Version) {
				var publishedAt *time.Time
				if doc.PublishedAt.Valid {
					publishedAt = &doc.PublishedAt.Time
				}

				var publishedBy *openapi_types.UUID
				if doc.PublishedBy.Valid {
					publishedBy = (*openapi_types.UUID)(&doc.PublishedBy.UUID)
				}

				latestPublished = &api.AgreementDocument{
					Id:          openapi_types.UUID(doc.ID),
					Type:        api.AgreementType(doc.DocumentType),
					Language:    api.AgreementLanguage(doc.Language),
					Version:     int(doc.Version),
					Title:       doc.Title,
					Content:     doc.Content,
					Status:      api.AgreementDocumentStatus(doc.Status),
					PublishedAt: publishedAt,
					PublishedBy: publishedBy,
					CreatedBy:   openapi_types.UUID(doc.CreatedBy),
					CreatedAt:   doc.CreatedAt,
					UpdatedAt:   doc.UpdatedAt,
				}
			}
		}
	}

	if latestPublished == nil {
		writeJSON(w, http.StatusNotFound, api.Error{Code: "not_found", Message: "No published agreement found"})
		return
	}

	writeJSON(w, http.StatusOK, latestPublished)
}

// GetAgreementsTypeVersion handles GET /agreements/{type}/{version}
func (h API) GetAgreementsTypeVersion(w http.ResponseWriter, r *http.Request, agreementType api.AgreementType, version int, params api.GetAgreementsTypeVersionParams) {
	var language string
	if params.Language != nil {
		language = string(*params.Language)
	} else {
		language = "en" // Default to English
	}

	// Get agreement history
	history, err := h.AdminAgreements.GetAgreementHistory(r.Context(), string(agreementType), language)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Find the document with the specified version that is published
	for _, doc := range history {
		if doc.Version == int32(version) && doc.Status == "published" {
			var publishedAt *time.Time
			if doc.PublishedAt.Valid {
				publishedAt = &doc.PublishedAt.Time
			}

			var publishedBy *openapi_types.UUID
			if doc.PublishedBy.Valid {
				publishedBy = (*openapi_types.UUID)(&doc.PublishedBy.UUID)
			}

			response := api.AgreementDocument{
				Id:          openapi_types.UUID(doc.ID),
				Type:        api.AgreementType(doc.DocumentType),
				Language:    api.AgreementLanguage(doc.Language),
				Version:     int(doc.Version),
				Title:       doc.Title,
				Content:     doc.Content,
				Status:      api.AgreementDocumentStatus(doc.Status),
				PublishedAt: publishedAt,
				PublishedBy: publishedBy,
				CreatedBy:   openapi_types.UUID(doc.CreatedBy),
				CreatedAt:   doc.CreatedAt,
				UpdatedAt:   doc.UpdatedAt,
			}

			writeJSON(w, http.StatusOK, response)
			return
		}
	}

	writeJSON(w, http.StatusNotFound, api.Error{Code: "not_found", Message: "Agreement version not found or not published"})
}
