################################################################################
# Outputs - Production Environment
################################################################################

output "alb_dns_name" {
  description = "ALB DNS name — point your domain CNAME to this"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB Route53 zone ID for alias records"
  value       = module.alb.alb_zone_id
}

output "rds_endpoint" {
  value = module.rds.db_endpoint
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "s3_bucket_name" {
  value = module.s3.bucket_id
}

output "service_discovery_namespace" {
  value = module.ecs.service_discovery_namespace_name
}

output "rabbitmq_endpoint" {
  value = aws_mq_broker.rabbitmq.instances[0].endpoints[0]
}

output "sns_alerts_topic_arn" {
  description = "SNS topic ARN for alerts — subscribe your email/Slack here"
  value       = aws_sns_topic.alerts.arn
}
