# MYB Platform - AWS Infrastructure Deployment Guide

## Deployment Phases

| Phase | Services | Est. Cost/mo | Status |
|-------|----------|-------------|--------|
| **Phase 1 — Coproperty** | keycloak, user-manager, coproperty, notification, mailer, admin-frontend | **~$160** | Active |
| Phase 2 — Full Platform | + timesheet, invoice, document, payment | ~$200 | Later |

> All Terraform configs, scripts, and this guide are scoped to **Phase 1** (6 services). Phase 2 services are preserved in `terraform/environments/staging/` and `prod/` for reference.

---

## Architecture Overview (Phase 1)

```
                           ┌─────────────────────────────────────────┐
                           │              INTERNET                    │
                           └──────────────────┬──────────────────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │   Route 53 / DNS   │
                                    └─────────┬─────────┘
                                              │
                        ┌─────────────────────▼─────────────────────┐
                        │          Application Load Balancer         │
                        │     (HTTP/HTTPS - path-based routing)      │
                        │                                            │
                        │  /           → Admin Frontend (Angular)    │
                        │  /realms/*   → Keycloak                    │
                        │  /api/users  → User Manager                │
                        │  /api/not*   → Notification (SignalR)      │
                        │  /api/mail*  → Mailer                      │
                        │  /api/copr*  → Coproperty                  │
                        │  /graphql    → Coproperty GraphQL          │
                        └─────────────┬──────────────────────────────┘
                                      │
                    ┌─────────────────▼─────────────────────────┐
                    │              VPC (10.0.0.0/16)             │
                    │                                            │
                    │  ┌── Public Subnets ──┐                    │
                    │  │  ALB, NAT Gateway   │                    │
                    │  └────────────────────┘                    │
                    │                                            │
                    │  ┌── Private Subnets ─────────────────┐    │
                    │  │                                     │    │
                    │  │  ┌────────────────────────────┐     │    │
                    │  │  │     ECS Cluster (Fargate)    │     │    │
                    │  │  │  ┌──────────┐ ┌──────────┐  │     │    │
                    │  │  │  │  Admin   │ │ Keycloak │  │     │    │
                    │  │  │  │ Frontend │ │          │  │     │    │
                    │  │  │  ├──────────┤ ├──────────┤  │     │    │
                    │  │  │  │ UserMgr  │ │Coproperty│  │     │    │
                    │  │  │  ├──────────┤ ├──────────┤  │     │    │
                    │  │  │  │  Mailer  │ │  Notif.  │  │     │    │
                    │  │  │  └──────────┘ └──────────┘  │     │    │
                    │  │  └────────────────────────────┘     │    │
                    │  │                                     │    │
                    │  │  ┌──────────────┐ ┌────────────┐    │    │
                    │  │  │ RDS Postgres  │ │ Amazon MQ  │    │    │
                    │  │  │ (1 instance,  │ │ (RabbitMQ) │    │    │
                    │  │  │  3 schemas)   │ │            │    │    │
                    │  │  └──────────────┘ └────────────┘    │    │
                    │  └─────────────────────────────────────┘    │
                    └────────────────────────────────────────────┘
                                      │
                              ┌───────▼───────┐
                              │  ECR (Images)  │
                              │  SSM (Secrets) │
                              └───────────────┘
```

## Cost Estimation (Monthly)

### Phase 1 — Coproperty Only (current)

| Resource | Dev | Notes |
|----------|-----|-------|
| **ECS Fargate** (6 services) | ~$54 | keycloak 512CPU/1GB, others 256CPU/512MB |
| **RDS PostgreSQL** db.t3.micro | ~$15 | 3 schemas: coproperty, keycloak, usermanager |
| **ALB** | ~$22 | |
| **NAT Gateway** (single) | ~$35 | |
| **Amazon MQ** mq.t3.micro | ~$27 | RabbitMQ for coproperty events |
| **ECR** (6 repos) | ~$1 | |
| **CloudWatch / Transfer** | ~$6 | |
| **Total** | **~$160/mo** | Saves ~$40 vs full platform |

### Phase 2 — Full Platform (future)

