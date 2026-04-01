################################################################################
# MYB Platform - Dev Environment
# Cost-optimized development environment on AWS
################################################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "myb-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "eu-west-3"
    dynamodb_table = "myb-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  # Service discovery domain for inter-service communication
  service_domain = "${var.project_name}-${var.environment}.local"

  # ECR repository URLs (populated after ECR module)
  ecr_base = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.project_name}"

  # Common environment variables for all .NET services
  common_env = {
    ASPNETCORE_ENVIRONMENT = "Production"
    ASPNETCORE_URLS        = "http://+:8080"
  }

  # Keycloak environment variables for all services
  keycloak_env = {
    "Keycloak__Authority"    = "http://keycloak.${local.service_domain}:8080/realms/${var.keycloak_realm}"
    "Keycloak__BaseUrl"      = "http://keycloak.${local.service_domain}:8080/realms/${var.keycloak_realm}/protocol/openid-connect"
    "Keycloak__ClientId"     = var.keycloak_client_id
    "Keycloak__ClientSecret" = var.keycloak_client_secret
  }

  # RabbitMQ connection for services that use messaging
  rabbitmq_env = {
    "RabbitMq__Host" = aws_mq_broker.rabbitmq.instances[0].endpoints[0]
  }

  # ALB service routing configuration
  service_routes = [
    {
      name              = "keycloak"
      container_port    = 8080
      health_check_path = "/health/ready"
      path_patterns     = ["/auth/*", "/realms/*", "/resources/*", "/js/*"]
      priority          = 10
    },
    {
      name              = "user-manager"
      container_port    = 8080
      health_check_path = "/health"
      path_patterns     = ["/api/users/*", "/api/user/*", "/api/auth/*"]
      priority          = 20
    },
    {
      name              = "notification"
      container_port    = 8080
      health_check_path = "/health"
      path_patterns     = ["/api/notification/*", "/api/notifications/*", "/hub/*"]
      priority          = 30
    },
    {
      name              = "mailer"
      container_port    = 8080
      health_check_path = "/health"
      path_patterns     = ["/api/mailer/*", "/api/mail/*"]
      priority          = 40
    },
    {
      name              = "coproperty"
      container_port    = 8080
      health_check_path = "/health"
      path_patterns     = ["/api/coproperty/*", "/api/coproperties/*", "/graphql/coproperty", "/graphql"]
      priority          = 50
    },
  ]

  # ECS service definitions with Fargate sizing
  ecs_services = [
    # Keycloak - needs more memory for Java
    {
      name              = "keycloak"
      image             = "${local.ecr_base}/keycloak"
      cpu               = 512
      memory            = 1024
      container_port    = 8080
      desired_count     = 1
      max_count         = 2
      auto_scale        = false
      health_check_path = "/health/ready"
      target_group_arn  = module.alb.service_target_group_arns["keycloak"]
      environment = merge({
        KC_DB                     = "postgres"
        KC_DB_URL                 = "jdbc:postgresql://${module.rds.db_address}:${module.rds.db_port}/${module.rds.db_name}?currentSchema=keycloak"
        KC_DB_USERNAME            = var.db_master_username
        KC_HOSTNAME_STRICT        = "false"
        KC_HTTP_ENABLED           = "true"
        KC_HOSTNAME_STRICT_HTTPS  = "false"
        KEYCLOAK_ADMIN            = var.keycloak_admin_user
      })
      secrets = {
        KC_DB_PASSWORD         = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/db-password"
        KEYCLOAK_ADMIN_PASSWORD = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/keycloak-admin-password"
      }
    },
    # User Manager
    {
      name              = "user-manager"
      image             = "${local.ecr_base}/user-manager"
      cpu               = 256
      memory            = 512
      container_port    = 8080
      desired_count     = 1
      max_count         = 3
      auto_scale        = false
      health_check_path = "/health"
      target_group_arn  = module.alb.service_target_group_arns["user-manager"]
      environment = merge(local.common_env, local.keycloak_env, local.rabbitmq_env, {
        "ConnectionStrings__UserDBConnection" = "Host=${module.rds.db_address};Port=${module.rds.db_port};Database=${module.rds.db_name};Username=${var.db_master_username};SearchPath=usermanager"
      })
      secrets = {
        "ConnectionStrings__UserDBPassword" = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/db-password"
      }
    },
    # Notification (SignalR)
    {
      name              = "notification"
      image             = "${local.ecr_base}/notification"
      cpu               = 256
      memory            = 512
      container_port    = 8080
      desired_count     = 1
      max_count         = 2
      auto_scale        = false
      health_check_path = "/health"
      target_group_arn  = module.alb.service_target_group_arns["notification"]
      environment = merge(local.common_env, local.keycloak_env, local.rabbitmq_env)
      secrets           = {}
    },
    # Mailer
    {
      name              = "mailer"
      image             = "${local.ecr_base}/mailer"
      cpu               = 256
      memory            = 512
      container_port    = 8080
      desired_count     = 1
      max_count         = 2
      auto_scale        = false
      health_check_path = "/health"
      target_group_arn  = module.alb.service_target_group_arns["mailer"]
      environment = merge(local.common_env, local.rabbitmq_env, {
        "Smtp__Host"        = "email-smtp.${var.aws_region}.amazonaws.com"
        "Smtp__Port"        = "587"
        "Smtp__EnableSsl"   = "true"
        "Smtp__FromAddress" = var.smtp_from_address
        "Smtp__FromName"    = var.smtp_from_name
      })
      secrets = {
        "Smtp__Username" = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/smtp-username"
        "Smtp__Password" = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/smtp-password"
      }
    },
    # Coproperty
    {
      name              = "coproperty"
      image             = "${local.ecr_base}/coproperty"
      cpu               = 256
      memory            = 512
      container_port    = 8080
      desired_count     = 1
      max_count         = 3
      auto_scale        = false
      health_check_path = "/health"
      target_group_arn  = module.alb.service_target_group_arns["coproperty"]
      environment = merge(local.common_env, local.keycloak_env, local.rabbitmq_env, {
        "ConnectionStrings__CopropertyDBConnection" = "Host=${module.rds.db_address};Port=${module.rds.db_port};Database=${module.rds.db_name};Username=${var.db_master_username};SearchPath=coproperty"
        "Keycloak__ServiceClientId"                 = var.keycloak_service_client_id
        "Keycloak__ServiceClientSecret"             = var.keycloak_service_client_secret
        "Keycloak__ManagerRole"                     = var.keycloak_manager_role
      })
      secrets = {
        "ConnectionStrings__CopropertyDBPassword" = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/db-password"
      }
    },
    # Admin Frontend (coproperty management UI - built from Dockerfile.frontend in repo root)
    {
      name              = "admin"
      image             = "${local.ecr_base}/admin"
      cpu               = 256
      memory            = 512
      container_port    = 8080
      desired_count     = 1
      max_count         = 2
      auto_scale        = false
      health_check_path = "/health"
      target_group_arn  = module.alb.frontend_target_group_arn
      environment = {
        NODE_ENV = "production"
        PORT     = "8080"
      }
      secrets = {}
    },
  ]
}

