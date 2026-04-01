################################################################################
# MYB Platform - LocalStack Environment
# Emulates AWS services locally while waiting for real AWS account
#
# Supports (free): S3, SSM, ECR, IAM, STS, CloudWatch Logs, SQS, SecretsMgr
# Requires Pro:    ECS, ALB, RDS, Amazon MQ, Route53
#
# Strategy: Use LocalStack for AWS-specific resources (S3, SSM, ECR),
#           keep local Docker for compute (ECS→docker-compose) and DB (RDS→postgres)
################################################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Use local backend for simplicity with LocalStack
  # (tflocal handles endpoint redirection automatically)
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Provider targeting LocalStack endpoint
provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3             = "http://localhost:4566"
    ssm            = "http://localhost:4566"
    ecr            = "http://localhost:4566"
    iam            = "http://localhost:4566"
    sts            = "http://localhost:4566"
    cloudwatch     = "http://localhost:4566"
    cloudwatchlogs = "http://localhost:4566"
    sqs            = "http://localhost:4566"
    secretsmanager = "http://localhost:4566"
    ec2            = "http://localhost:4566"
    elbv2          = "http://localhost:4566"
  }

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Target      = "localstack"
    }
  }
}

locals {
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Target      = "localstack"
  }
}

################################################################################
# ECR Repositories — SKIPPED (requires LocalStack Pro)
# Images are built locally and tagged directly for docker-compose usage.
# When migrating to real AWS, use: terraform/environments/dev/ (has ECR module)
################################################################################

################################################################################
# S3 Document Storage (free tier — works on LocalStack Community)
################################################################################

module "s3" {
  source       = "../../modules/s3"
  project_name = var.project_name
  environment  = var.environment
  cors_origins = var.cors_origins
  tags         = local.tags
}

################################################################################
# SSM Parameters (free tier — works on LocalStack Community)
################################################################################

resource "aws_ssm_parameter" "db_password" {
  name      = "/${var.project_name}/${var.environment}/db-password"
  type      = "SecureString"
  value     = var.db_master_password
  overwrite = true
  tags      = local.tags
}

resource "aws_ssm_parameter" "keycloak_admin_password" {
  name      = "/${var.project_name}/${var.environment}/keycloak-admin-password"
  type      = "SecureString"
  value     = var.keycloak_admin_password
  overwrite = true
  tags      = local.tags
}

resource "aws_ssm_parameter" "smtp_username" {
  name      = "/${var.project_name}/${var.environment}/smtp-username"
  type      = "SecureString"
  value     = "localstack-smtp-user"
  overwrite = true
  tags      = local.tags
}

resource "aws_ssm_parameter" "smtp_password" {
  name      = "/${var.project_name}/${var.environment}/smtp-password"
  type      = "SecureString"
  value     = "localstack-smtp-pass"
  overwrite = true
  tags      = local.tags
}

################################################################################
# CloudWatch Log Groups (free tier)
################################################################################

resource "aws_cloudwatch_log_group" "services" {
  for_each = toset(["user-manager", "notification", "mailer", "coproperty", "keycloak", "admin"])

  name              = "/ecs/${var.project_name}-${var.environment}/${each.key}"
  retention_in_days = 7
  tags              = local.tags
}

################################################################################
# IAM Roles (free tier — simulated but useful for validation)
################################################################################

resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-${var.environment}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-${var.environment}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "s3-access"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
      Resource = [module.s3.bucket_arn, "${module.s3.bucket_arn}/*"]
    }]
  })
}
