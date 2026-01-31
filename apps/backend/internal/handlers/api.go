package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/logging"
	"backend/internal/service"
	"backend/internal/service/admin"
	"backend/internal/service/moderation"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	openapi_types "github.com/oapi-codegen/runtime/types"
	"github.com/redis/go-redis/v9"
)

// API implements the generated OpenAPI server interface.
type API struct {
	Auth       *service.AuthService
	Admin      *service.AdminService
	Authz      *service.AuthzService
	Users      *service.UsersService
	Posts      *service.PostsService
	Timeline   *service.TimelineService
	Reactions  *service.ReactionsService
	Media      *service.MediaService
	Setup      *service.SetupService
	Agreements *service.AgreementsService
	Tokens     *auth.TokenManager
	Redis      *redis.Client

	// Admin services
	AdminInvites    *admin.InvitesService
	AdminUsers      *admin.UsersService
	AdminProfile    *admin.ProfileService
	AdminAgreements *admin.AgreementsService

	// Moderation services
	ModLogs          *moderation.LogsService
	ModMutes         *moderation.MutesService
	ModReports       *moderation.ReportsService
	ModBannedContent *moderation.BannedContentService
	ModIPBans        *moderation.IPBansService
	ModPosts         *moderation.PostsService
	ModMedia         *moderation.MediaService
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeServiceError(w http.ResponseWriter, err error) {
	if err == nil {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if se, ok := err.(*service.Error); ok {
		writeJSON(w, se.Status, api.Error{Code: se.Code, Message: se.Message})
		return
	}
	// Provide a helpful message for common DB schema mismatch issues (e.g., container volume
	// created with an older schema.sql). Keep details out of the HTTP response.
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "42703", "42P01": // undefined_column, undefined_table
			writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "database schema out of date; apply the latest migrations"})
			return
		}
	}

	slog.Error("internal error", "error", err)
	// Default to 500 without leaking details.
	writeJSON(w, http.StatusInternalServerError, api.Error{Code: "internal", Message: "internal error"})
}

func (h API) GetHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func (h API) PostAuthRegister(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	var req api.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	user, err := h.Auth.Register(r.Context(), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, user)
}

func (h API) PostAuthLoginStart(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	var req api.LoginStartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	resp, err := h.Auth.LoginStart(r.Context(), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h API) PostAuthLoginFinish(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	var req api.LoginFinishRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	resp, err := h.Auth.LoginFinish(r.Context(), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Set HttpOnly cookie for secure authentication
	setAuthCookie(w, r, resp.AccessToken, resp.ExpiresInSeconds)

	writeJSON(w, http.StatusOK, resp)
}

func (h API) PostAuthStepupStart(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	var req api.StepupStartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	resp, err := h.Auth.StepUpStart(r.Context(), user, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h API) PostAuthStepupFinish(w http.ResponseWriter, r *http.Request) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	var req api.StepupFinishRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	resp, err := h.Auth.StepUpFinish(r.Context(), user, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h API) PostAuthLogout(w http.ResponseWriter, r *http.Request) {
	// Determine if connection is secure
	isSecure := r.TLS != nil ||
		r.Header.Get("X-Forwarded-Proto") == "https" ||
		r.Header.Get("X-Forwarded-Ssl") == "on" ||
		r.Header.Get("X-Forwarded-Scheme") == "https"

	// Get cookie domain from environment (must match the domain used when setting the cookie)
	cookieDomain := os.Getenv("COOKIE_DOMAIN")

	// Clear the auth cookie
	// CRITICAL: All attributes (Domain, Path, Secure, SameSite) must match the original cookie
	// for the deletion to work properly
	cookie := &http.Cookie{
		Name:     "ciel_auth",
		Value:    "",
		Path:     "/",
		Domain:   cookieDomain, // CRITICAL: Must match COOKIE_DOMAIN to delete the cookie
		MaxAge:   -1,           // Delete cookie immediately
		HttpOnly: true,
		Secure:   isSecure,
		SameSite: http.SameSiteStrictMode,
	}
	http.SetCookie(w, cookie)

	// Stateless logout for JWT; kept for future token revocation.
	w.WriteHeader(http.StatusNoContent)
}

func (h API) GetMe(w http.ResponseWriter, r *http.Request) {
	if h.Users == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "users not configured"})
		return
	}
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	me, err := h.Users.GetByID(r.Context(), user.ID)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Check if user is admin
	isAdmin := false
	if h.Authz != nil {
		isAdmin, _ = h.Authz.HasPermission(r.Context(), user.ID, "admin.all", "global")
	}
	me.IsAdmin = &isAdmin

	slog.Info("GetMe response",
		"user_id", user.ID,
		"username", me.Username,
		"isAdmin", isAdmin,
		"isAdminPtr", me.IsAdmin)

	writeJSON(w, http.StatusOK, me)
}

