#!/usr/bin/env bash
################################################################################
# ovh-db-authorize-ip.sh - Add an authorized IP to an OVHcloud Managed Database.
#
# Usage:
#   SERVICE_NAME=<project-id> DB_SERVICE_ID=<db-id> ./scripts/ovh-db-authorize-ip.sh 1.2.3.4/32 "description"
################################################################################
set -euo pipefail

IP="${1:-}"
DESCRIPTION="${2:-myb-k8s-node}"

[[ -n "$IP" ]] || { echo "Usage: $0 <ip-or-cidr> [description]" >&2; exit 1; }
[[ "$IP" == */* ]] || IP="${IP}/32"

DB_ENGINE="${DB_ENGINE:-postgresql}"

for var in OVH_APPLICATION_KEY OVH_APPLICATION_SECRET OVH_CONSUMER_KEY SERVICE_NAME DB_SERVICE_ID; do
  [[ -n "${!var:-}" ]] || { echo "Missing env var: $var" >&2; exit 1; }
done

OVH_ENDPOINT_NAME="${OVH_ENDPOINT:-ovh-ca}"
case "$OVH_ENDPOINT_NAME" in
  ovh-ca) API_BASE="https://ca.api.ovh.com/1.0" ;;
  ovh-eu) API_BASE="https://eu.api.ovh.com/1.0" ;;
  *) echo "Unsupported OVH_ENDPOINT: $OVH_ENDPOINT_NAME" >&2; exit 1 ;;
esac

ovh_api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local url="${API_BASE}${path}"
  local ts sig_input digest signature

  ts="$(curl -sf "${API_BASE}/auth/time")"
  sig_input="${OVH_APPLICATION_SECRET}+${OVH_CONSUMER_KEY}+${method}+${url}+${body}+${ts}"
  digest="$(printf "%s" "$sig_input" | openssl dgst -sha1 -r | cut -d ' ' -f 1)"
  signature="\$1\$${digest}"

  if [[ -n "$body" ]]; then
    curl -sS -X "$method" \
      -H "Content-Type: application/json" \
      -H "X-Ovh-Application: ${OVH_APPLICATION_KEY}" \
      -H "X-Ovh-Consumer: ${OVH_CONSUMER_KEY}" \
      -H "X-Ovh-Timestamp: ${ts}" \
      -H "X-Ovh-Signature: ${signature}" \
      -d "$body" \
      "$url"
  else
    curl -sS -X "$method" \
      -H "Content-Type: application/json" \
      -H "X-Ovh-Application: ${OVH_APPLICATION_KEY}" \
      -H "X-Ovh-Consumer: ${OVH_CONSUMER_KEY}" \
      -H "X-Ovh-Timestamp: ${ts}" \
      -H "X-Ovh-Signature: ${signature}" \
      "$url"
  fi
}

BASE_PATH="/cloud/project/${SERVICE_NAME}/database/${DB_ENGINE}/${DB_SERVICE_ID}/ipRestriction"

echo "Existing IP restrictions:"
existing="$(ovh_api GET "$BASE_PATH" 2>/dev/null || echo "[]")"
echo "$existing" | jq .

if echo "$existing" | jq -e --arg ip "$IP" '.[] | select(.ip == $ip)' >/dev/null; then
  echo "IP already authorized: $IP"
  exit 0
fi

body="$(jq -nc --arg ip "$IP" --arg description "$DESCRIPTION" '{ip: $ip, description: $description}')"
echo "Adding authorized IP: $IP ($DESCRIPTION)"
ovh_api POST "$BASE_PATH" "$body" | jq .

echo "Updated IP restrictions:"
ovh_api GET "$BASE_PATH" | jq .
