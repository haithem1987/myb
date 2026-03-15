#!/usr/bin/env bash
# configure-keycloak-smtp.sh
# Configures SMTP settings on a Keycloak realm via the Admin REST API.
# Run this once after Keycloak is fully started.
#
# Usage:
#   ./scripts/configure-keycloak-smtp.sh
#
# Environment variables (defaults match docker-compose dev setup):
#   KEYCLOAK_URL          http://localhost:8080
#   KEYCLOAK_ADMIN        admin
#   KEYCLOAK_ADMIN_PASSWORD admin
#   KEYCLOAK_REALM        myb
#   SMTP_HOST             mailhog
#   SMTP_PORT             1025
#   SMTP_FROM             noreply@myb.com
#   SMTP_FROM_DISPLAY_NAME MYB Platform
#   SMTP_SSL              false
#   SMTP_STARTTLS         false
#   SMTP_AUTH             false

set -euo pipefail

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM="${KEYCLOAK_REALM:-myb}"
SMTP_HOST="${SMTP_HOST:-mailhog}"
SMTP_PORT="${SMTP_PORT:-1025}"
SMTP_FROM="${SMTP_FROM:-noreply@myb.com}"
SMTP_FROM_DISPLAY_NAME="${SMTP_FROM_DISPLAY_NAME:-MYB Platform}"
SMTP_SSL="${SMTP_SSL:-false}"
SMTP_STARTTLS="${SMTP_STARTTLS:-false}"
SMTP_AUTH="${SMTP_AUTH:-false}"

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

echo "→ Configuring SMTP for realm '${REALM}'..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"smtpServer\": {
      \"host\": \"${SMTP_HOST}\",
      \"port\": \"${SMTP_PORT}\",
      \"from\": \"${SMTP_FROM}\",
      \"fromDisplayName\": \"${SMTP_FROM_DISPLAY_NAME}\",
      \"ssl\": \"${SMTP_SSL}\",
      \"starttls\": \"${SMTP_STARTTLS}\",
      \"auth\": \"${SMTP_AUTH}\"
    }
  }")

if [[ "$HTTP_STATUS" -eq 204 ]]; then
  echo "✓ SMTP configured successfully on realm '${REALM}'."
  echo "  Host: ${SMTP_HOST}:${SMTP_PORT}  From: ${SMTP_FROM}"
else
  echo "✗ Unexpected HTTP status: ${HTTP_STATUS}"
  echo "  Check that realm '${REALM}' exists in Keycloak."
  exit 1
fi
