#!/usr/bin/env bash
# Smoke-test the on-prem urban-planning app (localhost or public Cloudflare URL).
# Usage:
#   ./scripts/post-deploy-smoke-onprem.sh
#   APP_URL=https://lasam.dost02.com ./scripts/post-deploy-smoke-onprem.sh
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1}"

echo "==> Web home (${APP_URL}/)"
home="$(curl -sfL "${APP_URL}/")"
echo "${home}" | grep -qi "urban planning"

echo "==> SPA shell is HTML"
echo "${home}" | grep -qi "<!doctype html"

echo "==> Boundary data (${APP_URL}/data/administrative/psa-lasam-boundary.geojson)"
curl -sf -o /dev/null "${APP_URL}/data/administrative/psa-lasam-boundary.geojson"

echo ""
echo "Automated smoke checks passed."
echo "Open ${APP_URL} and confirm the Lasam map loads."
