#!/usr/bin/env bash
set -euo pipefail

REGISTRY="ghcr.io"
OWNER="bettaworx"
BACKEND_IMAGE="${REGISTRY}/${OWNER}/ciel-backend"
FRONTEND_IMAGE="${REGISTRY}/${OWNER}/ciel-frontend"
PLATFORM="linux/arm64"

# タグ指定がなければ git SHA を使用
TAG="${1:-sha-$(git rev-parse --short HEAD)}"

# ビルドに埋め込む git 情報
BUILD_COMMIT="${BUILD_COMMIT:-$(git rev-parse --short HEAD)}"
BUILD_BRANCH="${BUILD_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"

echo "==> Building backend: ${BACKEND_IMAGE}:${TAG}"
docker buildx build \
  --platform "${PLATFORM}" \
  --file Dockerfile.backend \
  --build-arg BUILD_COMMIT="${BUILD_COMMIT}" \
  --build-arg BUILD_BRANCH="${BUILD_BRANCH}" \
  --tag "${BACKEND_IMAGE}:${TAG}" \
  --tag "${BACKEND_IMAGE}:latest" \
  --push \
  .

echo "==> Building frontend: ${FRONTEND_IMAGE}:${TAG}"
docker buildx build \
  --platform "${PLATFORM}" \
  --file Dockerfile.frontend \
  --build-arg BUILD_COMMIT="${BUILD_COMMIT}" \
  --build-arg BUILD_BRANCH="${BUILD_BRANCH}" \
  --tag "${FRONTEND_IMAGE}:${TAG}" \
  --tag "${FRONTEND_IMAGE}:latest" \
  --push \
  .

echo "==> Done! Pushed:"
echo "    ${BACKEND_IMAGE}:${TAG}"
echo "    ${FRONTEND_IMAGE}:${TAG}"
echo "    (+ :latest tags)"
