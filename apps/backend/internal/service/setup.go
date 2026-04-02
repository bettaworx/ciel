package service

import (
	"context"
	"crypto/subtle"
	"database/sql"
	"net/http"
	"os"
	"strings"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/config"
	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

type SetupService struct {
	store         *repository.Store
	authService   *AuthService
	setupTokenMgr *SetupTokenManager
	configMgr     *config.Manager
}

func NewSetupService(store *repository.Store, authService *AuthService, setupTokenMgr *SetupTokenManager, configMgr *config.Manager) *SetupService {
	return &SetupService{
		store:         store,
		authService:   authService,
		setupTokenMgr: setupTokenMgr,
		configMgr:     configMgr,
	}
}

// GetSetupStatus returns the current setup status including admin existence
func (s *SetupService) GetSetupStatus(ctx context.Context) (*api.SetupStatusResponse, error) {
	if s.store == nil {
		return nil, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	// Get setup completion status from config file
	cfg := s.configMgr.Get()

	// Check if admin account exists (database)
	adminExists, err := s.store.Q.HasAdminUser(ctx)
	if err != nil {
		return nil, err
	}

	return &api.SetupStatusResponse{
		SetupCompleted: cfg.Setup.Completed,
		AdminExists:    adminExists,
	}, nil
}

// IsSetupCompleted checks if the server setup has been completed
func (s *SetupService) IsSetupCompleted(ctx context.Context) (bool, error) {
	if s.configMgr == nil {
		return false, NewError(http.StatusServiceUnavailable, "service_unavailable", "config not configured")
	}

	cfg := s.configMgr.Get()
	return cfg.Setup.Completed, nil
}

// VerifySetupPassword verifies the setup password against the environment variable and returns a temporary token
func (s *SetupService) VerifySetupPassword(ctx context.Context, password string) (bool, string, error) {
	if s.store == nil {
		return false, "", NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	// Check if setup is already completed
	completed, err := s.IsSetupCompleted(ctx)
	if err != nil {
		return false, "", err
	}
	if completed {
		return false, "", NewError(http.StatusForbidden, "setup_completed", "setup already completed")
	}

	// Check if admin user already exists
	adminExists, err := s.store.Q.HasAdminUser(ctx)
	if err != nil {
		return false, "", err
	}
	if adminExists {
		return false, "", NewError(http.StatusForbidden, "admin_exists", "admin account already exists")
	}

	// Get the setup password from environment (plain text)
	// NOTE: This is a simple passphrase for initial server setup
	expectedPassword := os.Getenv("INITIAL_SETUP_PASSWORD")

	if expectedPassword == "" {
		return false, "", NewError(http.StatusServiceUnavailable, "setup_password_not_configured",
			"INITIAL_SETUP_PASSWORD not configured")
	}

	// SECURITY: Use constant-time comparison to prevent timing attacks
	// The setup password grants initial admin access - extremely sensitive
	if subtle.ConstantTimeCompare([]byte(password), []byte(expectedPassword)) != 1 {
		return false, "", nil // Wrong password
	}

	// Generate temporary setup token
	token, err := s.setupTokenMgr.GenerateSetupToken(ctx)
	if err != nil {
		return false, "", NewError(http.StatusInternalServerError, "token_generation_failed", "failed to generate setup token")
	}

	return true, token, nil
}

// CreateAdminAccount creates the admin user account and assigns the admin role
func (s *SetupService) CreateAdminAccount(ctx context.Context, setupToken, username, password string) (*api.User, string, error) {
	if s.store == nil {
		return nil, "", NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	// Validate setup token
	valid, err := s.setupTokenMgr.ValidateSetupToken(ctx, setupToken)
	if err != nil {
		return nil, "", NewError(http.StatusInternalServerError, "token_validation_failed", "failed to validate setup token")
	}
	if !valid {
		return nil, "", NewError(http.StatusForbidden, "invalid_setup_token", "invalid or expired setup token")
	}

	// Check if admin user already exists
	adminExists, err := s.store.Q.HasAdminUser(ctx)
	if err != nil {
		return nil, "", err
	}
	if adminExists {
		return nil, "", NewError(http.StatusForbidden, "admin_exists", "admin account already exists")
	}

	// Validate username and password
	username = strings.TrimSpace(username)
	if username == "" {
		return nil, "", NewError(http.StatusBadRequest, "invalid_request", "username required")
	}
	if err := auth.ValidatePassword(password); err != nil {
		return nil, "", NewError(http.StatusBadRequest, "invalid_request", err.Error())
	}

	// Create the user using the auth service logic
	salt, err := auth.RandomBytes(16)
	if err != nil {
		return nil, "", err
	}
	iterations := auth.DefaultIterations
	storedKey, serverKey := auth.DeriveVerifier(password, salt, iterations)

	var created sqlc.User
	var token string

	err = s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		// Ensure roles and permissions are initialized
		if err := q.EnsureRoles(ctx); err != nil {
			return err
		}
		if err := q.EnsurePermissions(ctx); err != nil {
			return err
		}
		if err := q.EnsureRolePermissions(ctx); err != nil {
			return err
		}

		// Ensure server settings exist to get current agreement versions
		if err := q.EnsureServerSettings(ctx); err != nil {
			return err
		}
		settings, err := q.GetServerSettings(ctx)
		if err != nil {
			return err
		}

		// Create admin user with current agreement versions
		now := time.Now()
		u, err := q.CreateUser(ctx, sqlc.CreateUserParams{
			Username:          username,
			TermsVersion:      settings.TermsVersion,
			PrivacyVersion:    settings.PrivacyVersion,
			TermsAcceptedAt:   sql.NullTime{Time: now, Valid: true},
			PrivacyAcceptedAt: sql.NullTime{Time: now, Valid: true},
		})
		if err != nil {
			return err
		}
		created = u

		// Store credentials
		if err := q.CreateAuthCredential(ctx, sqlc.CreateAuthCredentialParams{
			UserID:     u.ID,
			Salt:       salt,
			Iterations: int32(iterations),
			StoredKey:  storedKey,
			ServerKey:  serverKey,
		}); err != nil {
			return err
		}

		// Assign admin role
		if err := q.AddUserRole(ctx, sqlc.AddUserRoleParams{
			UserID: u.ID,
			RoleID: "admin",
		}); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, "", err
	}

	// Generate JWT token for the new admin user
	token, _, err = s.authService.tokens.Issue(auth.User{ID: created.ID, Username: created.Username})
	if err != nil {
		return nil, "", err
	}

	user := mapUserWithProfile(created.ID, created.Username, created.CreatedAt, created.DisplayName, created.Bio, created.AvatarMediaID, sql.NullString{}, created.TermsVersion, created.PrivacyVersion, created.TermsAcceptedAt, created.PrivacyAcceptedAt)
	return &user, token, nil
}

// ServerSetupParams contains the server configuration parameters
type ServerSetupParams struct {
	ServerName        *string
	ServerDescription *string
	ServerIconMediaID *uuid.UUID
	InviteOnly        *bool
	InviteCode        *string
}

// CompleteServerSetup completes the server setup with the provided configuration
func (s *SetupService) CompleteServerSetup(ctx context.Context, userID uuid.UUID, params ServerSetupParams) error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	// Verify user has admin role
	hasAdmin, err := s.store.Q.HasUserRole(ctx, sqlc.HasUserRoleParams{
		UserID: userID,
		RoleID: "admin",
	})
	if err != nil {
		return err
	}
	if !hasAdmin {
		return NewError(http.StatusForbidden, "forbidden", "admin role required")
	}

	// Update config file with server settings
	err = s.configMgr.Update(func(cfg *config.Config) error {
		if params.ServerName != nil {
			cfg.Server.Name = *params.ServerName
		}
		if params.ServerDescription != nil {
			cfg.Server.Description = *params.ServerDescription
		}
		if params.ServerIconMediaID != nil {
			cfg.Server.IconMediaID = params.ServerIconMediaID
		}
		if params.InviteOnly != nil {
			cfg.Auth.InviteOnly = *params.InviteOnly
		}

		// Mark setup as completed
		cfg.Setup.Completed = true
		cfg.Setup.PasswordUsed = true

		return nil
	})

	return err
}

// GetServerSettings returns the current server settings
func (s *SetupService) GetServerSettings(ctx context.Context) (*config.Config, error) {
	if s.configMgr == nil {
		return nil, NewError(http.StatusServiceUnavailable, "service_unavailable", "config not configured")
	}

	cfg := s.configMgr.Get()
	return cfg, nil
}

// GetStore returns the repository store for database access
func (s *SetupService) GetStore() *repository.Store {
	return s.store
}
