#!/bin/bash

# Exit on any error
set -e

echo "Connecting to EKS cluster..."
aws eks update-kubeconfig \
  --name zestify-dev-cluster \
  --region ap-south-1

echo "Adding Helm repos..."
helm repo add eks https://aws.github.io/eks-charts
helm repo add argo https://argoproj.github.io/argo-helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

echo "Installing AWS Load Balancer Controller..."
helm upgrade --install aws-load-balancer-controller \
  eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=zestify-dev-cluster \
  --wait

echo "Installing ArgoCD..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
helm upgrade --install argocd argo/argo-cd \
  -n argocd \
  --wait

echo "Applying ArgoCD app manifest..."
kubectl apply -f k8s/argocd-app.yml

echo "Installing Prometheus + Grafana..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
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
echo "Setup complete."
echo ""
echo "Get ArgoCD initial password:"
echo "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
echo ""
echo "Get ArgoCD server URL:"
echo "kubectl get svc argocd-server -n argocd"
