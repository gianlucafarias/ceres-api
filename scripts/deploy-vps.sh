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

git config --global --add safe.directory "${APP_DIR}"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git reset --hard "origin/${BRANCH}"

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

get_env_var() {
  local key="$1"
  local fallback="${2:-}"
  if [ ! -f .env ]; then
    echo "${fallback}"
    return
  fi

  local line
  line="$(grep -E "^${key}=" .env | tail -n1 || true)"
  if [ -z "${line}" ]; then
    echo "${fallback}"
    return
  fi

  echo "${line#*=}"
}

OBS_STACK_ENABLED="$(get_env_var OBS_STACK_ENABLED false)"

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

deploy_api_only() {
  API_IMAGE_TAG="${IMAGE_TAG}" ${COMPOSE_CMD} up -d --remove-orphans api
}

write_prometheus_config() {
  local scrape_interval
  local ops_api_key
  scrape_interval="$(get_env_var OBS_PROMETHEUS_SCRAPE_INTERVAL 30s)"
  ops_api_key="$(get_env_var OPS_API_KEY "")"

  cat > .deploy/prometheus.yml <<EOF
global:
  scrape_interval: ${scrape_interval}
  evaluation_interval: ${scrape_interval}
scrape_configs:
  - job_name: "ceres-api"
    metrics_path: "/api/v1/ops/metrics"
    params:
      api_key: ["${ops_api_key}"]
    static_configs:
      - targets: ["host.docker.internal:3022"]
EOF
}

deploy_with_observability() {
  write_prometheus_config
  API_IMAGE_TAG="${IMAGE_TAG}" ${COMPOSE_CMD} \
    -f docker-compose.yml \
    -f docker-compose.observability.yml \
    --profile observability \
    up -d --remove-orphans api prometheus grafana
}

if [ "${OBS_STACK_ENABLED}" = "true" ]; then
  set +e
  deploy_with_observability
  OBS_DEPLOY_EXIT=$?
  set -e
  if [ "${OBS_DEPLOY_EXIT}" -ne 0 ]; then
    echo "WARN: observability deploy failed, continuing with API-only deploy."
    deploy_api_only
  fi
else
  deploy_api_only
fi

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
rollback_api_only() {
  API_IMAGE_TAG="${ROLLBACK_TAG}" ${COMPOSE_CMD} up -d --remove-orphans api
}

rollback_with_observability() {
  write_prometheus_config
  API_IMAGE_TAG="${ROLLBACK_TAG}" ${COMPOSE_CMD} \
    -f docker-compose.yml \
    -f docker-compose.observability.yml \
    --profile observability \
    up -d --remove-orphans api prometheus grafana
}

if [ "${OBS_STACK_ENABLED}" = "true" ]; then
  set +e
  rollback_with_observability
  OBS_ROLLBACK_EXIT=$?
  set -e
  if [ "${OBS_ROLLBACK_EXIT}" -ne 0 ]; then
    echo "WARN: observability rollback failed, trying API-only rollback."
    rollback_api_only
  fi
else
  rollback_api_only
fi
exit 1
