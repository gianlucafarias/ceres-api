#!/usr/bin/env bash
set -euo pipefail

# Manual VPS deploy for current branch/tag without GitHub Actions.
# Usage:
#   ./scripts/deploy-vps.sh                 # uses branch head as image tag fallback
#   IMAGE_TAG=<tag-or-sha> ./scripts/deploy-vps.sh
#   BRANCH=main ./scripts/deploy-vps.sh

APP_DIR="${APP_DIR:-/var/www/ceres-api}"
BRANCH="${BRANCH:-main}"
IMAGE_NAME="${IMAGE_NAME:-ghcr.io/gianlucafarias/ceres-api}"
IMAGE_TAG="${IMAGE_TAG:-}"

cd "${APP_DIR}"

git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

if [ -z "${IMAGE_TAG}" ]; then
  IMAGE_TAG="$(git rev-parse HEAD)"
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Docker Compose no esta instalado (ni plugin ni standalone)."
  exit 1
fi

mkdir -p .deploy
PREVIOUS_IMAGE_ID="$(docker inspect --format='{{.Image}}' ceres-api 2>/dev/null || true)"
PREVIOUS_TAG="$(cat .deploy/current_api_image_tag 2>/dev/null || echo ${BRANCH})"
ROLLBACK_TAG="${PREVIOUS_TAG}"

if [ -n "${PREVIOUS_IMAGE_ID}" ] && docker image inspect "${PREVIOUS_IMAGE_ID}" >/dev/null 2>&1; then
  docker tag "${PREVIOUS_IMAGE_ID}" "${IMAGE_NAME}:rollback-local"
  ROLLBACK_TAG="rollback-local"
fi

if [ -n "${GHCR_TOKEN:-}" ] && [ -n "${GHCR_USERNAME:-}" ]; then
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin
fi

docker pull "${IMAGE_NAME}:${IMAGE_TAG}" || {
  echo "No se pudo descargar ${IMAGE_NAME}:${IMAGE_TAG}."
  echo "Tip: setea IMAGE_TAG manualmente a un tag existente (por ejemplo '${BRANCH}' o un sha publicado)."
  exit 1
}

API_IMAGE_TAG="${IMAGE_TAG}" ${COMPOSE_CMD} up -d --remove-orphans api

ATTEMPTS=30
SLEEP_SECONDS=2
for i in $(seq 1 "${ATTEMPTS}"); do
  STATUS="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' ceres-api 2>/dev/null || true)"
  if [ "${STATUS}" = "healthy" ]; then
    echo "${IMAGE_TAG}" > .deploy/current_api_image_tag
    echo "Deploy OK (${IMAGE_TAG})"
    exit 0
  fi
  if [ "${STATUS}" = "unhealthy" ]; then
    break
  fi
  sleep "${SLEEP_SECONDS}"
done

echo "Deploy fallo. Rollback a ${ROLLBACK_TAG}."
API_IMAGE_TAG="${ROLLBACK_TAG}" ${COMPOSE_CMD} up -d --remove-orphans api
exit 1
