package handlers

import (
	"net/http"

	"backend/internal/api"
	"backend/internal/auth"
)

// GetAdminDashboardStats retrieves system-wide statistics for the admin dashboard
func (h *API) GetAdminDashboardStats(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "authentication required"})
		return
	}

	// Check admin permission
	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:access"); err != nil {
		writeServiceError(w, err)
		return
	}

	stats, err := h.Admin.GetDashboardStats(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, stats)
}