data "aws_caller_identity" "current" {}

################################################################################
# Modules
################################################################################

module "vpc" {
  source       = "../../modules/vpc"
  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
  tags         = local.tags
}

module "security" {
  source       = "../../modules/security"
  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  tags         = local.tags
}

module "rds" {
  source                = "../../modules/rds"
  project_name          = var.project_name
  environment           = var.environment
  private_subnet_ids    = module.vpc.private_subnet_ids
  rds_security_group_id = module.security.rds_security_group_id
  instance_class        = var.rds_instance_class
  allocated_storage     = var.rds_allocated_storage
  master_username       = var.db_master_username
  master_password       = var.db_master_password
  tags                  = local.tags
}

module "ecr" {
  source       = "../../modules/ecr"
  project_name = var.project_name
  environment  = var.environment
  tags         = local.tags
}

module "alb" {
  source                = "../../modules/alb"
  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security.alb_security_group_id
  certificate_arn       = var.certificate_arn
  services              = local.service_routes
  tags                  = local.tags
}

################################################################################
# Amazon MQ (RabbitMQ) - managed replacement for self-hosted RabbitMQ
################################################################################

resource "aws_mq_broker" "rabbitmq" {
  broker_name = "${var.project_name}-${var.environment}-rabbitmq"

  engine_type        = "RabbitMQ"
  engine_version     = "3.13"
  host_instance_type = var.mq_instance_type
  deployment_mode    = "SINGLE_INSTANCE"

  auto_minor_version_upgrade = true
  publicly_accessible        = false
  subnet_ids                 = [module.vpc.private_subnet_ids[0]]
  security_groups            = [module.security.mq_security_group_id]

  user {
    username = var.rabbitmq_username
    password = var.rabbitmq_password
  }

  logs {
    general = true
  }

  tags = merge(local.tags, {
    Name = "${var.project_name}-${var.environment}-rabbitmq"
  })
}

################################################################################
# ECS Services
################################################################################

module "ecs" {
  source                = "../../modules/ecs"
  project_name          = var.project_name
  environment           = var.environment
  aws_region            = var.aws_region
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  ecs_security_group_id = module.security.ecs_security_group_id
  s3_bucket_arn         = "" # S3 not used in Phase 1 (document service not deployed)
  image_tag             = var.image_tag
  services              = local.ecs_services
  tags                  = local.tags
}

################################################################################
# SSM Parameters (secrets stored securely)
################################################################################

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/${var.environment}/db-password"
  type  = "SecureString"
  value = var.db_master_password

  tags = local.tags
}

resource "aws_ssm_parameter" "keycloak_admin_password" {
  name  = "/${var.project_name}/${var.environment}/keycloak-admin-password"
  type  = "SecureString"
  value = var.keycloak_admin_password

  tags = local.tags
}

# Stripe SSM params are defined in Phase 2 (when payment service is deployed)
