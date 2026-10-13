package service_test

import (
	"context"
	"net/http"
	"testing"
	"time"

	"backend/internal/auth"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

func newOAuthService(t *testing.T) (*service.OAuthService, sqlmock.Sqlmock, func()) {
	t.Helper()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	// nil code store: personal tokens never touch authorization codes.
	svc := service.NewOAuthService(repository.NewStore(db), auth.NewAuthorizationCodeStore(nil))
	return svc, mock, func() { _ = db.Close() }
}

func TestCreatePersonalAccessToken_NilStore(t *testing.T) {
	svc := service.NewOAuthService(nil, auth.NewAuthorizationCodeStore(nil))
	_, err := svc.CreatePersonalAccessToken(context.Background(), uuid.New(), "bot", []string{auth.ScopeReadPosts})
	assertServiceError(t, err, http.StatusServiceUnavailable, "service_unavailable")
}

// The name is what the owner identifies the token by later, so an empty one
// leaves a credential nobody can tell apart from the others.
func TestCreatePersonalAccessToken_RejectsBadName(t *testing.T) {
	svc, _, cleanup := newOAuthService(t)
	defer cleanup()

	for _, name := range []string{"", "   ", string(make([]byte, 61))} {
		_, err := svc.CreatePersonalAccessToken(context.Background(), uuid.New(), name, []string{auth.ScopeReadPosts})
		assertServiceError(t, err, http.StatusBadRequest, "invalid_request")
	}
}

// An unknown scope is refused rather than dropped: issuing a token with fewer
// permissions than asked for produces failures far from this decision.
func TestCreatePersonalAccessToken_RejectsUnknownScope(t *testing.T) {
	svc, _, cleanup := newOAuthService(t)
	defer cleanup()

	for _, scopes := range [][]string{
		{},
		{"read:everything"},
		{auth.ScopeReadPosts, "admin:all"},
	} {
		_, err := svc.CreatePersonalAccessToken(context.Background(), uuid.New(), "bot", scopes)
		assertServiceError(t, err, http.StatusBadRequest, "invalid_scope")
	}
}

func TestCreatePersonalAccessToken_EnforcesTheCap(t *testing.T) {
	svc, mock, cleanup := newOAuthService(t)
	defer cleanup()

	userID := uuid.New()
	mock.ExpectQuery(`-- name: CountPersonalAccessTokens`).WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(20))

	_, err := svc.CreatePersonalAccessToken(context.Background(), userID, "bot", []string{auth.ScopeReadPosts})
	assertServiceError(t, err, http.StatusConflict, "too_many_tokens")
}

func TestCreatePersonalAccessToken_Issues(t *testing.T) {
	svc, mock, cleanup := newOAuthService(t)
	defer cleanup()

	userID := uuid.New()
	tokenID := uuid.New()

	mock.ExpectQuery(`-- name: CountPersonalAccessTokens`).WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(`-- name: CreatePersonalAccessToken`).
		WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "name", "scopes", "access_expires_at", "created_at"}).
			AddRow(tokenID, userID, "my bot", []byte("{read:posts}"), fixedTime(), fixedTime()))

	issued, err := svc.CreatePersonalAccessToken(context.Background(), userID, "  my bot  ", []string{auth.ScopeReadPosts})
	if err != nil {
		t.Fatalf("CreatePersonalAccessToken: %v", err)
	}

	// The prefix is what the auth middleware uses to route a bearer token to
	// the OAuth verifier instead of the JWT parser. A personal token that did
	// not carry it would be parsed as a JWT and rejected on every request.
	if len(issued.Secret) <= len(service.AccessTokenPrefix) ||
		issued.Secret[:len(service.AccessTokenPrefix)] != service.AccessTokenPrefix {
		t.Errorf("secret = %q, want the %q prefix", issued.Secret, service.AccessTokenPrefix)
	}
	if issued.Token.ID != tokenID {
		t.Errorf("token id = %v, want %v", issued.Token.ID, tokenID)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// Two tokens issued back to back must not collide, which is the whole point of
// generating them from crypto/rand rather than anything derived.
func TestCreatePersonalAccessToken_SecretsAreDistinct(t *testing.T) {
	seen := map[string]bool{}
	for i := 0; i < 5; i++ {
		svc, mock, cleanup := newOAuthService(t)
		userID := uuid.New()
		mock.ExpectQuery(`-- name: CountPersonalAccessTokens`).WithArgs(userID).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
		mock.ExpectQuery(`-- name: CreatePersonalAccessToken`).
			WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "name", "scopes", "access_expires_at", "created_at"}).
				AddRow(uuid.New(), userID, "bot", []byte("{read:posts}"), fixedTime(), fixedTime()))

		issued, err := svc.CreatePersonalAccessToken(context.Background(), userID, "bot", []string{auth.ScopeReadPosts})
		if err != nil {
			t.Fatalf("CreatePersonalAccessToken: %v", err)
		}
		if seen[issued.Secret] {
			t.Fatalf("a secret repeated after %d issues", i+1)
		}
		seen[issued.Secret] = true
		cleanup()
	}
}

// Revoking is scoped to the owner in SQL, so somebody else's token id matches
// no row — which must read as not found rather than as success.
func TestRevokePersonalAccessToken_NotFound(t *testing.T) {
	svc, mock, cleanup := newOAuthService(t)
	defer cleanup()

	mock.ExpectExec(`-- name: RevokePersonalAccessToken`).
		WillReturnResult(sqlmock.NewResult(0, 0))

	err := svc.RevokePersonalAccessToken(context.Background(), uuid.New(), uuid.New())
	assertServiceError(t, err, http.StatusNotFound, "not_found")
}

func TestRevokePersonalAccessToken_Revokes(t *testing.T) {
	svc, mock, cleanup := newOAuthService(t)
	defer cleanup()

	userID := uuid.New()
	tokenID := uuid.New()
	mock.ExpectExec(`-- name: RevokePersonalAccessToken`).
		WithArgs(tokenID, userID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	if err := svc.RevokePersonalAccessToken(context.Background(), userID, tokenID); err != nil {
		t.Fatalf("RevokePersonalAccessToken: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

// A stable timestamp for rows the assertions do not look at.
func fixedTime() time.Time {
	return time.Unix(1_700_000_000, 0).UTC()
}
