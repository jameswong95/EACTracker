#!/usr/bin/env sh
set -eu

docker image prune -af --filter "until=168h"

