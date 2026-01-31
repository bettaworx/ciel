package service_test

import (
	"context"
	"testing"

	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

func TestAuthzService_UserDenyOverridesRole(t *testing.T) {
	svc, mock, cleanup := newAuthzServiceWithMockStore(t)
	defer cleanup()

	userID := uuid.New()
	perm := "admin_access"
	scope := service.DefaultPermissionScope

	mock.ExpectQuery("FROM user_permissions").
		WithArgs(userID, perm, scope).
		WillReturnRows(sqlmock.NewRows([]string{"has_deny", "has_allow"}).AddRow(true, false))

	allowed, err := svc.HasPermission(context.Background(), userID, perm, "")
	if err != nil {
		t.Fatalf("HasPermission error: %v", err)
	}
	if allowed {
		t.Fatalf("expected deny to return false")
	}
	assertExpectations(t, mock)
}

func TestAuthzService_UserAllowShortCircuits(t *testing.T) {
	svc, mock, cleanup := newAuthzServiceWithMockStore(t)
	defer cleanup()

	userID := uuid.New()
	perm := "admin_access"
	scope := service.DefaultPermissionScope

	mock.ExpectQuery("FROM user_permissions").
		WithArgs(userID, perm, scope).
		WillReturnRows(sqlmock.NewRows([]string{"has_deny", "has_allow"}).AddRow(false, true))

	allowed, err := svc.HasPermission(context.Background(), userID, perm, "")
	if err != nil {
		t.Fatalf("HasPermission error: %v", err)
	}
	if !allowed {
		t.Fatalf("expected allow to return true")
	}
	assertExpectations(t, mock)
}

func TestAuthzService_RoleAllowWhenNoUserOverride(t *testing.T) {
	svc, mock, cleanup := newAuthzServiceWithMockStore(t)
	defer cleanup()

	userID := uuid.New()
	perm := "admin_access"
	scope := service.DefaultPermissionScope

	mock.ExpectQuery("FROM user_permissions").
		WithArgs(userID, perm, scope).
		WillReturnRows(sqlmock.NewRows([]string{"has_deny", "has_allow"}).AddRow(false, false))
	mock.ExpectQuery("FROM role_permissions").
		WithArgs(userID, perm, scope).
		WillReturnRows(sqlmock.NewRows([]string{"has_deny", "has_allow"}).AddRow(false, true))

	allowed, err := svc.HasPermission(context.Background(), userID, perm, scope)
	if err != nil {
		t.Fatalf("HasPermission error: %v", err)
	}
	if !allowed {
		t.Fatalf("expected role allow to return true")
	}
	assertExpectations(t, mock)
}

func TestAuthzService_RoleDenyWhenNoUserOverride(t *testing.T) {
	svc, mock, cleanup := newAuthzServiceWithMockStore(t)
	defer cleanup()

	userID := uuid.New()
	perm := "admin_access"
	scope := service.DefaultPermissionScope

	mock.ExpectQuery("FROM user_permissions").
		WithArgs(userID, perm, scope).
		WillReturnRows(sqlmock.NewRows([]string{"has_deny", "has_allow"}).AddRow(false, false))
	mock.ExpectQuery("FROM role_permissions").
		WithArgs(userID, perm, scope).
		WillReturnRows(sqlmock.NewRows([]string{"has_deny", "has_allow"}).AddRow(true, false))

	allowed, err := svc.HasPermission(context.Background(), userID, perm, scope)
	if err != nil {
		t.Fatalf("HasPermission error: %v", err)
	}
	if allowed {
		t.Fatalf("expected role deny to return false")
	}
	assertExpectations(t, mock)
}

func TestAuthzService_DefaultDeny(t *testing.T) {
	svc, mock, cleanup := newAuthzServiceWithMockStore(t)
	defer cleanup()

	userID := uuid.New()
	perm := "admin_access"
	scope := service.DefaultPermissionScope

	mock.ExpectQuery("FROM user_permissions").
		WithArgs(userID, perm, scope).
		WillReturnRows(sqlmock.NewRows([]string{"has_deny", "has_allow"}).AddRow(false, false))
	mock.ExpectQuery("FROM role_permissions").
		WithArgs(userID, perm, scope).
		WillReturnRows(sqlmock.NewRows([]string{"has_deny", "has_allow"}).AddRow(false, false))

	allowed, err := svc.HasPermission(context.Background(), userID, perm, "")
	if err != nil {
		t.Fatalf("HasPermission error: %v", err)
	}
	if allowed {
		t.Fatalf("expected default deny to return false")
	}
	assertExpectations(t, mock)
}

func TestAuthzService_InvalidPermission(t *testing.T) {
	svc, mock, cleanup := newAuthzServiceWithMockStore(t)
	defer cleanup()

	allowed, err := svc.HasPermission(context.Background(), uuid.New(), "  ", service.DefaultPermissionScope)
	if err == nil {
		t.Fatalf("expected error for empty permission")
	}
	if allowed {
		t.Fatalf("expected false for empty permission")
	}
	assertExpectations(t, mock)
}

func newAuthzServiceWithMockStore(t *testing.T) (*service.AuthzService, sqlmock.Sqlmock, func()) {
	t.Helper()

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	store := repository.NewStore(db)
	svc := service.NewAuthzService(store)
	cleanup := func() {
		_ = db.Close()
	}
	return svc, mock, cleanup
}

func assertExpectations(t *testing.T, mock sqlmock.Sqlmock) {
	t.Helper()
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}
