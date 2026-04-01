################################################################################
# Outputs - LocalStack Environment
################################################################################

output "ecr_note" {
  description = "ECR requires LocalStack Pro — use local Docker images instead"
  value       = "Images are tagged locally. Use docker-compose.dev.yml to run services."
}

output "s3_bucket_name" {
  description = "S3 document storage bucket"
  value       = module.s3.bucket_id
}

output "ssm_parameters" {
  description = "SSM parameter paths"
  value = [
    aws_ssm_parameter.db_password.name,
    aws_ssm_parameter.keycloak_admin_password.name,
    aws_ssm_parameter.smtp_username.name,
    aws_ssm_parameter.smtp_password.name,
  ]
}

output "log_groups" {
  description = "CloudWatch log group names"
  value       = [for lg in aws_cloudwatch_log_group.services : lg.name]
}

output "ecs_task_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task.arn
}
