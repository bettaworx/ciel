# Ciel
An open source software, which enables making a self-hosted microblogging service

# Status
This project is under development and is very unstable; there may be breaking changes.
We do our best to avoid that since we operate a real server. But sometimes we have to make difficult choices.

# Running Ciel

We recommend using Docker. Local setup (without Docker) is also supported for development.

> **Upgrading from an older installation?** If your database was previously initialized via
> `schema.sql` (before the golang-migrate migration system was introduced), see
> [docs/migrate-from-schema-sql.md](docs/migrate-from-schema-sql.md) for upgrade steps.

## Setup with Docker

**Prerequisites:** Docker

Clone the repository and set up config files:

```bash
git clone https://github.com/bettaworx/ciel
cd ciel
cp .env.example .env
cp docker-compose.yml.example docker-compose.yml
cp apps/backend/config/config.yaml.example apps/backend/config/config.yaml
```

By default, the frontend and backend run independently: frontend on port 3000
and backend on port 6137. Set `API_BASE_URL` in `.env` to the backend URL that
browsers can reach. A host-level reverse proxy is optional deployment
infrastructure, not required by the application containers.

The frontend container does not proxy backend REST or WebSocket traffic. Browser
clients call the backend directly using `API_BASE_URL`; the Next.js server uses
`INTERNAL_API_BASE_URL` only for server-rendered assets such as icons and the
web app manifest.

Operational settings are provided at runtime through Docker Compose and `.env`.
Build provenance is the exception: frontend and backend images intentionally
embed the source commit and branch so a running deployment can be verified.

Edit `.env` and set the required secrets (passwords, JWT secret, etc.):

```bash
nano .env
```

### Search

Full-text search for posts and users is served by a Meilisearch container
declared in `docker-compose.yml`. Set `MEILI_MASTER_KEY` (16 characters or
more) and the matching `MEILISEARCH_API_KEY` in `.env`:

```bash
openssl rand -base64 32
```

On first start the backend creates the indexes and loads every existing post
and user into them; afterwards the index is kept up to date as content changes.
Set `SEARCH_BACKFILL=force` to reindex everything on the next start, which is
how a drifted index is repaired.

To run without search, set `SEARCH_PROVIDER=none`. The `/search/*` endpoints
then return 503 and nothing is indexed; the rest of the server is unaffected.

Build the images:

```bash
docker compose build
```

### Base image digest update policy

To keep setup instructions focused, detailed policy guidance is documented separately:

- [docs/base-image-digest-update-policy.md](docs/base-image-digest-update-policy.md)

Initialize the database (run once on first setup):

```bash
docker compose run --rm backend /app/migrate-db up
```

Start all services:

```bash
docker compose up
```

### Database management (Docker)

```bash
# Apply all pending migrations
docker compose run --rm backend /app/migrate-db up

# Roll back the latest migration
docker compose run --rm backend /app/migrate-db down 1

# Roll back all migrations
docker compose run --rm backend /app/migrate-db down -all
```

## Local development (native apps, containerized dependencies)

For day-to-day development, run the frontend and backend natively and keep only
PostgreSQL, Redis and Meilisearch in containers.

**Prerequisites:** Docker, Go, pnpm

```bash
cp .env.example .env
cp docker-compose.dev.yml.example docker-compose.dev.yml
cp apps/backend/config/config.yaml.example apps/backend/config/config.yaml
```

`.env.example` is written for the all-in-Docker setup, so its connection
strings use compose service names. For native development, point them at
`localhost` instead:

```dotenv
DATABASE_URL=postgres://ciel:your-password@localhost:5432/ciel?sslmode=disable
REDIS_ADDR=redis://:your-password@localhost:6379
MEILISEARCH_HOST=http://localhost:7700
```

Set the remaining secrets in `.env` as usual (`POSTGRES_PASSWORD`,
`REDIS_PASSWORD`, `MEILI_MASTER_KEY`, `MEILISEARCH_API_KEY`, `JWT_SECRET`,
`REALTIME_SIGNING_SECRET`, `INITIAL_SETUP_PASSWORD`). The dev compose file reads
the same `.env`, so the containers and the native backend always agree on
credentials.

Start the dependencies:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Apply migrations (run once on first setup, and after pulling new migrations):

```bash
pnpm run migrate:up
```

Start the frontend and backend natively:

```bash
pnpm dev
```

Frontend: <http://localhost:3000> — backend: <http://localhost:6137>

Stop the dependencies with `docker compose -f docker-compose.dev.yml down`, or
`down -v` to also discard the database, Redis and search data.

# License
[MIT License](https://opensource.org/license/MIT)
