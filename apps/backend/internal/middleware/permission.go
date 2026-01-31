package middleware

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/service"
)

func RequirePermission(authz *service.AuthzService, permissionID, scope string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if authz == nil {
				writeServiceError(w, service.NewError(http.StatusServiceUnavailable, "service_unavailable", "authz not configured"))
				return
			}
			user, ok := auth.UserFromContext(r.Context())
			if !ok {
				writeUnauthorized(w)
				return
			}
			allowed, err := authz.HasPermission(r.Context(), user.ID, permissionID, scope)
			if err != nil {
				writeServiceError(w, err)
				return
			}
			if !allowed {
				writeForbidden(w)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func RequireAdminAccess(tokenManager *auth.TokenManager, authz *service.AuthzService) func(http.Handler) http.Handler {
	requireAuth := RequireAuth(tokenManager)
	requirePermission := RequirePermission(authz, "admin_access", service.DefaultPermissionScope)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !strings.HasPrefix(r.URL.Path, "/api/v1/admin") {
				next.ServeHTTP(w, r)
				return
			}
			requirePermission(requireAuth(next)).ServeHTTP(w, r)
		})
	}
}

func writeServiceError(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	if err == nil {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if se, ok := err.(*service.Error); ok {
		w.WriteHeader(se.Status)
		_ = json.NewEncoder(w).Encode(api.Error{Code: se.Code, Message: se.Message})
		return
	}
	w.WriteHeader(http.StatusInternalServerError)
	_ = json.NewEncoder(w).Encode(api.Error{Code: "internal", Message: "internal error"})
}
