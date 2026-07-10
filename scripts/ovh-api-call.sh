#!/usr/bin/env bash
set -euo pipefail

METHOD="${1:-}"
PATH_ARG="${2:-}"
BODY="${3:-}"

[[ -n "$METHOD" && -n "$PATH_ARG" ]] || { echo "Usage: $0 <METHOD> <PATH> [json-body]" >&2; exit 1; }

for var in OVH_APPLICATION_KEY OVH_APPLICATION_SECRET OVH_CONSUMER_KEY; do
  [[ -n "${!var:-}" ]] || { echo "Missing env var: $var" >&2; exit 1; }
done

OVH_ENDPOINT_NAME="${OVH_ENDPOINT:-ovh-ca}"
case "$OVH_ENDPOINT_NAME" in
  ovh-ca) API_BASE="https://ca.api.ovh.com/1.0" ;;
  ovh-eu) API_BASE="https://eu.api.ovh.com/1.0" ;;
  *) echo "Unsupported OVH_ENDPOINT: $OVH_ENDPOINT_NAME" >&2; exit 1 ;;
esac

URL="${API_BASE}${PATH_ARG}"
TS="$(curl -sf "${API_BASE}/auth/time")"
SIG_INPUT="${OVH_APPLICATION_SECRET}+${OVH_CONSUMER_KEY}+${METHOD}+${URL}+${BODY}+${TS}"
DIGEST="$(printf "%s" "$SIG_INPUT" | openssl dgst -sha1 -r | cut -d ' ' -f 1)"
SIGNATURE="\$1\$${DIGEST}"

if [[ -n "$BODY" ]]; then
  curl -sS -X "$METHOD" \
    -H "Content-Type: application/json" \
    -H "X-Ovh-Application: ${OVH_APPLICATION_KEY}" \
    -H "X-Ovh-Consumer: ${OVH_CONSUMER_KEY}" \
    -H "X-Ovh-Timestamp: ${TS}" \
    -H "X-Ovh-Signature: ${SIGNATURE}" \
    -d "$BODY" \
    "$URL"
else
  curl -sS -X "$METHOD" \
    -H "Content-Type: application/json" \
    -H "X-Ovh-Application: ${OVH_APPLICATION_KEY}" \
    -H "X-Ovh-Consumer: ${OVH_CONSUMER_KEY}" \
    -H "X-Ovh-Timestamp: ${TS}" \
    -H "X-Ovh-Signature: ${SIGNATURE}" \
    "$URL"
fi
