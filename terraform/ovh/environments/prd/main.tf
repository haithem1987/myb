################################################################################
# MYB Platform - OVHcloud PRD (Production) Environment
# Infrastructure: OVH Managed Kubernetes cluster + node pool
# Nodes: b3-16 (4 vCPU / 16 GB RAM) x 2-4
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
  # To migrate to remote storage later, run: terraform init -migrate-state
  backend "local" {
    path = "terraform.tfstate"
  }
}

# ─── OVH Provider ─────────────────────────────────────────────────────────────
# Credentials via env vars:
#   OVH_APPLICATION_KEY, OVH_APPLICATION_SECRET, OVH_CONSUMER_KEY, OVH_ENDPOINT
provider "ovh" {
  endpoint = var.ovh_endpoint
}

# ─── PRD Cluster ──────────────────────────────────────────────────────────────
module "k8s_prd" {
  source = "../../modules/k8s-cluster"

  service_name  = var.service_name
  cluster_name  = "myb-prd"
  environment   = "prd"
  region        = var.region
  kube_version  = var.kube_version
  node_flavor   = "b3-16"         # 4 vCPU / 16 GB – production grade
  desired_nodes = var.desired_nodes
  min_nodes     = 0
  max_nodes     = 4
  autoscale     = false           # manual control for cost predictability
}

# ─── Save kubeconfig locally ──────────────────────────────────────────────────
resource "local_sensitive_file" "kubeconfig_prd" {
  content         = module.k8s_prd.kubeconfig
  filename        = "${path.module}/kubeconfig-prd.yml"
  file_permission = "0600"
}
