################################################################################
# MYB Platform - OVHcloud Managed Kubernetes Module
# Manages a Kubernetes cluster + node pool on OVHcloud
# Scale desired_nodes=0 to "pause" (no worker cost), destroy to fully remove
################################################################################

terraform {
  required_providers {
    ovh = {
      source  = "ovh/ovh"
      version = "~> 0.46"
    }
  }
}

# ─── Kubernetes Cluster ────────────────────────────────────────────────────────
resource "ovh_cloud_project_kube" "cluster" {
  service_name       = var.service_name
  name               = var.cluster_name
  region             = var.region
  version            = var.kube_version
  update_policy      = "NEVER_UPDATE"   # manual version control
  private_network_id = var.private_network_id != "" ? var.private_network_id : null

  customization_apiserver {
    admissionplugins {
      enabled  = ["NodeRestriction"]
      disabled = []
    }
  }
}

# ─── Node Pool ────────────────────────────────────────────────────────────────
# Set desired_nodes=0 via infra-down to suspend worker costs while keeping cluster
resource "ovh_cloud_project_kube_nodepool" "workers" {
  service_name  = var.service_name
  kube_id       = ovh_cloud_project_kube.cluster.id
  name          = "${var.cluster_name}-workers"
  flavor_name   = var.node_flavor
  desired_nodes = var.desired_nodes
  min_nodes     = var.min_nodes
  max_nodes     = var.max_nodes
  autoscale     = var.autoscale

  template {
    metadata {
      annotations = {}
      finalizers  = []
      labels = {
        env     = var.environment
        project = "myb"
        pool    = "workers"
      }
    }
    spec {
      unschedulable = false
      taints        = []
    }
  }
}
