################################################################################
# Variables - OVH K8s Cluster Module
################################################################################

variable "service_name" {
  description = "OVHcloud project/service ID (OVH_CLOUD_PROJECT_SERVICE)"
  type        = string
}

variable "cluster_name" {
  description = "Name of the Kubernetes cluster"
  type        = string
}

variable "environment" {
  description = "Environment label: prd or hprd"
  type        = string
  validation {
    condition     = contains(["prd", "hprd"], var.environment)
    error_message = "Environment must be 'prd' or 'hprd'."
  }
}

variable "region" {
  description = "OVHcloud region (e.g. GRA7, GRA9, SBG5)"
  type        = string
  default     = "GRA7"
}

variable "kube_version" {
  description = "Kubernetes version (e.g. 1.31)"
  type        = string
  default     = "1.31"
}

variable "node_flavor" {
  description = "OVHcloud node flavor (e.g. b3-8, b3-16)"
  type        = string
}

variable "desired_nodes" {
  description = "Number of worker nodes. Set to 0 to suspend (infra-down)."
  type        = number
  default     = 2
}

variable "min_nodes" {
  description = "Minimum nodes (autoscaler lower bound)"
  type        = number
  default     = 0
}

variable "max_nodes" {
  description = "Maximum nodes (autoscaler upper bound)"
  type        = number
}

variable "autoscale" {
  description = "Enable cluster autoscaler"
  type        = bool
  default     = false
}

variable "private_network_id" {
  description = "Optional OVHcloud private network ID (vRack). Leave empty for public."
  type        = string
  default     = ""
}
