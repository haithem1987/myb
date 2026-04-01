################################################################################
# MYB Platform - Production Environment
# Production-grade AWS infrastructure with HA, autoscaling, and monitoring
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
    key            = "prod/terraform.tfstate"
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

  service_domain = "${var.project_name}-${var.environment}.local"
  ecr_base       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.project_name}"

  common_env = {
    ASPNETCORE_ENVIRONMENT = "Production"
    ASPNETCORE_URLS        = "http://+:8080"
  }

  keycloak_env = {
    "Keycloak__Authority"    = "http://keycloak.${local.service_domain}:8080/realms/${var.keycloak_realm}"
    "Keycloak__BaseUrl"      = "http://keycloak.${local.service_domain}:8080/realms/${var.keycloak_realm}/protocol/openid-connect"
    "Keycloak__ClientId"     = var.keycloak_client_id
    "Keycloak__ClientSecret" = var.keycloak_client_secret
  }

  rabbitmq_env = {
    "RabbitMq__Host" = aws_mq_broker.rabbitmq.instances[0].endpoints[0]
  }

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
      name              = "timesheet"
      container_port    = 8080
      health_check_path = "/health"
      path_patterns     = ["/api/timesheet/*", "/api/timesheets/*", "/graphql/timesheet"]
      priority          = 30
    },
    {
      name              = "invoice"
      container_port    = 8080
      health_check_path = "/health"
      path_patterns     = ["/api/invoice/*", "/api/invoices/*", "/graphql/invoice"]
      priority          = 40
    },
    {
      name              = "document"
      container_port    = 8080
      health_check_path = "/health"
      path_patterns     = ["/api/document/*", "/api/documents/*", "/graphql/document"]
      priority          = 50
    },
    {
      name              = "payment"
      container_port    = 8080
      health_check_path = "/health"
      path_patterns     = ["/api/payment/*", "/api/payments/*", "/api/stripe/*"]
      priority          = 60
    },
    {
      name              = "notification"
      container_port    = 8080
      health_check_path = "/health"
      path_patterns     = ["/api/notification/*", "/api/notifications/*", "/hub/*"]
      priority          = 70
    },
    {
      name              = "mailer"
      container_port    = 8080
      health_check_path = "/health"
      path_patterns     = ["/api/mailer/*", "/api/mail/*"]
      priority          = 80
    },
    {
      name              = "coproperty"
      container_port    = 8080
      health_check_path = "/health"
      path_patterns     = ["/api/coproperty/*", "/api/coproperties/*", "/graphql/coproperty"]
      priority          = 90
    },
  ]

  # Production: higher CPU/memory, autoscaling enabled, 2 replicas minimum
  ecs_services = [
    {
      name              = "keycloak"
      image             = "${local.ecr_base}/keycloak"
      cpu               = 1024
      memory            = 2048
      container_port    = 8080
      desired_count     = 2
      max_count         = 4
      auto_scale        = true
      health_check_path = "/health/ready"
      target_group_arn  = module.alb.service_target_group_arns["keycloak"]
      environment = merge({
        KC_DB                    = "postgres"
        KC_DB_URL                = "jdbc:postgresql://${module.rds.db_address}:${module.rds.db_port}/${module.rds.db_name}?currentSchema=keycloak"
        KC_DB_USERNAME           = var.db_master_username
        KC_HOSTNAME_STRICT       = "false"
        KC_HTTP_ENABLED          = "true"
        KC_HOSTNAME_STRICT_HTTPS = "false"
        KC_PROXY                 = "edge"
        KEYCLOAK_ADMIN           = var.keycloak_admin_user
      })
      secrets = {
        KC_DB_PASSWORD          = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/db-password"
        KEYCLOAK_ADMIN_PASSWORD = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/keycloak-admin-password"
      }
    },
    {
      name              = "user-manager"
      image             = "${local.ecr_base}/user-manager"
      cpu               = 512
      memory            = 1024
      container_port    = 8080
      desired_count     = 2
      max_count         = 6
      auto_scale        = true
      health_check_path = "/health"
      target_group_arn  = module.alb.service_target_group_arns["user-manager"]
      environment = merge(local.common_env, local.keycloak_env, local.rabbitmq_env, {
        "ConnectionStrings__UserDBConnection" = "Host=${module.rds.db_address};Port=${module.rds.db_port};Database=${module.rds.db_name};Username=${var.db_master_username};SearchPath=usermanager"
      })
      secrets = {
        "ConnectionStrings__UserDBPassword" = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/db-password"
      }
    },
    {
      name              = "timesheet"
      image             = "${local.ecr_base}/timesheet"
      cpu               = 512
      memory            = 1024
      container_port    = 8080
      desired_count     = 2
      max_count         = 6
      auto_scale        = true
      health_check_path = "/health"
      target_group_arn  = module.alb.service_target_group_arns["timesheet"]
      environment = merge(local.common_env, local.keycloak_env, {
        "ConnectionStrings__TimesheetDBConnection" = "Host=${module.rds.db_address};Port=${module.rds.db_port};Database=${module.rds.db_name};Username=${var.db_master_username};SearchPath=timesheet"
      })
      secrets = {
        "ConnectionStrings__TimesheetDBPassword" = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/db-password"
      }
    },
    {
      name              = "invoice"
      image             = "${local.ecr_base}/invoice"
      cpu               = 512
      memory            = 1024
      container_port    = 8080
      desired_count     = 2
      max_count         = 6
      auto_scale        = true
      health_check_path = "/health"
      target_group_arn  = module.alb.service_target_group_arns["invoice"]
      environment = merge(local.common_env, local.keycloak_env, {
        "ConnectionStrings__InvoiceDBConnection" = "Host=${module.rds.db_address};Port=${module.rds.db_port};Database=${module.rds.db_name};Username=${var.db_master_username};SearchPath=invoice"
      })
      secrets = {
        "ConnectionStrings__InvoiceDBPassword" = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/db-password"
      }
    },
    {
      name              = "document"
      image             = "${local.ecr_base}/document"
      cpu               = 512
      memory            = 1024
      container_port    = 8080
      desired_count     = 2
      max_count         = 6
      auto_scale        = true
      health_check_path = "/health"
      target_group_arn  = module.alb.service_target_group_arns["document"]
      environment = merge(local.common_env, local.keycloak_env, {
        "ConnectionStrings__DocumentDBConnection" = "Host=${module.rds.db_address};Port=${module.rds.db_port};Database=${module.rds.db_name};Username=${var.db_master_username};SearchPath=document"
        "AWS__S3BucketName"                       = module.s3.bucket_id
        "AWS__Region"                             = var.aws_region
      })
      secrets = {
        "ConnectionStrings__DocumentDBPassword" = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/db-password"
      }
    },
    {
      name              = "payment"
      image             = "${local.ecr_base}/payment"
      cpu               = 512
      memory            = 1024
      container_port    = 8080
      desired_count     = 2
      max_count         = 4
      auto_scale        = true
      health_check_path = "/health"
      target_group_arn  = module.alb.service_target_group_arns["payment"]
      environment       = merge(local.common_env, local.keycloak_env, local.rabbitmq_env)
      secrets = {
        "Stripe__SecretKey"      = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/stripe-secret-key"
        "Stripe__PublishableKey" = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/stripe-publishable-key"
      }
    },
    {
      name              = "notification"
      image             = "${local.ecr_base}/notification"
      cpu               = 512
      memory            = 1024
      container_port    = 8080
      desired_count     = 2
      max_count         = 4
      auto_scale        = true
      health_check_path = "/health"
      target_group_arn  = module.alb.service_target_group_arns["notification"]
      environment       = merge(local.common_env, local.keycloak_env, local.rabbitmq_env)
      secrets           = {}
    },
    {
      name              = "mailer"
      image             = "${local.ecr_base}/mailer"
      cpu               = 256
      memory            = 512
      container_port    = 8080
      desired_count     = 1
      max_count         = 3
      auto_scale        = true
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
    {
      name              = "coproperty"
      image             = "${local.ecr_base}/coproperty"
      cpu               = 512
      memory            = 1024
      container_port    = 8080
      desired_count     = 2
      max_count         = 6
      auto_scale        = true
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
    {
      name              = "frontend"
      image             = "${local.ecr_base}/frontend"
      cpu               = 256
      memory            = 512
      container_port    = 80
      desired_count     = 2
      max_count         = 6
      auto_scale        = true
      health_check_path = "/"
      target_group_arn  = module.alb.frontend_target_group_arn
      environment = {
        NODE_ENV = "production"
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

module "s3" {
  source       = "../../modules/s3"
  project_name = var.project_name
  environment  = var.environment
  cors_origins = var.cors_origins
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

module "ecs" {
  source                = "../../modules/ecs"
  project_name          = var.project_name
  environment           = var.environment
  aws_region            = var.aws_region
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  ecs_security_group_id = module.security.ecs_security_group_id
  s3_bucket_arn         = module.s3.bucket_arn
  image_tag             = var.image_tag
  services              = local.ecs_services
  tags                  = local.tags
}

################################################################################
# SSM Parameters
################################################################################

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/${var.environment}/db-password"
  type  = "SecureString"
  value = var.db_master_password
  tags  = local.tags
}

resource "aws_ssm_parameter" "keycloak_admin_password" {
  name  = "/${var.project_name}/${var.environment}/keycloak-admin-password"
  type  = "SecureString"
  value = var.keycloak_admin_password
  tags  = local.tags
}

resource "aws_ssm_parameter" "stripe_secret_key" {
  name  = "/${var.project_name}/${var.environment}/stripe-secret-key"
  type  = "SecureString"
  value = var.stripe_secret_key
  tags  = local.tags
}

resource "aws_ssm_parameter" "stripe_publishable_key" {
  name  = "/${var.project_name}/${var.environment}/stripe-publishable-key"
  type  = "SecureString"
  value = var.stripe_publishable_key
  tags  = local.tags
}

################################################################################
# CloudWatch Alarms (production monitoring)
################################################################################

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"
  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is above 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = module.rds.db_instance_id
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "ALB is returning too many 5xx errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = module.alb.alb_arn
  }

  tags = local.tags
}
