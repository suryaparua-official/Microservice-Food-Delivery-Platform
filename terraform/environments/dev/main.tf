module "vpc" {
  source = "../../modules/vpc"

  project_id = var.project_id

  region = var.region

  vpc_name = "zestify-vpc"

  subnet_name = "zestify-subnet"

  subnet_cidr = "10.0.0.0/24"

  pods_cidr = "10.1.0.0/16"

  services_cidr = "10.2.0.0/20"
}

module "iam" {
  source = "../../modules/iam"

  project_id = var.project_id

  service_account_id = "zestify-gke-sa"

  service_account_name = "Zestify GKE Service Account"
}

module "gke" {
  source = "../../modules/gke"

  project_id = var.project_id

  region = var.region

  cluster_name = var.cluster_name

  network = module.vpc.vpc_name

  subnetwork = module.vpc.subnet_name

  service_account_email = module.iam.service_account_email

  node_count = var.node_count

  machine_type = var.machine_type

  pods_range_name = "pods"

  services_range_name = "services"
}