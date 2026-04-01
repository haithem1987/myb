# MYB Platform - LocalStack Local Development Guide

## What is LocalStack?

[LocalStack](https://github.com/localstack/localstack) emulates AWS services locally so you can develop and test your Terraform infrastructure **without an AWS account or paying any fees**.

## What Works Locally (Free Tier)

| AWS Service | LocalStack Free | Used For |
|-------------|:-:|------------|
| **S3** | ✅ | Document storage bucket |
| **SSM Parameter Store** | ✅ | Secrets (DB passwords, SMTP creds) |
| **IAM** | ✅ | ECS task roles & policies |
| **STS** | ✅ | Identity & token operations |
| **CloudWatch Logs** | ✅ | Service log groups |
| **SQS** | ✅ | Message queues |
| **Secrets Manager** | ✅ | Secret storage |
| ECR | ❌ Pro | Container registry (use local Docker images instead) |
| ECS/Fargate | ❌ Pro | Container orchestration (use docker-compose instead) |
| ALB | ❌ Pro | Load balancer (access services directly by port) |
| RDS | ❌ Pro | Database (use local PostgreSQL containers) |
| Amazon MQ | ❌ Pro | RabbitMQ (use local RabbitMQ container) |

**Strategy:** LocalStack handles AWS-specific resources (S3, SSM, IAM, logs). Docker Compose handles compute (services) and data (PostgreSQL, RabbitMQ) directly.

---

## Quick Start

### Prerequisites

```bash
# Required
brew install terraform
pip3 install --user terraform-local awscli-local

# Add to your shell profile (~/.zshrc)
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
```

### 1. Start LocalStack

```bash
# From project root
./scripts/localstack-start.sh
```

This will:
- Start the LocalStack Docker container
- Auto-create S3 buckets, SSM parameters via init script
- Apply Terraform to create IAM roles, CloudWatch log groups, S3 lifecycle rules

### 2. Verify It's Running

```bash
./scripts/localstack-start.sh status
```

### 3. Run Your App Services

```bash
# Start the app (uses regular docker-compose for services + databases)
docker compose -f docker-compose.dev.yml up -d
```

### 4. Stop LocalStack

```bash
./scripts/localstack-start.sh stop
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `./scripts/localstack-start.sh` | Start LocalStack + apply Terraform |
| `./scripts/localstack-start.sh stop` | Stop LocalStack |
| `./scripts/localstack-start.sh status` | Show all resources |
| `./scripts/localstack-start.sh tf` | Re-apply Terraform only |
| `awslocal s3 ls --region eu-west-3` | List S3 buckets |
| `awslocal ssm get-parameter --name /myb/dev/db-password --region eu-west-3` | Read a secret |
| `awslocal s3 cp file.txt s3://myb-dev-documents-000000000000/` | Upload to S3 |
| `docker logs -f localstack` | View LocalStack logs |

---

## File Structure

```
├── docker-compose.localstack.yml          # LocalStack container config
├── scripts/
│   ├── localstack-start.sh                # Main startup script
│   └── build-and-push-local.sh            # Build images locally
└── terraform/
    ├── environments/
    │   ├── localstack/                    # LocalStack-specific config
    │   │   ├── main.tf                    # S3, SSM, IAM, CloudWatch
    │   │   ├── variables.tf
    │   │   └── outputs.tf
    │   └── dev/                           # Real AWS config (for later)
    │       └── main.tf
    └── scripts/
        └── localstack-init/
            └── 01-bootstrap.sh            # Auto-runs on LocalStack start
```

---

## Terraform Usage with LocalStack

Use `tflocal` instead of `terraform` — it automatically routes API calls to `localhost:4566`:

```bash
cd terraform/environments/localstack

# Plan
tflocal plan

# Apply
tflocal apply

# Destroy
tflocal destroy

# Output
tflocal output
```

---

## Transitioning to Real AWS

When your AWS account registration is complete:

1. **Configure AWS CLI:**
   ```bash
   aws configure
   # Enter your access key, secret key, region (eu-west-3)
   ```

2. **Bootstrap remote state:**
   ```bash
   cd terraform/scripts
   terraform init && terraform apply
   ```

3. **Deploy to real AWS:**
   ```bash
   cd terraform/environments/dev
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with real passwords
   terraform init && terraform plan && terraform apply
   ```

4. **Build & push images to real ECR:**
   ```bash
   ./terraform/scripts/build-and-push.sh dev
   ```

The `dev` environment Terraform config includes all AWS services (VPC, ECS, ALB, RDS, Amazon MQ) that LocalStack doesn't cover in the free tier.

---

## Resources Created by LocalStack

After running `./scripts/localstack-start.sh`:

| Resource | Name/Path |
|----------|-----------|
| S3 Bucket (documents) | `myb-dev-documents-000000000000` |
| S3 Bucket (TF state) | `myb-terraform-state` |
| SSM Parameter | `/myb/dev/db-password` |
| SSM Parameter | `/myb/dev/keycloak-admin-password` |
| SSM Parameter | `/myb/dev/smtp-username` |
| SSM Parameter | `/myb/dev/smtp-password` |
| IAM Role | `myb-dev-ecs-execution` |
| IAM Role | `myb-dev-ecs-task` |
| CloudWatch Log Group | `/ecs/myb-dev/admin` |
| CloudWatch Log Group | `/ecs/myb-dev/coproperty` |
| CloudWatch Log Group | `/ecs/myb-dev/keycloak` |
| CloudWatch Log Group | `/ecs/myb-dev/mailer` |
| CloudWatch Log Group | `/ecs/myb-dev/notification` |
| CloudWatch Log Group | `/ecs/myb-dev/user-manager` |

---

## Troubleshooting

### LocalStack won't start
```bash
docker logs localstack
# Check for port conflicts or Docker issues
```

### "awslocal: command not found"
```bash
pip3 install --user awscli-local
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
```

### "tflocal: command not found"
```bash
pip3 install --user terraform-local
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
```

### SSM "ParameterAlreadyExists" during terraform apply
This is expected if the init script already created the parameters. The Terraform config uses `overwrite = true` to handle this.

### Persistence across restarts
LocalStack data persists in a Docker volume (`localstack_data`). To reset everything:
```bash
docker compose -f docker-compose.localstack.yml down -v
./scripts/localstack-start.sh
```
