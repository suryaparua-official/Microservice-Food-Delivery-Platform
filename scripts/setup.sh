#!/bin/bash

set -e

echo "Connecting to GKE cluster..."

gcloud container clusters get-credentials zestify-gke \
  --region asia-south1

echo "Adding Helm repos..."

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add argo https://argoproj.github.io/argo-helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts

helm repo update

echo "Installing NGINX Ingress..."

kubectl create namespace ingress-nginx \
  --dry-run=client -o yaml | kubectl apply -f -

helm upgrade --install ingress-nginx \
  ingress-nginx/ingress-nginx \
  -n ingress-nginx \
  --wait

echo "Installing ArgoCD..."

kubectl create namespace argocd \
  --dry-run=client -o yaml | kubectl apply -f -

helm upgrade --install argocd \
  argo/argo-cd \
  -n argocd \
  --wait

echo "Applying ArgoCD Application..."

kubectl apply -f k8s/argocd-app.yml

echo "Installing Prometheus + Grafana..."

kubectl create namespace monitoring \
  --dry-run=client -o yaml | kubectl apply -f -

helm upgrade --install kube-prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --set alertmanager.enabled=false \
  --wait

echo "Installing Loki..."

helm upgrade --install loki \
  grafana/loki-stack \
  -n monitoring \
  --set promtail.enabled=true \
  --wait

echo ""
echo "======================================="
echo "Setup Complete"
echo "======================================="
echo ""

echo "ArgoCD Initial Password:"
echo "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"

echo ""
echo "ArgoCD Service:"
echo "kubectl get svc -n argocd"

echo ""
echo "Grafana Service:"
echo "kubectl get svc -n monitoring"

echo ""
echo "Grafana Admin Password:"
echo "kubectl get secret kube-prometheus-stack-grafana -n monitoring -o jsonpath='{.data.admin-password}' | base64 -d"