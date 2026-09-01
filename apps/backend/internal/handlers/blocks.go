package handlers

import (
	"net/http"

	"backend/internal/api"
	"backend/internal/auth"
)

// blocksCaller resolves the authenticated user for the mute and block routes.
// Both are always done as yourself, so no RBAC check is needed.
func (h API) blocksCaller(w http.ResponseWriter, r *http.Request) (auth.User, bool) {
	if h.Blocks == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "blocks not configured"})
		return auth.User{}, false
	}
	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return auth.User{}, false
	}
	return caller, true
}

func (h API) PostUsersUsernameMute(w http.ResponseWriter, r *http.Request, username api.Username) {
	caller, ok := h.blocksCaller(w, r)
	if !ok {
		return
	}
	user, err := h.Blocks.Mute(r.Context(), caller, username)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h API) DeleteUsersUsernameMute(w http.ResponseWriter, r *http.Request, username api.Username) {
	caller, ok := h.blocksCaller(w, r)
	if !ok {
		return
	}
	user, err := h.Blocks.Unmute(r.Context(), caller, username)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h API) PostUsersUsernameBlock(w http.ResponseWriter, r *http.Request, username api.Username) {
	caller, ok := h.blocksCaller(w, r)
	if !ok {
		return
	}
	user, err := h.Blocks.Block(r.Context(), caller, username)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h API) DeleteUsersUsernameBlock(w http.ResponseWriter, r *http.Request, username api.Username) {
	caller, ok := h.blocksCaller(w, r)
	if !ok {
		return
	}
	user, err := h.Blocks.Unblock(r.Context(), caller, username)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h API) GetMeMutes(w http.ResponseWriter, r *http.Request, params api.GetMeMutesParams) {
	caller, ok := h.blocksCaller(w, r)
	if !ok {
		return
	}
	page, err := h.Blocks.ListMutes(r.Context(), caller.ID, params.Limit, params.Cursor)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h API) GetMeBlocks(w http.ResponseWriter, r *http.Request, params api.GetMeBlocksParams) {
	caller, ok := h.blocksCaller(w, r)
	if !ok {
		return
	}
	page, err := h.Blocks.ListBlocks(r.Context(), caller.ID, params.Limit, params.Cursor)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}
