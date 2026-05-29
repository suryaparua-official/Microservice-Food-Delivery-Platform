output "vpc_name" {
  value = module.vpc.vpc_name
}

output "subnet_name" {
  value = module.vpc.subnet_name
}

output "service_account_email" {
  value = module.iam.service_account_email
}

output "cluster_name" {
  value = module.gke.cluster_name
}

output "cluster_endpoint" {
  value = module.gke.cluster_endpoint
}