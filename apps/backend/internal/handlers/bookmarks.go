package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/api"
	"backend/internal/auth"
)

// bookmarksCaller resolves the authenticated user for the bookmark routes.
// Bookmarks are private and always acted on as yourself, so like follows there
// is no RBAC check to make.
func (h API) bookmarksCaller(w http.ResponseWriter, r *http.Request) (auth.User, bool) {
	if h.Bookmarks == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "bookmarks not configured"})
		return auth.User{}, false
	}
	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return auth.User{}, false
	}
	return caller, true
}

func (h API) GetBookmarksLists(w http.ResponseWriter, r *http.Request) {
	caller, ok := h.bookmarksCaller(w, r)
	if !ok {
		return
	}
	lists, err := h.Bookmarks.ListLists(r.Context(), caller.ID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, lists)
}

func (h API) PostBookmarksLists(w http.ResponseWriter, r *http.Request) {
	caller, ok := h.bookmarksCaller(w, r)
	if !ok {
		return
	}
	var req api.PostBookmarksListsJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}
	list, err := h.Bookmarks.CreateList(r.Context(), caller.ID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, list)
}

func (h API) PatchBookmarksListsListId(w http.ResponseWriter, r *http.Request, listId api.BookmarkListId) {
	caller, ok := h.bookmarksCaller(w, r)
	if !ok {
		return
	}
	var req api.PatchBookmarksListsListIdJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}
	list, err := h.Bookmarks.UpdateList(r.Context(), caller.ID, listId, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (h API) DeleteBookmarksListsListId(w http.ResponseWriter, r *http.Request, listId api.BookmarkListId) {
	caller, ok := h.bookmarksCaller(w, r)
	if !ok {
		return
	}
	if err := h.Bookmarks.DeleteList(r.Context(), caller.ID, listId); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h API) GetBookmarksListsListIdPosts(w http.ResponseWriter, r *http.Request, listId api.BookmarkListId, params api.GetBookmarksListsListIdPostsParams) {
	caller, ok := h.bookmarksCaller(w, r)
	if !ok {
		return
	}
	page, err := h.Bookmarks.ListPosts(r.Context(), caller.ID, listId, params.Limit, params.Cursor)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h API) PutPostsPostIdBookmarks(w http.ResponseWriter, r *http.Request, postId api.PostId) {
	caller, ok := h.bookmarksCaller(w, r)
	if !ok {
		return
	}
	var req api.PutPostsPostIdBookmarksJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}
	result, err := h.Bookmarks.SetPostBookmarks(r.Context(), caller.ID, postId, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
