# Base image digest update policy

`Dockerfile.frontend` pins `node:22-bookworm-slim` by digest. This keeps image layers reproducible and prevents unintended base image drift.

## Why we pin by digest

- A tag alone (for example, `node:22-bookworm-slim`) can change over time.
- Digest pinning ensures CI/CD, local development, and production all use the same base image.
- Security updates are adopted intentionally on your schedule.

## Update cadence

Consider updating the digest when:

- You want to adopt security patches in the Node 22 slim base image.
- You perform monthly base image maintenance.
- You revise runtime requirements in `Dockerfile.frontend`.

## Required rule

`base` and `runner` stages in `Dockerfile.frontend` must always use the same digest.

## Recommended update flow

1. Fetch the latest amd64 digest for `node:22-bookworm-slim`.
2. Update both `FROM` lines in `Dockerfile.frontend` (`base` and `runner`) to that digest.
3. Rebuild `frontend` and verify behavior.

### 1) Fetch current amd64 digest

```bash
TOKEN=$(curl -fsSL "https://auth.docker.io/token?service=registry.docker.io&scope=repository:library/node:pull" | jq -r .token)
curl -fsSL -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.oci.image.index.v1+json" \
  https://registry-1.docker.io/v2/library/node/manifests/22-bookworm-slim \
  | jq -r '.manifests[] | select(.platform.architecture=="amd64" and .platform.os=="linux") | .digest'
```

### 2) Replace both FROM lines in Dockerfile.frontend

In `Dockerfile.frontend`, update the digest for both `base` and `runner` at the same time.

### 3) Rebuild and verify

```bash
docker compose build frontend
```

If needed, run `docker compose up` and validate startup and runtime behavior.
