#!/usr/bin/env bash
# Build and start the Lasam urban-planning static app on the on-prem server.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-urban-planning-onprem}"
COMPOSE_FILES=( -f docker-compose.onprem.yml )
ENV_FILE="${ENV_FILE:-.env.onprem}"
READY_TIMEOUT_SEC="${READY_TIMEOUT_SEC:-180}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. cp .env.onprem.example .env.onprem and set the public hostname." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

READY_URL="${READY_URL:-http://127.0.0.1:${ONPREM_WEB_PORT:-80}/}"

compose() {
  docker compose -p "${COMPOSE_PROJECT_NAME}" "${COMPOSE_FILES[@]}" --env-file "${ENV_FILE}" "$@"
}

echo "==> Compose up --build (${COMPOSE_PROJECT_NAME})"
compose up -d --build

echo "==> Waiting for ${READY_URL} (timeout ${READY_TIMEOUT_SEC}s)"
deadline=$((SECONDS + READY_TIMEOUT_SEC))
until curl -sf -o /dev/null "${READY_URL}"; do
  if (( SECONDS >= deadline )); then
    echo "Timed out waiting for web." >&2
    compose ps
    compose logs --tail=80 web || true
    exit 1
  fi
  sleep 3
done
echo "Web ready."

APP_URL="${APP_URL:-${ONPREM_APP_URL:-http://127.0.0.1:${ONPREM_WEB_PORT:-80}}}"
export APP_URL
./scripts/post-deploy-smoke-onprem.sh

echo "Deploy complete. Project: ${COMPOSE_PROJECT_NAME}"
echo "Local: http://127.0.0.1:${ONPREM_WEB_PORT:-80}/"
echo "Public: ${ONPREM_APP_URL:-set ONPREM_APP_URL after Cloudflare DNS}"
