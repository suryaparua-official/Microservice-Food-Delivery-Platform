output "service_account_email" {
  value = google_service_account.gke_sa.email
}

output "service_account_name" {
  value = google_service_account.gke_sa.name
}