#!/usr/bin/env bash
################################################################################
# ovh-list-k8s-clusters.sh - List Kubernetes clusters across accessible OVHcloud
# Public Cloud projects.
################################################################################
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

for var in OVH_APPLICATION_KEY OVH_APPLICATION_SECRET OVH_CONSUMER_KEY; do
  [[ -n "${!var:-}" ]] || { echo -e "${RED}Missing env var: $var${NC}"; exit 1; }
done

OVH_ENDPOINT_NAME="${OVH_ENDPOINT:-ovh-ca}"
case "$OVH_ENDPOINT_NAME" in
  ovh-ca) API_BASE="https://ca.api.ovh.com/1.0" ;;
  ovh-eu) API_BASE="https://eu.api.ovh.com/1.0" ;;
  *) echo -e "${RED}Unsupported OVH_ENDPOINT: $OVH_ENDPOINT_NAME${NC}"; exit 1 ;;
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

echo -e "\n${GREEN}OVH Kubernetes clusters (${OVH_ENDPOINT_NAME})${NC}\n"

PROJECTS="$(ovh_api GET "/cloud/project")"
FOUND=0

while IFS= read -r project_id; do
  [[ -n "$project_id" ]] || continue
  project_json="$(ovh_api GET "/cloud/project/${project_id}" 2>/dev/null || true)"
  description="$(echo "$project_json" | jq -r '.description // "<no description>"' 2>/dev/null || echo "<unknown>")"
  status="$(echo "$project_json" | jq -r '.status // "<unknown>"' 2>/dev/null || echo "<unknown>")"

  echo -e "${BLUE}Project:${NC} ${project_id}  ${YELLOW}${description}${NC}  status=${status}"

  clusters="$(ovh_api GET "/cloud/project/${project_id}/kube" 2>/dev/null || echo "[]")"
  count="$(echo "$clusters" | jq 'length' 2>/dev/null || echo 0)"
  if [[ "$count" -eq 0 ]]; then
    echo "  (no Kubernetes clusters)"
    continue
  fi

  FOUND=1
  while IFS= read -r cluster_id; do
    detail="$(ovh_api GET "/cloud/project/${project_id}/kube/${cluster_id}")"
    echo "$detail" | jq -r '  + "\(.name) [\(.id)] status=\(.status) region=\(.region) version=\(.version) url=\(.url)"'
  done < <(echo "$clusters" | jq -r '.[]')
done < <(echo "$PROJECTS" | jq -r '.[]')

if [[ "$FOUND" -eq 0 ]]; then
  echo -e "\n${YELLOW}No Kubernetes clusters found for this OVH account/endpoint.${NC}"
fi

