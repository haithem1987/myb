#!/usr/bin/env bash
###############################################################################
# Full MYB stack in Docker on a developer machine (backend, both front-ends, Keycloak),
# ready to open in a browser and to test Web Push.
#
#   bash scripts/push-local.sh up                 # build the fronts, start everything, set up Keycloak
#   bash scripts/push-local.sh up --debug         # same, with debuggable notification/coproperty
#   SKIP_FRONT_BUILD=1 bash scripts/push-local.sh up   # reuse the last front build
#   bash scripts/push-local.sh send owner ["Message"] ["/coproperty/select"]
#                                                 # push a notification to a test user,
#                                                 # exactly like coproperty-management does
#   bash scripts/push-local.sh down               # stop the containers
#
#   Owner space  → http://localhost:4200     Syndic space → http://localhost:4201
#
# http://localhost is a secure context, so browsers allow Web Push without HTTPS.
# See docs/LOCAL_DOCKER_STACK.md.
###############################################################################
set -euo pipefail

cd "$(dirname "$0")/.."

# Load .env so shell variables (KEYCLOAK_ADMIN_PASSWORD etc.) are available to the script,
# not just to docker compose.
if [ -f .env ]; then
  set -o allexport; source .env; set +o allexport
fi

KC_URL="${KC_URL:-http://localhost:8080}"
NOTIFICATION_URL="${NOTIFICATION_URL:-http://localhost:8085}"
COPROPERTY_URL="${COPROPERTY_URL:-http://localhost:8088}"
REALM="MYB"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
SERVICE_CLIENT_ID="${KEYCLOAK_SERVICE_CLIENT_ID:-myb-backend}"
# Same default as docker-compose.yml (myb-coproperty) so both sides agree locally.
SERVICE_CLIENT_SECRET="${KEYCLOAK_SERVICE_CLIENT_SECRET:-Iae91CtN9N1a3voLVYW4yFsaA7woSTDD}"
PUSH_ENV_FILE=".env.push.local"
SERVICES=(
  keycloak-db keycloak mailhog rabbitmq
  notificationDB copropertyDB timesheetDB documentDB invoiceDB paymentDB
  myb-notification myb-coproperty myb-mailer myb-usermanager myb-timesheet myb-docmanager myb-invoice myb-payment
  myb-client-local myb-admin-local
)
FRONT_DIR="src/front/myb.front"

# The project's Keycloak scripts call python3. On Windows only `python` usually exists, and it
# ends lines with \r\n: the stray \r would corrupt the IDs that the scripts put in URLs.
PYTHON="$(command -v python3 2>/dev/null || true)"
if [ -z "$PYTHON" ] || ! "$PYTHON" --version >/dev/null 2>&1; then
  SHIM_DIR="$(mktemp -d)"
  printf '#!/usr/bin/env bash\nset -o pipefail\n"%s" "$@" | tr -d "\\r"\n' "$(command -v python)" > "$SHIM_DIR/python3"
  chmod +x "$SHIM_DIR/python3"
  export PATH="$SHIM_DIR:$PATH"
  PYTHON="$SHIM_DIR/python3"
fi

COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.local.yml)

compose() {
  docker compose "${COMPOSE_FILES[@]}" --env-file .env --env-file "$PUSH_ENV_FILE" "$@"
}

ensure_vapid_keys() {
  if [ -f "$PUSH_ENV_FILE" ]; then
    return
  fi
  echo "→ Generating local VAPID keys in $PUSH_ENV_FILE (git-ignored)"
  node -e "
const c = require('crypto');
const { publicKey, privateKey } = c.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const p = publicKey.export({ format: 'jwk' }), k = privateKey.export({ format: 'jwk' });
const raw = Buffer.concat([Buffer.from([4]), Buffer.from(p.x, 'base64url'), Buffer.from(p.y, 'base64url')]);
require('fs').writeFileSync('$PUSH_ENV_FILE',
  '# Local-only VAPID keys for Web Push. Never commit.\n' +
  'PUSH_VAPID_PUBLIC_KEY=' + raw.toString('base64url') + '\n' +
  'PUSH_VAPID_PRIVATE_KEY=' + k.d + '\n' +
  'PUSH_VAPID_SUBJECT=mailto:support@myb-platform.com\n');"
}

wait_for() {
  local url="$1" label="$2"
  echo -n "→ Waiting for $label"
  for _ in $(seq 1 90); do
    if curl -sf -o /dev/null "$url"; then echo " ✓"; return; fi
    echo -n "."; sleep 2
  done
  echo " ✗ ($url not reachable)"; exit 1
}

