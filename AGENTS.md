# AGENTS

This repository is a monorepo for **Ciel**, a minimal SNS (Social Networking Service) application.

## Project Overview

Ciel is a modern web application built with:
- **Backend**: Go API with PostgreSQL and Redis
- **Frontend**: Next.js with TypeScript
- **API Contract**: OpenAPI specification as the single source of truth

## Design Philosophy

### Type Safety First
- Full TypeScript coverage on frontend
- Go with strict typing on backend
- SQLC for type-safe SQL queries
- OpenAPI-generated types shared between frontend and backend

### Layered Architecture
- Clear separation of concerns
- Dependency injection
- Testable, maintainable code
- No global state

### Real-time Ready
- WebSocket infrastructure built-in
- Redis pub/sub for multi-instance support
- Optimistic updates with React Query

### Internationalization
- Japanese and English support from day one
- All user-facing strings managed via i18n

## Repository Structure

```
ciel/
├── apps/
│   ├── backend/          # Go API service
│   │   ├── internal/     # Private application code
│   │   ├── db/           # Schema, queries, migrations
│   │   ├── tests/        # Unit and integration tests
│   │   └── AGENTS.md     # Backend-specific guidelines
│   └── frontend/         # Next.js application
│       ├── app/          # App Router pages
│       ├── components/   # React components
│       ├── lib/          # API client, hooks, utilities
│       └── AGENTS.md     # Frontend-specific guidelines
├── packages/
│   └── api/
│       └── openapi.yml   # OpenAPI specification (source of truth)
└── pnpm-workspace.yaml   # Workspace configuration
```

## Tooling and Package Managers

- **Frontend**: `pnpm` (workspace configured in `pnpm-workspace.yaml`)
- **Backend**: Go modules (`apps/backend/go.mod`)
- **Database**: PostgreSQL with SQLC
- **Cache/Pub-Sub**: Redis

## Common Commands

### Workspace Management
```bash
pnpm install              # Install all dependencies
```

### Frontend
```bash
pnpm -C apps/frontend dev           # Start dev server (port 3000)
pnpm -C apps/frontend build         # Production build
pnpm -C apps/frontend lint          # ESLint
pnpm -C apps/frontend gen:openapi   # Generate API types
```

### Backend
```bash
cd apps/backend
go run main.go                      # Start API server (port 6137)
go test ./tests/unit/...            # Run unit tests
go test ./...                       # Run all tests (fast)
```

### Code Generation
```bash
pnpm run gen:openapi                # Generate backend OpenAPI types
pnpm run gen:sqlc                   # Generate SQLC code
pnpm -C apps/frontend gen:openapi   # Generate frontend API types
```

## Testing Strategy

### Backend Tests
- **Unit tests**: Fast, no external dependencies, run with `go test ./tests/unit/...`
- **Integration tests**: Docker-based (PostgreSQL + Redis), full stack testing
  - Docker: `docker compose -f apps/backend/docker-compose.test.yml up --abort-on-container-exit --exit-code-from backend_test`
  - Local DB: `go test ./tests/... -count=1 -tags=integration`
- See `apps/backend/TESTING.md` for detailed requirements

### Frontend Tests
- (To be added in the future)

### Testing Guidelines
- When implementing new functionality, **always add or update tests**
- Verify tests pass before committing
- Integration tests require Docker or local PostgreSQL/Redis

## Detailed Guidelines

For detailed architecture, patterns, and security guidelines:

- **Frontend work**: See `apps/frontend/AGENTS.md`
- **Backend work**: See `apps/backend/AGENTS.md`

Both documents include:
- Architecture overview
- Directory structure
- Development patterns
- Code examples
- Security checklists
