################################################################################
# Outputs - HPRD Environment
################################################################################

output "cluster_id" {
  description = "HPRD cluster ID"
  value       = module.k8s_hprd.cluster_id
}

output "cluster_name" {
  description = "HPRD cluster name"
  value       = module.k8s_hprd.cluster_name
}

output "kube_version" {
  description = "Kubernetes version"
  value       = module.k8s_hprd.kube_version
}

output "desired_nodes" {
  description = "Current desired node count (0 = paused)"
  value       = module.k8s_hprd.desired_nodes
}

output "kubeconfig_path" {
  description = "Path to generated kubeconfig"
  value       = "${path.module}/kubeconfig-hprd.yml"
}