# Like wait_for, but any HTTP answer (401 included) means the service is up.
wait_for_status() {
  local url="$1" label="$2" code
  echo -n "→ Waiting for $label"
  for _ in $(seq 1 90); do
    code="$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)"
    if [ "$code" != "000" ]; then echo " ✓"; return; fi
    echo -n "."; sleep 2
  done
  echo " ✗ ($url not reachable)"; exit 1
}

copropertydb_sql() {
  compose exec -T copropertyDB psql -U "${COPROPERTY_DB_USER:-postgres}" -d "${COPROPERTY_DB_NAME:-copropertyDB}" "$@"
}

ensure_owner_units_table() {
  echo -n "→ Checking coproperty schema"
  for _ in $(seq 1 60); do
    if [ "$(copropertydb_sql -Atc "select to_regclass('public.\"Units\"') is not null" 2>/dev/null | tr -d '\r')" = "t" ]; then
      break
    fi
    echo -n "."; sleep 2
  done
  if [ "$(copropertydb_sql -Atc "select to_regclass('public.\"OwnerUnits\"') is not null" | tr -d '\r')" != "t" ]; then
    copropertydb_sql -v ON_ERROR_STOP=1 -q < scripts/create-owner-units-table.sql >/dev/null
    echo " (OwnerUnits created)"
  else
    echo " ✓"
  fi
}

# Migration 20260601_AddPaymentValidation has no [Migration] attribute, so EF never applies it:
# fresh databases lack these columns and every fund-call query fails. Needs the table first.
ensure_payment_validation_columns() {
  for _ in $(seq 1 60); do
    if [ "$(copropertydb_sql -Atc "select to_regclass('public.\"FundCallPayments\"') is not null" 2>/dev/null | tr -d '\r')" = "t" ]; then
      break
    fi
    sleep 2
  done
  copropertydb_sql -v ON_ERROR_STOP=1 -q >/dev/null <<'SQL'
ALTER TABLE "FundCallPayments" ADD COLUMN IF NOT EXISTS "ValidationStatus" character varying(20) NOT NULL DEFAULT 'Pending';
ALTER TABLE "FundCallPayments" ADD COLUMN IF NOT EXISTS "RejectionReason" character varying(500) NULL;
SQL
}

# Demo residence (scripts/seed-residence-ellyssa.sql, idempotent), then linked to the local test
# accounts: the syndic manages it and owner@myb-test.com owns its first unit.
seed_demo_data() {
  echo -n "→ Demo data (Residence Ellyssa)"
  copropertydb_sql -v ON_ERROR_STOP=1 -q < scripts/seed-residence-ellyssa.sql >/dev/null
  local syndic_id owner_id
  syndic_id="$(keycloak user-id syndic@myb-test.com)"
  owner_id="$(keycloak user-id owner@myb-test.com)"
  copropertydb_sql -v ON_ERROR_STOP=1 -q >/dev/null <<SQL
UPDATE "Coproperties" SET "ManagerId" = '$syndic_id', "ManagerName" = 'Marie Dubois'
 WHERE "Id" = 'e1100000-0000-4000-8000-000000000001';
UPDATE "Owners" SET "UserId" = '$owner_id', "Email" = 'owner@myb-test.com', "FirstName" = 'Jean', "LastName" = 'Martin'
 WHERE "Id" = 'e1300000-0000-4000-8000-000000000001';
SQL
  echo " ✓"
}

keycloak() {
  KC_URL="$KC_URL" KEYCLOAK_ADMIN_USER="$ADMIN_USER" KEYCLOAK_ADMIN_PASSWORD="$ADMIN_PASS" \
    KEYCLOAK_SERVICE_CLIENT_ID="$SERVICE_CLIENT_ID" KEYCLOAK_SERVICE_CLIENT_SECRET="$SERVICE_CLIENT_SECRET" \
    "$PYTHON" scripts/push-local-keycloak.py "$@"
}

# Local builds of both apps (localhost URLs, service worker on), served by nginx containers.
build_fronts() {
  if [ "${SKIP_FRONT_BUILD:-}" = "1" ] && [ -f "$FRONT_DIR/dist/local/client/index.html" ]      && [ -f "$FRONT_DIR/dist/local/admin/index.html" ]; then
    echo "→ Reusing the last front build (SKIP_FRONT_BUILD=1)"
    return
  fi
  if [ ! -d "$FRONT_DIR/node_modules" ]; then
    echo "→ Installing front dependencies"
    (cd "$FRONT_DIR" && npm ci --legacy-peer-deps --no-audit --no-fund)
  fi
  for app in client admin; do
    echo "→ Building $app front-end"
    (cd "$FRONT_DIR" && npx nx build "$app" --configuration=pushdev --output-path="dist/local/$app" >/dev/null)       || { echo "✗ $app build failed: cd $FRONT_DIR && npx nx build $app --configuration=pushdev"; exit 1; }
  done
}

