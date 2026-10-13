package handlers_test

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"backend/internal/config"
	"backend/internal/handlers"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

// manifestBody mirrors the fields the browser actually reads, so the test
// asserts the wire shape rather than the Go struct.
type manifestBody struct {
	Name            string `json:"name"`
	ShortName       string `json:"short_name"`
	Description     string `json:"description"`
	StartURL        string `json:"start_url"`
	Display         string `json:"display"`
	BackgroundColor string `json:"background_color"`
	Icons           []struct {
		Src     string `json:"src"`
		Sizes   string `json:"sizes"`
		Type    string `json:"type"`
		Purpose string `json:"purpose"`
	} `json:"icons"`
}

func requestManifest(t *testing.T, h handlers.API) (*httptest.ResponseRecorder, manifestBody) {
	t.Helper()

	req := httptest.NewRequest(http.MethodGet, "/pwa/manifest.json", nil)
	rr := httptest.NewRecorder()
	h.GetPwaManifest(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var body manifestBody
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	return rr, body
}

func TestAPI_GetPwaManifest_WithoutIcon(t *testing.T) {
	originalConfig := config.GetGlobalConfig()
	defer config.SetGlobalConfig(originalConfig)

	testConfig := config.DefaultConfig()
	testConfig.Server.Name = "Test Server"
	testConfig.Server.Description = "A test server instance"
	testConfig.Server.IconMediaID = nil
	config.SetGlobalConfig(testConfig)

	rr, body := requestManifest(t, handlers.API{})

	if body.Name != "Test Server" || body.ShortName != "Test Server" {
		t.Errorf("name = %q / %q, want the instance name", body.Name, body.ShortName)
	}
	if body.Description != "A test server instance" {
		t.Errorf("description = %q", body.Description)
	}
	if body.StartURL != "/" {
		t.Errorf("start_url = %q, want / so it resolves against the frontend origin", body.StartURL)
	}
	if body.Display != "standalone" {
		t.Errorf("display = %q", body.Display)
	}

	// The shipped defaults must always be present, so an instance with no icon
	// still passes the installability check.
	if len(body.Icons) != 3 {
		t.Fatalf("icons = %d, want the 3 shipped defaults", len(body.Icons))
	}
	if body.Icons[0].Src != "/icon-192.png" || body.Icons[0].Sizes != "192x192" {
		t.Errorf("first icon = %+v", body.Icons[0])
	}
	if body.Icons[2].Purpose != "maskable" {
		t.Errorf("a maskable icon must be offered, got %+v", body.Icons[2])
	}

	if got := rr.Header().Get("Content-Type"); got != "application/manifest+json" {
		t.Errorf("Content-Type = %q", got)
	}
	// SecurityHeaders stamps no-store outside /media/; the handler overrides it.
	if got := rr.Header().Get("Cache-Control"); got != "public, max-age=300" {
		t.Errorf("Cache-Control = %q", got)
	}
}

func TestAPI_GetPwaManifest_WithIcon(t *testing.T) {
	originalConfig := config.GetGlobalConfig()
	defer config.SetGlobalConfig(originalConfig)

	iconMediaID := uuid.New()
	testConfig := config.DefaultConfig()
	testConfig.Server.Name = "Iconic"
	testConfig.Server.IconMediaID = &iconMediaID
	config.SetGlobalConfig(testConfig)

	if err := os.Setenv("PUBLIC_BASE_URL", "http://localhost:6137"); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Unsetenv("PUBLIC_BASE_URL") }()

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	defer func() { _ = db.Close() }()

	createdAt := time.Date(2026, 1, 22, 0, 0, 0, 0, time.UTC)
	rows := sqlmock.NewRows([]string{
		"id", "user_id", "type", "ext", "width", "height", "duration", "blurhash", "created_at",
	}).AddRow(
		iconMediaID, uuid.New(), "image", "webp",
		int32(400), int32(400), sql.NullFloat64{}, sql.NullString{}, createdAt,
	)
	mock.ExpectQuery(`-- name: GetMediaByID`).WithArgs(iconMediaID).WillReturnRows(rows)

	h := handlers.API{Setup: service.NewSetupService(repository.NewStore(db), nil, nil, nil)}
	_, body := requestManifest(t, h)

	if len(body.Icons) != 4 {
		t.Fatalf("icons = %d, want the instance icon plus the 3 defaults", len(body.Icons))
	}

	// The instance icon comes first, as the static variant so it does not
	// animate in the launcher, and with no declared pixel size because nothing
	// resizes it.
	instanceIcon := body.Icons[0]
	wantSrc := "http://localhost:6137/media/" + iconMediaID.String() + "/image_static.webp"
	if instanceIcon.Src != wantSrc {
		t.Errorf("instance icon src = %q, want %q", instanceIcon.Src, wantSrc)
	}
	if instanceIcon.Sizes != "any" {
		t.Errorf("instance icon sizes = %q, want any", instanceIcon.Sizes)
	}
	if instanceIcon.Type != "image/webp" {
		t.Errorf("instance icon type = %q", instanceIcon.Type)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet sqlmock expectations: %v", err)
	}
}

// A missing or unloaded config must still produce an installable manifest
// rather than an error page, since the browser has no fallback of its own.
func TestAPI_GetPwaManifest_FallsBackWithoutConfig(t *testing.T) {
	originalConfig := config.GetGlobalConfig()
	defer config.SetGlobalConfig(originalConfig)

	config.SetGlobalConfig(nil)

	_, body := requestManifest(t, handlers.API{})

	if body.Name != "Ciel" {
		t.Errorf("name = %q, want the Ciel fallback", body.Name)
	}
	if len(body.Icons) != 3 {
		t.Errorf("icons = %d, want the 3 shipped defaults", len(body.Icons))
	}
}

// An unset name must not produce an empty install prompt.
func TestAPI_GetPwaManifest_FallsBackWithoutName(t *testing.T) {
	originalConfig := config.GetGlobalConfig()
	defer config.SetGlobalConfig(originalConfig)

	testConfig := config.DefaultConfig()
	testConfig.Server.Name = ""
	testConfig.Server.Description = ""
	testConfig.Server.IconMediaID = nil
	config.SetGlobalConfig(testConfig)

	_, body := requestManifest(t, handlers.API{})

	if body.Name != "Ciel" {
		t.Errorf("name = %q, want the Ciel fallback", body.Name)
	}
	if body.Description != "A minimal SNS application" {
		t.Errorf("description = %q, want the fallback", body.Description)
	}
}
