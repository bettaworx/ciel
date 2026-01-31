package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/config"
	"backend/internal/handlers"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

func TestAPI_GetServerInfo_WithoutIcon(t *testing.T) {
	// Set up config with server info but no icon
	originalConfig := config.GetGlobalConfig()
	defer config.SetGlobalConfig(originalConfig) // Restore after test

	testConfig := config.DefaultConfig()
	testConfig.Server.Name = "Test Server"
	testConfig.Server.Description = "A test server instance"
	testConfig.Server.IconMediaID = nil
	testConfig.Auth.InviteOnly = false
	config.SetGlobalConfig(testConfig)

	// Set up PUBLIC_BASE_URL for URL generation
	os.Setenv("PUBLIC_BASE_URL", "http://localhost:6137")
	defer os.Unsetenv("PUBLIC_BASE_URL")

	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	apiHandler := handlers.API{
		Setup: service.NewSetupService(repository.NewStore(db), nil, nil, nil),
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/server/info", nil)
	rr := httptest.NewRecorder()
	apiHandler.GetServerInfo(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var body api.ServerInfo
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if body.ServerName == nil || *body.ServerName != "Test Server" {
		t.Errorf("expected serverName 'Test Server', got %v", body.ServerName)
	}
	if body.ServerDescription == nil || *body.ServerDescription != "A test server instance" {
		t.Errorf("expected serverDescription 'A test server instance', got %v", body.ServerDescription)
	}
	if body.ServerIconUrl != nil {
		t.Errorf("expected nil serverIconUrl, got %v", body.ServerIconUrl)
	}
	if body.SignupEnabled != true {
		t.Errorf("expected signupEnabled true, got %v", body.SignupEnabled)
	}
}

func TestAPI_GetServerInfo_WithIcon(t *testing.T) {
	// Set up config with server icon
	originalConfig := config.GetGlobalConfig()
	defer config.SetGlobalConfig(originalConfig)

	iconMediaID := uuid.New()
	testConfig := config.DefaultConfig()
	testConfig.Server.Name = "Test Server"
	testConfig.Server.Description = "A test server instance"
	testConfig.Server.IconMediaID = &iconMediaID
	testConfig.Auth.InviteOnly = true // invite-only = signup disabled
	config.SetGlobalConfig(testConfig)

	// Set up PUBLIC_BASE_URL for URL generation
	os.Setenv("PUBLIC_BASE_URL", "http://localhost:6137")
	defer os.Unsetenv("PUBLIC_BASE_URL")

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	// Mock the GetMediaByID query
	createdAt := time.Date(2026, 1, 22, 0, 0, 0, 0, time.UTC)
	rows := sqlmock.NewRows([]string{"id", "user_id", "type", "ext", "width", "height", "created_at"}).
		AddRow(iconMediaID, uuid.New(), "image", "webp", int32(400), int32(400), createdAt)
	mock.ExpectQuery(`-- name: GetMediaByID`).
		WithArgs(iconMediaID).
		WillReturnRows(rows)

	apiHandler := handlers.API{
		Setup: service.NewSetupService(repository.NewStore(db), nil, nil, nil),
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/server/info", nil)
	rr := httptest.NewRecorder()
	apiHandler.GetServerInfo(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var body api.ServerInfo
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}

	t.Logf("Response body: %+v", body)

	if body.ServerName == nil || *body.ServerName != "Test Server" {
		t.Errorf("expected serverName 'Test Server', got %v", body.ServerName)
	}
	if body.ServerIconUrl == nil {
		t.Errorf("expected serverIconUrl to be set, got nil")
	} else {
		expectedURL := "http://localhost:6137/media/" + iconMediaID.String() + "/image.webp"
		if *body.ServerIconUrl != expectedURL {
			t.Errorf("expected serverIconUrl %q, got %q", expectedURL, *body.ServerIconUrl)
		}
	}
	if body.SignupEnabled != false {
		t.Errorf("expected signupEnabled false (invite-only), got %v", body.SignupEnabled)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestAPI_GetServerInfo_EmptyName(t *testing.T) {
	// Test with empty server name (should return nil)
	originalConfig := config.GetGlobalConfig()
	defer config.SetGlobalConfig(originalConfig)

	testConfig := config.DefaultConfig()
	testConfig.Server.Name = ""
	testConfig.Server.Description = ""
	config.SetGlobalConfig(testConfig)

	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer db.Close()

	apiHandler := handlers.API{
		Setup: service.NewSetupService(repository.NewStore(db), nil, nil, nil),
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/server/info", nil)
	rr := httptest.NewRecorder()
	apiHandler.GetServerInfo(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var body api.ServerInfo
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if body.ServerName != nil {
		t.Errorf("expected nil serverName for empty string, got %v", body.ServerName)
	}
	if body.ServerDescription != nil {
		t.Errorf("expected nil serverDescription for empty string, got %v", body.ServerDescription)
	}
}
