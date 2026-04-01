################################################################################
# Variables - LocalStack Environment
################################################################################

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
  description = "AWS region (simulated)"
  type        = string
  default     = "eu-west-3"
}

variable "cors_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "db_master_password" {
  description = "Database master password (local only)"
  type        = string
  default     = "localstack-db-password"
  sensitive   = true
}

variable "keycloak_admin_password" {
  description = "Keycloak admin password (local only)"
  type        = string
  default     = "admin"
  sensitive   = true
}
