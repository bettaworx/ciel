package handlers

import (
	"net/http"

	"backend/internal/api"
	"backend/internal/auth"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// ===== Admin Profile Management =====

// DeleteAdminUsersUserIdAvatar deletes user's avatar
func (h API) DeleteAdminUsersUserIdAvatar(w http.ResponseWriter, r *http.Request, userId openapi_types.UUID) {
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

	if err := h.AdminProfile.DeleteUserAvatar(r.Context(), uuid.UUID(userId), user.ID, ""); err != nil {
		writeServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DeleteAdminUsersUserIdDisplayName deletes user's display name
func (h API) DeleteAdminUsersUserIdDisplayName(w http.ResponseWriter, r *http.Request, userId openapi_types.UUID) {
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

	if err := h.AdminProfile.DeleteUserDisplayName(r.Context(), uuid.UUID(userId), user.ID, ""); err != nil {
		writeServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DeleteAdminUsersUserIdBio deletes user's bio
func (h API) DeleteAdminUsersUserIdBio(w http.ResponseWriter, r *http.Request, userId openapi_types.UUID) {
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

	if err := h.AdminProfile.DeleteUserBio(r.Context(), uuid.UUID(userId), user.ID, ""); err != nil {
		writeServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
