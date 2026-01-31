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

// GetAdminModerationLogs handles GET /admin/moderation-logs
func (h API) GetAdminModerationLogs(w http.ResponseWriter, r *http.Request, params api.GetAdminModerationLogsParams) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:view_logs"); err != nil {
		writeServiceError(w, err)
		return
	}

	// Build list options
	limit := int32(50)
	if params.Limit != nil {
		limit = int32(*params.Limit)
	}

	offset := int32(0)
	if params.Offset != nil {
		offset = int32(*params.Offset)
	}

	listParams := moderation.ListLogsParams{
		Limit:  limit,
		Offset: offset,
	}

	if params.AdminUserId != nil {
		adminUUID := uuid.UUID(*params.AdminUserId)
		listParams.AdminUserID = &adminUUID
	}
	if params.Action != nil {
		action := string(*params.Action)
		listParams.Action = &action
	}
	if params.TargetType != nil {
		targetType := string(*params.TargetType)
		listParams.TargetType = &targetType
	}
	if params.TargetId != nil {
		listParams.TargetID = params.TargetId
	}

	result, err := h.ModLogs.ListLogs(r.Context(), listParams)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	response := make([]api.ModerationLog, len(result.Logs))
	for i, log := range result.Logs {
		var adminUserId *openapi_types.UUID
		if log.AdminID.Valid {
			adminUUID := openapi_types.UUID(log.AdminID.UUID)
			adminUserId = &adminUUID
		}

		var adminUsername *string
		if log.AdminUsername.Valid {
			adminUsername = &log.AdminUsername.String
		}

		var adminDisplayName *string
		if log.AdminDisplayName.Valid {
			adminDisplayName = &log.AdminDisplayName.String
		}

		// Parse details JSON into map
		var details map[string]interface{}
		if len(log.Details) > 0 {
			if err := json.Unmarshal(log.Details, &details); err == nil {
				// Only set if unmarshal succeeded
			}
		}

		response[i] = api.ModerationLog{
			Id:               openapi_types.UUID(log.ID),
			AdminUserId:      adminUserId,
			AdminUsername:    adminUsername,
			AdminDisplayName: adminDisplayName,
			Action:           api.ModerationAction(log.Action),
			TargetType:       api.ModerationTargetType(log.TargetType),
			TargetId:         log.TargetID,
			Details:          &details,
			CreatedAt:        log.CreatedAt,
		}
	}

	writeJSON(w, http.StatusOK, response)
}

// GetAdminUsersUserIdModerationLogs handles GET /admin/users/{userId}/moderation-logs
func (h API) GetAdminUsersUserIdModerationLogs(w http.ResponseWriter, r *http.Request, userId openapi_types.UUID, params api.GetAdminUsersUserIdModerationLogsParams) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:view_logs"); err != nil {
		writeServiceError(w, err)
		return
	}

	// Build list options with user filter
	limit := int32(50)
	if params.Limit != nil {
		limit = int32(*params.Limit)
	}

	offset := int32(0)
	if params.Offset != nil {
		offset = int32(*params.Offset)
	}

	targetUserIdStr := uuid.UUID(userId).String()
	listParams := moderation.ListLogsParams{
		TargetID: &targetUserIdStr,
		Limit:    limit,
		Offset:   offset,
	}

	result, err := h.ModLogs.ListLogs(r.Context(), listParams)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	response := make([]api.ModerationLog, len(result.Logs))
	for i, log := range result.Logs {
		var adminUserId *openapi_types.UUID
		if log.AdminID.Valid {
			adminUUID := openapi_types.UUID(log.AdminID.UUID)
			adminUserId = &adminUUID
		}

		var adminUsername *string
		if log.AdminUsername.Valid {
			adminUsername = &log.AdminUsername.String
		}

		var adminDisplayName *string
		if log.AdminDisplayName.Valid {
			adminDisplayName = &log.AdminDisplayName.String
		}

		// Parse details JSON into map
		var details map[string]interface{}
		if len(log.Details) > 0 {
			if err := json.Unmarshal(log.Details, &details); err == nil {
				// Only set if unmarshal succeeded
			}
		}

		response[i] = api.ModerationLog{
			Id:               openapi_types.UUID(log.ID),
			AdminUserId:      adminUserId,
			AdminUsername:    adminUsername,
			AdminDisplayName: adminDisplayName,
			Action:           api.ModerationAction(log.Action),
			TargetType:       api.ModerationTargetType(log.TargetType),
			TargetId:         log.TargetID,
			Details:          &details,
			CreatedAt:        log.CreatedAt,
		}
	}

	writeJSON(w, http.StatusOK, response)
}
