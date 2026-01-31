package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/service/moderation"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// GetAdminPosts handles GET /admin/posts
func (h *API) GetAdminPosts(w http.ResponseWriter, r *http.Request, params api.GetAdminPostsParams) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_posts"); err != nil {
		writeServiceError(w, err)
		return
	}

	// Build list params
	limit := int32(20)
	if params.Limit != nil {
		limit = int32(*params.Limit)
	}

	offset := int32(0)
	if params.Offset != nil {
		offset = int32(*params.Offset)
	}

	var userID *uuid.UUID
	if params.UserId != nil {
		uid := uuid.UUID(*params.UserId)
		userID = &uid
	}

	result, err := h.ModPosts.ListPosts(r.Context(), moderation.ListPostsParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	items := make([]api.AdminPost, len(result.Posts))
	for i, post := range result.Posts {
		var deletedAt *time.Time
		if post.DeletedAt.Valid {
			t := post.DeletedAt.Time
			deletedAt = &t
		}

		var deletedBy *openapi_types.UUID
		if post.DeletedBy.Valid {
			uid := openapi_types.UUID(post.DeletedBy.UUID)
			deletedBy = &uid
		}

		var deletionReason *string
		if post.DeletionReason.Valid {
			deletionReason = &post.DeletionReason.String
		}

		var authorDisplayName *string
		if post.AuthorDisplayName.Valid {
			authorDisplayName = &post.AuthorDisplayName.String
		}

		items[i] = api.AdminPost{
			Id:      openapi_types.UUID(post.ID),
			Content: post.Content,
			Author: api.User{
				Id:          openapi_types.UUID(post.AuthorID),
				Username:    post.AuthorUsername,
				DisplayName: authorDisplayName,
			},
			Visibility:     api.PostVisibility(post.Visibility),
			DeletedAt:      deletedAt,
			DeletedBy:      deletedBy,
			DeletionReason: deletionReason,
			CreatedAt:      post.CreatedAt,
			Media:          []api.Media{}, // TODO: Load media if needed
		}
	}

	response := api.AdminPostPage{
		Items: items,
		Total: int(result.Total),
	}

	writeJSON(w, http.StatusOK, response)
}

// DeleteAdminPostsPostId handles DELETE /admin/posts/{postId}
func (h *API) DeleteAdminPostsPostId(w http.ResponseWriter, r *http.Request, postId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_posts"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.DeleteAdminPostsPostIdJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	var reason string
	if req.Reason != nil {
		reason = *req.Reason
	}

	if err := h.ModPosts.DeletePost(r.Context(), uuid.UUID(postId), user.ID, reason); err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Post deleted successfully"})
}

// PatchAdminPostsPostIdVisibility handles PATCH /admin/posts/{postId}/visibility
func (h *API) PatchAdminPostsPostIdVisibility(w http.ResponseWriter, r *http.Request, postId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_posts"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.PatchAdminPostsPostIdVisibilityJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	// Check visibility value and call appropriate method
	if req.Visibility == api.Hidden {
		if err := h.ModPosts.HidePost(r.Context(), uuid.UUID(postId), user.ID); err != nil {
			writeServiceError(w, err)
			return
		}
	} else {
		if err := h.ModPosts.UnhidePost(r.Context(), uuid.UUID(postId), user.ID); err != nil {
			writeServiceError(w, err)
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Post visibility updated successfully"})
}

// GetAdminMedia handles GET /admin/media
func (h *API) GetAdminMedia(w http.ResponseWriter, r *http.Request, params api.GetAdminMediaParams) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_media"); err != nil {
		writeServiceError(w, err)
		return
	}

	// Build list params
	limit := int32(20)
	if params.Limit != nil {
		limit = int32(*params.Limit)
	}

	offset := int32(0)
	if params.Offset != nil {
		offset = int32(*params.Offset)
	}

	var userID *uuid.UUID
	if params.UserId != nil {
		uid := uuid.UUID(*params.UserId)
		userID = &uid
	}

	result, err := h.ModMedia.ListMedia(r.Context(), moderation.ListMediaParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	items := make([]api.AdminMedia, len(result.Media))
	for i, m := range result.Media {
		var deletedAt *time.Time
		if m.DeletedAt.Valid {
			t := m.DeletedAt.Time
			deletedAt = &t
		}

		var deletedBy *openapi_types.UUID
		if m.DeletedBy.Valid {
			uid := openapi_types.UUID(m.DeletedBy.UUID)
			deletedBy = &uid
		}

		var deletionReason *string
		if m.DeletionReason.Valid {
			deletionReason = &m.DeletionReason.String
		}

		var phash *string
		if m.Phash.Valid {
			phash = &m.Phash.String
		}

		uploaderUsername := m.UploaderUsername
		usedInPostsCount := int(m.UsedInPostsCount)

		// Build full media URL
		scheme := "http"
		if r.TLS != nil {
			scheme = "https"
		}
		host := r.Host
		mediaURL := scheme + "://" + host + "/media/" + m.ID.String() + "/image." + m.Ext

		items[i] = api.AdminMedia{
			Id:               openapi_types.UUID(m.ID),
			Type:             api.MediaType(m.Type),
			Url:              mediaURL,
			Width:            int(m.Width),
			Height:           int(m.Height),
			Phash:            phash,
			UploaderUsername: &uploaderUsername,
			UsedInPostsCount: &usedInPostsCount,
			DeletedAt:        deletedAt,
			DeletedBy:        deletedBy,
			DeletionReason:   deletionReason,
			CreatedAt:        m.CreatedAt,
		}
	}

	response := api.AdminMediaPage{
		Items: items,
		Total: int(result.Total),
	}

	writeJSON(w, http.StatusOK, response)
}

// DeleteAdminMediaMediaId handles DELETE /admin/media/{mediaId}
func (h *API) DeleteAdminMediaMediaId(w http.ResponseWriter, r *http.Request, mediaId openapi_types.UUID) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "Authentication required"})
		return
	}

	if err := h.Authz.RequirePermission(r.Context(), user.ID, "admin:moderation:manage_media"); err != nil {
		writeServiceError(w, err)
		return
	}

	var req api.DeleteAdminMediaMediaIdJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "Invalid request body"})
		return
	}

	var reason string
	if req.Reason != nil {
		reason = *req.Reason
	}

	if err := h.ModMedia.DeleteMedia(r.Context(), uuid.UUID(mediaId), user.ID, reason); err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Media deleted successfully"})
}