func (h API) PatchMeProfile(w http.ResponseWriter, r *http.Request) {
	if h.Users == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "users not configured"})
		return
	}
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	var req api.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	updated, err := h.Users.UpdateProfile(r.Context(), user.ID, req.DisplayName, req.Bio)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (h API) PostMeAvatar(w http.ResponseWriter, r *http.Request) {
	if h.Users == nil || h.Media == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "users/media not configured"})
		return
	}
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	media, err := h.Media.UploadAvatarFromRequest(w, r, user)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	updated, previous, err := h.Users.UpdateAvatar(r.Context(), user.ID, media.Id)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	if previous != nil && *previous != media.Id {
		if err := h.Media.DeleteMedia(r.Context(), user.ID, *previous); err != nil {
			slog.Warn("failed to delete old avatar", "media_id", previous.String(), "error", err)
		}
	}
	writeJSON(w, http.StatusOK, updated)
}

func (h API) PostAuthPasswordChange(w http.ResponseWriter, r *http.Request, _ api.PostAuthPasswordChangeParams) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	if !requireStepup(w, r, h.Tokens, h.Redis, user, "password_change") {
		return
	}
	var req api.PasswordChangeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	if err := h.Auth.ChangePassword(r.Context(), user, req); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h API) DeleteMe(w http.ResponseWriter, r *http.Request, _ api.DeleteMeParams) {
	if h.Auth == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "auth not configured"})
		return
	}
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	if !requireStepup(w, r, h.Tokens, h.Redis, user, "account_delete") {
		return
	}
	if err := h.Auth.DeleteAccount(r.Context(), user); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h API) GetUsersUsername(w http.ResponseWriter, r *http.Request, username api.Username) {
	if h.Users == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "users not configured"})
		return
	}
	u, err := h.Users.GetByUsername(r.Context(), username)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, u)
}

func (h API) GetUsersUsernamePosts(w http.ResponseWriter, r *http.Request, username api.Username, params api.GetUsersUsernamePostsParams) {
	if h.Posts == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "posts not configured"})
		return
	}
	page, err := h.Posts.ListByUsername(r.Context(), username, params)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h API) PostPosts(w http.ResponseWriter, r *http.Request) {
	if h.Posts == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "posts not configured"})
		return
	}
	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	if !requirePermission(w, r, h.Authz, caller, "posts_create") {
		return
	}

	var req api.CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	post, err := h.Posts.Create(r.Context(), caller, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, post)
}

func (h API) GetPostsPostId(w http.ResponseWriter, r *http.Request, postId api.PostId) {
	if h.Posts == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "posts not configured"})
		return
	}
	post, err := h.Posts.Get(r.Context(), postId)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, post)
}

func (h API) DeletePostsPostId(w http.ResponseWriter, r *http.Request, postId api.PostId) {
	if h.Posts == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "posts not configured"})
		return
	}
	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	if !requirePermission(w, r, h.Authz, caller, "posts_delete") {
		return
	}
	if err := h.Posts.Delete(r.Context(), caller, postId); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h API) GetTimeline(w http.ResponseWriter, r *http.Request, params api.GetTimelineParams) {
	if h.Timeline == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "timeline not configured"})
		return
	}
	page, err := h.Timeline.Get(r.Context(), params)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, page)
}

