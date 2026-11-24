package handlers

import (
	"net/http"

	"backend/internal/api"
	"backend/internal/auth"

	"github.com/google/uuid"
)

// searchCaller resolves the authenticated user for search routes. Search is
// authenticated so it can be rate limited per user rather than per IP; no RBAC
// check is needed because the results are public posts and profiles.
func (h API) searchCaller(w http.ResponseWriter, r *http.Request) (*uuid.UUID, bool) {
	if h.Search == nil {
		// Distinct from the provider-disabled message below, so a wiring bug
		// is not mistaken for SEARCH_PROVIDER=none.
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "search_unavailable", Message: "search not configured"})
		return nil, false
	}
	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return nil, false
	}
	id := caller.ID
	return &id, true
}

func (h API) GetSearchPosts(w http.ResponseWriter, r *http.Request, params api.GetSearchPostsParams) {
	viewer, ok := h.searchCaller(w, r)
	if !ok {
		return
	}
	page, err := h.Search.SearchPosts(r.Context(), params.Q, params.Limit, params.Offset, viewer)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h API) GetSearchUsers(w http.ResponseWriter, r *http.Request, params api.GetSearchUsersParams) {
	viewer, ok := h.searchCaller(w, r)
	if !ok {
		return
	}
	page, err := h.Search.SearchUsers(r.Context(), params.Q, params.Limit, params.Offset, viewer)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}