| Resource | Dev | Staging | Prod |
|----------|-----|---------|------|
| **ECS Fargate** (10 services) | ~$90 | ~$90 | ~$360 |
| **RDS PostgreSQL** (1 instance) | ~$15 | ~$15 | ~$50 (t3.small Multi-AZ) |
| **ALB** | ~$22 | ~$22 | ~$22 |
| **NAT Gateway** | ~$35 | ~$35 | ~$35 |
| **Amazon MQ** | ~$27 | ~$27 | ~$200 (m5.large) |
| **S3** | ~$1 | ~$1 | ~$5 |
| **ECR / CloudWatch / Transfer** | ~$11 | ~$11 | ~$36 |
| **Total** | **~$200/mo** | **~$200/mo** | **~$710/mo** |

### Cost Optimization Applied
- **Phase 1 scoping** — 6 services instead of 10 (saves ~$36/mo in Fargate)
- **1 RDS instance** with 3 schemas instead of separate DBs (saves ~$45/mo)
- **Single NAT Gateway** instead of one per AZ (saves ~$35/mo)
- Fargate **smallest valid sizing** (256 CPU / 512 MB) for dev
- **mq.t3.micro** for dev/staging vs production instance
- Container Insights disabled in dev (saves ~$10/mo)
- **No S3** in Phase 1 (document service not deployed)

---

## Step-by-Step Deployment

### Prerequisites

```bash
# Install required tools
brew install terraform awscli docker

# Configure AWS credentials
aws configure
# Enter: Access Key, Secret Key, Region (eu-west-3), Output (json)

# Verify access
aws sts get-caller-identity
```

### Step 1: Bootstrap Remote State

```bash
cd terraform/scripts

# Initialize and create S3 bucket + DynamoDB table
terraform init
terraform apply -auto-approve

# Output: state_bucket_name, lock_table_name
```

### Step 2: Create ECR Repositories (first time only)

ECR repositories are created by the environment Terraform. For the first deployment,
you can deploy just the ECR module first, or build images after full terraform apply.

### Step 3: Build and Push Docker Images

> **Admin frontend note:** The `admin` ECR image is built from `Dockerfile.frontend` in the
> repo root. It compiles the `admin` NX app (`npx nx build admin`) and serves it with nginx.
> No separate Dockerfile needed inside the NX workspace.

```bash
# From project root
cd terraform/scripts

# Build ALL Phase 1 services and push to ECR
./build-and-push.sh dev

# Or build a single service
./build-and-push.sh dev coproperty
./build-and-push.sh dev admin
```

### Step 4: Deploy Dev Environment

```bash
cd terraform/environments/dev

# Copy and fill in variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with real values

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply infrastructure
terraform apply

# Note the outputs:
# - alb_dns_name (access the platform at this URL)
# - ecr_repository_urls
# - rds_endpoint
```

### Step 5: Initialize Database Schemas

After RDS is created, run the Phase 1 schema initialization:

```bash
# Get RDS endpoint from Terraform output
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)

# Connect and run schema init (creates: coproperty, keycloak, usermanager schemas)
psql "postgresql://myb_admin:YOUR_PASSWORD@${RDS_ENDPOINT}/myb" \
  -f ../../scripts/init-schemas.sql
```

### Step 6: Deploy Staging / Production

```bash
# Staging
cd terraform/environments/staging
cp ../dev/terraform.tfvars.example terraform.tfvars
# Edit with staging values
terraform init && terraform apply

# Production (REQUIRES certificate_arn)
cd terraform/environments/prod
# Edit terraform.tfvars
terraform init && terraform apply
```

---

## Service Communication

### Internal (service-to-service)
Services communicate via **AWS Cloud Map (Service Discovery)**:
```
http://user-manager.myb-dev.local:8080/api/users
http://keycloak.myb-dev.local:8080/realms/MYB
http://coproperty.myb-dev.local:8080/graphql
```

### External (clients)
All traffic enters through the ALB with path-based routing:
```
https://myb.com/                    → Admin Frontend (coproperty UI)
https://myb.com/realms/MYB/...      → Keycloak
https://myb.com/api/users/...       → User Manager
https://myb.com/graphql             → Coproperty GraphQL
https://myb.com/api/coproperty/...  → Coproperty REST
```

### Async (events)
Services use **Amazon MQ (RabbitMQ)** for async communication:
- Coproperty → Notification (property/syndic events)
- User Manager → Mailer (user registration/reset emails)
- Coproperty → Mailer (charge/meeting notification emails)

---

## Secrets Management