func (h API) PostMedia(w http.ResponseWriter, r *http.Request) {
	if h.Media == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "media not configured"})
		return
	}
	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	if !requirePermission(w, r, h.Authz, caller, "media_upload") {
		return
	}
	media, err := h.Media.UploadImageFromRequest(w, r, caller)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, media)
}

func (h API) GetPostsPostIdReactions(w http.ResponseWriter, r *http.Request, postId api.PostId) {
	if h.Reactions == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "reactions not configured"})
		return
	}
	// Get optional user ID from context (nil if anonymous)
	user, ok := auth.UserFromContext(r.Context())
	var userID *api.UserId
	if ok {
		userID = &user.ID
	}
	counts, err := h.Reactions.List(r.Context(), postId, userID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, counts)
}

func (h API) PostPostsPostIdReactions(w http.ResponseWriter, r *http.Request, postId api.PostId) {
	if h.Reactions == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "reactions not configured"})
		return
	}
	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	if !requirePermission(w, r, h.Authz, caller, "reactions_add") {
		return
	}
	var req api.ReactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	counts, err := h.Reactions.Add(r.Context(), caller, postId, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, counts)
}

func (h API) DeletePostsPostIdReactions(w http.ResponseWriter, r *http.Request, postId api.PostId, params api.DeletePostsPostIdReactionsParams) {
	if h.Reactions == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "reactions not configured"})
		return
	}
	caller, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}
	if !requirePermission(w, r, h.Authz, caller, "reactions_remove") {
		return
	}
	// form tag is handled by generated wrapper; but keep a fallback for safety.
	emoji := params.Emoji
	if strings.TrimSpace(string(emoji)) == "" {
		// try query param
		emoji = api.Emoji(r.URL.Query().Get("emoji"))
	}
	counts, err := h.Reactions.Remove(r.Context(), caller, postId, emoji)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, counts)
}

func (h API) GetAdminRoles(w http.ResponseWriter, r *http.Request) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	roles, err := h.Admin.ListRoles(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, api.RoleList(roles))
}

func (h API) PostAdminRoles(w http.ResponseWriter, r *http.Request) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	var req api.CreateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	role, err := h.Admin.CreateRole(r.Context(), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, role)
}

func (h API) GetAdminRolesRoleId(w http.ResponseWriter, r *http.Request, roleId api.RoleId) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	role, err := h.Admin.GetRole(r.Context(), roleId)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, role)
}

func (h API) PatchAdminRolesRoleId(w http.ResponseWriter, r *http.Request, roleId api.RoleId) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	var req api.UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	role, err := h.Admin.UpdateRole(r.Context(), roleId, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, role)
}

func (h API) DeleteAdminRolesRoleId(w http.ResponseWriter, r *http.Request, roleId api.RoleId) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	if err := h.Admin.DeleteRole(r.Context(), roleId); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h API) GetAdminRolesRoleIdPermissions(w http.ResponseWriter, r *http.Request, roleId api.RoleId) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	permissions, err := h.Admin.GetRolePermissions(r.Context(), roleId)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, api.RolePermissions{Permissions: permissions})
}

func (h API) PutAdminRolesRoleIdPermissions(w http.ResponseWriter, r *http.Request, roleId api.RoleId) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	var req api.RolePermissions
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	permissions, err := h.Admin.UpdateRolePermissions(r.Context(), roleId, req.Permissions)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, api.RolePermissions{Permissions: permissions})
}

func (h API) GetAdminRolesRoleIdUsers(w http.ResponseWriter, r *http.Request, roleId api.RoleId, params api.GetAdminRolesRoleIdUsersParams) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	limit := 50
	if params.Limit != nil {
		limit = *params.Limit
	}
	offset := 0
	if params.Offset != nil {
		offset = *params.Offset
	}
	usersPage, err := h.Admin.GetRoleUsers(r.Context(), roleId, limit, offset)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, usersPage)
}

