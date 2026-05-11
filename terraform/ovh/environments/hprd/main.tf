################################################################################
# MYB Platform - OVHcloud HPRD (Hors Production) Environment
# Infrastructure: OVH Managed Kubernetes cluster + node pool
# Nodes: b3-8 (4 vCPU / 8 GB RAM) x 1-2  → lower cost than PRD
# State: local (terraform.tfstate in this directory)
################################################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    ovh = {
      source  = "ovh/ovh"
      version = "~> 0.46"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }

  # Local backend – state stored in this directory.
  backend "local" {
    path = "terraform.tfstate"
  }
}

# ─── OVH Provider ─────────────────────────────────────────────────────────────
provider "ovh" {
  endpoint = var.ovh_endpoint
}

# ─── HPRD Cluster ─────────────────────────────────────────────────────────────
module "k8s_hprd" {
  source = "../../modules/k8s-cluster"

  service_name  = var.service_name
  cluster_name  = "myb-hprd"
  environment   = "hprd"
  region        = var.region
  kube_version  = var.kube_version
  node_flavor   = "b3-8"          # 4 vCPU / 8 GB – pre-prod, cost efficient
  desired_nodes = var.desired_nodes
  min_nodes     = 0
  max_nodes     = 2
  autoscale     = false
}

# ─── Save kubeconfig locally ──────────────────────────────────────────────────
resource "local_sensitive_file" "kubeconfig_hprd" {
  content         = module.k8s_hprd.kubeconfig
  filename        = "${path.module}/kubeconfig-hprd.yml"
  file_permission = "0600"
}
