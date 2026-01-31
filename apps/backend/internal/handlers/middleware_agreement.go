package handlers

import (
	"net/http"
	"strings"

	"backend/internal/auth"
	"backend/internal/service"
)

// RequireAgreementConsent is a middleware that checks if authenticated users
// have accepted the latest terms of service and privacy policy.
// Returns 403 Forbidden if user needs to re-accept agreements.
func RequireAgreementConsent(agreements *service.AgreementsService, authz *service.AuthzService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip if user is not authenticated
			user, ok := auth.UserFromContext(r.Context())
			if !ok {
				next.ServeHTTP(w, r)
				return
			}

			// Skip for excluded paths
			if isAgreementExcludedPath(r.URL.Path) {
				next.ServeHTTP(w, r)
				return
			}

			// Check if user needs to re-accept agreements
			if agreements != nil {
				needsUpdate, err := agreements.CheckUserAgreementStatus(r.Context(), user.ID)
				if err != nil {
					// Log error but don't block - allow request to proceed
					// This prevents service disruption if agreement check fails
					next.ServeHTTP(w, r)
					return
				}

				if needsUpdate {
					writeJSON(w, http.StatusForbidden, ErrorResponse{
						Code:    "agreement_required",
						Message: "You must accept the latest agreements to continue",
					})
					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

// isAgreementExcludedPath checks if a path should be excluded from agreement checks
func isAgreementExcludedPath(path string) bool {
	excludedPrefixes := []string{
		// Agreement-related APIs (must be accessible before accepting)
		"/api/v1/agreements/",
		"/api/v1/me/agreements",

		// User info API (needed to check agreement status on /agreements page)
		"/api/v1/me",

		// Authentication APIs (login, logout, registration)
		"/api/v1/auth/",

		// Server info and setup (needed for initial setup)
		"/api/v1/server/info",
		"/api/v1/setup/",
	}

	for _, prefix := range excludedPrefixes {
		if strings.HasPrefix(path, prefix) {
			return true
		}
	}

	return false
}

// ErrorResponse is a simple error response structure
type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