func (h API) GetAdminPermissions(w http.ResponseWriter, r *http.Request) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	perms, err := h.Admin.ListPermissions(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, api.PermissionList(perms))
}

func (h API) GetAdminUsersUserIdRoles(w http.ResponseWriter, r *http.Request, userId api.UserId) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	roles, err := h.Admin.GetUserRoles(r.Context(), userId)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, api.RoleList(roles))
}

func (h API) PutAdminUsersUserIdRoles(w http.ResponseWriter, r *http.Request, userId api.UserId) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	var req api.UserRolesUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	roles, err := h.Admin.UpdateUserRoles(r.Context(), userId, req.Roles)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, api.RoleList(roles))
}

func (h API) GetAdminUsersUserIdPermissions(w http.ResponseWriter, r *http.Request, userId api.UserId) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	overrides, err := h.Admin.GetUserPermissionOverrides(r.Context(), userId)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, api.UserPermissionOverrides{Overrides: overrides})
}

func (h API) PutAdminUsersUserIdPermissions(w http.ResponseWriter, r *http.Request, userId api.UserId) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	var req api.UserPermissionOverrides
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	overrides, err := h.Admin.UpdateUserPermissionOverrides(r.Context(), userId, req.Overrides)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, api.UserPermissionOverrides{Overrides: overrides})
}

func (h API) PostAdminUsersUserIdBan(w http.ResponseWriter, r *http.Request, userId api.UserId) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	var req api.BanUserRequest
	if r.Body != nil {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil && !errors.Is(err, io.EOF) {
			writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
			return
		}
	}
	if err := h.Admin.BanUser(r.Context(), userId, req.TtlSeconds); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h API) DeleteAdminUsersUserIdBan(w http.ResponseWriter, r *http.Request, userId api.UserId) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	if err := h.Admin.UnbanUser(r.Context(), userId); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h API) GetAdminSettings(w http.ResponseWriter, r *http.Request) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	settings, err := h.Admin.GetServerSettings(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, settings)
}

func (h API) PatchAdminSettingsSignup(w http.ResponseWriter, r *http.Request) {
	if h.Admin == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "admin not configured"})
		return
	}
	var req api.UpdateSignupEnabledRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}
	settings, err := h.Admin.UpdateSignupEnabled(r.Context(), req.SignupEnabled)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, settings)
}

func requirePermission(w http.ResponseWriter, r *http.Request, authz *service.AuthzService, user auth.User, permissionID string) bool {
	if authz == nil {
		writeServiceError(w, service.NewError(http.StatusServiceUnavailable, "service_unavailable", "authz not configured"))
		return false
	}
	allowed, err := authz.HasPermission(r.Context(), user.ID, permissionID, service.DefaultPermissionScope)
	if err != nil {
		writeServiceError(w, err)
		return false
	}
	if !allowed {
		writeJSON(w, http.StatusForbidden, api.Error{Code: "forbidden", Message: "forbidden"})
		return false
	}
	return true
}

const stepupHeader = "X-Stepup-Token"

// stepupAuditAttrs creates audit log attributes for stepup operations
func stepupAuditAttrs(r *http.Request, user auth.User, action string) []slog.Attr {
	attrs := []slog.Attr{
		slog.String("actor_user_id", user.ID.String()),
		slog.String("action", action),
	}
	return append(attrs, logging.RequestAttrs(r.Context())...)
}

// validateStepupTokenManager checks if token manager is configured
func validateStepupTokenManager(w http.ResponseWriter, r *http.Request, tokens *auth.TokenManager, auditAttrs []slog.Attr) bool {
	if tokens == nil {
		logging.Audit(r.Context(), "auth.stepup.use", "failure", append(auditAttrs, slog.String("reason", "token_manager_missing"))...)
		writeServiceError(w, service.NewError(http.StatusServiceUnavailable, "service_unavailable", "token manager not configured"))
		return false
	}
	return true
}

