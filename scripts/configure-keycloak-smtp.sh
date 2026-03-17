#!/usr/bin/env bash
# configure-keycloak-smtp.sh
# Configures SMTP settings on a Keycloak realm via the Admin REST API.
# Run this once after Keycloak is fully started.
#
# Usage (dev — Mailhog, no auth):
#   ./scripts/configure-keycloak-smtp.sh
#
# Usage (Gmail App Password):
#   SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_STARTTLS=true \
#   SMTP_AUTH=true SMTP_USER=you@gmail.com SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx \
#   SMTP_FROM=you@gmail.com \
#   ./scripts/configure-keycloak-smtp.sh
#
# Environment variables (defaults match docker-compose dev setup):
#   KEYCLOAK_URL          http://localhost:8080
#   KEYCLOAK_ADMIN        admin
#   KEYCLOAK_ADMIN_PASSWORD admin
#   KEYCLOAK_REALM        MYB
#   SMTP_HOST             mailhog
#   SMTP_PORT             1025
#   SMTP_FROM             noreply@myb.com
#   SMTP_FROM_DISPLAY_NAME MYB Platform
#   SMTP_SSL              false
#   SMTP_STARTTLS         false
#   SMTP_AUTH             false
#   SMTP_USER             (empty)
#   SMTP_PASSWORD         (empty)

set -euo pipefail

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM="${KEYCLOAK_REALM:-MYB}"
SMTP_HOST="${SMTP_HOST:-mailhog}"
SMTP_PORT="${SMTP_PORT:-1025}"
SMTP_FROM="${SMTP_FROM:-noreply@myb.com}"
SMTP_FROM_DISPLAY_NAME="${SMTP_FROM_DISPLAY_NAME:-MYB Platform}"
SMTP_SSL="${SMTP_SSL:-false}"
SMTP_STARTTLS="${SMTP_STARTTLS:-false}"
SMTP_AUTH="${SMTP_AUTH:-false}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASSWORD="${SMTP_PASSWORD:-}"

echo "→ Obtaining Keycloak admin token..."
TOKEN=$(curl -sf -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=${KEYCLOAK_ADMIN}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
  -d "grant_type=password" | jq -r '.access_token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "✗ Failed to obtain admin token. Is Keycloak running at ${KEYCLOAK_URL}?"
  exit 1
fi

# Build SMTP JSON — include user/password only when auth is enabled
SMTP_JSON="{
  \"host\": \"${SMTP_HOST}\",
  \"port\": \"${SMTP_PORT}\",
  \"from\": \"${SMTP_FROM}\",
  \"fromDisplayName\": \"${SMTP_FROM_DISPLAY_NAME}\",
  \"ssl\": \"${SMTP_SSL}\",
  \"starttls\": \"${SMTP_STARTTLS}\",
  \"auth\": \"${SMTP_AUTH}\""

if [[ "$SMTP_AUTH" == "true" ]]; then
  SMTP_JSON="${SMTP_JSON},
  \"user\": \"${SMTP_USER}\",
  \"password\": \"${SMTP_PASSWORD}\""
fi

SMTP_JSON="${SMTP_JSON}
}"

echo "→ Configuring SMTP for realm '${REALM}'..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"smtpServer\": ${SMTP_JSON}}")

if [[ "$HTTP_STATUS" -eq 204 ]]; then
  echo "✓ SMTP configured successfully on realm '${REALM}'."
  echo "  Host: ${SMTP_HOST}:${SMTP_PORT}  From: ${SMTP_FROM}  Auth: ${SMTP_AUTH}"
else
  echo "✗ Unexpected HTTP status: ${HTTP_STATUS}"
  echo "  Check that realm '${REALM}' exists in Keycloak."
  exit 1
fi
