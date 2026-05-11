# Ciel
An open source software, which enables making a self-hosted microblogging service

# Status
This project is under development and is very unstable; there may be breaking changes.
We do our best to avoid that since we operate a real server. But sometimes we have to make difficult choices.

# Running Ciel

We recommend using Docker. Local setup (without Docker) is also supported for development.

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

## Setup without Docker

**Prerequisites:** node (22.16.0+), go (1.26.0+), pnpm (10.28.0+), PostgreSQL

```bash
git clone https://github.com/bettaworx/ciel
cd ciel
cp .env.example .env
cp apps/backend/config/config.yaml.example apps/backend/config/config.yaml
```

Edit `.env` and set `DATABASE_URL` to point to your local PostgreSQL instance.

Install dependencies:

```bash
pnpm install
cd apps/backend && go mod download && cd ../..
```

Generate code:

```bash
pnpm run gen:openapi && pnpm run gen:openapi:ts
pnpm run gen:sqlc
```

Initialize the database:

```bash
pnpm migrate:init
```

### Database management (local)

```bash
# Apply all pending migrations  (alias: pnpm migrate:init)
pnpm migrate:up

# Roll back the latest migration
pnpm migrate:down

# Roll back all migrations
pnpm migrate:down:all
```

> **Note:** These commands require `DATABASE_URL` to be set in your environment or `.env` file.

# License
[MIT License](https://opensource.org/license/MIT)
