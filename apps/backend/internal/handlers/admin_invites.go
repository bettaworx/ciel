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

// GetAdminInvites handles GET /admin/invites
func (h API) GetAdminInvites(w http.ResponseWriter, r *http.Request, params api.GetAdminInvitesParams) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:invites:read"); err != nil {
		writeServiceError(w, err)
		return
	}

	limit := int32(50)
	if params.Limit != nil {
		limit = int32(*params.Limit)
	}

	offset := int32(0)
	if params.Offset != nil {
		offset = int32(*params.Offset)
	}

	result, err := h.AdminInvites.ListInviteCodes(r.Context(), limit, offset)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	invites := make([]api.InviteCode, len(result.Invites))
	for i, invite := range result.Invites {
		var expiresAt *time.Time
		if invite.ExpiresAt.Valid {
			expiresAt = &invite.ExpiresAt.Time
		}

		var lastUsedAt *time.Time
		if invite.LastUsedAt.Valid {
			lastUsedAt = &invite.LastUsedAt.Time
		}

		var maxUses *int
		if invite.MaxUses.Valid {
			uses := int(invite.MaxUses.Int32)
			maxUses = &uses
		}

		var note *string
		if invite.Note.Valid {
			note = &invite.Note.String
		}

		invites[i] = api.InviteCode{
			Id:         openapi_types.UUID(invite.ID),
			Code:       invite.Code,
			CreatedBy:  openapi_types.UUID(invite.CreatedBy),
			CreatedAt:  invite.CreatedAt,
			ExpiresAt:  expiresAt,
			LastUsedAt: lastUsedAt,
			MaxUses:    maxUses,
			UseCount:   int(invite.UseCount),
			Disabled:   invite.Disabled,
			Note:       note,
		}
	}

	writeJSON(w, http.StatusOK, invites)
}

// PostAdminInvites handles POST /admin/invites
func (h API) PostAdminInvites(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:invites:write"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.PostAdminInvitesJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	// Prepare params
	params := admin.CreateInviteCodeParams{
		CreatorID: user.ID,
	}

	if req.Code != nil {
		params.Code = *req.Code
	}

	if req.Note != nil {
		params.Note = *req.Note
	}

	if req.ExpiresAt != nil {
		params.ExpiresAt = req.ExpiresAt
	}

	if req.MaxUses != nil {
		maxUses := int32(*req.MaxUses)
		params.MaxUses = &maxUses
	}

	invite, err := h.AdminInvites.CreateInviteCode(r.Context(), params)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	var expiresAt *time.Time
	if invite.ExpiresAt.Valid {
		expiresAt = &invite.ExpiresAt.Time
	}

	var lastUsedAt *time.Time
	if invite.LastUsedAt.Valid {
		lastUsedAt = &invite.LastUsedAt.Time
	}

	var maxUses *int
	if invite.MaxUses.Valid {
		uses := int(invite.MaxUses.Int32)
		maxUses = &uses
	}

	var note *string
	if invite.Note.Valid {
		note = &invite.Note.String
	}

	response := api.InviteCode{
		Id:         openapi_types.UUID(invite.ID),
		Code:       invite.Code,
		CreatedBy:  openapi_types.UUID(invite.CreatedBy),
		CreatedAt:  invite.CreatedAt,
		ExpiresAt:  expiresAt,
		LastUsedAt: lastUsedAt,
		MaxUses:    maxUses,
		UseCount:   int(invite.UseCount),
		Disabled:   invite.Disabled,
		Note:       note,
	}

	writeJSON(w, http.StatusCreated, response)
}

// GetAdminInvitesInviteId handles GET /admin/invites/{inviteId}
func (h API) GetAdminInvitesInviteId(w http.ResponseWriter, r *http.Request, inviteId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:invites:read"); err != nil {
		writeServiceError(w, err)
		return
	}

	invite, err := h.AdminInvites.GetInviteCode(r.Context(), uuid.UUID(inviteId))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	var expiresAt *time.Time
	if invite.ExpiresAt.Valid {
		expiresAt = &invite.ExpiresAt.Time
	}

	var lastUsedAt *time.Time
	if invite.LastUsedAt.Valid {
		lastUsedAt = &invite.LastUsedAt.Time
	}

	var maxUses *int
	if invite.MaxUses.Valid {
		uses := int(invite.MaxUses.Int32)
		maxUses = &uses
	}

	var note *string
	if invite.Note.Valid {
		note = &invite.Note.String
	}

	response := api.InviteCode{
		Id:         openapi_types.UUID(invite.ID),
		Code:       invite.Code,
		CreatedBy:  openapi_types.UUID(invite.CreatedBy),
		CreatedAt:  invite.CreatedAt,
		ExpiresAt:  expiresAt,
		LastUsedAt: lastUsedAt,
		MaxUses:    maxUses,
		UseCount:   int(invite.UseCount),
		Disabled:   invite.Disabled,
		Note:       note,
	}

	writeJSON(w, http.StatusOK, response)
}

