package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"log/slog"
	"mime/multipart"
	"net/http"
	"strings"
	"time"

	"backend/internal/cache"
	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

const (
	emojiListCacheKey = "emojis:list"
	emojiCacheTTL     = time.Hour
)

// EmojiService manages custom emoji CRUD and image processing.
type EmojiService struct {
	store    *repository.Store
	mediaSvc *MediaService
	cache    cache.Cache
}

// NewEmojiService creates a new EmojiService.
func NewEmojiService(store *repository.Store, mediaSvc *MediaService, cache cache.Cache) *EmojiService {
	return &EmojiService{
		store:    store,
		mediaSvc: mediaSvc,
		cache:    cache,
	}
}

// EmojiCreateParams holds parameters for creating a custom emoji.
type EmojiCreateParams struct {
	Shortcode string
	Name      string // optional
	Category  string // optional
	License   string // optional
	File      multipart.File
	Header    *multipart.FileHeader
}

// EmojiUpdateParams holds parameters for updating a custom emoji.
type EmojiUpdateParams struct {
	ID          uuid.UUID
	Shortcode   string // empty = no change
	Name        string
	SetName     bool // true = set name field (even if empty → clear it)
	Category    string
	SetCategory bool
	License     string
	SetLicense  bool
	File        multipart.File        // nil = no image change
	Header      *multipart.FileHeader // nil = no image change
}

// Create uploads the image and inserts a new custom emoji record.
// The UUID is generated in Go so the image directory and DB record share the same ID.
func (s *EmojiService) Create(ctx context.Context, p EmojiCreateParams) (sqlc.CustomEmoji, error) {
	id := uuid.New()

	w, h, err := s.mediaSvc.UploadEmojiImage(ctx, p.File, p.Header, id)
	if err != nil {
		return sqlc.CustomEmoji{}, err
	}

	params := sqlc.CreateCustomEmojiParams{
		ID:        id,
		Shortcode: p.Shortcode,
		Width:     int32(w),
		Height:    int32(h),
	}
	if p.Name != "" {
		params.Name = sql.NullString{String: p.Name, Valid: true}
	}
	if p.Category != "" {
		params.Category = sql.NullString{String: p.Category, Valid: true}
	}
	if p.License != "" {
		params.License = sql.NullString{String: p.License, Valid: true}
	}

	emoji, err := s.store.Q.CreateCustomEmoji(ctx, params)
	if err != nil {
		s.mediaSvc.DeleteEmojiImage(id)
		if isEmojiUniqueViolation(err) {
			return sqlc.CustomEmoji{}, NewError(http.StatusConflict, "shortcode_taken", "shortcode is already in use")
		}
		slog.Error("failed to create custom emoji", "error", err)
		return sqlc.CustomEmoji{}, NewError(http.StatusInternalServerError, "internal_error", "failed to create emoji")
	}

	s.invalidateCache(ctx)
	return emoji, nil
}

// Update modifies an existing custom emoji. If File/Header are non-nil the image is replaced.
func (s *EmojiService) Update(ctx context.Context, p EmojiUpdateParams) (sqlc.CustomEmoji, error) {
	if _, err := s.store.Q.GetCustomEmojiByID(ctx, p.ID); err != nil {
		return sqlc.CustomEmoji{}, NewError(http.StatusNotFound, "not_found", "emoji not found")
	}

	params := sqlc.UpdateCustomEmojiParams{ID: p.ID}

	if p.Shortcode != "" {
		params.Shortcode = sql.NullString{String: p.Shortcode, Valid: true}
	}
	if p.SetName {
		params.SetName = sql.NullBool{Bool: true, Valid: true}
		if p.Name != "" {
			params.Name = sql.NullString{String: p.Name, Valid: true}
		}
	}
	if p.SetCategory {
		params.SetCategory = sql.NullBool{Bool: true, Valid: true}
		if p.Category != "" {
			params.Category = sql.NullString{String: p.Category, Valid: true}
		}
	}
	if p.SetLicense {
		params.SetLicense = sql.NullBool{Bool: true, Valid: true}
		if p.License != "" {
			params.License = sql.NullString{String: p.License, Valid: true}
		}
	}

	if p.File != nil && p.Header != nil {
		w, h, err := s.mediaSvc.UploadEmojiImage(ctx, p.File, p.Header, p.ID)
		if err != nil {
			return sqlc.CustomEmoji{}, err
		}
		params.Width = sql.NullInt32{Int32: int32(w), Valid: true}
		params.Height = sql.NullInt32{Int32: int32(h), Valid: true}
	}

	updated, err := s.store.Q.UpdateCustomEmoji(ctx, params)
	if err != nil {
		if isEmojiUniqueViolation(err) {
			return sqlc.CustomEmoji{}, NewError(http.StatusConflict, "shortcode_taken", "shortcode is already in use")
		}
		slog.Error("failed to update custom emoji", "error", err)
		return sqlc.CustomEmoji{}, NewError(http.StatusInternalServerError, "internal_error", "failed to update emoji")
	}

	s.invalidateCache(ctx)
	return updated, nil
}

