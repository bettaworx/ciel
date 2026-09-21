# Backend AGENTS Guide

This document provides comprehensive guidelines for working on the Ciel backend API.

## Architecture Overview

The backend is built with:
- **Go 1.26+**
- **PostgreSQL** with SQLC for type-safe queries
- **Redis** for caching and pub/sub
- **Chi router** for HTTP routing
- **OpenAPI** for API contract (code generation)

**Architecture Pattern**: Layered Architecture (Clean Architecture variant)

## Directory Structure

```
apps/backend/
├── main.go                    # Application entry point
├── go.mod / go.sum           # Go module dependencies
├── sqlc.yaml                 # SQLC configuration
├── oapi-codegen.yaml         # OpenAPI code generation config
├── docker-compose.test.yml   # Integration test infrastructure
├── .env.example / .env.local # Environment configuration
│
├── internal/                 # Private application code
│   ├── api/                  # Generated OpenAPI types & server interface
│   ├── handlers/             # HTTP handlers (API implementation)
│   ├── service/              # Business logic layer
│   ├── repository/           # Data access layer
│   ├── db/
│   │   └── sqlc/            # Generated SQLC code (queries, models)
│   ├── auth/                 # JWT, SCRAM, context utilities
│   ├── middleware/           # HTTP middleware chain
│   ├── realtime/             # WebSocket Hub & Redis pub/sub
│   └── logging/              # Structured logging
│
├── db/                       # Database artifacts
│   ├── schema.sql           # Base schema definition
│   ├── queries.sql          # SQLC query definitions
│   └── migrations/          # SQL migration files
│
└── tests/                    # Test suites
    ├── unit/                # Unit tests (no external deps)
    └── integration/         # Integration tests (Docker-based)
```

## Layered Architecture

The application follows strict separation of concerns with dependency injection:

### Layer 1: Handlers (`internal/handlers/`)

**Purpose**: HTTP request/response handling

**Responsibilities**:
- Implement OpenAPI-generated server interface
- Parse and validate requests
- Serialize responses
- Map service errors to HTTP status codes
- Apply authentication/authorization guards

**Example** (`handlers/api.go`):
```go
type API struct {
    Auth      *service.AuthService
    Posts     *service.PostsService
    Timeline  *service.TimelineService
    Reactions *service.ReactionsService
    Users     *service.UsersService
    // ...
}

func (a *API) CreatePost(w http.ResponseWriter, r *http.Request) {
    user := auth.FromContext(r.Context())
    var req CreatePostRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondError(w, ErrBadRequest)
        return
    }
    
    post, err := a.Posts.CreatePost(r.Context(), user.ID, req)
    if err != nil {
        respondError(w, err)
        return
    }
    
    respondJSON(w, http.StatusCreated, post)
}
```

### Layer 2: Service (`internal/service/`)

**Purpose**: Business logic and orchestration

**Responsibilities**:
- Implement domain logic
- Coordinate transactions
- Manage cache invalidation
- Publish realtime events
- Enforce authorization rules

**Example** (`service/posts.go`):
```go
type PostsService struct {
    store     *repository.Store
    rdb       *redis.Client
    publisher realtime.Publisher
}

func (s *PostsService) CreatePost(ctx context.Context, userID uuid.UUID, req CreatePostRequest) (*Post, error) {
    var post *sqlc.Post
    err := s.store.WithTx(ctx, func(q *sqlc.Queries) error {
        var err error
        post, err = q.CreatePost(ctx, sqlc.CreatePostParams{
            UserID:  userID,
            Content: req.Content,
        })
        if err != nil {
            return err
        }
        
        // Attach media if provided
        if len(req.MediaIDs) > 0 {
            err = q.AttachMediaToPosts(ctx, post.ID, req.MediaIDs)
            if err != nil {
                return err
            }
        }
        
        return nil
    })
    
    if err != nil {
        return nil, err
    }
    
    // Publish realtime event
    s.publisher.Publish(realtime.Event{
        Type: "post_created",
        Data: post,
    })
    
    return post, nil
}
```

### Layer 3: Repository (`internal/repository/`)

**Purpose**: Data access abstraction

**Responsibilities**:
- Wrap SQLC queries
- Provide transaction helper
- Abstract database operations

