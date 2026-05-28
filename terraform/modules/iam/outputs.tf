output "eks_cluster_role_arn" {
  description = "ARN of the EKS cluster IAM role, null when create_base_roles is false"
  value       = length(aws_iam_role.eks_cluster) > 0 ? aws_iam_role.eks_cluster[0].arn : null
}

output "eks_node_group_role_arn" {
  description = "ARN of the EKS node group IAM role, null when create_base_roles is false"
  value       = length(aws_iam_role.eks_node_group) > 0 ? aws_iam_role.eks_node_group[0].arn : null
}

output "alb_controller_role_arn" {
  description = "ARN of the ALB controller IAM role (IRSA), null if OIDC provider not yet set"
  value       = length(aws_iam_role.alb_controller) > 0 ? aws_iam_role.alb_controller[0].arn : null
}
