# Migrating from schema.sql to golang-migrate

## Background

Previously, the database was initialized by mounting `apps/backend/db/schema.sql` directly
into the PostgreSQL container's `/docker-entrypoint-initdb.d/` directory. PostgreSQL executed
this file automatically on first startup, creating all tables in a single step with no
migration history.

As of [`d0f30c7`](../apps/backend/db/migrations/), the project uses
[golang-migrate](https://github.com/golang-migrate/migrate) for all schema changes.
Migration files live in `apps/backend/db/migrations/` as paired `.up.sql` / `.down.sql`
files and are tracked by a `schema_migrations` table in the database.

## What changed

| Before | After |
|--------|-------|
| `schema.sql` mounted in `docker-compose.yml` | Removed; no longer used for initialization |
| No migration history tracked | `schema_migrations` table records every applied version |
| Schema changes required editing `schema.sql` | Add a new `YYYYMMDD_*.up.sql` + `.down.sql` pair |
| `docker compose up --build` (all-in-one) | `build` → `migrate up` → `up` (explicit DB init step) |

`apps/backend/db/schema.sql` is still kept as the authoritative schema definition for
[sqlc](https://sqlc.dev/) code generation. Keep it in sync when adding new migrations.

---

## Migration scenarios

### Case A — Existing database (initialized from schema.sql)

Your database already has all tables but no `schema_migrations` table.
Use `migrate force` to record the current version without re-running any SQL:

**With Docker** (build the image first if not already done):

```bash
# docker compose build (or pull the latest image)
docker compose run --rm backend /app/migrate-db force 20260501
```

**Without Docker** (host machine with Go installed):

```bash
cd apps/backend
go run -tags postgres github.com/golang-migrate/migrate/v4/cmd/migrate \
  -path ./db/migrations \
  -database "$DATABASE_URL" \
  force 20260501
```

Verify the result:

```bash
docker exec ciel-db psql -U ciel -d ciel \
  -c "SELECT version, dirty FROM schema_migrations;"
```

Expected output:

```
 version  | dirty
----------+-------
 20260501 | f
```

From this point on, apply future migrations normally:

```bash
docker compose run --rm backend /app/migrate-db up
# or (host): pnpm migrate:up
```

---

### Case B — Fresh database

No special steps needed. Follow the standard setup in [README.md](../README.md):

```bash
# docker compose build (or pull the latest image)
docker compose run --rm backend /app/migrate-db up
docker compose up
```

---

## Adding future migrations

1. Create a new pair of files in `apps/backend/db/migrations/`:

   ```
   YYYYMMDD_description.up.sql    ← forward changes
   YYYYMMDD_description.down.sql  ← rollback
   ```

2. Apply the migration:

   ```bash
   docker compose run --rm backend /app/migrate-db up
   # or (host): pnpm migrate:up
   ```

3. Update `apps/backend/db/schema.sql` to reflect the new final state so sqlc stays in sync.

---

## Reference: migration commands

| Command | Docker | Host (Go) |
|---------|--------|-----------|
| Apply all pending | `docker compose run --rm backend /app/migrate-db up` | `pnpm migrate:up` |
| Roll back one step | `docker compose run --rm backend /app/migrate-db down 1` | `pnpm migrate:down` |
| Roll back all | `docker compose run --rm backend /app/migrate-db down -all` | `pnpm migrate:down:all` |
| Baseline existing DB | `docker compose run --rm backend /app/migrate-db force <version>` | `pnpm migrate:up` after force |
| Check current version | `docker exec ciel-db psql -U ciel -d ciel -c "SELECT * FROM schema_migrations;"` | — |