cmd_up() {
  ensure_vapid_keys
  build_fronts
  echo "→ Building and starting: ${SERVICES[*]}"
  compose up -d --build "${SERVICES[@]}"

  wait_for "$KC_URL/realms/master" "Keycloak"
  echo "→ Keycloak setup"
  keycloak setup

  # No EF migration creates "OwnerUnits", so a fresh coproperty database stops migrating
  # until the project's manual script has created it.
  ensure_owner_units_table

  # The coproperty service caches its service token: restart it once the client is ready.
  compose restart myb-coproperty >/dev/null
  wait_for "$NOTIFICATION_URL/health" "notification service"
  wait_for_status "$COPROPERTY_URL/graphql" "coproperty service"
  ensure_payment_validation_columns
  # Seed once coproperty has applied its migrations (the seed targets the current schema).
  seed_demo_data

  if curl -s "$NOTIFICATION_URL/api/push/vapid-public-key" -o /dev/null -w "%{http_code}" | grep -q "401"; then
    echo "→ Push API is up (authentication required) ✓"
  fi
  wait_for "http://localhost:4200/" "owner space (client)"
  wait_for "http://localhost:4201/" "syndic space (admin)"
  echo
  compose ps --format "table {{.Service}}	{{.Status}}	{{.Ports}}" "${SERVICES[@]}" 2>/dev/null || true
  cat <<EOF

═══════════════════════════════════════════════════════════════
  MYB is running in Docker:
    Owner space  (copropriétaire): http://localhost:4200
    Syndic space (syndic):         http://localhost:4201
    Keycloak admin:                http://localhost:8080/admin   (admin / admin)
    Mails (MailHog):               http://localhost:8025

  Test accounts: owner@myb-test.com / owner123 | syndic@myb-test.com / syndic123

  Push: in « Mon profil », click « Activer les notifications », then with MYB
  in the background:  bash scripts/push-local.sh send owner "Votre paiement a été validé."
═══════════════════════════════════════════════════════════════
EOF
}

cmd_send() {
  local username="${1:?usage: push-local.sh send <username> [message] [url]}"
  local message="${2:-Notification de test MYB 🔔}"
  local url="${3:-/coproperty/select}"
  local user_id service_token

  # Short names map to the test accounts; anything else is used as an e-mail address.
  case "$username" in
    owner|syndic) username="$username@myb-test.com" ;;
  esac
  user_id="$(keycloak user-id "$username")"

  service_token="$(curl -s -X POST "$KC_URL/realms/$REALM/protocol/openid-connect/token" \
    -d "grant_type=client_credentials" -d "client_id=$SERVICE_CLIENT_ID" -d "client_secret=$SERVICE_CLIENT_SECRET" \
    | "$PYTHON" -c "import sys,json; print(json.load(sys.stdin)['access_token'])")"

  local body
  body="$(MESSAGE="$message" RECEIVER="$user_id" URL="$url" "$PYTHON" -c "
import json, os
print(json.dumps({'senderId': 'system', 'receiverId': os.environ['RECEIVER'],
                  'message': os.environ['MESSAGE'], 'url': os.environ['URL'], 'urgency': 'high'}))")"

  local status
  status="$(curl -s -o /dev/null -w "%{http_code}" -X POST "$NOTIFICATION_URL/api/Notifications" \
    -H "Authorization: Bearer $service_token" -H "Content-Type: application/json" --data-binary "$body")"
  if [ "$status" = "200" ]; then
    echo "✓ Notification sent to $username ($user_id). Push delivery runs in the background."
  else
    echo "✗ Notification service answered HTTP $status"; exit 1
  fi
}

case "${1:-up}" in
  up)
    if [ "${2:-}" = "--debug" ]; then
      # Debug builds of notification + coproperty with vsdbg inside (docs/DEBUG_DOCKER_LOCAL.md).
      COMPOSE_FILES+=(-f docker-compose.debug.yml)
    elif [ -n "${2:-}" ]; then
      echo "usage: $0 up [--debug]"; exit 1
    fi
    cmd_up
    if [ "${2:-}" = "--debug" ]; then
      echo "  Debug mode: attach from VS Code (Run and Debug → « Docker: attach notification »"
      echo "  or « Docker: attach coproperty »). Back to normal images: $0 up"
    fi
    ;;
  send) shift; cmd_send "$@" ;;
  down) compose stop "${SERVICES[@]}" ;;
  *) echo "usage: $0 [up [--debug]|send <username> [message] [url]|down]"; exit 1 ;;
esac
