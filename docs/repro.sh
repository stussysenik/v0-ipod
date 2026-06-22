#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")"

PORT=4101 PORT_STRICT=1 bun run build >/tmp/v0-ipod-build.log 2>&1

PORT=4101 PORT_STRICT=1 bun run start >/tmp/v0-ipod-start.log 2>&1 &
server_pid=$!

cleanup() {
  kill "$server_pid" 2>/dev/null || true
}

trap cleanup EXIT

for _ in {1..40}; do
  if curl --silent --fail http://127.0.0.1:4101/ >/tmp/v0-ipod-home.html; then
    if grep -q "<title>iPod Snapshot</title>" /tmp/v0-ipod-home.html; then
      exit 0
    fi
    break
  fi
  sleep 0.5
done

tail -n 50 /tmp/v0-ipod-start.log >&2 || true
exit 1