**Example** (`repository/store.go`):
```go
type Store struct {
    DB *sql.DB
    Q  *sqlc.Queries
}

func NewStore(db *sql.DB) *Store {
    return &Store{
        DB: db,
        Q:  sqlc.New(db),
    }
}

func (s *Store) WithTx(ctx context.Context, fn func(q *sqlc.Queries) error) error {
    tx, err := s.DB.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    
    q := s.Q.WithTx(tx)
    err = fn(q)
    
    if err != nil {
        tx.Rollback()
        return err
    }
    
    return tx.Commit()
}
```

### Layer 4: SQLC (`internal/db/sqlc/`)

**Purpose**: Type-safe SQL query execution

- Auto-generated from SQL queries
- Compile-time type safety
- No ORM overhead

**Dependency Flow**: Handlers → Service → Repository → SQLC

**Key Principle**: Outer layers depend on inner layers; inner layers are unaware of outer layers.

## Authentication & Authorization

### SCRAM-SHA-256 Authentication

**Implementation**: `auth/scram.go`

- Challenge-response authentication
- No plaintext password storage
- Salt + iteration count for password hashing

**Flow**:
1. Client requests challenge
2. Server generates nonce and salt
3. Client computes proof with password
4. Server verifies proof and issues JWT

### JWT Token Management

**Implementation**: `auth/jwt.go`

**Access Tokens**:
- 1 hour TTL (configurable)
- Used for regular API access
- Stored in `Authorization: Bearer <token>` header

**Step-up Tokens**:
- 5 minute TTL (configurable)
- Single-use (Redis tracking)
- Required for sensitive operations (password change, etc.)

**Example**:
```go
token, err := tokenManager.CreateAccessToken(user.ID, user.Username)
if err != nil {
    return err
}

stepupToken, err := tokenManager.CreateStepUpToken(user.ID, user.Username)
if err != nil {
    return err
}
```

### RBAC Authorization

**Implementation**: `service/authz.go`

**Tables**:
- `roles` - Role definitions (user, admin)
- `permissions` - Permission scopes (posts:create, users:ban, etc.)
- `role_permissions` - Role → permission mappings
- `user_roles` - User → role assignments
- `user_permissions` - User permission overrides (allow/deny)

**Permission Check**:
```go
allowed, err := authzService.HasPermission(ctx, userID, "posts:delete")
if err != nil {
    return err
}
if !allowed {
    return ErrForbidden
}
```

### Context Propagation

**Implementation**: `auth/context.go`

**Usage**:
```go
// Middleware sets user in context
ctx = auth.WithUser(ctx, user)

// Handlers retrieve user from context
user := auth.FromContext(ctx)
if user == nil {
    return ErrUnauthorized
}
```

## Database Patterns (SQLC)

### Schema Definition

**Location**: `db/schema.sql`

**Key Features**:
- UUID primary keys with `gen_random_uuid()`
- Foreign key constraints with cascades
- Optimized indexes for timeline queries
- Soft deletes for posts (`deleted_at`)
- `timestamptz` for all timestamps

**Example Table**:
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT posts_content_length CHECK (char_length(content) <= 10000)
);

CREATE INDEX idx_posts_timeline ON posts(created_at DESC, id DESC) WHERE deleted_at IS NULL;
```

### Query Definition

**Location**: `db/queries.sql`

**Pattern**: Named queries with SQLC annotations

```sql
-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: ListTimelinePosts :many
SELECT 
    p.id, p.user_id, p.content, p.created_at,
    u.username, u.display_name, u.avatar_media_id
FROM posts p
JOIN users u ON u.id = p.user_id
WHERE p.deleted_at IS NULL
  AND (sqlc.narg('cursor_time')::timestamptz IS NULL
       OR p.created_at < sqlc.narg('cursor_time')
       OR (p.created_at = sqlc.narg('cursor_time') AND p.id < sqlc.narg('cursor_id')))
ORDER BY p.created_at DESC, p.id DESC
LIMIT sqlc.arg('limit');