// PatchAdminInvitesInviteId handles PATCH /admin/invites/{inviteId}
func (h API) PatchAdminInvitesInviteId(w http.ResponseWriter, r *http.Request, inviteId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:invites:write"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.PatchAdminInvitesInviteIdJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	// Prepare params
	params := admin.UpdateInviteCodeParams{
		ID: uuid.UUID(inviteId),
	}

	if req.Code != nil {
		params.Code = req.Code
	}

	if req.Note != nil {
		params.Note = req.Note
	}

	if req.ExpiresAt != nil {
		params.ExpiresAt = req.ExpiresAt
	}

	if req.MaxUses != nil {
		maxUses := int32(*req.MaxUses)
		params.MaxUses = &maxUses
	}

	invite, err := h.AdminInvites.UpdateInviteCode(r.Context(), params)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	var expiresAt *time.Time
	if invite.ExpiresAt.Valid {
		expiresAt = &invite.ExpiresAt.Time
	}

	var lastUsedAt *time.Time
	if invite.LastUsedAt.Valid {
		lastUsedAt = &invite.LastUsedAt.Time
	}

	var maxUses *int
	if invite.MaxUses.Valid {
		uses := int(invite.MaxUses.Int32)
		maxUses = &uses
	}

	var note *string
	if invite.Note.Valid {
		note = &invite.Note.String
	}

	response := api.InviteCode{
		Id:         openapi_types.UUID(invite.ID),
		Code:       invite.Code,
		CreatedBy:  openapi_types.UUID(invite.CreatedBy),
		CreatedAt:  invite.CreatedAt,
		ExpiresAt:  expiresAt,
		LastUsedAt: lastUsedAt,
		MaxUses:    maxUses,
		UseCount:   int(invite.UseCount),
		Disabled:   invite.Disabled,
		Note:       note,
	}

	writeJSON(w, http.StatusOK, response)
}

// DeleteAdminInvitesInviteId handles DELETE /admin/invites/{inviteId}
func (h API) DeleteAdminInvitesInviteId(w http.ResponseWriter, r *http.Request, inviteId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:invites:write"); err != nil {
		writeServiceError(w, err)
		return
	}

	if err := h.AdminInvites.DeleteInviteCode(r.Context(), uuid.UUID(inviteId)); err != nil {
		writeServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetAdminInvitesInviteIdUses handles GET /admin/invites/{inviteId}/uses
func (h API) GetAdminInvitesInviteIdUses(w http.ResponseWriter, r *http.Request, inviteId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:invites:read"); err != nil {
		writeServiceError(w, err)
		return
	}

	history, err := h.AdminInvites.GetInviteCodeUsageHistory(r.Context(), uuid.UUID(inviteId))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	uses := make([]api.InviteCodeUse, len(history))
	for i, use := range history {
		var displayName *string
		if use.DisplayName.Valid {
			displayName = &use.DisplayName.String
		}

		var avatarMediaId *openapi_types.UUID
		if use.AvatarMediaID.Valid {
			uid := openapi_types.UUID(use.AvatarMediaID.UUID)
			avatarMediaId = &uid
		}

		uses[i] = api.InviteCodeUse{
			Id:            openapi_types.UUID(use.ID),
			InviteCodeId:  uuid.UUID(inviteId),
			UserId:        openapi_types.UUID(use.UserID),
			DisplayName:   displayName,
			AvatarMediaId: avatarMediaId,
			UsedAt:        use.UsedAt,
		}
	}

	writeJSON(w, http.StatusOK, uses)
}

// PatchAdminInvitesInviteIdDisable handles PATCH /admin/invites/{inviteId}/disable
func (h API) PatchAdminInvitesInviteIdDisable(w http.ResponseWriter, r *http.Request, inviteId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:invites:write"); err != nil {
		writeServiceError(w, err)
		return
	}

	if err := h.AdminInvites.DisableInviteCode(r.Context(), uuid.UUID(inviteId)); err != nil {
		writeServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
