package service_test

import (
	"context"
	"database/sql"
	"encoding/base64"
	"errors"
	"net/http"
	"testing"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/service"
	"backend/tests/testutil"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

func passkeyService(t *testing.T) (*service.AuthService, sqlmock.Sqlmock, *auth.MemoryWebAuthnSessionStore) {
	t.Helper()
	svc, mock, _, cleanup := newMFATestService(t)
	t.Cleanup(cleanup)
	wa, err := auth.NewWebAuthn(auth.WebAuthnConfig{RPDisplayName: "Ciel", RPID: "localhost", RPOrigins: []string{"http://localhost:3000"}})
	if err != nil {
		t.Fatal(err)
	}
	sessions := auth.NewMemoryWebAuthnSessionStore()
	svc.SetMFA(nil, auth.NewMemoryMfaSessionStore(), nil, wa, sessions, nil, "")
	t.Cleanup(func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Error(err)
		}
	})
	return svc, mock, sessions
}

func credentialRows(userID, credentialID uuid.UUID, key testutil.Passkey, count int64) *sqlmock.Rows {
	return sqlmock.NewRows([]string{"id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "name", "created_at", "last_used_at", "backup_eligible", "backup_state"}).
		AddRow(credentialID, userID, key.ID, key.PublicKey, "none", nil, count, "{}", "key", time.Now(), nil, false, false)
}

func expectPasskeyLookup(mock sqlmock.Sqlmock, userID, id uuid.UUID, key testutil.Passkey, count int64) {
	mock.ExpectQuery(`WHERE credential_id = \$1`).WithArgs(key.ID).WillReturnRows(credentialRows(userID, id, key, count))
	mock.ExpectQuery(`WHERE user_id = \$1\s+ORDER BY created_at`).WithArgs(userID).WillReturnRows(credentialRows(userID, id, key, count))
}

func TestPasskeyOptionsAreAccountIndependent(t *testing.T) {
	svc, _, _ := passkeyService(t)
	first, err := svc.PasskeyLoginOptions()
	if err != nil {
		t.Fatal(err)
	}
	second, err := svc.PasskeyLoginOptions()
	if err != nil {
		t.Fatal(err)
	}
	pk := first.Options["publicKey"].(map[string]interface{})
	if pk["userVerification"] != "required" || pk["rpId"] != "localhost" {
		t.Fatalf("unexpected options: %v", pk)
	}
	if ids, ok := pk["allowCredentials"]; ok {
		t.Fatalf("credential IDs disclosed: %v", ids)
	}
	if first.SessionId == second.SessionId || pk["challenge"] == second.Options["publicKey"].(map[string]interface{})["challenge"] {
		t.Fatal("challenge/session reused")
	}
}

func TestPasskeyLoginVerification(t *testing.T) {
	for _, scenario := range []string{"success", "opted_out", "bad_signature", "no_uv", "wrong_origin", "wrong_rp", "wrong_handle", "missing_handle", "unknown_credential", "counter_regression", "counter_reset", "concurrent_update", "storage_error"} {
		t.Run(scenario, func(t *testing.T) {
			svc, mock, _ := passkeyService(t)
			userID, id := uuid.New(), uuid.New()
			key := testutil.NewPasskey(t)
			options, err := svc.PasskeyLoginOptions()
			if err != nil {
				t.Fatal(err)
			}
			origin, rpID, flags, count, storedCount := "http://localhost:3000", "localhost", byte(5), uint32(1), int64(0)
			if scenario == "no_uv" {
				flags = 1
			}
			if scenario == "wrong_origin" {
				origin = "https://evil.example"
			}
			if scenario == "wrong_rp" {
				rpID = "evil.example"
			}
			if scenario == "counter_regression" {
				storedCount = 1
			}
			if scenario == "counter_reset" {
				storedCount, count = 1, 0
			}
			credential := key.Assertion(t, options.Options, userID, origin, rpID, count, flags)
			response := credential["response"].(map[string]interface{})
			if scenario == "bad_signature" {
				response["signature"] = base64.RawURLEncoding.EncodeToString([]byte("invalid"))
			}
			if scenario == "wrong_handle" {
				handle := uuid.New()
				response["userHandle"] = base64.RawURLEncoding.EncodeToString(handle[:])
			}
			if scenario == "missing_handle" {
				delete(response, "userHandle")
			}
			if scenario == "unknown_credential" {
				mock.ExpectQuery(`WHERE credential_id = \$1`).WithArgs(key.ID).WillReturnError(sql.ErrNoRows)
			} else if scenario == "wrong_handle" {
				mock.ExpectQuery(`WHERE credential_id = \$1`).WithArgs(key.ID).WillReturnRows(credentialRows(userID, id, key, storedCount))
			} else if scenario != "missing_handle" {
				expectPasskeyLookup(mock, userID, id, key, storedCount)
			}
			if scenario == "success" || scenario == "opted_out" || scenario == "concurrent_update" || scenario == "storage_error" {
				mock.ExpectBegin()
				mock.ExpectQuery(`SELECT username FROM users`).WithArgs(userID).WillReturnRows(sqlmock.NewRows([]string{"username"}).AddRow("alice"))
				preference := mock.ExpectQuery(`SELECT EXISTS\(SELECT 1 FROM auth_passkey_login`).WithArgs(userID)
				if scenario == "storage_error" {
					preference.WillReturnError(errors.New("database unavailable"))
				} else {
					preference.WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(scenario != "opted_out"))
				}
				if scenario == "success" || scenario == "concurrent_update" {
					affected := int64(1)
					if scenario == "concurrent_update" {
						affected = 0
					}
					mock.ExpectExec(`UPDATE auth_webauthn_credentials`).WithArgs(int64(count), false, id, storedCount).WillReturnResult(sqlmock.NewResult(0, affected))
				}
				if scenario == "success" {
					mock.ExpectCommit()
					mock.ExpectQuery(`INSERT INTO refresh_tokens`).WithArgs(userID, sqlmock.AnyArg(), sqlmock.AnyArg()).WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "token_hash", "created_at", "expires_at", "revoked_at"}).AddRow(uuid.New(), userID, []byte{1}, time.Now(), time.Now().Add(time.Hour), nil))
					rows := sqlmock.NewRows(authRowColumns())
					addAuthRow(rows, userID, "alice")
					mock.ExpectQuery(`SELECT\s+u.id`).WithArgs(userID).WillReturnRows(rows)
				} else {
					mock.ExpectRollback()
				}
			}
			login, refresh, err := svc.PasskeyLoginVerify(context.Background(), api.PasskeyLoginVerifyRequest{SessionId: options.SessionId, Credential: credential})
			if scenario == "success" {
				if err != nil {
					t.Fatal(err)
				}
				if login.AccessToken == "" || refresh == "" || login.User.Id != userID {
					t.Fatal("missing login/session")
				}
			} else {
				assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
				if err.(*service.Error).Message != "passkey login failed" {
					t.Fatalf("non-uniform error: %v", err)
				}
			}
			_, _, err = svc.PasskeyLoginVerify(context.Background(), api.PasskeyLoginVerifyRequest{SessionId: options.SessionId, Credential: credential})
			assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
		})
	}
}

