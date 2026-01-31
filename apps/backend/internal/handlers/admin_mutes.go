package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/service/moderation"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// GetAdminUsersUserIdMutes handles GET /admin/users/{userId}/mutes
func (h API) GetAdminUsersUserIdMutes(w http.ResponseWriter, r *http.Request, userId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_mutes"); err != nil {
		writeServiceError(w, err)
		return
	}

	mutes, err := h.ModMutes.GetUserMutes(r.Context(), userId)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	response := make([]api.UserMute, len(mutes))
	for i, mute := range mutes {
		var expiresAt *time.Time
		if mute.ExpiresAt.Valid {
			expiresAt = &mute.ExpiresAt.Time
		}

		var reason *string
		if mute.Reason.Valid {
			reason = &mute.Reason.String
		}

		response[i] = api.UserMute{
			UserId:    mute.UserID,
			MuteType:  api.MuteType(mute.MuteType),
			Reason:    reason,
			ExpiresAt: expiresAt,
			CreatedAt: mute.CreatedAt,
		}
	}

	writeJSON(w, http.StatusOK, response)
}

// PostAdminUsersUserIdMutes handles POST /admin/users/{userId}/mutes
func (h API) PostAdminUsersUserIdMutes(w http.ResponseWriter, r *http.Request, userId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_mutes"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.PostAdminUsersUserIdMutesJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	// Prepare params
	var reason string
	if req.Reason != nil {
		reason = *req.Reason
	}

	// Create mute
	mute, err := h.ModMutes.CreateUserMute(r.Context(), moderation.CreateUserMuteParams{
		UserID:    uuid.UUID(userId),
		MuteType:  string(req.MuteType),
		MutedBy:   user.ID,
		Reason:    reason,
		ExpiresAt: req.ExpiresAt,
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	var expiresAt *time.Time
	if mute.ExpiresAt.Valid {
		expiresAt = &mute.ExpiresAt.Time
	}

	var responseReason *string
	if mute.Reason.Valid {
		responseReason = &mute.Reason.String
	}

	response := api.UserMute{
		UserId:    mute.UserID,
		MuteType:  api.MuteType(mute.MuteType),
		Reason:    responseReason,
		ExpiresAt: expiresAt,
		CreatedAt: mute.CreatedAt,
	}

	writeJSON(w, http.StatusCreated, response)
}

// DeleteAdminUsersUserIdMutes handles DELETE /admin/users/{userId}/mutes
func (h API) DeleteAdminUsersUserIdMutes(w http.ResponseWriter, r *http.Request, userId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_mutes"); err != nil {
		writeServiceError(w, err)
		return
	}

	if err := h.ModMutes.DeleteUserMutes(r.Context(), userId, user.ID); err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "All mutes removed successfully"})
}

// DeleteAdminUsersUserIdMutesMuteType handles DELETE /admin/users/{userId}/mutes/{muteType}
func (h API) DeleteAdminUsersUserIdMutesMuteType(w http.ResponseWriter, r *http.Request, userId openapi_types.UUID, muteType api.MuteType) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_mutes"); err != nil {
		writeServiceError(w, err)
		return
	}

	if err := h.ModMutes.DeleteUserMutesByType(r.Context(), userId, string(muteType), user.ID); err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Mute removed successfully"})
}
