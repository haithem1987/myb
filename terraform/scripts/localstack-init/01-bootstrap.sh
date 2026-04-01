#!/bin/bash
# ==============================================================================
# MYB Platform - LocalStack Bootstrap
# Auto-runs when LocalStack starts (placed in /etc/localstack/init/ready.d/)
# Creates: ECR repos, SSM parameters, S3 bucket
# ==============================================================================

set -euo pipefail

REGION="eu-west-3"
PROJECT="myb"
ENV="dev"

echo "=== MYB LocalStack Bootstrap ==="

# --- ECR Repositories (Phase 1: 6 services) ---
echo "[1/4] Creating ECR repositories..."
for svc in user-manager notification mailer coproperty keycloak admin; do
  awslocal ecr create-repository \
    --repository-name "${PROJECT}/${svc}" \
    --region "${REGION}" 2>/dev/null || true
  echo "  ✓ ${PROJECT}/${svc}"
done

# --- SSM Parameters (secrets) ---
echo "[2/4] Creating SSM parameters..."
awslocal ssm put-parameter \
  --name "/${PROJECT}/${ENV}/db-password" \
  --type SecureString \
  --value "localstack-db-password" \
  --overwrite --region "${REGION}" 2>/dev/null || true

awslocal ssm put-parameter \
  --name "/${PROJECT}/${ENV}/keycloak-admin-password" \
  --type SecureString \
  --value "admin" \
  --overwrite --region "${REGION}" 2>/dev/null || true

awslocal ssm put-parameter \
  --name "/${PROJECT}/${ENV}/smtp-username" \
  --type SecureString \
  --value "localstack-smtp-user" \
  --overwrite --region "${REGION}" 2>/dev/null || true

awslocal ssm put-parameter \
  --name "/${PROJECT}/${ENV}/smtp-password" \
  --type SecureString \
  --value "localstack-smtp-pass" \
  --overwrite --region "${REGION}" 2>/dev/null || true

echo "  ✓ SSM parameters created"

# --- S3 Bucket (document storage) ---
echo "[3/4] Creating S3 bucket..."
awslocal s3 mb "s3://${PROJECT}-${ENV}-documents" --region "${REGION}" 2>/dev/null || true
awslocal s3api put-bucket-versioning \
  --bucket "${PROJECT}-${ENV}-documents" \
  --versioning-configuration Status=Enabled \
  --region "${REGION}" 2>/dev/null || true
echo "  ✓ S3 bucket created"

# --- Terraform State Bucket ---
echo "[4/4] Creating Terraform state bucket..."
awslocal s3 mb "s3://myb-terraform-state" --region "${REGION}" 2>/dev/null || true
awslocal s3api put-bucket-versioning \
  --bucket "myb-terraform-state" \
  --versioning-configuration Status=Enabled \
  --region "${REGION}" 2>/dev/null || true

awslocal dynamodb create-table \
  --table-name "myb-terraform-locks" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "${REGION}" 2>/dev/null || true
echo "  ✓ Terraform state backend ready"

echo ""
echo "=== MYB LocalStack Bootstrap Complete ==="
echo "Endpoint: http://localhost:4566"
echo "Region:   ${REGION}"
echo ""
echo "Test with:"
echo "  awslocal s3 ls --region ${REGION}"
echo "  awslocal ecr describe-repositories --region ${REGION}"
echo "  awslocal ssm get-parameters-by-path --path /${PROJECT}/${ENV} --region ${REGION}"
