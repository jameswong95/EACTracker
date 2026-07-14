#!/usr/bin/env sh
set -eu

BASE_URL="${1:-http://127.0.0.1}"
echo "Checking ${BASE_URL}/api/ready"
for i in $(seq 1 30); do
  if curl -fsS "${BASE_URL}/api/ready" >/dev/null; then
    echo "healthy"
    exit 0
  fi
  sleep 2
done

echo "health check failed" >&2
exit 1