// extractAndParseStepupToken extracts and parses the stepup token from request
func extractAndParseStepupToken(w http.ResponseWriter, r *http.Request, tokens *auth.TokenManager, user auth.User, auditAttrs []slog.Attr) (auth.User, string, time.Time, bool) {
	stepupToken := strings.TrimSpace(r.Header.Get(stepupHeader))
	if stepupToken == "" {
		logging.Audit(r.Context(), "auth.stepup.use", "failure", append(auditAttrs, slog.String("reason", "missing_token"))...)
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "stepup_required", Message: "step-up authentication required"})
		return auth.User{}, "", time.Time{}, false
	}

	stepupUser, jti, exp, err := tokens.ParseStepup(stepupToken)
	if err != nil {
		logging.Audit(r.Context(), "auth.stepup.use", "failure", append(auditAttrs, slog.String("reason", "invalid_token"))...)
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return auth.User{}, "", time.Time{}, false
	}

	if stepupUser.ID != user.ID {
		logging.Audit(r.Context(), "auth.stepup.use", "failure", append(auditAttrs, slog.String("reason", "user_mismatch"))...)
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return auth.User{}, "", time.Time{}, false
	}

	return stepupUser, jti, exp, true
}

// checkStepupTokenReplay validates token is not expired and prevents replay attacks using Redis
func checkStepupTokenReplay(w http.ResponseWriter, r *http.Request, rdb *redis.Client, jti string, exp time.Time, user auth.User, auditAttrs []slog.Attr) bool {
	if rdb == nil {
		logging.Audit(r.Context(), "auth.stepup.use", "failure", append(auditAttrs, slog.String("reason", "redis_unavailable"))...)
		writeServiceError(w, service.NewError(http.StatusServiceUnavailable, "service_unavailable", "step-up verification temporarily unavailable"))
		return false
	}

	ttl := time.Until(exp)
	if ttl <= 0 {
		logging.Audit(r.Context(), "auth.stepup.use", "failure", append(auditAttrs, slog.String("reason", "expired"))...)
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return false
	}

	ok, err := rdb.SetNX(r.Context(), "stepup:jti:"+jti, "1", ttl).Result()
	if err != nil {
		// Redis error: fail closed for security
		slog.Error("stepup replay check failed", "error", err, "user_id", user.ID)
		logging.Audit(r.Context(), "auth.stepup.use", "failure", append(auditAttrs, slog.String("reason", "redis_error"))...)
		writeServiceError(w, service.NewError(http.StatusServiceUnavailable, "service_unavailable", "step-up verification failed"))
		return false
	}

	if !ok {
		logging.Audit(r.Context(), "auth.stepup.use", "failure", append(auditAttrs, slog.String("reason", "replay"))...)
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return false
	}

	return true
}

func requireStepup(w http.ResponseWriter, r *http.Request, tokens *auth.TokenManager, rdb *redis.Client, user auth.User, action string) bool {
	// Step 1: Setup audit logging attributes
	auditAttrs := stepupAuditAttrs(r, user, action)

	// Step 2: Validate token manager is configured
	if !validateStepupTokenManager(w, r, tokens, auditAttrs) {
		return false
	}

	// Step 3: Extract and parse stepup token
	_, jti, exp, ok := extractAndParseStepupToken(w, r, tokens, user, auditAttrs)
	if !ok {
		return false
	}

	// Step 4: Check token replay using Redis
	if !checkStepupTokenReplay(w, r, rdb, jti, exp, user, auditAttrs) {
		return false
	}

	// Success
	logging.Audit(r.Context(), "auth.stepup.use", "success", auditAttrs...)
	return true
}

// Setup endpoints

func (h API) GetSetupStatus(w http.ResponseWriter, r *http.Request) {
	if h.Setup == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "setup service not configured"})
		return
	}
	status, err := h.Setup.GetSetupStatus(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, status)
}

