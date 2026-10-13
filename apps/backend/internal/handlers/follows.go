package handlers

import (
	"net/http"

	"backend/internal/api"
	"backend/internal/auth"

	"github.com/google/uuid"
)

// followsCaller resolves the authenticated user for routes that change a follow.
// Following is always done as yourself, so no RBAC check is needed.
func (h API) followsCaller(w http.ResponseWriter, r *http.Request) (auth.User, bool) {
	if h.Follows == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "follows not configured"})
		return auth.User{}, false
	}
	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return auth.User{}, false
	}
	return caller, true
}

// viewerID returns the caller's id for read-only routes, or nil when anonymous.
func viewerID(r *http.Request) *uuid.UUID {
	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		return nil
	}
	id := caller.ID
	return &id
}

func (h API) PostUsersUsernameFollow(w http.ResponseWriter, r *http.Request, username api.Username) {
	caller, ok := h.followsCaller(w, r)
	if !ok {
		return
	}
	user, err := h.Follows.Follow(r.Context(), caller, username)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h API) DeleteUsersUsernameFollow(w http.ResponseWriter, r *http.Request, username api.Username) {
	caller, ok := h.followsCaller(w, r)
	if !ok {
		return
	}
	user, err := h.Follows.Unfollow(r.Context(), caller, username)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h API) GetUsersUsernameFollowers(w http.ResponseWriter, r *http.Request, username api.Username, params api.GetUsersUsernameFollowersParams) {
	if h.Follows == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "follows not configured"})
		return
	}
	page, err := h.Follows.ListFollowers(r.Context(), username, params.Limit, params.Cursor, viewerID(r))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h API) GetUsersUsernameFollowing(w http.ResponseWriter, r *http.Request, username api.Username, params api.GetUsersUsernameFollowingParams) {
	if h.Follows == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "follows not configured"})
		return
	}
	page, err := h.Follows.ListFollowing(r.Context(), username, params.Limit, params.Cursor, viewerID(r))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h API) GetUsersUsernameFollowersYouFollow(w http.ResponseWriter, r *http.Request, username api.Username, params api.GetUsersUsernameFollowersYouFollowParams) {
	caller, ok := h.followsCaller(w, r)
	if !ok {
		return
	}
	page, err := h.Follows.ListFollowersYouFollow(r.Context(), username, params.Limit, params.Cursor, caller.ID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h API) GetTimelineHome(w http.ResponseWriter, r *http.Request, params api.GetTimelineHomeParams) {
	if h.Timeline == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "timeline not configured"})
		return
	}
	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	page, err := h.Timeline.GetHome(r.Context(), params, caller.ID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h API) GetMeFollowRequests(w http.ResponseWriter, r *http.Request, params api.GetMeFollowRequestsParams) {
	caller, ok := h.followsCaller(w, r)
	if !ok {
		return
	}
	page, err := h.Follows.ListFollowRequests(r.Context(), caller.ID, params.Limit, params.Cursor)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h API) PostMeFollowRequestsUsernameAccept(w http.ResponseWriter, r *http.Request, username api.Username) {
	caller, ok := h.followsCaller(w, r)
	if !ok {
		return
	}
	user, err := h.Follows.AcceptFollowRequest(r.Context(), caller, username)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h API) PostMeFollowRequestsUsernameReject(w http.ResponseWriter, r *http.Request, username api.Username) {
	caller, ok := h.followsCaller(w, r)
	if !ok {
		return
	}
	user, err := h.Follows.RejectFollowRequest(r.Context(), caller, username)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}
