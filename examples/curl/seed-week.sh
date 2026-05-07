#!/usr/bin/env bash
# Seed a sample week of events for the local-dev user.
#
#   make compose-up && bash examples/curl/seed-week.sh

set -euo pipefail

API="${CHRONOS_API_URL:-http://localhost:8080}"
COOKIE_FILE="$(mktemp)"
trap 'rm -f "$COOKIE_FILE"' EXIT

echo "[seed] dev-login → $API"
curl -sS -c "$COOKIE_FILE" -X POST "$API/api/auth/dev-login" >/dev/null

# ISO-8601 helper — Monday this week at 09:00 UTC.
MONDAY=$(python3 -c '
import datetime as d
now = d.datetime.now(d.timezone.utc)
mon = now - d.timedelta(days=(now.weekday()))
mon = mon.replace(hour=9, minute=0, second=0, microsecond=0)
print(mon.strftime("%Y-%m-%dT%H:%M:%SZ"))
')

mk_event() {
    local title="$1" day_off="$2" duration_h="$3"
    local starts ends
    starts=$(python3 -c "
import datetime as d
base = d.datetime.fromisoformat('${MONDAY%Z}+00:00')
print((base + d.timedelta(days=${day_off})).strftime('%Y-%m-%dT%H:%M:%SZ'))
")
    ends=$(python3 -c "
import datetime as d
base = d.datetime.fromisoformat('${MONDAY%Z}+00:00')
print((base + d.timedelta(days=${day_off}, hours=${duration_h})).strftime('%Y-%m-%dT%H:%M:%SZ'))
")
    echo "[seed] event '$title' @ $starts"
    curl -sS -b "$COOKIE_FILE" -X POST "$API/api/events" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"$title\",\"startsAt\":\"$starts\",\"endsAt\":\"$ends\"}" >/dev/null
}

mk_event "Standup"            0 1
mk_event "Design review"      1 2
mk_event "Lunch with Bob"     2 1
mk_event "1:1 with manager"   2 1
mk_event "Focus block"        3 3
mk_event "Demo"               4 2

echo "[seed] done. Visit http://localhost:3000/agenda"
