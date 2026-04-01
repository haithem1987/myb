################################################################################
# Variables - Dev Environment
################################################################################

# --- Project ---
variable "project_name" {
  description = "Project name"
  type        = string
  default     = "myb"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-west-3"
}

# --- Networking ---
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "cors_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS. Leave empty for HTTP only."
  type        = string
  default     = ""
}

# --- Database ---
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_master_username" {
  description = "RDS master username"
  type        = string
  default     = "myb_admin"
  sensitive   = true
}

variable "db_master_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

# --- Keycloak ---
variable "keycloak_admin_user" {
  description = "Keycloak admin username"
  type        = string
  default     = "admin"
}

variable "keycloak_admin_password" {
  description = "Keycloak admin password"
  type        = string
  sensitive   = true
}

variable "keycloak_realm" {
  description = "Keycloak realm name"
  type        = string
  default     = "MYB"
}

variable "keycloak_client_id" {
  description = "Keycloak client ID"
  type        = string
  default     = "MYB-client"
}

variable "keycloak_client_secret" {
  description = "Keycloak client secret"
  type        = string
  sensitive   = true
}

variable "keycloak_service_client_id" {
  description = "Keycloak service client ID for backend-to-backend auth"
  type        = string
  default     = "myb-backend"
}

variable "keycloak_service_client_secret" {
  description = "Keycloak service client secret"
  type        = string
  sensitive   = true
}

variable "keycloak_manager_role" {
  description = "Keycloak manager role for coproperty service"
  type        = string
  default     = "coproperty-syndic"
}

# --- RabbitMQ ---
variable "mq_instance_type" {
  description = "Amazon MQ instance type"
  type        = string
  default     = "mq.t3.micro"
}

variable "rabbitmq_username" {
  description = "RabbitMQ admin username"
  type        = string
  default     = "myb_mq_admin"
  sensitive   = true
}

variable "rabbitmq_password" {
  description = "RabbitMQ admin password (min 12 chars)"
  type        = string
  sensitive   = true
}

# --- Stripe ---
variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key"
  type        = string
  sensitive   = true
}

# --- SMTP ---
variable "smtp_from_address" {
  description = "SMTP from email address"
  type        = string
  default     = "noreply@myb.com"
}

variable "smtp_from_name" {
  description = "SMTP from display name"
  type        = string
  default     = "MYB Platform"
}

# --- Deployment ---
variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}
