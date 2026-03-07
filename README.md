# Ciel
An open source software, which enables making a self-hosted microblogging service

# Status
This project is under development and is very unstable; there may be breaking changes.
We do our best to avoid that since we operate a real server. But sometimes we have to make difficult choices.

# Running Ciel
We recommend using it with a container, such as Docker or Podman. But it's cool to build an environment from scratch.

The required libraries are:
- node (22.16.0+)
- go (1.24.5+)
- pnpm (10.28.0+)

Clone the repository:
```bash
git clone https://github.com/bettaworx/ciel
cd ciel
```

Install the dependencies (node):
```
pnpm install
```

Install the dependencies (go):
```
cd ./apps/backend/ && go install
```

Generate the code from the OpenAPI Scheme:
```
pnpm gen openapi && pnpm gen openapi:ts
```

Generate the code from the SQL query:
```
pnpm gen sqlc
```

Create `.env` file:
```bash
mv ./.env.example ./.env
```

Ciel requires passwords for the databases, an initial setup, a JWT secret, and a real-time signing secret. Open the .env file and set the secrets:
```bash
nano ./.env
```

Create `config.yaml` file:
```bash
mv ./apps/backend/config/config.yaml.example ./apps/backend/config/config.yaml
```
If you want to change anything at that point, do so; most things will be auto-configured by the backend.

Build images and compose containers:
```bash
docker compose up --build
```

# License
[MIT License](https://opensource.org/license/MIT)
