package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/service/moderation"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// GetAdminBannedWords handles GET /admin/banned-words
func (h API) GetAdminBannedWords(w http.ResponseWriter, r *http.Request, params api.GetAdminBannedWordsParams) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_banned_content"); err != nil {
		writeServiceError(w, err)
		return
	}

	var appliesTo *string
	if params.AppliesTo != nil {
		s := string(*params.AppliesTo)
		appliesTo = &s
	}

	words, err := h.ModBannedContent.ListBannedWords(r.Context(), appliesTo)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	response := make([]api.BannedWord, len(words))
	for i, word := range words {
		response[i] = api.BannedWord{
			Id:        openapi_types.UUID(word.ID),
			Pattern:   word.Pattern,
			AppliesTo: api.BannedWordAppliesTo(word.AppliesTo),
			Severity:  api.BannedWordSeverity(word.Severity),
			CreatedBy: openapi_types.UUID(word.CreatedBy),
			CreatedAt: word.CreatedAt,
		}
	}

	writeJSON(w, http.StatusOK, response)
}

// PostAdminBannedWords handles POST /admin/banned-words
func (h API) PostAdminBannedWords(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_banned_content"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.PostAdminBannedWordsJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	word, err := h.ModBannedContent.CreateBannedWord(r.Context(), moderation.CreateBannedWordParams{
		Pattern:   req.Pattern,
		AppliesTo: string(req.AppliesTo),
		Severity:  string(req.Severity),
		CreatedBy: uuid.UUID(user.ID),
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}

	response := api.BannedWord{
		Id:        openapi_types.UUID(word.ID),
		Pattern:   word.Pattern,
		AppliesTo: api.BannedWordAppliesTo(word.AppliesTo),
		Severity:  api.BannedWordSeverity(word.Severity),
		CreatedBy: openapi_types.UUID(word.CreatedBy),
		CreatedAt: word.CreatedAt,
	}

	writeJSON(w, http.StatusCreated, response)
}

// GetAdminBannedWordsWordId handles GET /admin/banned-words/{wordId}
func (h API) GetAdminBannedWordsWordId(w http.ResponseWriter, r *http.Request, wordId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_banned_content"); err != nil {
		writeServiceError(w, err)
		return
	}

	word, err := h.ModBannedContent.GetBannedWord(r.Context(), uuid.UUID(wordId))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	response := api.BannedWord{
		Id:        openapi_types.UUID(word.ID),
		Pattern:   word.Pattern,
		AppliesTo: api.BannedWordAppliesTo(word.AppliesTo),
		Severity:  api.BannedWordSeverity(word.Severity),
		CreatedBy: openapi_types.UUID(word.CreatedBy),
		CreatedAt: word.CreatedAt,
	}

	writeJSON(w, http.StatusOK, response)
}

// DeleteAdminBannedWordsWordId handles DELETE /admin/banned-words/{wordId}
func (h API) DeleteAdminBannedWordsWordId(w http.ResponseWriter, r *http.Request, wordId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_banned_content"); err != nil {
		writeServiceError(w, err)
		return
	}

	if err := h.ModBannedContent.DeleteBannedWord(r.Context(), uuid.UUID(wordId), uuid.UUID(user.ID)); err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Banned word deleted successfully"})
}

// GetAdminBannedImages handles GET /admin/banned-images
func (h API) GetAdminBannedImages(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_banned_content"); err != nil {
		writeServiceError(w, err)
		return
	}

	hashes, err := h.ModBannedContent.ListBannedImageHashes(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	response := make([]api.BannedImageHash, len(hashes))
	for i, hash := range hashes {
		var reason *string
		if hash.Reason.Valid {
			reason = &hash.Reason.String
		}

		response[i] = api.BannedImageHash{
			Id:        openapi_types.UUID(hash.ID),
			Hash:      hash.Hash,
			HashType:  api.ImageHashType(hash.HashType),
			Reason:    reason,
			CreatedBy: openapi_types.UUID(hash.CreatedBy),
			CreatedAt: hash.CreatedAt,
		}
	}

	writeJSON(w, http.StatusOK, response)
}

// PostAdminBannedImages handles POST /admin/banned-images
func (h API) PostAdminBannedImages(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_banned_content"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.PostAdminBannedImagesJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	reason := ""
	if req.Reason != nil {
		reason = *req.Reason
	}

	hash, err := h.ModBannedContent.CreateBannedImageHash(r.Context(), moderation.CreateBannedImageHashParams{
		Hash:      req.Hash,
		HashType:  string(req.HashType),
		Reason:    reason,
		CreatedBy: uuid.UUID(user.ID),
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}

	var respReason *string
	if hash.Reason.Valid {
		respReason = &hash.Reason.String
	}

	response := api.BannedImageHash{
		Id:        openapi_types.UUID(hash.ID),
		Hash:      hash.Hash,
		HashType:  api.ImageHashType(hash.HashType),
		Reason:    respReason,
		CreatedBy: openapi_types.UUID(hash.CreatedBy),
		CreatedAt: hash.CreatedAt,
	}

	writeJSON(w, http.StatusCreated, response)
}

// GetAdminBannedImagesHashId handles GET /admin/banned-images/{hashId}
func (h API) GetAdminBannedImagesHashId(w http.ResponseWriter, r *http.Request, hashId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_banned_content"); err != nil {
		writeServiceError(w, err)
		return
	}

	hash, err := h.ModBannedContent.GetBannedImageHash(r.Context(), uuid.UUID(hashId))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	var reason *string
	if hash.Reason.Valid {
		reason = &hash.Reason.String
	}

	response := api.BannedImageHash{
		Id:        openapi_types.UUID(hash.ID),
		Hash:      hash.Hash,
		HashType:  api.ImageHashType(hash.HashType),
		Reason:    reason,
		CreatedBy: openapi_types.UUID(hash.CreatedBy),
		CreatedAt: hash.CreatedAt,
	}

	writeJSON(w, http.StatusOK, response)
}

// DeleteAdminBannedImagesHashId handles DELETE /admin/banned-images/{hashId}
func (h API) DeleteAdminBannedImagesHashId(w http.ResponseWriter, r *http.Request, hashId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_banned_content"); err != nil {
		writeServiceError(w, err)
		return
	}

	if err := h.ModBannedContent.DeleteBannedImageHash(r.Context(), uuid.UUID(hashId), uuid.UUID(user.ID)); err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Banned image hash deleted successfully"})
}
