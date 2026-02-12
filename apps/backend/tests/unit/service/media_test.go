package service

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// TestDeleteMedia_Success tests successful media deletion
func TestDeleteMedia_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := service.NewMediaService(store, "/tmp/media", nil)

	userID := uuid.New()
	mediaID := uuid.New()

	// Mock GetMediaByID
	mock.ExpectQuery(`-- name: GetMediaByID`).
		WithArgs(mediaID).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "user_id", "type", "ext", "width", "height", "created_at"}).
				AddRow(mediaID, userID, "image", "webp", sql.NullInt32{Valid: true, Int32: 2048}, sql.NullInt32{Valid: true, Int32: 1365}, time.Now()),
		)

	// Mock DeleteMediaByID
	mock.ExpectExec(`-- name: DeleteMediaByID`).
		WithArgs(mediaID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err = svc.DeleteMedia(context.Background(), userID, mediaID)
	assert.NoError(t, err)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestDeleteMedia_NotFound tests deleting non-existent media
func TestDeleteMedia_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := service.NewMediaService(store, "/tmp/media", nil)

	userID := uuid.New()
	mediaID := uuid.New()

	// Mock GetMediaByID returning error
	mock.ExpectQuery(`-- name: GetMediaByID`).
		WithArgs(mediaID).
		WillReturnError(sql.ErrNoRows)

	err = svc.DeleteMedia(context.Background(), userID, mediaID)
	assert.Error(t, err)

	svcErr, ok := err.(*service.Error)
	assert.True(t, ok)
	assert.Equal(t, 404, svcErr.Status)
	assert.Equal(t, "not_found", svcErr.Code)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestDeleteMedia_Forbidden tests deleting media owned by another user
func TestDeleteMedia_Forbidden(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := service.NewMediaService(store, "/tmp/media", nil)

	ownerID := uuid.New()
	userID := uuid.New() // Different user
	mediaID := uuid.New()

	// Mock GetMediaByID
	mock.ExpectQuery(`-- name: GetMediaByID`).
		WithArgs(mediaID).
		WillReturnRows(
			sqlmock.NewRows([]string{"id", "user_id", "type", "ext", "width", "height", "created_at"}).
				AddRow(mediaID, ownerID, "image", "webp", sql.NullInt32{Valid: true, Int32: 1920}, sql.NullInt32{Valid: true, Int32: 1080}, time.Now()),
		)

	err = svc.DeleteMedia(context.Background(), userID, mediaID)
	assert.Error(t, err)

	svcErr, ok := err.(*service.Error)
	assert.True(t, ok)
	assert.Equal(t, 403, svcErr.Status)
	assert.Equal(t, "forbidden", svcErr.Code)
	assert.Equal(t, "not the owner", svcErr.Message)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

// TestDeleteMedia_ServiceUnavailable tests when database is not configured
func TestDeleteMedia_ServiceUnavailable(t *testing.T) {
	svc := service.NewMediaService(nil, "/tmp/media", nil)

	userID := uuid.New()
	mediaID := uuid.New()

	err := svc.DeleteMedia(context.Background(), userID, mediaID)
	assert.Error(t, err)

	svcErr, ok := err.(*service.Error)
	assert.True(t, ok)
	assert.Equal(t, 503, svcErr.Status)
	assert.Equal(t, "service_unavailable", svcErr.Code)
}

// TestNewMediaService tests service initialization
func TestNewMediaService(t *testing.T) {
	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	svc := service.NewMediaService(store, "/tmp/media", nil)

	assert.NotNil(t, svc)
}

// TestMediaService_InitError tests service behavior when initialization fails
func TestMediaService_InitError(t *testing.T) {
	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	store := repository.NewStore(db)
	initErr := assert.AnError // Simulate initialization error
	svc := service.NewMediaService(store, "/tmp/media", initErr)

	assert.NotNil(t, svc)

	// Any upload operation should return 503 service unavailable
	// Note: We can't easily test UploadImageFromRequest without mocking http.Request,
	// but the uploadFromRequest method will check initErr first and return 503.
}

// Note: Testing actual image upload/processing requires:
// 1. Mocking http.ResponseWriter and *http.Request
// 2. Mocking multipart.File
// 3. Mocking ffmpeg/ffprobe execution
// 4. Creating temporary directories
//
// These are better suited for integration tests rather than unit tests.
// The DeleteMedia function tests above provide good coverage of the
// error handling and authorization logic.
