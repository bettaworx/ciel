package handlers

import (
	"net/http"

	"backend/internal/api"
	"backend/internal/config"
	"backend/internal/service"
)

// GetServerConfig returns public server configuration (signup settings, media limits).
// This is a public endpoint that does not require authentication.
func (h API) GetServerConfig(w http.ResponseWriter, r *http.Request) {
	cfg := config.GetGlobalConfig()
	if cfg == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{
			Code:    "service_unavailable",
			Message: "server configuration not loaded",
		})
		return
	}

	writeJSON(w, http.StatusOK, service.BuildServerConfig(cfg))
}
