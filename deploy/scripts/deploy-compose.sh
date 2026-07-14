#!/usr/bin/env sh
set -eu

ENVIRONMENT="${1:?usage: deploy-compose.sh <uat|prod> <frontend-tag> <backend-tag>}"
FRONTEND_TAG="${2:?frontend image tag required}"
BACKEND_TAG="${3:?backend image tag required}"
ROOT="${ROOT:-/opt/eactracker}"
RELEASE_DIR="${ROOT}/releases"
COMPOSE_FILE="deploy/docker-compose.${ENVIRONMENT}.yml"

mkdir -p "${RELEASE_DIR}"
if [ -f "${RELEASE_DIR}/current.env" ]; then
  cp "${RELEASE_DIR}/current.env" "${RELEASE_DIR}/previous.env"
fi

cat > "${RELEASE_DIR}/current.env" <<EOF
FRONTEND_IMAGE_TAG=${FRONTEND_TAG}
BACKEND_IMAGE_TAG=${BACKEND_TAG}
DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

cd "${ROOT}"
export FRONTEND_IMAGE_TAG="${FRONTEND_TAG}"
export BACKEND_IMAGE_TAG="${BACKEND_TAG}"

docker compose -f "${COMPOSE_FILE}" pull
docker compose -f "${COMPOSE_FILE}" run --rm backend npm run db:deploy
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans
./deploy/scripts/health-check.sh "${APP_BASE_URL:-http://127.0.0.1}"
./deploy/scripts/smoke-test.sh "${APP_BASE_URL:-http://127.0.0.1}"

