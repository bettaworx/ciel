package handlers

import (
	"mime/multipart"
	"net/http"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/db/sqlc"
	"backend/internal/service"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

// toPublicEmoji converts a DB emoji to the public API response.
func toPublicEmoji(e sqlc.CustomEmoji) api.PublicEmoji {
	out := api.PublicEmoji{
		Shortcode: api.EmojiShortcode(e.Shortcode),
		ImageUrl:  service.EmojiImageURL(e.ID),
	}
	if e.Name.Valid {
		out.Name = &e.Name.String
	}
	if e.Category.Valid {
		out.Category = &e.Category.String
	}
	if e.License.Valid {
		out.License = &e.License.String
	}
	return out
}

// toAdminEmoji converts a DB emoji to the admin API response.
func toAdminEmoji(e sqlc.CustomEmoji) api.AdminEmoji {
	out := api.AdminEmoji{
		Id:        openapi_types.UUID(e.ID),
		Shortcode: api.EmojiShortcode(e.Shortcode),
		ImageUrl:  service.EmojiImageURL(e.ID),
		Width:     int(e.Width),
		Height:    int(e.Height),
		CreatedAt: e.CreatedAt,
		UpdatedAt: e.UpdatedAt,
	}
	if e.Name.Valid {
		out.Name = &e.Name.String
	}
	if e.Category.Valid {
		out.Category = &e.Category.String
	}
	if e.License.Valid {
		out.License = &e.License.String
	}
	return out
}

// GetEmojis returns the public list of custom emojis.
func (h API) GetEmojis(w http.ResponseWriter, r *http.Request, params api.GetEmojisParams) {
	if h.Emojis == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "emoji service not configured"})
		return
	}

	limit := int32(50)
	offset := int32(0)
	if params.Limit != nil {
		limit = int32(*params.Limit)
	}
	if params.Offset != nil {
		offset = int32(*params.Offset)
	}

	emojis, total, err := h.Emojis.List(r.Context(), limit, offset)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	out := make([]api.PublicEmoji, len(emojis))
	for i, e := range emojis {
		out[i] = toPublicEmoji(e)
	}
	writeJSON(w, http.StatusOK, api.EmojiListResponse{
		Emojis: out,
		Total:  int(total),
	})
}

// GetEmojisShortcode returns a single emoji by shortcode.
func (h API) GetEmojisShortcode(w http.ResponseWriter, r *http.Request, shortcode api.EmojiShortcode) {
	if h.Emojis == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "emoji service not configured"})
		return
	}

	emoji, err := h.Emojis.GetByShortcode(r.Context(), string(shortcode))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toPublicEmoji(emoji))
}

// GetAdminEmojis returns the admin list of custom emojis.
func (h API) GetAdminEmojis(w http.ResponseWriter, r *http.Request, params api.GetAdminEmojisParams) {
	if h.Emojis == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "emoji service not configured"})
		return
	}

	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	if !requirePermission(w, r, h.Authz, caller, "admin:emojis:manage") {
		return
	}

	limit := int32(50)
	offset := int32(0)
	if params.Limit != nil {
		limit = int32(*params.Limit)
	}
	if params.Offset != nil {
		offset = int32(*params.Offset)
	}

	emojis, total, err := h.Emojis.List(r.Context(), limit, offset)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	out := make([]api.AdminEmoji, len(emojis))
	for i, e := range emojis {
		out[i] = toAdminEmoji(e)
	}
	writeJSON(w, http.StatusOK, api.AdminEmojiListResponse{
		Emojis: out,
		Total:  int(total),
	})
}

// PostAdminEmojis creates a new custom emoji.
func (h API) PostAdminEmojis(w http.ResponseWriter, r *http.Request) {
	if h.Emojis == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "emoji service not configured"})
		return
	}

	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	if !requirePermission(w, r, h.Authz, caller, "admin:emojis:manage") {
		return
	}

	if err := r.ParseMultipartForm(16 << 20); err != nil { // 16 MiB
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "failed to parse form"})
		return
	}

	shortcode := r.FormValue("shortcode")
	if shortcode == "" {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "shortcode is required"})
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "image is required"})
		return
	}
	defer file.Close()

	params := service.EmojiCreateParams{
		Shortcode: shortcode,
		Name:      r.FormValue("name"),
		Category:  r.FormValue("category"),
		License:   r.FormValue("license"),
		File:      file,
		Header:    header,
	}

	emoji, err := h.Emojis.Create(r.Context(), params)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toAdminEmoji(emoji))
}

// PutAdminEmojisEmojiId updates an existing custom emoji.
func (h API) PutAdminEmojisEmojiId(w http.ResponseWriter, r *http.Request, emojiId api.EmojiId) {
	if h.Emojis == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "emoji service not configured"})
		return
	}

	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	if !requirePermission(w, r, h.Authz, caller, "admin:emojis:manage") {
		return
	}

	if err := r.ParseMultipartForm(16 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "failed to parse form"})
		return
	}

	params := service.EmojiUpdateParams{
		ID:        uuid.UUID(emojiId),
		Shortcode: r.FormValue("shortcode"),
	}

	if setName := r.FormValue("setName"); setName == "true" {
		params.SetName = true
		params.Name = r.FormValue("name")
	}
	if setCategory := r.FormValue("setCategory"); setCategory == "true" {
		params.SetCategory = true
		params.Category = r.FormValue("category")
	}
	if setLicense := r.FormValue("setLicense"); setLicense == "true" {
		params.SetLicense = true
		params.License = r.FormValue("license")
	}

	var imageFile multipart.File
	var imageHeader *multipart.FileHeader
	if f, fh, ferr := r.FormFile("image"); ferr == nil {
		imageFile = f
		imageHeader = fh
		defer imageFile.Close()
	}
	params.File = imageFile
	params.Header = imageHeader

	emoji, err := h.Emojis.Update(r.Context(), params)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toAdminEmoji(emoji))
}

// DeleteAdminEmojisEmojiId deletes a custom emoji.
func (h API) DeleteAdminEmojisEmojiId(w http.ResponseWriter, r *http.Request, emojiId api.EmojiId) {
	if h.Emojis == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "emoji service not configured"})
		return
	}

	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	if !requirePermission(w, r, h.Authz, caller, "admin:emojis:manage") {
		return
	}

	if err := h.Emojis.Delete(r.Context(), uuid.UUID(emojiId)); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
