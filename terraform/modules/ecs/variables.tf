variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for service discovery"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN for document storage. Empty string to skip S3 policy."
  type        = string
  default     = ""
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "services" {
  description = "List of services to deploy"
  type = list(object({
    name              = string
    image             = string
    cpu               = number
    memory            = number
    container_port    = number
    desired_count     = number
    max_count         = number
    auto_scale        = bool
    health_check_path = string
    target_group_arn  = string
    environment       = map(string)
    secrets           = map(string)
  }))
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
