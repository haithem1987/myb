################################################################################
# Outputs - PRD Environment
################################################################################

output "cluster_id" {
  description = "PRD cluster ID"
  value       = module.k8s_prd.cluster_id
}

output "cluster_name" {
  description = "PRD cluster name"
  value       = module.k8s_prd.cluster_name
}

output "kube_version" {
  description = "Kubernetes version"
  value       = module.k8s_prd.kube_version
}

output "desired_nodes" {
  description = "Current desired node count (0 = paused)"
  value       = module.k8s_prd.desired_nodes
}

output "kubeconfig_path" {
  description = "Path to generated kubeconfig"
  value       = "${path.module}/kubeconfig-prd.yml"
}