func TestPasskeySessionPurposeAndExpiry(t *testing.T) {
	for _, purpose := range []string{"register", "assert", "expired", "unknown"} {
		t.Run(purpose, func(t *testing.T) {
			svc, _, sessions := passkeyService(t)
			expires := time.Now().Add(time.Minute)
			storedPurpose := purpose
			if purpose == "expired" {
				expires, storedPurpose = time.Now().Add(-time.Minute), "passkey_login"
			}
			if err := sessions.Put(auth.WebAuthnSessionData{SessionID: "test", Purpose: storedPurpose, ExpiresAtUTC: expires}); err != nil {
				t.Fatal(err)
			}
			_, _, err := svc.PasskeyLoginVerify(context.Background(), api.PasskeyLoginVerifyRequest{SessionId: "test"})
			assertServiceError(t, err, http.StatusUnauthorized, "unauthorized")
		})
	}
}

func TestPasskeyLoginPreference(t *testing.T) {
	for _, scenario := range []string{"enable", "disable", "no_key", "storage_error", "unauthenticated"} {
		t.Run(scenario, func(t *testing.T) {
			svc, mock, _ := passkeyService(t)
			user := auth.User{ID: uuid.New(), Username: "alice"}
			if scenario == "unauthenticated" {
				assertServiceError(t, svc.SetPasskeyLogin(context.Background(), auth.User{}, true), http.StatusUnauthorized, "unauthorized")
				return
			}
			mock.ExpectBegin()
			mock.ExpectQuery(`SELECT username FROM users`).WithArgs(user.ID).WillReturnRows(sqlmock.NewRows([]string{"username"}).AddRow("alice"))
			if scenario == "disable" {
				mock.ExpectExec(`DELETE FROM auth_passkey_login`).WithArgs(user.ID).WillReturnResult(sqlmock.NewResult(0, 1))
			} else {
				expectation := mock.ExpectExec(`INSERT INTO auth_passkey_login`).WithArgs(user.ID)
				switch scenario {
				case "no_key":
					expectation.WillReturnResult(sqlmock.NewResult(0, 0))
				case "storage_error":
					expectation.WillReturnError(errors.New("database unavailable"))
				default:
					expectation.WillReturnResult(sqlmock.NewResult(0, 1))
				}
			}
			if scenario == "no_key" || scenario == "storage_error" {
				mock.ExpectRollback()
			} else {
				mock.ExpectCommit()
			}
			err := svc.SetPasskeyLogin(context.Background(), user, scenario != "disable")
			if scenario == "no_key" {
				assertServiceError(t, err, http.StatusBadRequest, "passkey_required")
			} else if scenario == "storage_error" {
				if err == nil {
					t.Fatal("storage error swallowed")
				}
			} else if err != nil {
				t.Fatal(err)
			}
		})
	}
}
