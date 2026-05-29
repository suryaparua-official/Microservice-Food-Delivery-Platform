resource "google_container_cluster" "this" {
  name     = var.cluster_name
  location = var.region
  project  = var.project_id

  network    = var.network
  subnetwork = var.subnetwork

  deletion_protection = false

  remove_default_node_pool = true
  initial_node_count       = 1

  release_channel {
    channel = "REGULAR"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = var.pods_range_name
    services_secondary_range_name = var.services_range_name
  }

  logging_service    = "logging.googleapis.com/kubernetes"
  monitoring_service = "monitoring.googleapis.com/kubernetes"

  vertical_pod_autoscaling {
    enabled = true
  }

  cost_management_config {
    enabled = true
  }
}

resource "google_container_node_pool" "primary" {
  name     = "${var.cluster_name}-node-pool"
  location = var.region
  project  = var.project_id
  cluster  = google_container_cluster.this.name

  node_count = var.node_count

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  autoscaling {
    min_node_count = 1
    max_node_count = 3
  }

  node_config {
    machine_type = var.machine_type

    service_account = var.service_account_email

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      environment = "dev"
      project     = "zestify"
    }

    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}