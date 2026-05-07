#!/usr/bin/env bash
# Quick smoke: hit /actuator/health and dev-login, then list this week's events.
set -euo pipefail

API="${CHRONOS_API_URL:-http://localhost:8080}"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "$COOKIE_FILE"' EXIT

echo "[smoke] /actuator/health"
curl -sS "$API/actuator/health"
echo

echo "[smoke] dev-login"
curl -sS -c "$COOKIE_FILE" -X POST "$API/api/auth/dev-login"
echo

echo "[smoke] /api/events (this week)"
FROM=$(python3 -c "
import datetime as d
now = d.datetime.now(d.timezone.utc)
mon = now - d.timedelta(days=now.weekday())
mon = mon.replace(hour=0, minute=0, second=0, microsecond=0)
print(mon.strftime('%Y-%m-%dT%H:%M:%SZ'))
")
TO=$(python3 -c "
import datetime as d
now = d.datetime.now(d.timezone.utc)
mon = now - d.timedelta(days=now.weekday())
mon = mon.replace(hour=0, minute=0, second=0, microsecond=0)
print((mon + d.timedelta(days=7)).strftime('%Y-%m-%dT%H:%M:%SZ'))
")
curl -sS -b "$COOKIE_FILE" "$API/api/events?from=$FROM&to=$TO" | python3 -m json.tool
