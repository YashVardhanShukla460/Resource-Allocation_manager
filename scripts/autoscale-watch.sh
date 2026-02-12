#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3000/api}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-30}"

while true; do
  curl -s -X POST "${API_BASE}/admin/autoscale-check" -H "Content-Type: application/json" || true
  echo ""
  sleep "${INTERVAL_SECONDS}"
done
