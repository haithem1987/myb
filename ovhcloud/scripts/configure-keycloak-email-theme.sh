#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
namespace="${NAMESPACE:-myb-platform}"
kubectl -n "$namespace" create configmap myb-keycloak-email-theme \
  --from-file=theme.properties="$root/keycloak-theme/myb/email/theme.properties" \
  --from-file=messages_en.properties="$root/keycloak-theme/myb/email/messages/messages_en.properties" \
  --from-file=messages_fr.properties="$root/keycloak-theme/myb/email/messages/messages_fr.properties" \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n "$namespace" patch deployment keycloak --type=strategic --patch '{"spec":{"template":{"spec":{"volumes":[{"name":"myb-email-theme","configMap":{"name":"myb-keycloak-email-theme","items":[{"key":"theme.properties","path":"theme.properties"},{"key":"messages_en.properties","path":"messages/messages_en.properties"},{"key":"messages_fr.properties","path":"messages/messages_fr.properties"}]}}],"containers":[{"name":"keycloak","volumeMounts":[{"name":"myb-email-theme","mountPath":"/opt/keycloak/themes/myb/email","readOnly":true}]}]}}}}'
kubectl -n "$namespace" rollout status deployment/keycloak --timeout=300s
kubectl -n "$namespace" exec deployment/keycloak -- sh -c '
  set -eu
  config=/tmp/myb-email-kcadm-$$.config
  trap '\''rm -f "$config"'\'' EXIT
  /opt/keycloak/bin/kcadm.sh config credentials --config "$config" --server http://localhost:8080/auth --realm master --user "$KEYCLOAK_ADMIN" --password "$KEYCLOAK_ADMIN_PASSWORD" >/dev/null
  /opt/keycloak/bin/kcadm.sh update "realms/${KEYCLOAK_REALM:-MYB}" --config "$config" -s emailTheme=myb -s internationalizationEnabled=true -s '\''supportedLocales=["en","fr"]'\'' -s defaultLocale=fr
'
