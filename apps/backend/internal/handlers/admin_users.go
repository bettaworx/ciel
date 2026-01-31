package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/service/admin"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// ===== Admin User Management =====

// GetAdminUsers searches users
func (h API) GetAdminUsers(w http.ResponseWriter, r *http.Request, params api.GetAdminUsersParams) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "authentication required"})
		return
	}

	// Check admin permission
	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:users:read"); err != nil {
		writeServiceError(w, err)
		return
	}

	// Parse pagination
	limit := int32(20)
	if params.Limit != nil {
		limit = int32(*params.Limit)
	}
	offset := int32(0)
	if params.Offset != nil {
		offset = int32(*params.Offset)
	}

	// Search users
	var sort *string
	if params.Sort != nil {
		s := string(*params.Sort)
		sort = &s
	}

	result, err := h.AdminUsers.SearchUsers(r.Context(), admin.SearchUsersParams{
		Search: stringPtrValue(params.Search),
		Sort:   sort,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	users := make([]api.AdminUser, len(result.Users))
	for i, u := range result.Users {
		users[i] = api.AdminUser{
			Id:          openapi_types.UUID(u.ID),
			Username:    u.Username,
			DisplayName: stringToPtr(u.DisplayName),
			CreatedAt:   u.CreatedAt,
		}
	}

	writeJSON(w, http.StatusOK, api.AdminUserPage{
		Items: users,
		Total: int(result.Total),
	})
}

// GetAdminUsersUserIdStats gets user statistics
func (h API) GetAdminUsersUserIdStats(w http.ResponseWriter, r *http.Request, userId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "authentication required"})
		return
	}

	// Check admin permission
	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:users:read"); err != nil {
		writeServiceError(w, err)
		return
	}

	stats, err := h.AdminUsers.GetUserStats(r.Context(), uuid.UUID(userId))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, api.UserStats{
		PostsCount:   int(stats.PostsCount),
		MediaCount:   int(stats.MediaCount),
		ReportsCount: int(stats.ReportsCount),
	})
}

// ===== Admin User Notes =====

// GetAdminUsersUserIdNote gets admin note for a user
func (h API) GetAdminUsersUserIdNote(w http.ResponseWriter, r *http.Request, userId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "authentication required"})
		return
	}

	// Check admin permission
	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:users:read"); err != nil {
		writeServiceError(w, err)
		return
	}

	note, err := h.AdminUsers.GetAdminUserNote(r.Context(), uuid.UUID(userId))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// If no note exists, return empty
	if note.ID == uuid.Nil {
		writeJSON(w, http.StatusNotFound, api.Error{Code: "not_found", Message: "Admin note not found"})
		return
	}

	var updatedBy *openapi_types.UUID
	if note.UpdatedBy != note.CreatedBy {
		uid := openapi_types.UUID(note.UpdatedBy)
		updatedBy = &uid
	}

	writeJSON(w, http.StatusOK, api.AdminUserNote{
		Id:        openapi_types.UUID(note.ID),
		UserId:    openapi_types.UUID(note.UserID),
		Content:   note.Content,
		CreatedAt: note.CreatedAt,
		UpdatedAt: note.UpdatedAt,
		CreatedBy: openapi_types.UUID(note.CreatedBy),
		UpdatedBy: updatedBy,
	})
}

// PutAdminUsersUserIdNote creates or updates admin note
func (h API) PutAdminUsersUserIdNote(w http.ResponseWriter, r *http.Request, userId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "authentication required"})
		return
	}

	// Check admin permission
	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:users:write"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.PutAdminUsersUserIdNoteJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid request body"})
		return
	}

	// Check if note exists
	existing, err := h.AdminUsers.GetAdminUserNote(r.Context(), uuid.UUID(userId))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	if existing.ID == uuid.Nil {
		// Create new note
		_, err = h.AdminUsers.CreateAdminUserNote(r.Context(), admin.CreateAdminUserNoteParams{
			UserID:    uuid.UUID(userId),
			Content:   req.Content,
			CreatedBy: user.ID,
		})
	} else {
		// Update existing note
		_, err = h.AdminUsers.UpdateAdminUserNote(r.Context(), admin.UpdateAdminUserNoteParams{
			UserID:    uuid.UUID(userId),
			Content:   req.Content,
			UpdatedBy: user.ID,
		})
	}

	if err != nil {
		writeServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DeleteAdminUsersUserIdNote deletes admin note
func (h API) DeleteAdminUsersUserIdNote(w http.ResponseWriter, r *http.Request, userId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "authentication required"})
		return
	}

	// Check admin permission
	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:users:write"); err != nil {
		writeServiceError(w, err)
		return
	}

	if err := h.AdminUsers.DeleteAdminUserNote(r.Context(), uuid.UUID(userId)); err != nil {
		writeServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Helper function
func stringPtrValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func stringToPtr(s sql.NullString) *string {
	if !s.Valid {
		return nil
	}
	return &s.String
}
