package service

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
)

const DefaultPermissionScope = "global"

type AuthzService struct {
	store *repository.Store
}

func NewAuthzService(store *repository.Store) *AuthzService {
	return &AuthzService{store: store}
}

func (s *AuthzService) HasPermission(ctx context.Context, userID uuid.UUID, permissionID string, scope string) (bool, error) {
	if s.store == nil {
		return false, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	perm := strings.ToLower(strings.TrimSpace(permissionID))
	if perm == "" {
		return false, NewError(http.StatusBadRequest, "invalid_request", "permission required")
	}
	normalizedScope := strings.TrimSpace(scope)
	if normalizedScope == "" {
		normalizedScope = DefaultPermissionScope
	}

	userSummary, err := s.store.Q.GetUserPermissionSummary(ctx, sqlc.GetUserPermissionSummaryParams{
		UserID:       userID,
		PermissionID: perm,
		Scope:        normalizedScope,
	})
	if err != nil {
		return false, err
	}
	userHasDeny, err := boolFromAny(userSummary.HasDeny)
	if err != nil {
		return false, err
	}
	if userHasDeny {
		slog.Warn("permission denied", slog.String("reason", "user_override_deny"), slog.String("permission_id", perm), slog.String("scope", normalizedScope), slog.String("user_id", userID.String()))
		return false, nil
	}
	userHasAllow, err := boolFromAny(userSummary.HasAllow)
	if err != nil {
		return false, err
	}
	if userHasAllow {
		return true, nil
	}

	roleSummary, err := s.store.Q.GetRolePermissionSummary(ctx, sqlc.GetRolePermissionSummaryParams{
		UserID:       userID,
		PermissionID: perm,
		Scope:        normalizedScope,
	})
	if err != nil {
		return false, err
	}
	roleHasDeny, err := boolFromAny(roleSummary.HasDeny)
	if err != nil {
		return false, err
	}
	if roleHasDeny {
		slog.Warn("permission denied", slog.String("reason", "role_deny"), slog.String("permission_id", perm), slog.String("scope", normalizedScope), slog.String("user_id", userID.String()))
		return false, nil
	}
	roleHasAllow, err := boolFromAny(roleSummary.HasAllow)
	if err != nil {
		return false, err
	}
	if roleHasAllow {
		return true, nil
	}
	slog.Warn("permission denied", slog.String("reason", "no_allow"), slog.String("permission_id", perm), slog.String("scope", normalizedScope), slog.String("user_id", userID.String()))
	return false, nil
}

// RequirePermission checks if a user has a permission and returns an error if not
func (s *AuthzService) RequirePermission(ctx context.Context, userID uuid.UUID, permissionID string) error {
	has, err := s.HasPermission(ctx, userID, permissionID, DefaultPermissionScope)
	if err != nil {
		return err
	}
	if !has {
		return NewError(http.StatusForbidden, "forbidden", "insufficient permissions")
	}
	return nil
}

func boolFromAny(value any) (bool, error) {
	switch v := value.(type) {
	case nil:
		return false, fmt.Errorf("unexpected nil boolean value")
	case bool:
		return v, nil
	case *bool:
		if v == nil {
			return false, fmt.Errorf("unexpected nil boolean pointer")
		}
		return *v, nil
	case sql.NullBool:
		return v.Valid && v.Bool, nil
	case *sql.NullBool:
		if v == nil {
			return false, fmt.Errorf("unexpected nil sql.NullBool pointer")
		}
		return v.Valid && v.Bool, nil
	case int64:
		return v != 0, nil
	case int32:
		return v != 0, nil
	case []byte:
		s := strings.ToLower(strings.TrimSpace(string(v)))
		return s == "t" || s == "true" || s == "1", nil
	case string:
		s := strings.ToLower(strings.TrimSpace(v))
		return s == "t" || s == "true" || s == "1", nil
	default:
		return false, fmt.Errorf("unsupported boolean type: %T", value)
	}
}
