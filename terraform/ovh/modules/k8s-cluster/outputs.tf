################################################################################
# Outputs - OVH K8s Cluster Module
################################################################################

output "cluster_id" {
  description = "OVHcloud Kubernetes cluster ID"
  value       = ovh_cloud_project_kube.cluster.id
}

output "cluster_name" {
  description = "Cluster name"
  value       = ovh_cloud_project_kube.cluster.name
}

output "kube_version" {
  description = "Actual Kubernetes version deployed"
  value       = ovh_cloud_project_kube.cluster.version
}

output "kubeconfig" {
  description = "Kubeconfig to connect to this cluster (sensitive)"
  value       = ovh_cloud_project_kube.cluster.kubeconfig
  sensitive   = true
}

output "nodepool_id" {
  description = "Node pool ID"
  value       = ovh_cloud_project_kube_nodepool.workers.id
}

output "desired_nodes" {
  description = "Current desired node count"
  value       = ovh_cloud_project_kube_nodepool.workers.desired_nodes
}
