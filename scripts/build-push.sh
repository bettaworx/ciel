#!/usr/bin/env bash
set -euo pipefail

REGISTRY="ghcr.io"
OWNER="bettaworx"
BACKEND_IMAGE="${REGISTRY}/${OWNER}/ciel-backend"
FRONTEND_IMAGE="${REGISTRY}/${OWNER}/ciel-frontend"

# ビルドに埋め込む git 情報
BUILD_COMMIT="${BUILD_COMMIT:-$(git rev-parse --short HEAD)}"
BUILD_BRANCH="${BUILD_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
TAG="${TAG:-sha-$(git rev-parse --short HEAD)}"

# ─── カラー出力 ────────────────────────────────────────────────
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

prompt() { echo -e "${CYAN}${BOLD}$*${NC}"; }
info()   { echo -e "${GREEN}==>${NC} $*"; }
warn()   { echo -e "${YELLOW}[!]${NC} $*"; }

# ─── 対話プロンプト ────────────────────────────────────────────

echo ""
prompt "Ciel build-push 設定"
echo "────────────────────────────────────"

# 1. ビルド対象コンテナ
echo ""
echo "ビルドするコンテナを選択してください:"
echo "  1) frontend"
echo "  2) backend"
echo "  3) both (frontend + backend)"
echo ""
printf "選択 [1-3, デフォルト: 3]: "; read -r TARGET_INPUT
TARGET_INPUT="${TARGET_INPUT:-3}"

case "$TARGET_INPUT" in
  1) BUILD_TARGET="frontend" ;;
  2) BUILD_TARGET="backend" ;;
  3) BUILD_TARGET="both" ;;
  frontend|backend|both) BUILD_TARGET="$TARGET_INPUT" ;;
  *)
    warn "無効な選択です。both を使用します。"
    BUILD_TARGET="both"
    ;;
esac

# 2. ビルドプラットフォーム
echo ""
echo "ビルドプラットフォームを選択してください:"
echo "  1) linux/amd64"
echo "  2) linux/arm64"
echo "  3) both (linux/amd64,linux/arm64)"
echo ""
printf "選択 [1-3, デフォルト: 2]: "; read -r PLATFORM_INPUT
PLATFORM_INPUT="${PLATFORM_INPUT:-2}"

case "$PLATFORM_INPUT" in
  1) PLATFORM="linux/amd64" ;;
  2) PLATFORM="linux/arm64" ;;
  3) PLATFORM="linux/amd64,linux/arm64" ;;
  amd64|linux/amd64) PLATFORM="linux/amd64" ;;
  arm64|linux/arm64) PLATFORM="linux/arm64" ;;
  both) PLATFORM="linux/amd64,linux/arm64" ;;
  *)
    warn "無効な選択です。linux/arm64 を使用します。"
    PLATFORM="linux/arm64"
    ;;
esac

# 3. タグ確認
echo ""
printf "タグ [デフォルト: %s]: " "${TAG}"; read -r TAG_INPUT
TAG="${TAG_INPUT:-$TAG}"

# 4. チャンネル選択
echo ""
echo "デプロイチャンネルを選択してください:"
echo "  1) stable  (→ :stable + :latest を更新)"
echo "  2) canary  (→ :canary を更新)"
echo "  3) none    (チャンネルタグなし)"
echo ""
printf "選択 [1-3, デフォルト: 2]: "; read -r CHANNEL_INPUT
CHANNEL_INPUT="${CHANNEL_INPUT:-2}"

case "$CHANNEL_INPUT" in
  1) CHANNEL="stable" ;;
  2) CHANNEL="canary" ;;
  3) CHANNEL="none" ;;
  stable|canary|none) CHANNEL="$CHANNEL_INPUT" ;;
  *)
    warn "無効な選択です。canary を使用します。"
    CHANNEL="canary"
    ;;
esac

# ─── 確認 ─────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────"
info "ビルド設定:"
echo "  対象コンテナ : ${BUILD_TARGET}"
echo "  プラットフォーム: ${PLATFORM}"
echo "  タグ         : ${TAG}"
echo "  チャンネル   : ${CHANNEL}"
echo "  コミット     : ${BUILD_COMMIT} (${BUILD_BRANCH})"
echo "────────────────────────────────────"
echo ""
printf "この設定でビルド・プッシュを開始しますか? [y/N]: "; read -r CONFIRM
CONFIRM="${CONFIRM:-N}"

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  warn "キャンセルしました。"
  exit 0
fi

# ─── ビルド関数 ───────────────────────────────────────────────

# チャンネルに応じた追加タグを配列で返す
# 使い方: build_image <image_name> <dockerfile>
build_image() {
  local IMAGE="$1"
  local DOCKERFILE="$2"

  local EXTRA_TAGS=()
  case "$CHANNEL" in
    stable)
      EXTRA_TAGS+=("--tag" "${IMAGE}:stable" "--tag" "${IMAGE}:latest")
      ;;
    canary)
      EXTRA_TAGS+=("--tag" "${IMAGE}:canary")
      ;;
    none) ;;
  esac

  docker buildx build \
    --platform "${PLATFORM}" \
    --file "${DOCKERFILE}" \
    --build-arg BUILD_COMMIT="${BUILD_COMMIT}" \
    --build-arg BUILD_BRANCH="${BUILD_BRANCH}" \
    --tag "${IMAGE}:${TAG}" \
    "${EXTRA_TAGS[@]}" \
    --push \
    .
}

build_backend() {
  info "Building backend: ${BACKEND_IMAGE}:${TAG} [${PLATFORM}]"
  build_image "${BACKEND_IMAGE}" "Dockerfile.backend"
  info "Backend pushed: ${BACKEND_IMAGE}:${TAG}"
}

build_frontend() {
  info "Building frontend: ${FRONTEND_IMAGE}:${TAG} [${PLATFORM}]"
  build_image "${FRONTEND_IMAGE}" "Dockerfile.frontend"
  info "Frontend pushed: ${FRONTEND_IMAGE}:${TAG}"
}

# ─── 実行 ─────────────────────────────────────────────────────
echo ""

case "$BUILD_TARGET" in
  backend)
    build_backend
    ;;
  frontend)
    build_frontend
    ;;
  both)
    build_backend
    build_frontend
    ;;
esac

echo ""
info "Done! Pushed:"
for IMAGE in \
  $([[ "$BUILD_TARGET" == "backend"  || "$BUILD_TARGET" == "both" ]] && echo "${BACKEND_IMAGE}") \
  $([[ "$BUILD_TARGET" == "frontend" || "$BUILD_TARGET" == "both" ]] && echo "${FRONTEND_IMAGE}"); do
  echo "    ${IMAGE}:${TAG}"
  case "$CHANNEL" in
    stable) echo "    ${IMAGE}:stable"; echo "    ${IMAGE}:latest" ;;
    canary) echo "    ${IMAGE}:canary" ;;
  esac
done
