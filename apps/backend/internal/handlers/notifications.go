package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"backend/internal/api"
	"backend/internal/auth"

	"github.com/google/uuid"
)

// notificationsCaller resolves the authenticated user for notification routes.
// Notifications are always scoped to the caller, so no RBAC check is needed.
func (h API) notificationsCaller(w http.ResponseWriter, r *http.Request) (auth.User, bool) {
	if h.Notifications == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "notifications not configured"})
		return auth.User{}, false
	}
	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return auth.User{}, false
	}
	return caller, true
}

func (h API) GetNotifications(w http.ResponseWriter, r *http.Request, params api.GetNotificationsParams) {
	caller, ok := h.notificationsCaller(w, r)
	if !ok {
		return
	}
	page, err := h.Notifications.List(r.Context(), caller.ID, params)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h API) GetNotificationsUnreadCount(w http.ResponseWriter, r *http.Request) {
	caller, ok := h.notificationsCaller(w, r)
	if !ok {
		return
	}
	count, err := h.Notifications.UnreadCount(r.Context(), caller.ID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, count)
}

func (h API) PostNotificationsRead(w http.ResponseWriter, r *http.Request) {
	caller, ok := h.notificationsCaller(w, r)
	if !ok {
		return
	}

	// The body is optional: no body at all means "mark everything read".
	var req api.MarkNotificationsReadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && !errors.Is(err, io.EOF) {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}

	var ids *[]uuid.UUID
	if req.Ids != nil {
		list := make([]uuid.UUID, 0, len(*req.Ids))
		list = append(list, *req.Ids...)
		ids = &list
	}

	count, err := h.Notifications.MarkRead(r.Context(), caller.ID, ids)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, count)
}
