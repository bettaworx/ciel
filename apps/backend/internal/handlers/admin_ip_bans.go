package handlers

import (
	"encoding/json"
	"net"
	"net/http"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/service/moderation"

	openapi_types "github.com/oapi-codegen/runtime/types"
)

// GetAdminIpBans handles GET /admin/ip-bans
func (h API) GetAdminIpBans(w http.ResponseWriter, r *http.Request, params api.GetAdminIpBansParams) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_ip_bans"); err != nil {
		writeServiceError(w, err)
		return
	}

	limit := int32(20)
	if params.Limit != nil {
		limit = int32(*params.Limit)
	}

	offset := int32(0)
	if params.Offset != nil {
		offset = int32(*params.Offset)
	}

	bans, _, err := h.ModIPBans.ListIPBans(r.Context(), limit, offset)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	response := make([]api.IPBan, len(bans))
	for i, ban := range bans {
		var expiresAt *time.Time
		if ban.ExpiresAt.Valid {
			expiresAt = &ban.ExpiresAt.Time
		}

		ipAddr := ban.IpAddress.IPNet.IP.String()

		var reason *string
		if ban.Reason.Valid {
			reason = &ban.Reason.String
		}

		response[i] = api.IPBan{
			Id:        ban.ID,
			IpAddress: ipAddr,
			Reason:    reason,
			ExpiresAt: expiresAt,
			CreatedAt: ban.CreatedAt,
		}
	}

	writeJSON(w, http.StatusOK, response)
}

// PostAdminIpBans handles POST /admin/ip-bans
func (h API) PostAdminIpBans(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_ip_bans"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.PostAdminIpBansJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	// Parse IP address
	ip := net.ParseIP(req.IpAddress)
	if ip == nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_ip", Message: "Invalid IP address"})
		return
	}

	// Prepare create params
	var reason string
	if req.Reason != nil {
		reason = *req.Reason
	}

	ban, err := h.ModIPBans.CreateIPBan(r.Context(), moderation.CreateIPBanParams{
		IPAddress: req.IpAddress,
		Reason:    reason,
		ExpiresAt: req.ExpiresAt,
		BannedBy:  user.ID,
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}

	var expiresAt *time.Time
	if ban.ExpiresAt.Valid {
		expiresAt = &ban.ExpiresAt.Time
	}

	ipAddr := ban.IpAddress.IPNet.IP.String()

	var responseReason *string
	if ban.Reason.Valid {
		responseReason = &ban.Reason.String
	}

	response := api.IPBan{
		Id:        ban.ID,
		IpAddress: ipAddr,
		Reason:    responseReason,
		ExpiresAt: expiresAt,
		CreatedAt: ban.CreatedAt,
	}

	writeJSON(w, http.StatusCreated, response)
}

// DeleteAdminIpBansBanId handles DELETE /admin/ip-bans/{banId}
func (h API) DeleteAdminIpBansBanId(w http.ResponseWriter, r *http.Request, banId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_ip_bans"); err != nil {
		writeServiceError(w, err)
		return
	}

	if err := h.ModIPBans.DeleteIPBan(r.Context(), banId, user.ID); err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "IP ban deleted successfully"})
}

// DeleteAdminIpBans handles DELETE /admin/ip-bans (delete by IP address)
func (h API) DeleteAdminIpBans(w http.ResponseWriter, r *http.Request, params api.DeleteAdminIpBansParams) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_ip_bans"); err != nil {
		writeServiceError(w, err)
		return
	}

	// Parse IP address
	ip := net.ParseIP(params.IpAddress)
	if ip == nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_ip", Message: "Invalid IP address"})
		return
	}

	if err := h.ModIPBans.DeleteIPBanByAddress(r.Context(), ip.String(), user.ID); err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "IP ban deleted successfully"})
}
