################################################################################
# Variables - HPRD Environment
################################################################################

variable "ovh_endpoint" {
  description = "OVHcloud API endpoint (ovh-ca for Canada, ovh-eu for Europe)"
  type        = string
  default     = "ovh-ca"
}

variable "service_name" {
  description = "OVHcloud project/service ID"
  type        = string
}

variable "region" {
  description = "OVHcloud region"
  type        = string
  default     = "BHS5"
}

variable "kube_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.31"
}

variable "desired_nodes" {
  description = "Worker node count. Use 0 to pause (infra-down). Use 1 for normal HPRD."
  type        = number
  default     = 1
}
