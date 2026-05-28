variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string
}

variable "create_base_roles" {
  description = "Set to false in secondary module calls to skip creating EKS cluster and node group roles that already exist from a prior module call"
  type        = bool
  default     = true
}

variable "oidc_provider_arn" {
  description = "ARN of the EKS OIDC provider for IRSA (optional, set after EKS is created)"
  type        = string
  default     = null
}

variable "oidc_provider_url" {
  description = "URL of the EKS OIDC provider for IRSA (optional, set after EKS is created)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
