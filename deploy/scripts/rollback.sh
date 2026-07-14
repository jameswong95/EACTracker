#!/usr/bin/env sh
set -eu

ENVIRONMENT="${1:?usage: rollback.sh <uat|prod>}"
ROOT="${ROOT:-/opt/eactracker}"
. "${ROOT}/releases/previous.env"

"${ROOT}/deploy/scripts/deploy-compose.sh" "${ENVIRONMENT}" "${FRONTEND_IMAGE_TAG}" "${BACKEND_IMAGE_TAG}"
echo "rollback completed to frontend=${FRONTEND_IMAGE_TAG} backend=${BACKEND_IMAGE_TAG}"

