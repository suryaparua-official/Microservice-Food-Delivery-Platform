output "eks_cluster_role_arn" {
  description = "ARN of the EKS cluster IAM role"
  value       = aws_iam_role.eks_cluster.arn
}

output "eks_node_group_role_arn" {
  description = "ARN of the EKS node group IAM role"
  value       = aws_iam_role.eks_node_group.arn
}

output "alb_controller_role_arn" {
  description = "ARN of the ALB controller IAM role (IRSA)"
  value       = aws_iam_role.alb_controller.arn
}
