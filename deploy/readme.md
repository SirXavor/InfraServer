# 🚀 Bootstrap Kubernetes

Una vez el nodo está preparado:

```bash
curl -sfL https://get.k3s.io | \
  INSTALL_K3S_EXEC="--disable traefik --disable servicelb --write-kubeconfig-mode=644" \
  sh -
```

```bash
kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true
kubectl taint nodes --all node-role.kubernetes.io/master:NoSchedule- || true
```

```bash
curl -s https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh | bash
sudo mv kustomize /usr/local/bin/
```

```bash
git clone https://github.com/SirXavor/InfraServer.git
cd InfraServer
```

```bash
kustomize build manifests\infraserver\bootstrap --enable-helm | kubectl apply -f -
```

```bash
kubectl apply -f manifests\infraserver\apps\root.yaml
```

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Usuario:

```
admin
```