Secrets are stored in **AWS SSM Parameter Store** (SecureString):

| Parameter Path | Used By |
|---------------|---------|
| `/myb/dev/db-password` | All DB services |
| `/myb/dev/keycloak-admin-password` | Keycloak |
| `/myb/dev/smtp-username` | Mailer |
| `/myb/dev/smtp-password` | Mailer |

> Stripe secrets (`stripe-secret-key`, `stripe-publishable-key`) will be added in Phase 2 when the payment service is deployed.

ECS tasks reference these via the `secrets` block in task definitions.

---

## Updating a Service

```bash
# 1. Build new image
./terraform/scripts/build-and-push.sh dev coproperty

# 2. Force new deployment
./terraform/scripts/deploy.sh dev coproperty

# 3. Monitor
aws ecs describe-services \
  --cluster myb-dev \
  --services coproperty \
  --query 'services[].deployments' \
  --region eu-west-3
```

---

## Monitoring

### CloudWatch Logs
```bash
# Tail logs for a service
aws logs tail /ecs/myb-dev/invoice --follow --region eu-west-3
```

### Production Alerts
Production environment includes CloudWatch alarms for:
- RDS CPU > 80% (3 consecutive 5-min periods)
- ALB 5xx errors > 50 (2 consecutive 5-min periods)

Subscribe to alerts:
```bash
aws sns subscribe \
  --topic-arn $(terraform output -raw sns_alerts_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region eu-west-3
```

---

## CI/CD with GitLab

The `.gitlab-ci.yml` in `terraform/` provides:

1. **Validate** — `terraform validate` + `fmt` check on every MR
2. **Build** — Parallel Docker builds for all 10 services
3. **Deploy Dev** — Auto-deploy on `develop` branch merge
4. **Deploy Staging** — Manual trigger on `main` branch
5. **Deploy Prod** — Manual trigger on Git tags

### Required GitLab CI/CD Variables

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `AWS_ACCOUNT_ID` | AWS account number |
| `TF_VAR_db_master_password` | RDS password |
| `TF_VAR_keycloak_admin_password` | Keycloak admin password |
| `TF_VAR_keycloak_client_secret` | Keycloak client secret |
| `TF_VAR_keycloak_service_client_secret` | Backend client secret |
| `TF_VAR_rabbitmq_password` | RabbitMQ password |
| `TF_VAR_stripe_secret_key` | Stripe secret key |
| `TF_VAR_stripe_publishable_key` | Stripe publishable key |

---

## Migration from docker-compose

### Key Changes
| docker-compose | AWS |
|---------------|-----|
| 4x PostgreSQL containers | 1x RDS instance, 3 schemas (Phase 1) |
| Self-hosted RabbitMQ | Amazon MQ (managed) |
| Self-hosted MailHog | AWS SES |
| Docker networking | VPC + Service Discovery |
| Container ports | ALB path-based routing |
| `.env` files | SSM Parameter Store |
| `docker-compose up` | `terraform apply` + ECS |

### Migration Steps
1. Export data from local PostgreSQL containers
2. Create RDS + schemas via Terraform
3. Import data into corresponding schemas
4. Build images and push to ECR
5. Deploy ECS services via Terraform
6. Update DNS to point to ALB

---

## Terraform Structure

```
terraform/
├── modules/
│   ├── vpc/          # VPC, subnets, NAT, routing
│   ├── security/     # Security groups (ALB, ECS, RDS, MQ)
│   ├── rds/          # RDS PostgreSQL (single instance)
│   ├── ecr/          # Container registries (6 repos in Phase 1)
│   ├── alb/          # Load balancer + routing rules
│   ├── ecs/          # Cluster, tasks, services, autoscaling
│   └── s3/           # Document storage (Phase 2 only)
├── environments/
│   ├── dev/          # Phase 1: 6 services, minimal resources
│   ├── staging/      # Full platform (all 10 services)
│   └── prod/         # Production (HA, autoscaling, monitoring)
├── scripts/
│   ├── bootstrap-state.tf    # Remote state S3 + DynamoDB
│   ├── init-schemas.sql      # DB schema init (Phase 1: 3 schemas)
│   ├── build-and-push.sh     # Build & push Docker images to ECR
│   └── deploy.sh             # Trigger ECS deployments
├── .gitignore
└── .gitlab-ci.yml
```
