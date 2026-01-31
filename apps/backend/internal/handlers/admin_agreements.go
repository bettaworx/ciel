package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/service/admin"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// GetAdminAgreementsDocuments handles GET /admin/agreements/documents
func (h API) GetAdminAgreementsDocuments(w http.ResponseWriter, r *http.Request, params api.GetAdminAgreementsDocumentsParams) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:agreements:manage"); err != nil {
		writeServiceError(w, err)
		return
	}

	var docType *string
	if params.Type != nil {
		t := string(*params.Type)
		docType = &t
	}

	var language *string
	if params.Language != nil {
		l := string(*params.Language)
		language = &l
	}

	var status *string
	if params.Status != nil {
		s := string(*params.Status)
		status = &s
	}

	limit := int32(20)
	if params.Limit != nil {
		limit = int32(*params.Limit)
	}

	offset := int32(0)
	if params.Offset != nil {
		offset = int32(*params.Offset)
	}

	result, err := h.AdminAgreements.ListAgreementDocuments(r.Context(), admin.ListAgreementDocumentsParams{
		DocumentType: docType,
		Language:     language,
		Status:       status,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	items := make([]api.AgreementDocument, len(result.Documents))
	for i, doc := range result.Documents {
		var publishedAt *time.Time
		if doc.PublishedAt.Valid {
			publishedAt = &doc.PublishedAt.Time
		}

		var publishedBy *openapi_types.UUID
		if doc.PublishedBy.Valid {
			publishedBy = (*openapi_types.UUID)(&doc.PublishedBy.UUID)
		}

		items[i] = api.AgreementDocument{
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

	response := api.AgreementDocumentPage{
		Items: items,
		Total: int(result.Total),
	}

	writeJSON(w, http.StatusOK, response)
}

// PostAdminAgreementsDocuments handles POST /admin/agreements/documents
func (h API) PostAdminAgreementsDocuments(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:agreements:manage"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.PostAdminAgreementsDocumentsJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	doc, err := h.AdminAgreements.CreateAgreementDocument(r.Context(), admin.CreateAgreementDocumentParams{
		DocumentType: string(req.Type),
		Language:     string(req.Language),
		Version:      int32(req.Version),
		Title:        req.Title,
		Content:      req.Content,
		Status:       "draft",
		CreatedBy:    uuid.UUID(user.ID),
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}

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

	writeJSON(w, http.StatusCreated, response)
}

// GetAdminAgreementsDocumentsHistory handles GET /admin/agreements/documents/history
func (h API) GetAdminAgreementsDocumentsHistory(w http.ResponseWriter, r *http.Request, params api.GetAdminAgreementsDocumentsHistoryParams) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:agreements:manage"); err != nil {
		writeServiceError(w, err)
		return
	}

	history, err := h.AdminAgreements.GetAgreementHistory(r.Context(), string(params.Type), string(params.Language))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	response := make([]api.AgreementDocument, len(history))
	for i, doc := range history {
		var publishedAt *time.Time
		if doc.PublishedAt.Valid {
			publishedAt = &doc.PublishedAt.Time
		}

		var publishedBy *openapi_types.UUID
		if doc.PublishedBy.Valid {
			publishedBy = (*openapi_types.UUID)(&doc.PublishedBy.UUID)
		}

		response[i] = api.AgreementDocument{
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

	writeJSON(w, http.StatusOK, response)
}

// DeleteAdminAgreementsDocumentsDocumentId handles DELETE /admin/agreements/documents/{documentId}
func (h API) DeleteAdminAgreementsDocumentsDocumentId(w http.ResponseWriter, r *http.Request, documentId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:agreements:manage"); err != nil {
		writeServiceError(w, err)
		return
	}

	if err := h.AdminAgreements.DeleteAgreementDocument(r.Context(), uuid.UUID(documentId)); err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Agreement document deleted successfully"})
}

// GetAdminAgreementsDocumentsDocumentId handles GET /admin/agreements/documents/{documentId}
func (h API) GetAdminAgreementsDocumentsDocumentId(w http.ResponseWriter, r *http.Request, documentId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:agreements:manage"); err != nil {
		writeServiceError(w, err)
		return
	}

	doc, err := h.AdminAgreements.GetAgreementDocument(r.Context(), uuid.UUID(documentId))
	if err != nil {
		writeServiceError(w, err)
		return
	}

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
}

// PatchAdminAgreementsDocumentsDocumentId handles PATCH /admin/agreements/documents/{documentId}
func (h API) PatchAdminAgreementsDocumentsDocumentId(w http.ResponseWriter, r *http.Request, documentId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:agreements:manage"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.PatchAdminAgreementsDocumentsDocumentIdJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	if _, err := h.AdminAgreements.UpdateAgreementDocument(r.Context(), admin.UpdateAgreementDocumentParams{
		ID:      uuid.UUID(documentId),
		Title:   req.Title,
		Content: req.Content,
	}); err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Agreement document updated successfully"})
}

// PostAdminAgreementsDocumentsDocumentIdDuplicate handles POST /admin/agreements/documents/{documentId}/duplicate
func (h API) PostAdminAgreementsDocumentsDocumentIdDuplicate(w http.ResponseWriter, r *http.Request, documentId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:agreements:manage"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.PostAdminAgreementsDocumentsDocumentIdDuplicateJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	doc, err := h.AdminAgreements.DuplicateAgreementDocument(r.Context(), uuid.UUID(documentId), uuid.UUID(user.ID), int32(req.NewVersion))
	if err != nil {
		writeServiceError(w, err)
		return
	}

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

	writeJSON(w, http.StatusCreated, response)
}

// PostAdminAgreementsDocumentsDocumentIdPublish handles POST /admin/agreements/documents/{documentId}/publish
func (h API) PostAdminAgreementsDocumentsDocumentIdPublish(w http.ResponseWriter, r *http.Request, documentId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:agreements:manage"); err != nil {
		writeServiceError(w, err)
		return
	}

	if _, err := h.AdminAgreements.PublishAgreementDocument(r.Context(), uuid.UUID(documentId), uuid.UUID(user.ID)); err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Agreement document published successfully"})
}
