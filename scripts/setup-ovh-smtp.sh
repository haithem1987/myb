#!/usr/bin/env bash
# setup-ovh-smtp.sh
# Configure BOTH Keycloak AND the mailer k8s secret to use OVH MXplan SMTP.
# Uses ssl0.ovh.net:465 (SSL) — no port-blocking issues since we're on OVH infrastructure.
#
# ── OVH Email Setup (one-time, ~5 minutes) ──────────────────────────────
#   1. Log in to OVH Manager: https://www.ovh.com/manager/
#   2. Go to: Web Cloud → Emails → myb-platform.com
#   3. Click "Create an email address"
#      → Account: contact  → Full address: contact@myb-platform.com
#      → Set a strong password (save it — you'll need it below)
#   4. (Optional) Also create: noreply@myb-platform.com for automated emails
#
# ── Run ─────────────────────────────────────────────────────────────────
#   OVH_EMAIL_PASSWORD=<password-you-set-in-ovh> \
#   KEYCLOAK_ADMIN_PASSWORD=<your-kc-admin-pass> \
#   ./scripts/setup-ovh-smtp.sh
#
# ── SMTP Settings Reference ──────────────────────────────────────────────
#   Host:     ssl0.ovh.net
#   Port:     465  (SSL/TLS — most reliable on OVH infra)
#   Alt Port: 587  (STARTTLS — works too from OVH k8s)
#   User:     contact@myb-platform.com
#   Password: the password you set in OVH Manager
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

KC_URL="${KEYCLOAK_URL:-https://54.38.0.191}"
ADMIN="${KEYCLOAK_ADMIN:-admin}"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM="${KEYCLOAK_REALM:-MYB}"
KUBECONFIG_PATH="${KUBECONFIG:-/Volumes/NidhalSSD/Projects/myb/terraform/ovh/environments/hprd/kubeconfig-hprd.yml}"
NAMESPACE="myb-platform"

OVH_EMAIL_USER="${OVH_EMAIL_USER:-contact@myb-platform.com}"
OVH_EMAIL_PASSWORD="${OVH_EMAIL_PASSWORD:-}"
SMTP_FROM="${SMTP_FROM:-contact@myb-platform.com}"
SMTP_FROM_DISPLAY_NAME="${SMTP_FROM_DISPLAY_NAME:-MYB Platform}"
SMTP_HOST="ssl0.ovh.net"
SMTP_PORT="465"       # SSL/TLS — no OVH port blocking (it's OVH's own relay)
SMTP_SSL="true"
SMTP_STARTTLS="false" # Not needed when SSL=true on port 465

if [[ -z "$OVH_EMAIL_PASSWORD" ]]; then
  echo "✗ OVH_EMAIL_PASSWORD is required."
  echo ""
  echo "  Steps to get it:"
  echo "  1. Go to https://www.ovh.com/manager/ → Web Cloud → Emails → myb-platform.com"
  echo "  2. Create account: contact@myb-platform.com (or reset password if it exists)"
  echo "  3. Re-run: OVH_EMAIL_PASSWORD=<your-password> ./scripts/setup-ovh-smtp.sh"
  exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "  MYB — OVH MXplan SMTP Setup"
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
      \"user\": \"${OVH_EMAIL_USER}\",
      \"password\": \"${OVH_EMAIL_PASSWORD}\"
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

# ── 2. Update k8s smtp-credentials secret (for myb-mailer service) ───────
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
  --from-literal=SMTP_USERNAME="$OVH_EMAIL_USER" \
  --from-literal=SMTP_PASSWORD="$OVH_EMAIL_PASSWORD" \
  --save-config \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✓ k8s smtp-credentials → ${SMTP_HOST}:${SMTP_PORT}"

# Restart mailer pods to pick up new secret
echo ""
echo "→ Restarting myb-mailer pods..."
kubectl rollout restart deployment/myb-mailer -n "$NAMESPACE"
kubectl rollout status deployment/myb-mailer -n "$NAMESPACE" --timeout=120s || \
  echo "(rollout still in progress — pods will be ready shortly)"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✓ OVH SMTP setup complete!"
echo ""
echo "  Verification emails will now be sent from:"
echo "    ${SMTP_FROM}"
echo ""
echo "  Test: log in to Keycloak admin → Realm Settings"
echo "        → Email → Send test email"
echo "═══════════════════════════════════════════════════════"