-- name: CreatePost :one
INSERT INTO posts (user_id, content)
VALUES ($1, $2)
RETURNING *;
```

**Query Features**:
- Keyset pagination (cursor-based)
- Nullable parameters with `sqlc.narg()`
- Complex joins
- Aggregate functions

### Transactions

Always use transactions for multi-step operations:

```go
err := store.WithTx(ctx, func(q *sqlc.Queries) error {
    // Step 1: Create post
    post, err := q.CreatePost(ctx, params)
    if err != nil {
        return err
    }
    
    // Step 2: Attach media
    err = q.AttachMedia(ctx, post.ID, mediaIDs)
    if err != nil {
        return err
    }
    
    // Step 3: Update user stats
    err = q.IncrementUserPostCount(ctx, userID)
    if err != nil {
        return err
    }
    
    return nil
})
```

### Migrations

**Location**: `db/migrations/`

**Tool**: [golang-migrate](https://github.com/golang-migrate/migrate)

Each schema change requires a **pair** of files:

```
db/migrations/
├── YYYYMMDD_feature_name.up.sql    ← apply changes
└── YYYYMMDD_feature_name.down.sql  ← roll back changes
```

**Example pair** (`20260601_add_notifications`):

```sql
-- 20260601_add_notifications.up.sql
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON notifications(user_id, created_at DESC);
```

```sql
-- 20260601_add_notifications.down.sql
DROP TABLE IF EXISTS notifications;
```

**Apply / roll back**:

```bash
# Docker (recommended)
docker compose run --rm backend /app/migrate-db up
docker compose run --rm backend /app/migrate-db down 1

# Host (requires Go)
pnpm migrate:up
pnpm migrate:down
```

**Best Practices**:
- Use `IF NOT EXISTS` / `IF EXISTS` guards so re-running is safe after a partial failure
- One migration per feature or logical change
- Never modify or delete past migration files — add a new one instead
- Keep `.down.sql` accurate so rollbacks are safe in production

### Database Change Workflow

**IMPORTANT**: When making database changes, update **all three** of the following:

1. Create a migration pair in `db/migrations/` (`YYYYMMDD_*.up.sql` + `.down.sql`)
2. Update `db/schema.sql` to reflect the final state — used by sqlc for code generation
3. Add/update queries in `db/queries.sql` if needed, then run `pnpm run gen:sqlc`

**Example Workflow** — Adding a new admin permission:

**Step 1**: Create `db/migrations/20260601_add_new_permission.up.sql`:

```sql
INSERT INTO permissions (id, name, description) VALUES
  ('admin:new_feature:manage', 'Admin new feature', 'Manage new feature')
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, scope, effect)
VALUES ('admin', 'admin:new_feature:manage', 'global', 'allow')
ON CONFLICT (role_id, permission_id, scope) DO NOTHING;
```

**Step 1b**: Create `db/migrations/20260601_add_new_permission.down.sql`:

```sql
DELETE FROM role_permissions WHERE permission_id = 'admin:new_feature:manage';
DELETE FROM permissions WHERE id = 'admin:new_feature:manage';
```

**Step 2**: Update `db/schema.sql` — add the permission to the initial data section so new databases get it:

```sql
INSERT INTO permissions (id, name, description) VALUES
  ...
  ('admin:new_feature:manage', 'Admin new feature', 'Manage new feature')
ON CONFLICT (id) DO NOTHING;
```

**Step 3**: Apply the migration:

```bash
# Docker
docker compose run --rm backend /app/migrate-db up

# Host
pnpm migrate:up
```

**Step 4**: Verify migration state:

```bash
docker exec ciel-db psql -U ciel -d ciel \
  -c "SELECT version, dirty FROM schema_migrations;"
```

## Middleware Chain

**Order** (from `main.go`):
```
RequestID → CORS → OptionalAuth → AccessLog 
  → AccessControl → RateLimit → RequireAuth/Admin
```

**Middleware Files** (`internal/middleware/`):

- `auth.go` - `OptionalAuth`, `RequireAuth` (JWT parsing)
- `cors.go` - CORS headers
- `access_log.go` - Structured access logging
- `access_control.go` - IP ban enforcement (Redis)
- `rate_limit.go` - Rate limiting per IP (Redis)
- `permission.go` - `RequireAdminAccess` (RBAC check)

**Example**:
```go
r := chi.NewRouter()
r.Use(chimiddleware.RequestID)
r.Use(middleware.CORS())
r.Use(middleware.OptionalAuth(tokenManager))
r.Use(middleware.AccessLog(middleware.AccessLogOptions{TrustProxy: true}))
r.Use(middleware.RateLimit(redisClient, 100, time.Minute))

