#!/usr/bin/env bash
# setup-gmail-smtp.sh
# Configure Keycloak + mailer k8s secret to use Gmail SMTP with App Password.
#
# ── Gmail App Password Setup (one-time, ~3 minutes) ─────────────────────
#   1. Log in to: https://myaccount.google.com (as myb.platform.contact@gmail.com)
#   2. Security & sign-in → Enable 2-Step Verification (required)
#   3. Go to: https://myaccount.google.com/apppasswords
#   4. App name: "MYB Platform" → Create
#   5. Copy the 16-char password (e.g. abcd efgh ijkl mnop → remove spaces)
#
# ── Run ─────────────────────────────────────────────────────────────────
#   GMAIL_APP_PASSWORD=abcdefghijklmnop \
#   KEYCLOAK_ADMIN_PASSWORD=<your-kc-admin-pass> \
#   ./scripts/setup-gmail-smtp.sh
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

KC_URL="${KEYCLOAK_URL:-https://54.38.0.191}"
ADMIN="${KEYCLOAK_ADMIN:-admin}"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM="${KEYCLOAK_REALM:-MYB}"
KUBECONFIG_PATH="${KUBECONFIG:-/Volumes/NidhalSSD/Projects/myb/terraform/ovh/environments/hprd/kubeconfig-hprd.yml}"
NAMESPACE="myb-platform"

GMAIL_USER="${GMAIL_USER:-myb.platform.contact@gmail.com}"
GMAIL_APP_PASSWORD="${GMAIL_APP_PASSWORD:-}"
SMTP_FROM="${SMTP_FROM:-myb.platform.contact@gmail.com}"
SMTP_FROM_DISPLAY_NAME="${SMTP_FROM_DISPLAY_NAME:-MYB Platform}"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SSL="true"
SMTP_STARTTLS="false"

if [[ -z "$GMAIL_APP_PASSWORD" ]]; then
  echo "✗ GMAIL_APP_PASSWORD is required."
  echo ""
  echo "  Steps:"
  echo "  1. Go to https://myaccount.google.com/apppasswords"
  echo "     (logged in as ${GMAIL_USER})"
  echo "  2. App name: MYB Platform → Create"
  echo "  3. Copy the 16-char password (no spaces)"
  echo ""
  echo "  Then run:"
  echo "    GMAIL_APP_PASSWORD=xxxx ./scripts/setup-gmail-smtp.sh"
  exit 1
fi

# Strip spaces from app password (in case user copied with spaces)
GMAIL_APP_PASSWORD="${GMAIL_APP_PASSWORD// /}"

echo "═══════════════════════════════════════════════════════"
echo "  MYB — Gmail SMTP Setup"
echo "  From:  ${SMTP_FROM}"
echo "  Host:  ${SMTP_HOST}:${SMTP_PORT} (SSL)"
echo "═══════════════════════════════════════════════════════"

# ── 1. Update Keycloak SMTP ──────────────────────────────────────────────
echo ""
echo "→ [1/2] Configuring Keycloak SMTP..."
TOKEN=$(curl -sk --max-time 15 -f -X POST "${KC_URL}/auth/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli&username=${ADMIN}&password=${ADMIN_PASS}&grant_type=password" \
  | jq -r '.access_token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "✗ Keycloak auth failed. Check KC_URL and KEYCLOAK_ADMIN_PASSWORD."; exit 1
fi

HTTP_STATUS=$(curl -sk -o /dev/null -w "%{http_code}" \
  -X PUT "${KC_URL}/auth/admin/realms/${REALM}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"verifyEmail\": true,
    \"registrationAllowed\": true,
    \"registrationEmailAsUsername\": true,
    \"loginWithEmailAllowed\": true,
    \"resetPasswordAllowed\": true,
    \"smtpServer\": {
      \"host\": \"${SMTP_HOST}\",
      \"port\": \"${SMTP_PORT}\",
      \"from\": \"${SMTP_FROM}\",
      \"fromDisplayName\": \"${SMTP_FROM_DISPLAY_NAME}\",
      \"ssl\": \"${SMTP_SSL}\",
      \"starttls\": \"${SMTP_STARTTLS}\",
      \"auth\": \"true\",
      \"user\": \"${GMAIL_USER}\",
      \"password\": \"${GMAIL_APP_PASSWORD}\"
    }
  }")

if [[ "$HTTP_STATUS" -eq 204 ]]; then
  echo "✓ Keycloak SMTP → ${SMTP_HOST}:${SMTP_PORT} (from: ${SMTP_FROM})"
else
  echo "✗ Keycloak update failed (HTTP ${HTTP_STATUS})"; exit 1
fi

# Re-enable VERIFY_EMAIL required action
curl -sk -o /dev/null \
  -X PUT "${KC_URL}/auth/admin/realms/${REALM}/authentication/required-actions/VERIFY_EMAIL" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"alias":"VERIFY_EMAIL","name":"Verify Email","providerId":"VERIFY_EMAIL","enabled":true,"defaultAction":true,"priority":50}'

echo "✓ Keycloak VERIFY_EMAIL required action enabled"

# ── 2. Update k8s smtp-credentials secret ────────────────────────────────
echo ""
echo "→ [2/2] Updating k8s smtp-credentials secret..."

export KUBECONFIG="$KUBECONFIG_PATH"

kubectl create secret generic smtp-credentials \
  --namespace="$NAMESPACE" \
  --from-literal=SMTP_HOST="$SMTP_HOST" \
  --from-literal=SMTP_PORT="$SMTP_PORT" \
  --from-literal=EMAIL_FROM_ADDRESS="$SMTP_FROM" \
  --from-literal=EMAIL_FROM_NAME="$SMTP_FROM_DISPLAY_NAME" \
  --from-literal=SMTP_ENABLE_SSL="true" \
  --from-literal=SMTP_STARTTLS="false" \
  --from-literal=SMTP_USERNAME="$GMAIL_USER" \
  --from-literal=SMTP_PASSWORD="$GMAIL_APP_PASSWORD" \
  --save-config \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✓ k8s smtp-credentials → ${SMTP_HOST}:${SMTP_PORT}"

# Restart mailer pods
echo ""
echo "→ Restarting myb-mailer pods..."
kubectl rollout restart deployment/myb-mailer -n "$NAMESPACE"
kubectl rollout status deployment/myb-mailer -n "$NAMESPACE" --timeout=120s || \
  echo "(rollout still in progress — pods will be ready shortly)"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✓ Gmail SMTP setup complete!"
echo ""
echo "  Verification emails will now be sent from:"
echo "    ${SMTP_FROM}"
echo ""
echo "  Test: Keycloak admin → Realm Settings → Email → Send test email"
echo "═══════════════════════════════════════════════════════"
