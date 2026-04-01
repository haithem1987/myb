################################################################################
# Outputs - Dev Environment
################################################################################

output "alb_dns_name" {
  description = "Application Load Balancer DNS name (use this to access the platform)"
  value       = module.alb.alb_dns_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.db_endpoint
}

output "ecr_repository_urls" {
  description = "ECR repository URLs for all services"
  value       = module.ecr.repository_urls
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "s3_bucket_name" {
  description = "S3 document storage bucket name"
  value       = module.s3.bucket_id
}

output "service_discovery_namespace" {
  description = "Service discovery namespace for inter-service communication"
  value       = module.ecs.service_discovery_namespace_name
}

output "rabbitmq_endpoint" {
  description = "Amazon MQ RabbitMQ endpoint"
  value       = aws_mq_broker.rabbitmq.instances[0].endpoints[0]
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "nat_gateway_ip" {
  description = "NAT Gateway public IP"
  value       = module.vpc.nat_gateway_ip
}
