variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "service_names" {
  description = "List of microservice names to create repositories for"
  type        = list(string)
  # Phase 1: Coproperty only. Phase 2 will add: timesheet, invoice, document, payment
  default = [
    "user-manager",
    "notification",
    "mailer",
    "coproperty",
    "keycloak",
    "admin"
  ]
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