// Delete removes the emoji record and its image files.
func (s *EmojiService) Delete(ctx context.Context, id uuid.UUID) error {
	if _, err := s.store.Q.GetCustomEmojiByID(ctx, id); err != nil {
		return NewError(http.StatusNotFound, "not_found", "emoji not found")
	}

	if err := s.store.Q.DeleteCustomEmoji(ctx, id); err != nil {
		slog.Error("failed to delete custom emoji", "error", err)
		return NewError(http.StatusInternalServerError, "internal_error", "failed to delete emoji")
	}

	if s.mediaSvc != nil {
		s.mediaSvc.DeleteEmojiImage(id)
	}
	s.invalidateCache(ctx)
	return nil
}

// List returns a paginated list of all custom emojis and the total count.
func (s *EmojiService) List(ctx context.Context, limit, offset int32) ([]sqlc.CustomEmoji, int64, error) {
	total, err := s.store.Q.CountCustomEmojis(ctx)
	if err != nil {
		return nil, 0, NewError(http.StatusInternalServerError, "internal_error", "failed to count emojis")
	}
	if total == 0 {
		return []sqlc.CustomEmoji{}, 0, nil
	}

	// Cache the first page (offset=0) for fast public list fetching.
	if offset == 0 {
		if cached, ok := s.getListCache(ctx); ok {
			end := int(limit)
			if end > len(cached) {
				end = len(cached)
			}
			return cached[:end], total, nil
		}
	}

	emojis, err := s.store.Q.ListCustomEmojis(ctx, sqlc.ListCustomEmojisParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, 0, NewError(http.StatusInternalServerError, "internal_error", "failed to list emojis")
	}

	if offset == 0 {
		s.setListCache(ctx, emojis)
	}

	return emojis, total, nil
}

// GetByID returns a single emoji by its UUID.
func (s *EmojiService) GetByID(ctx context.Context, id uuid.UUID) (sqlc.CustomEmoji, error) {
	emoji, err := s.store.Q.GetCustomEmojiByID(ctx, id)
	if err != nil {
		return sqlc.CustomEmoji{}, NewError(http.StatusNotFound, "not_found", "emoji not found")
	}
	return emoji, nil
}

// GetByShortcode returns a single emoji by its shortcode.
func (s *EmojiService) GetByShortcode(ctx context.Context, shortcode string) (sqlc.CustomEmoji, error) {
	emoji, err := s.store.Q.GetCustomEmojiByShortcode(ctx, shortcode)
	if err != nil {
		return sqlc.CustomEmoji{}, NewError(http.StatusNotFound, "not_found", "emoji not found")
	}
	return emoji, nil
}

// invalidateCache deletes the cached emoji list.
func (s *EmojiService) invalidateCache(ctx context.Context) {
	if s.cache == nil {
		return
	}
	if err := s.cache.Delete(ctx, emojiListCacheKey); err != nil {
		slog.Warn("failed to invalidate emoji list cache", "error", err)
	}
}

func (s *EmojiService) getListCache(ctx context.Context) ([]sqlc.CustomEmoji, bool) {
	if s.cache == nil {
		return nil, false
	}
	raw, err := s.cache.Get(ctx, emojiListCacheKey)
	if err != nil {
		return nil, false
	}
	var emojis []sqlc.CustomEmoji
	if err := json.Unmarshal([]byte(raw), &emojis); err != nil {
		return nil, false
	}
	return emojis, true
}

func (s *EmojiService) setListCache(ctx context.Context, emojis []sqlc.CustomEmoji) {
	if s.cache == nil {
		return
	}
	raw, err := json.Marshal(emojis)
	if err != nil {
		return
	}
	if err := s.cache.Set(ctx, emojiListCacheKey, string(raw), emojiCacheTTL); err != nil {
		slog.Warn("failed to set emoji list cache", "error", err)
	}
}

// isEmojiUniqueViolation checks if the error is a PostgreSQL unique constraint violation (code 23505).
func isEmojiUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errorsAs(err, &pgErr) && pgErr.Code == "23505" {
		return true
	}
	// Fallback for errors wrapped without pgconn (e.g., database/sql driver)
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate key") || strings.Contains(msg, "unique constraint")
}