// Protected routes
r.Group(func(r chi.Router) {
    r.Use(middleware.RequireAuth(tokenManager))
    r.Post("/posts", apiHandler.CreatePost)
})
```

## Realtime Features (WebSocket)

**Implementation**: `internal/realtime/hub.go`

**Features**:
- WebSocket connections with auth
- Redis pub/sub for multi-instance support
- Event broadcasting to subscribed clients

**Events**:
- `post_created` - New post published
- `post_deleted` - Post removed
- `reaction_updated` - Reaction counts changed

**Usage**:
```go
// Publish event from service layer
publisher.Publish(realtime.Event{
    Type: "post_created",
    Data: map[string]interface{}{
        "postId": post.ID,
        "userId": post.UserID,
    },
})
```

## Search (`internal/search/`)

**Implementation**: `internal/search/` (provider abstraction) and
`internal/service/search.go` (query handling and index synchronisation).

The engine is chosen at startup from `SEARCH_PROVIDER`. `meilisearch` uses
`internal/search/meili.go`; anything else (including unset) selects
`internal/search/noop.go`, which drops writes and answers reads with
`search.ErrUnavailable` so `/search/*` returns 503 while the rest of the server
keeps working. To add another engine, implement `search.Provider` and add a case
to `search.New`.

**What is indexed**: only the fields needed to match and filter — post content
plus author id and timestamp, and username, display name, bio and timestamp for
users. Responses are always hydrated from the database via
`PostsService.GetHydratedPostsByIDs` and `GetUsersByIDs`, so a stale index can
never leak deleted or hidden content. Posts are indexed by **author id**, not
username, so renaming a user does not invalidate their posts.

**Result ordering**: post search is chronological — `SearchPosts` asks for
`createdAt:desc` and the posts index puts `sort` first in its `RankingRules`, so
relevance decides only *what* matches, never the order. User search is
deliberately left on relevance: newest-account-first is useless for finding
people. Both are offset-paged, so a client accumulating pages must dedupe by id.

**Query syntax**: `internal/search/query.go` parses `from:`, `since:`, `until:`,
quoted phrases and a bare uppercase `OR`/`AND` out of the query string. `OR`
maps to the engine's matching strategy for the whole query; it is not a per-term
boolean expression.

**Keeping the index in step**: any code that creates, deletes, hides or
un-hides a post must call `SearchService.ReindexPost(ctx, postID)`, and any code
that changes a profile must call `SearchService.ReindexUser(ctx, userID)`. Both
read the current row and decide for themselves whether to upsert or delete, so
the call is the same one line at every site. Deleting a user cascades their
posts away, so that path calls `SearchService.RemoveUser` instead. Errors are
logged and swallowed: a search index failure must never fail the write that
triggered it.

**Backfill**: `SearchService.StartBackfill` runs in the background at startup,
applies the index settings, and loads existing rows when the index is empty. A
Redis `SetNX` lock keeps multiple replicas from doing it at once. Set
`SEARCH_BACKFILL=force` to reindex regardless — this is the drift repair.

## Build & Development Commands

```bash
# Start development server (port 6137)
cd apps/backend
go run main.go

# Run unit tests (fast, no external deps)
go test ./tests/unit/...

# Run all tests (unit only by default)
go test ./...

# Run integration tests with local DB
go test ./tests/... -count=1 -tags=integration

# Run integration tests with Docker
docker compose -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from backend_test
docker compose -f docker-compose.test.yml down

# Generate SQLC code
pnpm run gen:sqlc

# Generate OpenAPI types
pnpm run gen:openapi

# Check for dependency updates
go list -m -u all
```

## Adding New Features

### New API Endpoint

**Steps**:
1. Add path-item to the appropriate domain file in `packages/api/paths/` (e.g. `paths/posts.yml` for a posts endpoint, `paths/admin/users.yml` for admin user management). If no suitable file exists, create one under `paths/` or `paths/admin/`.
2. Add the new path entry to `packages/api/openapi.yml` under `paths:`, pointing to your new path-item file:
   ```yaml
   /posts/{postId}/like:
     $ref: ./paths/posts.yml#/~1posts~1{postId}~1like
   ```
3. If you need new schema types, add them to the appropriate file in `packages/api/schemas/` (e.g. `schemas/post.yml` for post-related types, `schemas/common.yml` for shared types). Reference them from path files using relative paths: `$ref: ../schemas/post.yml#/components/schemas/MyNewType`
4. Run `pnpm run gen:openapi` to bundle the spec and regenerate Go types
3. Implement handler in `internal/handlers/api.go`
4. Add business logic in `internal/service/*.go`
5. Add queries to `db/queries.sql` if needed
6. Run `pnpm run gen:sqlc` to generate query code
7. Add tests in `tests/unit/` and `tests/integration/`

**Example OpenAPI Addition**:
```yaml
/posts/{postId}/like:
  post:
    tags: [Reactions]
    operationId: likePost
    parameters:
      - name: postId
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      '200':
        description: OK
      '401':
        $ref: '#/components/responses/Unauthorized'
```

### New Database Table

**Steps**:
1. Create a migration pair in `db/migrations/`:
   - `YYYYMMDD_feature_name.up.sql` — create table, indexes, seed data
   - `YYYYMMDD_feature_name.down.sql` — drop table / undo changes
2. Update `db/schema.sql` to reflect the final state (used by sqlc)
3. Add queries to `db/queries.sql`
4. Run `pnpm run gen:sqlc`
5. Apply the migration: `docker compose run --rm backend /app/migrate-db up`
6. Update service layer to use new queries

**Example Migration**:
```sql
-- db/migrations/20260601_add_notifications.up.sql
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON notifications(user_id, created_at DESC);
```

```sql
-- db/migrations/20260601_add_notifications.down.sql
DROP TABLE IF EXISTS notifications;
```

### New Service

**Steps**:
1. Create `internal/service/feature.go`
2. Define service struct with dependencies
3. Implement business logic methods
4. Wire up in `main.go`
5. Inject into handlers

**Example**:
```go
// internal/service/notifications.go
package service

type NotificationsService struct {
    store     *repository.Store
    rdb       *redis.Client
    publisher realtime.Publisher
}

func NewNotificationsService(
    store *repository.Store,
    rdb *redis.Client,
    publisher realtime.Publisher,
) *NotificationsService {
    return &NotificationsService{
        store:     store,
        rdb:       rdb,
        publisher: publisher,
    }
}

func (s *NotificationsService) CreateNotification(
    ctx context.Context,
    userID uuid.UUID,
    notifType string,
    data map[string]interface{},
) error {
    err := s.store.Q.CreateNotification(ctx, sqlc.CreateNotificationParams{
        UserID: userID,
        Type:   notifType,
        Data:   data,
    })
    
    if err != nil {
        return err
    }
    
    // Publish realtime event
    s.publisher.Publish(realtime.Event{
        Type:   "notification_created",
        UserID: userID,
        Data:   data,
    })
    
    return nil
}
```

## Testing Strategy

### Unit Tests (`tests/unit/`)

**Characteristics**:
- No build tags required
- Use mocks (`sqlmock`, `miniredis`)
- Fast execution
- Test individual functions

**Example** (`tests/unit/auth/token_manager_test.go`):
```go
func TestTokenManager_CreateAccessToken(t *testing.T) {
    tm := auth.NewTokenManager("secret", time.Hour, time.Minute*5)
    
    token, err := tm.CreateAccessToken(userID, "testuser")
    assert.NoError(t, err)
    assert.NotEmpty(t, token)
    
    claims, err := tm.VerifyAccessToken(token)
    assert.NoError(t, err)
    assert.Equal(t, "testuser", claims.Username)
}
```

### Integration Tests (`tests/integration/`)

**Characteristics**:
- Build tag: `//go:build integration`
- Real PostgreSQL + Redis (Docker)
- Full stack testing with `httptest.Server`
- Test API contracts end-to-end

**Example** (`tests/integration/api_integration_test.go`):
```go
//go:build integration

func TestCreatePost(t *testing.T) {
    app := setupTestApp(t)
    defer app.Cleanup()
    
    user := app.CreateTestUser(t)
    token := app.GetAccessToken(t, user)
    
    req := CreatePostRequest{Content: "Hello, world!"}
    resp := app.PostJSON(t, "/posts", req, token)
    
    assert.Equal(t, http.StatusCreated, resp.StatusCode)
    
    var post Post
    json.Unmarshal(resp.Body, &post)
    assert.Equal(t, "Hello, world!", post.Content)
}
```

**Running Integration Tests**:
```bash
# With Docker (recommended)
docker compose -f docker-compose.test.yml up --abort-on-container-exit

# With local DB
export DATABASE_URL="postgres://ciel:ciel@localhost:5432/ciel_test?sslmode=disable"
export REDIS_ADDR="localhost:6379"
go test ./tests/... -count=1 -tags=integration
```

## Security

### Password Security
- Use SCRAM-SHA-256 for authentication
- Never store plaintext passwords
- Salt + iteration count for hashing
- Server and stored keys kept separate

### JWT Security
- Verify signature on every request
- Check expiration time
- Use strong secret (32+ bytes, random)
- Step-up tokens for sensitive operations

### SQL Injection Prevention
- **Always use SQLC** for queries
- Never use `fmt.Sprintf` to build SQL
- Avoid dynamic table/column names
- Escape `LIKE` patterns if user-provided

### Authorization
- Protect endpoints with middleware (`RequireAuth`, `RequireAdminAccess`)
- Verify user owns resource before operations
- Use RBAC for permission checks (`HasPermission`)
- Don't rely solely on `admin` flag

### Input Validation
- Validate all inputs (length, format, range)
- Check file uploads (extension, MIME type, size)
- Use `filepath.Clean()` to prevent path traversal
- Enforce constraints at database level

### Information Disclosure
- Never return stack traces in API responses
- Use generic error messages (`INTERNAL_ERROR`)
- Don't log sensitive data (passwords, tokens)
- Use 403 vs 404 carefully (avoid resource enumeration)

### DoS Prevention
- Enforce pagination limits (no unlimited `LIMIT`)
- Apply rate limiting (Redis-backed)
- Set database query timeouts
- Limit file upload sizes
- Use connection pooling

### CORS & CSRF
- Whitelist allowed origins
- Use appropriate HTTP methods (POST/PUT/DELETE for mutations)
- SameSite cookies for session tokens

### Dependencies
- Regularly check for vulnerabilities (`go list -m -u all`)
- Keep dependencies up-to-date
- Use minimal database privileges

## Post-Implementation Security Checklist

After writing new code, verify the following:

### SQL Injection
- [ ] All queries use SQLC (no `fmt.Sprintf` for SQL)
- [ ] No dynamic table or column name construction
- [ ] `LIKE` patterns escaped if user-provided

### Authentication & Authorization
- [ ] Endpoints protected by appropriate middleware (`RequireAuth`, `RequireAdminAccess`)
- [ ] Users can only access their own resources (verify userId)
- [ ] RBAC permissions checked for sensitive operations (`authzService.HasPermission`)
- [ ] Step-up authentication required for critical operations

### Input Validation
- [ ] All inputs validated (length, format, range)
- [ ] File uploads check extension, MIME type, and size
- [ ] Path traversal prevented (`filepath.Clean()` used)

### Information Disclosure
- [ ] Error messages don't expose internal details (stack traces, SQL)
- [ ] Logs don't contain sensitive data (passwords, tokens)
- [ ] 404 vs 403 used appropriately (avoid resource enumeration)

### DoS Prevention
- [ ] Pagination enforced (no unlimited `LIMIT`)
- [ ] Rate limiting applied
- [ ] Database queries have timeouts
- [ ] File uploads have size limits

### Transactions
- [ ] Multi-step operations use transactions (`store.WithTx`)
- [ ] TOCTOU vulnerabilities avoided (check-then-act in transaction)
- [ ] Deadlock potential considered (lock order consistent)

### Cryptography
- [ ] Passwords use SCRAM-SHA-256 (no plaintext or simple hashing)
- [ ] JWT signatures verified
- [ ] Random numbers from `crypto/rand` (not `math/rand`)

### CORS & CSRF
- [ ] CORS allows only necessary origins
- [ ] State-changing operations use POST/PUT/DELETE (not GET)

### Dependencies
- [ ] External library vulnerabilities checked (`go list -m -u all`)
- [ ] Database connection uses minimal privileges

### Realtime/WebSocket
- [ ] WebSocket connections authenticated
- [ ] Event data doesn't contain sensitive information
- [ ] Connection limits enforced (per IP and total)

---

**For frontend guidelines, see**: `apps/frontend/AGENTS.md`
