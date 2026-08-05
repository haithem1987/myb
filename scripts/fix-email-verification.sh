#!/usr/bin/env bash
# fix-email-verification.sh
# Two modes:
#   --disable   : Turn off email verification requirement (quick unblock for dev/test)
#   --enable    : Re-enable email verification (requires SMTP to be configured)
#   --smtp      : Configure real SMTP + keep verification enabled
#
# NOTE: Always use http://IP:8080 (not https) to bypass the self-signed cert.
#       The script uses -k so HTTPS with self-signed cert also works as fallback.
#
# Usage examples:
#
#   # Quick fix — disable verification so users can register immediately:
#   KEYCLOAK_URL=http://54.38.0.191:8080 \
#   KEYCLOAK_ADMIN_PASSWORD=admin \
#   ./scripts/fix-email-verification.sh --disable
#
#   # Configure Gmail SMTP and keep verification on:
#   KEYCLOAK_URL=http://54.38.0.191:8080 \
#   KEYCLOAK_ADMIN_PASSWORD=admin \
#   SMTP_USER=benmaadnidhal96@gmail.com \
#   SMTP_FROM=benmaadnidhal96@gmail.com \
#   SMTP_PASSWORD=your-gmail-app-password \
#   ./scripts/fix-email-verification.sh --smtp

set -euo pipefail

MODE="${1:---help}"

KC_URL="${KEYCLOAK_URL:-http://localhost:8080}"
ADMIN="${KEYCLOAK_ADMIN:-admin}"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM="${KEYCLOAK_REALM:-MYB}"

# SMTP defaults (used only with --smtp)
SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_FROM="${SMTP_FROM:-}"
SMTP_FROM_DISPLAY_NAME="${SMTP_FROM_DISPLAY_NAME:-MYB Platform}"
SMTP_SSL="${SMTP_SSL:-false}"
SMTP_STARTTLS="${SMTP_STARTTLS:-true}"
SMTP_AUTH="${SMTP_AUTH:-true}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASSWORD="${SMTP_PASSWORD:-}"

if [[ "$MODE" == "--help" ]]; then
  sed -n '2,30p' "$0" | grep '^#' | sed 's/^# //'
  exit 0
fi

echo "═══════════════════════════════════════════════════════"
echo "  MYB — Keycloak Email Verification Fix"
echo "  Target: ${KC_URL}  Realm: ${REALM}"
echo "═══════════════════════════════════════════════════════"

# -k allows self-signed / untrusted certificates (OVH server uses self-signed cert)
CURL="curl -sk"

# ── Get admin token ─────────────────────────────────────────────────────
echo ""
echo "→ Authenticating with Keycloak..."
TOKEN=$($CURL -f -X POST "${KC_URL}/auth/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=${ADMIN}" \
  -d "password=${ADMIN_PASS}" \
  -d "grant_type=password" | jq -r '.access_token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "✗ Auth failed. Check KEYCLOAK_URL and KEYCLOAK_ADMIN_PASSWORD."
  exit 1
fi
echo "✓ Authenticated"

# ── Apply changes based on mode ─────────────────────────────────────────

if [[ "$MODE" == "--disable" ]]; then
  echo ""
  echo "→ Disabling email verification requirement..."
  HTTP_STATUS=$($CURL -o /dev/null -w "%{http_code}" \
    -X PUT "${KC_URL}/auth/admin/realms/${REALM}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "verifyEmail": false,
      "registrationAllowed": true,
      "registrationEmailAsUsername": true,
      "loginWithEmailAllowed": true,
      "resetPasswordAllowed": true
    }')

  $CURL -X PUT "${KC_URL}/auth/admin/realms/${REALM}/authentication/required-actions/VERIFY_EMAIL" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"alias":"VERIFY_EMAIL","name":"Verify Email","providerId":"VERIFY_EMAIL","enabled":true,"defaultAction":false,"priority":50}' \
    > /dev/null

  if [[ "$HTTP_STATUS" -eq 204 ]]; then
    echo "✓ Email verification is now DISABLED"
    echo ""
    echo "  Users can register and log in without verifying their email."
    echo "  To re-enable later, run:  $0 --enable"
  else
    echo "✗ Failed (HTTP ${HTTP_STATUS})"
    exit 1
  fi

