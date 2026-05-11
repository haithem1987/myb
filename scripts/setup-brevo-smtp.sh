#!/usr/bin/env bash
# setup-brevo-smtp.sh
# Configure BOTH Keycloak AND the mailer k8s secret to use Brevo SMTP.
# Uses port 587 with STARTTLS (Brevo standard). If OVH blocks 587, try 2525 (no TLS).
#
# Setup (free, 300 emails/day):
#   1. Create account: https://app.brevo.com/account/register
#   2. Go to: Settings → SMTP & API → SMTP tab
#   3. Copy: SMTP login (your email) and SMTP key (the generated password)
#
# Run:
#   BREVO_USER=aa69fc001@smtp-brevo.com \   ← SMTP login from Brevo dashboard (NOT your account email)
#   BREVO_PASSWORD=<brevo-smtp-key> \        ← xsmtpsib-... key from Settings → SMTP & API
#   KEYCLOAK_ADMIN_PASSWORD=admin \
#   ./scripts/setup-brevo-smtp.sh

set -euo pipefail

KC_URL="${KEYCLOAK_URL:-https://54.38.0.191}"
ADMIN="${KEYCLOAK_ADMIN:-admin}"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM="${KEYCLOAK_REALM:-MYB}"
KUBECONFIG_PATH="${KUBECONFIG:-/Volumes/NidhalSSD/Projects/myb/ovhcloud/kubeconfig-ebak4v.yml}"
NAMESPACE="myb-platform"

BREVO_USER="${BREVO_USER:-}"
BREVO_PASSWORD="${BREVO_PASSWORD:-}"
SMTP_FROM="${SMTP_FROM:-benmaadnidhal96@gmail.com}"
SMTP_FROM_DISPLAY_NAME="${SMTP_FROM_DISPLAY_NAME:-MYB Platform}"
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="2525"       # 587 and 465 are blocked by OVH; 2525 is open
SMTP_STARTTLS="true"  # Brevo requires STARTTLS even on port 2525

if [[ -z "$BREVO_USER" || -z "$BREVO_PASSWORD" ]]; then
  echo "✗ Set BREVO_USER and BREVO_PASSWORD"
  echo "  Get them at: https://app.brevo.com/settings/keys/smtp"
  exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "  MYB — Brevo SMTP Setup (port 2525 + STARTTLS)"
echo "═══════════════════════════════════════════════════════"

# ── 1. Update Keycloak SMTP ──────────────────────────────────────────────
echo ""
echo "→ [1/2] Configuring Keycloak SMTP..."
TOKEN=$(curl -sk --max-time 15 -f -X POST "${KC_URL}/auth/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli&username=${ADMIN}&password=${ADMIN_PASS}&grant_type=password" \
  | jq -r '.access_token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "✗ Keycloak auth failed."; exit 1
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
      \"ssl\": \"false\",
      \"starttls\": \"${SMTP_STARTTLS}\",
      \"auth\": \"true\",
      \"user\": \"${BREVO_USER}\",
      \"password\": \"${BREVO_PASSWORD}\"
    }
  }")

if [[ "$HTTP_STATUS" -eq 204 ]]; then
  echo "✓ Keycloak SMTP → ${SMTP_HOST}:${SMTP_PORT}"
else
  echo "✗ Keycloak update failed (HTTP ${HTTP_STATUS})"; exit 1
fi

# Re-enable VERIFY_EMAIL
curl -sk -o /dev/null \
  -X PUT "${KC_URL}/auth/admin/realms/${REALM}/authentication/required-actions/VERIFY_EMAIL" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"alias":"VERIFY_EMAIL","name":"Verify Email","providerId":"VERIFY_EMAIL","enabled":true,"defaultAction":true,"priority":50}'

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
  --from-literal=SMTP_ENABLE_SSL="false" \
  --from-literal=SMTP_STARTTLS="${SMTP_STARTTLS}" \
  --from-literal=SMTP_USERNAME="$BREVO_USER" \
  --from-literal=SMTP_PASSWORD="$BREVO_PASSWORD" \
  --save-config \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✓ k8s smtp-credentials → ${SMTP_HOST}:${SMTP_PORT}"

# Restart mailer pods to pick up new secret
echo ""
echo "→ Restarting myb-mailer pods..."
kubectl rollout restart deployment/myb-mailer -n "$NAMESPACE"
kubectl rollout status deployment/myb-mailer -n "$NAMESPACE" --timeout=120s || \
  echo "(rollout still in progress — pods will be ready shortly)"
echo "✓ Mailer restarted"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✓ Done! Both Keycloak and myb-mailer now use Brevo"
echo "  From: ${SMTP_FROM}  Via: ${SMTP_HOST}:${SMTP_PORT}"
echo ""
echo "  Test: Keycloak admin → Realm Settings → Email → Test connection"
echo "═══════════════════════════════════════════════════════"