func (h API) PostSetupVerifyPassword(w http.ResponseWriter, r *http.Request) {
	if h.Setup == nil {
		slog.Error("setup service not configured")
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "setup service not configured"})
		return
	}
	var req struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("invalid json in verify-password request", "error", err)
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}

	valid, token, err := h.Setup.VerifySetupPassword(r.Context(), req.Password)
	if err != nil {
		slog.Error("setup password verification failed", "error", err, "remote_addr", r.RemoteAddr)
		writeServiceError(w, err)
		return
	}

	if !valid {
		// SECURITY: Only log failed attempts for security monitoring (no success details)
		slog.Warn("invalid setup password attempt", "remote_addr", r.RemoteAddr)
		writeJSON(w, http.StatusOK, map[string]interface{}{"valid": false, "setupToken": ""})
		return
	}

	// Success - minimal logging (no token existence info)
	slog.Info("setup password verified", "remote_addr", r.RemoteAddr)
	writeJSON(w, http.StatusOK, map[string]interface{}{"valid": true, "setupToken": token})
}

func (h API) PostSetupCreateAdmin(w http.ResponseWriter, r *http.Request) {
	if h.Setup == nil {
		slog.Error("setup service not configured")
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "setup service not configured"})
		return
	}
	var req struct {
		SetupToken string `json:"setupToken"`
		Username   string `json:"username"`
		Password   string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("invalid json in create-admin request", "error", err)
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}

	slog.Info("creating admin account", "remote_addr", r.RemoteAddr)

	user, token, err := h.Setup.CreateAdminAccount(r.Context(), req.SetupToken, req.Username, req.Password)
	if err != nil {
		slog.Error("failed to create admin account", "error", err, "username", req.Username)
		writeServiceError(w, err)
		return
	}

	slog.Info("admin account created successfully", "user_id", user.Id, "username", user.Username)

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"user":  user,
		"token": token,
	})
}

