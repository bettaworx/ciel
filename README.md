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

Edit `.env` and set the required secrets (passwords, JWT secret, etc.):

```bash
nano .env
```

Build the images:

```bash
docker compose build
```

### Base image digest update policy

`Dockerfile.frontend` pins `node:22-bookworm-slim` by digest to keep image layers reproducible.

- Update the digest when you intentionally bump Node 22 slim base contents (security patches or monthly maintenance).
- Keep `base` and `runner` on the same digest in `Dockerfile.frontend`.
- Recommended update flow:

```bash
# 1) Fetch current amd64 digest for node:22-bookworm-slim
TOKEN=$(curl -fsSL "https://auth.docker.io/token?service=registry.docker.io&scope=repository:library/node:pull" | jq -r .token)
curl -fsSL -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.oci.image.index.v1+json" \
  https://registry-1.docker.io/v2/library/node/manifests/22-bookworm-slim \
  | jq -r '.manifests[] | select(.platform.architecture=="amd64" and .platform.os=="linux") | .digest'

# 2) Replace both FROM lines in Dockerfile.frontend
# 3) Rebuild and verify
docker compose build frontend
```

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
