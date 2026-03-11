#!/usr/bin/env bash
set -euo pipefail

API_URL="${1:-http://localhost:4000}"

echo "Smoke test basladi: ${API_URL}"
curl -fsS "${API_URL}/health" | grep -q "\"status\":\"ok\""
echo "Health check basarili."