func (h API) PatchSetupComplete(w http.ResponseWriter, r *http.Request) {
	if h.Setup == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "setup service not configured"})
		return
	}

	// Require authentication
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}

	// Require admin permission
	if h.Authz == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "authz service not configured"})
		return
	}
	hasPermission, err := h.Authz.HasPermission(r.Context(), user.ID, "admin_access", service.DefaultPermissionScope)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	if !hasPermission {
		writeJSON(w, http.StatusForbidden, api.Error{Code: "forbidden", Message: "admin access required"})
		return
	}

	var req struct {
		ServerName        *string `json:"serverName"`
		ServerDescription *string `json:"serverDescription"`
		ServerIconMediaID *string `json:"serverIconMediaId"`
		InviteOnly        *bool   `json:"inviteOnly"`
		InviteCode        *string `json:"inviteCode"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}

	// Parse UUID if provided
	var serverIconMediaID *uuid.UUID
	if req.ServerIconMediaID != nil && *req.ServerIconMediaID != "" {
		parsed, err := uuid.Parse(*req.ServerIconMediaID)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid server icon media id"})
			return
		}
		serverIconMediaID = &parsed
	}

	params := service.ServerSetupParams{
		ServerName:        req.ServerName,
		ServerDescription: req.ServerDescription,
		ServerIconMediaID: serverIconMediaID,
		InviteOnly:        req.InviteOnly,
		InviteCode:        req.InviteCode,
	}

	if err := h.Setup.CompleteServerSetup(r.Context(), user.ID, params); err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// PostSetupCreateInvite handles POST /setup/create-invite during setup
func (h API) PostSetupCreateInvite(w http.ResponseWriter, r *http.Request) {
	if h.Setup == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "setup service not configured"})
		return
	}

	// Require authentication
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}

	// Require admin permission
	if h.Authz == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "authz service not configured"})
		return
	}
	hasPermission, err := h.Authz.HasPermission(r.Context(), user.ID, "admin_access", service.DefaultPermissionScope)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	if !hasPermission {
		writeJSON(w, http.StatusForbidden, api.Error{Code: "forbidden", Message: "admin access required"})
		return
	}

	var req api.PostSetupCreateInviteJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid json"})
		return
	}

	// Create invite code using AdminInvites service
	if h.AdminInvites == nil {
		writeJSON(w, http.StatusServiceUnavailable, api.Error{Code: "service_unavailable", Message: "invites service not configured"})
		return
	}

	params := admin.CreateInviteCodeParams{
		CreatorID: user.ID,
	}

	if req.Code != nil {
		params.Code = *req.Code
	}
	if req.MaxUses != nil {
		maxUses := int32(*req.MaxUses)
		params.MaxUses = &maxUses
	}
	if req.ExpiresAt != nil {
		params.ExpiresAt = req.ExpiresAt
	}
	if req.Note != nil {
		params.Note = *req.Note
	}

	invite, err := h.AdminInvites.CreateInviteCode(r.Context(), params)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	// Convert to API response
	var expiresAt *time.Time
	if invite.ExpiresAt.Valid {
		expiresAt = &invite.ExpiresAt.Time
	}

	var lastUsedAt *time.Time
	if invite.LastUsedAt.Valid {
		lastUsedAt = &invite.LastUsedAt.Time
	}

	var maxUses *int
	if invite.MaxUses.Valid {
		uses := int(invite.MaxUses.Int32)
		maxUses = &uses
	}

	var note *string
	if invite.Note.Valid {
		note = &invite.Note.String
	}

	response := api.InviteCode{
		Id:         openapi_types.UUID(invite.ID),
		Code:       invite.Code,
		CreatedBy:  openapi_types.UUID(invite.CreatedBy),
		CreatedAt:  invite.CreatedAt,
		ExpiresAt:  expiresAt,
		LastUsedAt: lastUsedAt,
		MaxUses:    maxUses,
		UseCount:   int(invite.UseCount),
		Disabled:   invite.Disabled,
		Note:       note,
	}

	writeJSON(w, http.StatusCreated, response)
}

// setAuthCookie creates and sets a secure authentication cookie with proper security attributes
func setAuthCookie(w http.ResponseWriter, r *http.Request, token string, maxAge int) {
	// Determine if connection is secure
	// Check multiple headers for HTTPS detection behind reverse proxies
	isSecure := r.TLS != nil ||
		r.Header.Get("X-Forwarded-Proto") == "https" ||
		r.Header.Get("X-Forwarded-Ssl") == "on" ||
		r.Header.Get("X-Forwarded-Scheme") == "https"

	// Get cookie domain from environment (should be set in production)
	// Examples: "example.com" or ".example.com" (with dot for subdomains)
	cookieDomain := os.Getenv("COOKIE_DOMAIN")

	cookie := &http.Cookie{
		Name:     "ciel_auth",
		Value:    token,
		Path:     "/",
		Domain:   cookieDomain, // CRITICAL: Restrict cookie to specific domain
		MaxAge:   maxAge,
		HttpOnly: true,                    // Prevent JavaScript access
		Secure:   isSecure,                // Only send over HTTPS
		SameSite: http.SameSiteStrictMode, // CSRF protection
	}

	http.SetCookie(w, cookie)
}

// GetAgreementVersions handles GET /agreements/current
func (h API) GetAgreementVersions(w http.ResponseWriter, r *http.Request) {
	versions, err := h.Agreements.GetCurrentVersions(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, versions)
}

// ===== Moderation and Admin Endpoints =====
// (Implemented in separate handler files)

// PostMeAgreements handles POST /me/agreements
func (h API) PostMeAgreements(w http.ResponseWriter, r *http.Request) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, api.Error{Code: "unauthorized", Message: "unauthorized"})
		return
	}

	var req api.AcceptAgreementsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid request body"})
		return
	}

	if err := h.Agreements.AcceptAgreements(r.Context(), user.ID, req); err != nil {
		writeServiceError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// PatchAdminSettingsAgreements handles PATCH /admin/settings/agreements
func (h API) PatchAdminSettingsAgreements(w http.ResponseWriter, r *http.Request) {
	var req api.UpdateAgreementVersionsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, api.Error{Code: "invalid_request", Message: "invalid request body"})
		return
	}

	versions, err := h.Admin.UpdateAgreementVersions(r.Context(), req)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, versions)
}
