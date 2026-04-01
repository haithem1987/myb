################################################################################
# Variables - Production Environment
################################################################################

variable "project_name" {
  type    = string
  default = "myb"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "aws_region" {
  type    = string
  default = "eu-west-3"
}

variable "vpc_cidr" {
  type    = string
  default = "10.1.0.0/16"
}

variable "cors_origins" {
  type    = list(string)
  default = ["https://myb.com"]
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (REQUIRED for production)"
  type        = string
}

variable "rds_instance_class" {
  type    = string
  default = "db.t3.small" # Production: more capacity
}

variable "rds_allocated_storage" {
  type    = number
  default = 50
}

variable "db_master_username" {
  type      = string
  default   = "myb_admin"
  sensitive = true
}

variable "db_master_password" {
  type      = string
  sensitive = true
}

variable "keycloak_admin_user" {
  type    = string
  default = "admin"
}

variable "keycloak_admin_password" {
  type      = string
  sensitive = true
}

variable "keycloak_realm" {
  type    = string
  default = "MYB"
}

variable "keycloak_client_id" {
  type    = string
  default = "MYB-client"
}

variable "keycloak_client_secret" {
  type      = string
  sensitive = true
}

variable "keycloak_service_client_id" {
  type    = string
  default = "myb-backend"
}

variable "keycloak_service_client_secret" {
  type      = string
  sensitive = true
}

variable "keycloak_manager_role" {
  type    = string
  default = "coproperty-syndic"
}

variable "mq_instance_type" {
  type    = string
  default = "mq.m5.large" # Production: higher throughput
}

variable "rabbitmq_username" {
  type      = string
  default   = "myb_mq_admin"
  sensitive = true
}

variable "rabbitmq_password" {
  type      = string
  sensitive = true
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
}

variable "stripe_publishable_key" {
  type      = string
  sensitive = true
}

variable "smtp_from_address" {
  type    = string
  default = "noreply@myb.com"
}

variable "smtp_from_name" {
  type    = string
  default = "MYB Platform"
}

variable "image_tag" {
  type    = string
  default = "latest"
}
