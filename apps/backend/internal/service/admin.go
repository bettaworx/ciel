package service

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	"backend/internal/api"
	"backend/internal/cache"
	"backend/internal/config"
	"backend/internal/db/sqlc"
	"backend/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

type AdminService struct {
	store     *repository.Store
	cache     cache.Cache
	configMgr *config.Manager
}

func NewAdminService(store *repository.Store, cache cache.Cache, configMgr *config.Manager) *AdminService {
	return &AdminService{store: store, cache: cache, configMgr: configMgr}
}

func (s *AdminService) ListRoles(ctx context.Context) ([]api.RoleId, error) {
	if s.store == nil {
		return nil, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	rows, err := s.store.Q.ListRoles(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.RoleId, 0, len(rows))
	for _, id := range rows {
		out = append(out, api.RoleId(id))
	}
	return out, nil
}

func (s *AdminService) ListPermissions(ctx context.Context) ([]api.PermissionId, error) {
	if s.store == nil {
		return nil, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	rows, err := s.store.Q.ListPermissions(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.PermissionId, 0, len(rows))
	for _, id := range rows {
		out = append(out, api.PermissionId(id))
	}
	return out, nil
}

func (s *AdminService) GetUserRoles(ctx context.Context, userID uuid.UUID) ([]api.RoleId, error) {
	if err := s.ensureUserExists(ctx, userID); err != nil {
		return nil, err
	}
	rows, err := s.store.Q.GetUserRoles(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]api.RoleId, 0, len(rows))
	for _, roleID := range rows {
		out = append(out, api.RoleId(roleID))
	}
	return out, nil
}

func (s *AdminService) UpdateUserRoles(ctx context.Context, userID uuid.UUID, roles []api.RoleId) ([]api.RoleId, error) {
	if err := s.ensureUserExists(ctx, userID); err != nil {
		return nil, err
	}
	normalized, err := normalizeRoleIDs(roles)
	if err != nil {
		return nil, err
	}
	err = s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if err := q.DeleteUserRoles(ctx, userID); err != nil {
			return err
		}
		for _, roleID := range normalized {
			if err := q.AddUserRole(ctx, sqlc.AddUserRoleParams{UserID: userID, RoleID: roleID}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, mapAdminForeignKeyError(err, "invalid roleId")
	}
	out := make([]api.RoleId, 0, len(normalized))
	for _, roleID := range normalized {
		out = append(out, api.RoleId(roleID))
	}
	return out, nil
}

func (s *AdminService) GetUserPermissionOverrides(ctx context.Context, userID uuid.UUID) ([]api.PermissionOverride, error) {
	if err := s.ensureUserExists(ctx, userID); err != nil {
		return nil, err
	}
	rows, err := s.store.Q.GetUserPermissionOverrides(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]api.PermissionOverride, 0, len(rows))
	for _, row := range rows {
		out = append(out, api.PermissionOverride{
			PermissionId: api.PermissionId(row.PermissionID),
			Scope:        api.PermissionScope(row.Scope),
			Effect:       api.PermissionEffect(row.Effect),
		})
	}
	return out, nil
}

func (s *AdminService) UpdateUserPermissionOverrides(ctx context.Context, userID uuid.UUID, overrides []api.PermissionOverride) ([]api.PermissionOverride, error) {
	if err := s.ensureUserExists(ctx, userID); err != nil {
		return nil, err
	}
	normalized, err := normalizeOverrides(overrides)
	if err != nil {
		return nil, err
	}
	err = s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if err := q.DeleteUserPermissionOverrides(ctx, userID); err != nil {
			return err
		}
		for _, ov := range normalized {
			if err := q.AddUserPermissionOverride(ctx, sqlc.AddUserPermissionOverrideParams{
				UserID:       userID,
				PermissionID: ov.PermissionID,
				Scope:        ov.Scope,
				Effect:       sqlc.PermissionEffect(ov.Effect),
			}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, mapAdminForeignKeyError(err, "invalid permissionId")
	}
	out := make([]api.PermissionOverride, 0, len(normalized))
	for _, ov := range normalized {
		out = append(out, api.PermissionOverride{
			PermissionId: api.PermissionId(ov.PermissionID),
			Scope:        api.PermissionScope(ov.Scope),
			Effect:       api.PermissionEffect(ov.Effect),
		})
	}
	return out, nil
}

func (s *AdminService) GetDashboardStats(ctx context.Context) (api.DashboardStats, error) {
	if s.store == nil {
		return api.DashboardStats{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	stats, err := s.store.Q.GetDashboardStats(ctx)
	if err != nil {
		return api.DashboardStats{}, err
	}
	return api.DashboardStats{
		TotalUsers: int(stats.TotalUsers),
		TotalPosts: int(stats.TotalPosts),
		TotalMedia: int(stats.TotalMedia),
	}, nil
}

func (s *AdminService) GetServerSettings(ctx context.Context) (api.ServerSettings, error) {
	if s.store == nil {
		return api.ServerSettings{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	if s.configMgr == nil {
		return api.ServerSettings{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "config not configured")
	}

	// Get invite_only setting from config file
	cfg := s.configMgr.Get()

	// Get agreement versions from database
	if err := s.store.Q.EnsureServerSettings(ctx); err != nil {
		return api.ServerSettings{}, err
	}
	row, err := s.store.Q.GetServerSettings(ctx)
	if err != nil {
		if err == sql.ErrNoRows {
			return api.ServerSettings{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "server settings missing")
		}
		return api.ServerSettings{}, err
	}

	termsVersion := int(row.TermsVersion)
	privacyVersion := int(row.PrivacyVersion)
	return api.ServerSettings{
		SignupEnabled:  !cfg.Auth.InviteOnly, // Invert: invite_only=true means signup_enabled=false
		TermsVersion:   &termsVersion,
		PrivacyVersion: &privacyVersion,
	}, nil
}

func (s *AdminService) UpdateSignupEnabled(ctx context.Context, enabled bool) (api.ServerSettings, error) {
	if s.configMgr == nil {
		return api.ServerSettings{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "config not configured")
	}

	// Convert signup_enabled to invite_only (inverse boolean)
	inviteOnly := !enabled

	// Update config.yaml using Manager.Update()
	err := s.configMgr.Update(func(cfg *config.Config) error {
		cfg.Auth.InviteOnly = inviteOnly
		return nil
	})

	if err != nil {
		return api.ServerSettings{}, NewError(http.StatusInternalServerError, "config_update_failed", "failed to update config")
	}

	// Return current settings (read from config + DB)
	return s.GetServerSettings(ctx)
}

func (s *AdminService) UpdateAgreementVersions(ctx context.Context, req api.UpdateAgreementVersionsRequest) (api.AgreementVersions, error) {
	if s.store == nil {
		return api.AgreementVersions{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}

	// Validate that at least one version is provided
	if req.TermsVersion == nil && req.PrivacyVersion == nil {
		return api.AgreementVersions{}, NewError(http.StatusBadRequest, "invalid_request", "at least one version must be provided")
	}

	// Validate version numbers are >= 1
	if req.TermsVersion != nil && *req.TermsVersion < 1 {
		return api.AgreementVersions{}, NewError(http.StatusBadRequest, "invalid_request", "termsVersion must be >= 1")
	}
	if req.PrivacyVersion != nil && *req.PrivacyVersion < 1 {
		return api.AgreementVersions{}, NewError(http.StatusBadRequest, "invalid_request", "privacyVersion must be >= 1")
	}

	if err := s.store.Q.EnsureServerSettings(ctx); err != nil {
		return api.AgreementVersions{}, err
	}

	params := sqlc.UpdateAgreementVersionsParams{}
	if req.TermsVersion != nil {
		v := int32(*req.TermsVersion)
		params.TermsVersion = sql.NullInt32{Int32: v, Valid: true}
	}
	if req.PrivacyVersion != nil {
		v := int32(*req.PrivacyVersion)
		params.PrivacyVersion = sql.NullInt32{Int32: v, Valid: true}
	}

	row, err := s.store.Q.UpdateAgreementVersions(ctx, params)
	if err != nil {
		return api.AgreementVersions{}, err
	}

	return api.AgreementVersions{
		TermsVersion:   int(row.TermsVersion),
		PrivacyVersion: int(row.PrivacyVersion),
	}, nil
}

func (s *AdminService) BanUser(ctx context.Context, userID uuid.UUID, ttlSeconds *int) error {
	if err := s.ensureUserExists(ctx, userID); err != nil {
		return err
	}
	if s.cache == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "redis not configured")
	}
	if ttlSeconds != nil {
		if *ttlSeconds <= 0 {
			return NewError(http.StatusBadRequest, "invalid_request", "ttlSeconds must be greater than zero")
		}
		// Maximum ban period: 1 year (31536000 seconds)
		const maxBanTTLSeconds = 31536000
		if *ttlSeconds > maxBanTTLSeconds {
			return NewError(http.StatusBadRequest, "invalid_request", "ttlSeconds exceeds maximum of 31536000 (1 year)")
		}
	}
	ctx, cancel := context.WithTimeout(ctx, 250*time.Millisecond)
	defer cancel()
	if ttlSeconds != nil {
		return s.cache.Set(ctx, "deny:user:"+userID.String(), "1", time.Duration(*ttlSeconds)*time.Second)
	}
	return s.cache.SAdd(ctx, "deny:user", userID.String())
}

func (s *AdminService) UnbanUser(ctx context.Context, userID uuid.UUID) error {
	if err := s.ensureUserExists(ctx, userID); err != nil {
		return err
	}
	if s.cache == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "redis not configured")
	}
	ctx, cancel := context.WithTimeout(ctx, 250*time.Millisecond)
	defer cancel()
	if err := s.cache.SRem(ctx, "deny:user", userID.String()); err != nil {
		return err
	}
	return s.cache.Delete(ctx, "deny:user:"+userID.String())
}

func (s *AdminService) ensureUserExists(ctx context.Context, userID uuid.UUID) error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	_, err := s.store.Q.GetUserByID(ctx, userID)
	if err == nil {
		return nil
	}
	if err == sql.ErrNoRows {
		return NewError(http.StatusNotFound, "not_found", "user not found")
	}
	return err
}

func normalizeRoleIDs(roles []api.RoleId) ([]string, error) {
	out := make([]string, 0, len(roles))
	seen := make(map[string]struct{}, len(roles))
	for _, roleID := range roles {
		id := strings.ToLower(strings.TrimSpace(string(roleID)))
		if id == "" {
			return nil, NewError(http.StatusBadRequest, "invalid_request", "role id required")
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out, nil
}

type normalizedOverride struct {
	PermissionID string
	Scope        string
	Effect       string
}

func normalizeOverrides(overrides []api.PermissionOverride) ([]normalizedOverride, error) {
	out := make([]normalizedOverride, 0, len(overrides))
	seen := make(map[string]struct{}, len(overrides))
	for _, ov := range overrides {
		perm := strings.ToLower(strings.TrimSpace(string(ov.PermissionId)))
		if perm == "" {
			return nil, NewError(http.StatusBadRequest, "invalid_request", "permissionId required")
		}
		scope := strings.TrimSpace(string(ov.Scope))
		if scope == "" {
			scope = DefaultPermissionScope
		}
		effect := strings.ToLower(strings.TrimSpace(string(ov.Effect)))
		if effect != "allow" && effect != "deny" {
			return nil, NewError(http.StatusBadRequest, "invalid_request", "effect must be allow or deny")
		}
		key := perm + ":" + scope
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, normalizedOverride{
			PermissionID: perm,
			Scope:        scope,
			Effect:       effect,
		})
	}
	return out, nil
}

func mapAdminForeignKeyError(err error, message string) error {
	var pgErr *pgconn.PgError
	if errorsAs(err, &pgErr) && pgErr.Code == "23503" {
		return NewError(http.StatusBadRequest, "invalid_request", message)
	}
	return err
}

// ==================== Role Management ====================

func (s *AdminService) GetRole(ctx context.Context, roleID string) (api.Role, error) {
	if s.store == nil {
		return api.Role{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	row, err := s.store.Q.GetRoleByID(ctx, roleID)
	if err != nil {
		if err == sql.ErrNoRows {
			return api.Role{}, NewError(http.StatusNotFound, "not_found", "role not found")
		}
		return api.Role{}, err
	}
	return api.Role{
		Id:          api.RoleId(row.ID),
		Name:        row.Name,
		Description: row.Description,
	}, nil
}

func (s *AdminService) CreateRole(ctx context.Context, req api.CreateRoleRequest) (api.Role, error) {
	if s.store == nil {
		return api.Role{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	// Validate role ID format
	roleID := strings.ToLower(strings.TrimSpace(string(req.Id)))
	if roleID == "" {
		return api.Role{}, NewError(http.StatusBadRequest, "invalid_request", "role id required")
	}
	if !isValidRoleID(roleID) {
		return api.Role{}, NewError(http.StatusBadRequest, "invalid_request", "role id must contain only lowercase letters, numbers, and underscores")
	}
	// Check if role already exists
	exists, err := s.store.Q.RoleExists(ctx, roleID)
	if err != nil {
		return api.Role{}, err
	}
	if exists {
		return api.Role{}, NewError(http.StatusConflict, "conflict", "role id already exists")
	}
	// Create role
	err = s.store.Q.CreateRole(ctx, sqlc.CreateRoleParams{
		ID:          roleID,
		Name:        strings.TrimSpace(req.Name),
		Description: strings.TrimSpace(req.Description),
	})
	if err != nil {
		return api.Role{}, err
	}
	return api.Role{
		Id:          api.RoleId(roleID),
		Name:        req.Name,
		Description: req.Description,
	}, nil
}

func (s *AdminService) UpdateRole(ctx context.Context, roleID string, req api.UpdateRoleRequest) (api.Role, error) {
	if s.store == nil {
		return api.Role{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	// Check if role exists
	existing, err := s.store.Q.GetRoleByID(ctx, roleID)
	if err != nil {
		if err == sql.ErrNoRows {
			return api.Role{}, NewError(http.StatusNotFound, "not_found", "role not found")
		}
		return api.Role{}, err
	}
	// Prepare update parameters - keep existing values if not provided
	newName := existing.Name
	newDesc := existing.Description
	if req.Name != nil {
		newName = strings.TrimSpace(*req.Name)
	}
	if req.Description != nil {
		newDesc = strings.TrimSpace(*req.Description)
	}
	// Update role
	err = s.store.Q.UpdateRole(ctx, sqlc.UpdateRoleParams{
		ID:          roleID,
		Name:        newName,
		Description: newDesc,
	})
	if err != nil {
		return api.Role{}, err
	}
	// Return updated role
	return api.Role{
		Id:          api.RoleId(roleID),
		Name:        newName,
		Description: newDesc,
	}, nil
}

func (s *AdminService) DeleteRole(ctx context.Context, roleID string) error {
	if s.store == nil {
		return NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	// Prevent deletion of system roles
	if roleID == "user" || roleID == "admin" {
		return NewError(http.StatusForbidden, "forbidden", "cannot delete system role")
	}
	// Check if role exists
	_, err := s.store.Q.GetRoleByID(ctx, roleID)
	if err != nil {
		if err == sql.ErrNoRows {
			return NewError(http.StatusNotFound, "not_found", "role not found")
		}
		return err
	}
	// Delete role (cascade deletes user_roles and role_permissions)
	err = s.store.Q.DeleteRole(ctx, roleID)
	if err != nil {
		return err
	}
	return nil
}

// ==================== Role Permissions ====================

func (s *AdminService) GetRolePermissions(ctx context.Context, roleID string) ([]api.PermissionOverride, error) {
	if s.store == nil {
		return nil, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	// Check if role exists
	_, err := s.store.Q.GetRoleByID(ctx, roleID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, NewError(http.StatusNotFound, "not_found", "role not found")
		}
		return nil, err
	}
	// Get permissions
	rows, err := s.store.Q.GetRolePermissions(ctx, roleID)
	if err != nil {
		return nil, err
	}
	out := make([]api.PermissionOverride, 0, len(rows))
	for _, row := range rows {
		out = append(out, api.PermissionOverride{
			PermissionId: api.PermissionId(row.PermissionID),
			Scope:        api.PermissionScope(row.Scope),
			Effect:       api.PermissionEffect(row.Effect),
		})
	}
	return out, nil
}

func (s *AdminService) UpdateRolePermissions(ctx context.Context, roleID string, permissions []api.PermissionOverride) ([]api.PermissionOverride, error) {
	if s.store == nil {
		return nil, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	// Check if role exists
	_, err := s.store.Q.GetRoleByID(ctx, roleID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, NewError(http.StatusNotFound, "not_found", "role not found")
		}
		return nil, err
	}
	// Normalize permissions
	normalized, err := normalizeOverrides(permissions)
	if err != nil {
		return nil, err
	}
	// Update permissions in transaction
	err = s.store.WithTx(ctx, func(q *sqlc.Queries) error {
		if err := q.DeleteRolePermissions(ctx, roleID); err != nil {
			return err
		}
		for _, perm := range normalized {
			if err := q.AddRolePermission(ctx, sqlc.AddRolePermissionParams{
				RoleID:       roleID,
				PermissionID: perm.PermissionID,
				Scope:        perm.Scope,
				Effect:       sqlc.PermissionEffect(perm.Effect),
			}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, mapAdminForeignKeyError(err, "invalid permissionId")
	}
	// Return updated permissions
	out := make([]api.PermissionOverride, 0, len(normalized))
	for _, perm := range normalized {
		out = append(out, api.PermissionOverride{
			PermissionId: api.PermissionId(perm.PermissionID),
			Scope:        api.PermissionScope(perm.Scope),
			Effect:       api.PermissionEffect(perm.Effect),
		})
	}
	return out, nil
}

// ==================== Role Users ====================

func (s *AdminService) GetRoleUsers(ctx context.Context, roleID string, limit, offset int) (api.RoleUsersPage, error) {
	if s.store == nil {
		return api.RoleUsersPage{}, NewError(http.StatusServiceUnavailable, "service_unavailable", "database not configured")
	}
	// Check if role exists
	_, err := s.store.Q.GetRoleByID(ctx, roleID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return api.RoleUsersPage{}, NewError(http.StatusNotFound, "not_found", "role not found")
		}
		return api.RoleUsersPage{}, err
	}
	// Get users
	rows, err := s.store.Q.GetRoleUsers(ctx, sqlc.GetRoleUsersParams{
		RoleID: roleID,
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return api.RoleUsersPage{}, err
	}
	// Get total count
	total, err := s.store.Q.CountRoleUsers(ctx, roleID)
	if err != nil {
		return api.RoleUsersPage{}, err
	}
	// Convert to API types
	users := make([]api.RoleUser, 0, len(rows))
	for _, row := range rows {
		user := api.RoleUser{
			Id:       row.ID,
			Username: row.Username,
		}
		if row.DisplayName.Valid {
			user.DisplayName = &row.DisplayName.String
		}
		if row.AvatarMediaID.Valid {
			avatarURL := buildAvatarURL(row.AvatarMediaID.UUID)
			user.AvatarUrl = &avatarURL
		}
		users = append(users, user)
	}
	return api.RoleUsersPage{
		RoleId: roleID,
		Total:  int(total),
		Users:  users,
	}, nil
}

func isValidRoleID(roleID string) bool {
	if roleID == "" {
		return false
	}
	for _, c := range roleID {
		if !((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '_') {
			return false
		}
	}
	return true
}

func buildAvatarURL(mediaID uuid.UUID) string {
	// Placeholder implementation - should match your media URL structure
	return "/api/v1/media/" + mediaID.String() + "/view"
}
