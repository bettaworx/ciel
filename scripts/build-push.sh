#!/usr/bin/env bash
set -euo pipefail

REGISTRY="ghcr.io"
OWNER="bettaworx"
BACKEND_IMAGE="${REGISTRY}/${OWNER}/ciel-backend"
FRONTEND_IMAGE="${REGISTRY}/${OWNER}/ciel-frontend"
PLATFORM="linux/arm64"

# タグ指定がなければ git SHA を使用
TAG="${1:-sha-$(git rev-parse --short HEAD)}"

echo "==> Building backend: ${BACKEND_IMAGE}:${TAG}"
docker buildx build \
  --platform "${PLATFORM}" \
  --file Dockerfile.backend \
  --tag "${BACKEND_IMAGE}:${TAG}" \
  --tag "${BACKEND_IMAGE}:latest" \
  --push \
  .

echo "==> Building frontend: ${FRONTEND_IMAGE}:${TAG}"
docker buildx build \
  --platform "${PLATFORM}" \
  --file Dockerfile.frontend \
  --tag "${FRONTEND_IMAGE}:${TAG}" \
  --tag "${FRONTEND_IMAGE}:latest" \
  --push \
  .

echo "==> Done! Pushed:"
echo "    ${BACKEND_IMAGE}:${TAG}"
echo "    ${FRONTEND_IMAGE}:${TAG}"
echo "    (+ :latest tags)"
