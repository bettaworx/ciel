package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/internal/api"
	"backend/internal/handlers"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

func TestAPI_GetPostsPostId_PgSchemaError_Returns503(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	postID := uuid.New()
	pgErr := &pgconn.PgError{Code: "42703"}
	mock.ExpectQuery(`SELECT\s+p.id,`).WithArgs(postID).WillReturnError(pgErr)

	apiHandler := handlers.API{
		Posts: service.NewPostsService(repository.NewStore(db), nil, nil),
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/posts/"+postID.String(), nil)
	rr := httptest.NewRecorder()
	apiHandler.GetPostsPostId(rr, req, api.PostId(postID))

	if rr.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", rr.Code)
	}

	var body api.Error
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body.Code != "service_unavailable" {
		t.Fatalf("expected service_unavailable, got %q", body.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
