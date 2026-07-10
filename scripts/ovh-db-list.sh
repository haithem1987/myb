#!/usr/bin/env bash
set -euo pipefail

for var in OVH_APPLICATION_KEY OVH_APPLICATION_SECRET OVH_CONSUMER_KEY; do
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
    curl -sf -X "$method" \
      -H "Content-Type: application/json" \
      -H "X-Ovh-Application: ${OVH_APPLICATION_KEY}" \
      -H "X-Ovh-Consumer: ${OVH_CONSUMER_KEY}" \
      -H "X-Ovh-Timestamp: ${ts}" \
      -H "X-Ovh-Signature: ${signature}" \
      -d "$body" \
      "$url"
  else
    curl -sf -X "$method" \
      -H "Content-Type: application/json" \
      -H "X-Ovh-Application: ${OVH_APPLICATION_KEY}" \
      -H "X-Ovh-Consumer: ${OVH_CONSUMER_KEY}" \
      -H "X-Ovh-Timestamp: ${ts}" \
      -H "X-Ovh-Signature: ${signature}" \
      "$url"
  fi
}

PROJECTS="${SERVICE_NAME:-}"
if [[ -z "$PROJECTS" ]]; then
  PROJECTS="$(ovh_api GET "/cloud/project" | jq -r '.[]')"
fi

for project_id in $PROJECTS; do
  echo "Project: $project_id"
  services="$(ovh_api GET "/cloud/project/${project_id}/database/service" 2>/dev/null || echo "[]")"
  if ! echo "$services" | jq -e . >/dev/null 2>&1; then
    echo "  database/service endpoint unavailable"
    continue
  fi
  if [[ "$(echo "$services" | jq 'length')" -eq 0 ]]; then
    echo "  (no database services)"
    continue
  fi
  echo "$services" | jq -r '.[]' | while read -r db_id; do
    detail="$(ovh_api GET "/cloud/project/${project_id}/database/service/${db_id}" 2>/dev/null || echo "{}")"
    echo "$detail" | jq -r --arg db_id "$db_id" '"  + \(.description // .id // $db_id) [engine=\(.engine // "unknown")] id=\(.id // $db_id) status=\(.status // "unknown")"'
    echo "$detail" | jq -r '    "endpoints=" + ((.endpoints // []) | tostring)' 2>/dev/null || true
  done
done
