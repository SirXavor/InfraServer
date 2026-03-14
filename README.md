# Instalación de K3s + ingress-nginx + ArgoCD

## 1. Instalar K3s sin Traefik ni ServiceLB

```bash
curl -sfL https://get.k3s.io | \
  INSTALL_K3S_EXEC="--disable traefik --disable servicelb --write-kubeconfig-mode=644" \
  sh -
```

Esto deja un cluster K3s limpio, sin Traefik y sin ServiceLB.

---

## 2. Permitir que el nodo ejecute pods (quitar taints)

```bash
kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true
kubectl taint nodes --all node-role.kubernetes.io/master:NoSchedule- || true
```

---

## 3. Instalar ingress-nginx (modo baremetal)

### Crear namespace

```bash
kubectl create namespace ingress-nginx
```

### Instalar manifiesto baremetal

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.1/deploy/static/provider/baremetal/deploy.yaml
```

---

## 4. Activar hostNetwork en ingress-nginx

Editar el Deployment:

```bash
kubectl -n ingress-nginx edit deploy ingress-nginx-controller
```

Añadir dentro de `spec.template.spec`:

```yaml
hostNetwork: true
dnsPolicy: ClusterFirstWithHostNet
```

Esto hace que ingress-nginx escuche directamente en los puertos **80/443** del host.

---

## 5. Activar SSL passthrough en ingress-nginx

En el mismo Deployment, dentro de `args:` del contenedor:

```yaml
- --enable-ssl-passthrough
```

Esto permite que ArgoCD reciba HTTPS real, necesario para que el login funcione.

---

## 6. Instalar Helm

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

---

## 7. Configurar kubeconfig para Helm

```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
```

Se puede añadir a `~/.bashrc` para hacerlo permanente.

---

## 8. Añadir el repositorio de ArgoCD para Helm

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
```

---

## 9. Crear namespace para ArgoCD

```bash
kubectl create namespace argocd
```

---

## 10. Crear `values.yaml` para ArgoCD (sin ApplicationSet)

```yaml
nameOverride: argocd

applicationset:
  enabled: false

server:
  ingress:
    enabled: true
    ingressClassName: "nginx"
    hostname: "argocd.local"
    path: /
    pathType: Prefix
    tls: false
    annotations:
      nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
      nginx.ingress.kubernetes.io/ssl-passthrough: "true"
```

---

## 11. Instalar ArgoCD con Helm

```bash
helm upgrade --install argocd argo/argo-cd \
  --namespace argocd \
  --version 8.0.0 \
  -f values.yaml
```

---

## 12. Obtener la contraseña inicial de ArgoCD

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Usuario:

```
admin
```

---

## 13. Añadir entrada en el hosts de Windows

```
192.168.1.70   argocd.local
```

---

## 14. Acceder a ArgoCD

```
https://argocd.local
```

El login funciona porque:

* ingress-nginx está en **hostNetwork**
* **SSL passthrough** está activado
* el **Ingress reenvía HTTPS directamente al servidor de ArgoCD**
