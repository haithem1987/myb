#!/usr/bin/env bash
# configure-keycloak-email-verification.sh
# Enables self-registration + email verification on the Keycloak realm.
# Also configures SMTP so Keycloak can send verification / reset emails.
#
# Prerequisites:
#   - Keycloak running and healthy
#   - jq installed (brew install jq)
#
# Usage (dev — Mailhog):
#   ./scripts/configure-keycloak-email-verification.sh
#
# Usage (Gmail App Password):
#   SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_STARTTLS=true \
#   SMTP_AUTH=true SMTP_USER=you@gmail.com SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx \
#   SMTP_FROM=you@gmail.com \
#   ./scripts/configure-keycloak-email-verification.sh

set -euo pipefail

KC_URL="${KEYCLOAK_URL:-http://localhost:8080}"
ADMIN="${KEYCLOAK_ADMIN:-admin}"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
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

echo "═══════════════════════════════════════════════════════"
echo "  Keycloak Email Verification Setup"
echo "  Realm: ${REALM}  |  SMTP: ${SMTP_HOST}:${SMTP_PORT}"
echo "═══════════════════════════════════════════════════════"

# ── 1. Get admin token ───────────────────────────────────────────────────
echo ""
echo "→ Obtaining admin token..."
TOKEN=$(curl -sf -X POST "${KC_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=${ADMIN}" \
  -d "password=${ADMIN_PASS}" \
  -d "grant_type=password" | jq -r '.access_token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "✗ Failed to get admin token. Is Keycloak running at ${KC_URL}?"
  exit 1
fi
echo "✓ Token obtained"

# ── 2. Check realm exists ───────────────────────────────────────────────
echo ""
echo "→ Checking realm '${REALM}'..."
REALM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "${KC_URL}/admin/realms/${REALM}" \
  -H "Authorization: Bearer ${TOKEN}")

if [[ "$REALM_STATUS" == "404" ]]; then
  echo "✗ Realm '${REALM}' not found. Run keycloak-setup-roles-users.sh first."
  exit 1
fi
echo "✓ Realm exists"

# ── 3. Build SMTP config ────────────────────────────────────────────────
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
SMTP_JSON="${SMTP_JSON}}"

# ── 4. Update realm: enable registration + email verification + SMTP ───
echo ""
echo "→ Enabling registration, email verification, and SMTP..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "${KC_URL}/admin/realms/${REALM}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"registrationAllowed\": true,
    \"registrationEmailAsUsername\": true,
    \"verifyEmail\": true,
    \"loginWithEmailAllowed\": true,
    \"resetPasswordAllowed\": true,
    \"duplicateEmailsAllowed\": false,
    \"smtpServer\": ${SMTP_JSON}
  }")

if [[ "$HTTP_STATUS" -eq 204 ]]; then
  echo "✓ Realm updated successfully"
else
  echo "✗ Failed to update realm (HTTP ${HTTP_STATUS})"
  exit 1
fi

# ── 5. Configure required actions ────────────────────────────────────────
echo ""
echo "→ Enabling VERIFY_EMAIL required action..."
curl -s -X PUT "${KC_URL}/admin/realms/${REALM}/authentication/required-actions/VERIFY_EMAIL" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"alias\": \"VERIFY_EMAIL\",
    \"name\": \"Verify Email\",
    \"providerId\": \"VERIFY_EMAIL\",
    \"enabled\": true,
    \"defaultAction\": true,
    \"priority\": 50
  }"
echo "✓ VERIFY_EMAIL enabled as default action"

echo ""
echo "→ Enabling UPDATE_PROFILE required action..."
curl -s -X PUT "${KC_URL}/admin/realms/${REALM}/authentication/required-actions/UPDATE_PROFILE" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"alias\": \"UPDATE_PROFILE\",
    \"name\": \"Update Profile\",
    \"providerId\": \"UPDATE_PROFILE\",
    \"enabled\": true,
    \"defaultAction\": false,
    \"priority\": 40
  }"
echo "✓ UPDATE_PROFILE enabled"

# ── 6. Summary ──────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✓ Setup complete!"
echo ""
echo "  Registration flow:"
echo "    1. User goes to /register → clicks 'S'inscrire par e-mail'"
echo "    2. Keycloak shows registration form (first name, last name, email, password)"
echo "    3. After submit → Keycloak sends verification email via SMTP"
echo "    4. User clicks verification link in email"
echo "    5. Email verified → redirect to /register/complete-profile"
echo "    6. User fills phone number → Owner record created in coproperty DB"
echo ""
echo "  SMTP: ${SMTP_HOST}:${SMTP_PORT} (auth=${SMTP_AUTH})"
if [[ "$SMTP_HOST" == "mailhog" ]]; then
  echo "  Mailhog UI: http://localhost:8025"
fi
echo "═══════════════════════════════════════════════════════"
