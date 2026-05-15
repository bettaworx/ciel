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

Edit `.env` and set the required secrets (passwords, JWT secret, etc.):

```bash
nano .env
```

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

# License
[MIT License](https://opensource.org/license/MIT)