elif [[ "$MODE" == "--enable" ]]; then
  echo ""
  echo "→ Re-enabling email verification..."
  HTTP_STATUS=$($CURL -o /dev/null -w "%{http_code}" \
    -X PUT "${KC_URL}/auth/admin/realms/${REALM}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"verifyEmail": true}')

  $CURL -X PUT "${KC_URL}/auth/admin/realms/${REALM}/authentication/required-actions/VERIFY_EMAIL" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"alias":"VERIFY_EMAIL","name":"Verify Email","providerId":"VERIFY_EMAIL","enabled":true,"defaultAction":true,"priority":50}' \
    > /dev/null

  if [[ "$HTTP_STATUS" -eq 204 ]]; then
    echo "✓ Email verification is now ENABLED"
    echo "  Make sure SMTP is configured or users will be stuck on verification."
  else
    echo "✗ Failed (HTTP ${HTTP_STATUS})"
    exit 1
  fi

elif [[ "$MODE" == "--smtp" ]]; then
  if [[ -z "$SMTP_FROM" || -z "$SMTP_USER" || -z "$SMTP_PASSWORD" ]]; then
    echo "✗ SMTP mode requires SMTP_FROM, SMTP_USER, and SMTP_PASSWORD to be set."
    echo ""
    echo "  Example:"
    echo "    SMTP_FROM=benmaadnidhal96@gmail.com \\"
    echo "    SMTP_USER=benmaadnidhal96@gmail.com \\"
    echo "    SMTP_PASSWORD=your-gmail-app-password \\"
    echo "    KEYCLOAK_URL=http://54.38.0.191:8080 \\"
    echo "    KEYCLOAK_ADMIN_PASSWORD=admin \\"
    echo "    $0 --smtp"
    exit 1
  fi

  SMTP_JSON="{
    \"host\": \"${SMTP_HOST}\",
    \"port\": \"${SMTP_PORT}\",
    \"from\": \"${SMTP_FROM}\",
    \"fromDisplayName\": \"${SMTP_FROM_DISPLAY_NAME}\",
    \"ssl\": \"${SMTP_SSL}\",
    \"starttls\": \"${SMTP_STARTTLS}\",
    \"auth\": \"${SMTP_AUTH}\",
    \"user\": \"${SMTP_USER}\",
    \"password\": \"${SMTP_PASSWORD}\"
  }"

  echo ""
  echo "→ Configuring SMTP (${SMTP_HOST}:${SMTP_PORT}) + enabling verification..."
  HTTP_STATUS=$($CURL -o /dev/null -w "%{http_code}" \
    -X PUT "${KC_URL}/auth/admin/realms/${REALM}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"verifyEmail\": true,
      \"registrationAllowed\": true,
      \"registrationEmailAsUsername\": true,
      \"loginWithEmailAllowed\": true,
      \"resetPasswordAllowed\": true,
      \"smtpServer\": ${SMTP_JSON}
    }")

  $CURL -X PUT "${KC_URL}/auth/admin/realms/${REALM}/authentication/required-actions/VERIFY_EMAIL" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"alias":"VERIFY_EMAIL","name":"Verify Email","providerId":"VERIFY_EMAIL","enabled":true,"defaultAction":true,"priority":50}' \
    > /dev/null

  if [[ "$HTTP_STATUS" -eq 204 ]]; then
    echo "✓ SMTP configured and email verification enabled"
    echo "  From: ${SMTP_FROM}  Host: ${SMTP_HOST}:${SMTP_PORT}"
  else
    echo "✗ Failed (HTTP ${HTTP_STATUS})"
    exit 1
  fi

else
  echo "✗ Unknown mode: ${MODE}"
  echo "  Use --disable, --enable, or --smtp"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════"
