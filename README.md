# InfraServer — Bootstrap híbrido con Kustomize + Helm + ArgoCD

Este repositorio define un bootstrap GitOps completo para K3s usando:

* **Kustomize** (con `--enable-helm`)
* **HelmCharts** renderizados por Kustomize
* **ArgoCD** instalado vía Helm en el bootstrap
* **App‑of‑Apps** (`infra-root`)
* **ingress-nginx** en baremetal (hostNetwork + SSL passthrough)
* **provisioning** gestionado por ArgoCD

Todo se despliega con un único comando.

---

## 1. Instalar K3s sin Traefik ni ServiceLB

```bash
curl -sfL https://get.k3s.io | \
  INSTALL_K3S_EXEC="--disable traefik --disable servicelb --write-kubeconfig-mode=644" \
  sh -
```

## 2. Quitar taints del nodo

```bash
kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true
kubectl taint nodes --all node-role.kubernetes.io/master:NoSchedule- || true
```

## 3. Instalar Kustomize (solo la primera vez)

```bash
curl -s https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh | bash
sudo mv kustomize /usr/local/bin/
```

Comprobar:

```bash
kustomize version
```

## 4. Clonar este repositorio

```bash
git clone https://github.com/SirXavor/InfraServer.git
cd InfraServer
```

## 5. Desplegar el bootstrap completo

```bash
kustomize build bootstrapInfra --enable-helm | kubectl apply -f -
```

Esto instala:

* ingress-nginx
* ArgoCD (vía Helm)
* App‑of‑Apps (infra-root)
* provisioning

## 6. Borrar artefactos temporales (opcional)

Kustomize descarga el chart de ArgoCD en:

```
bootstrapInfra/charts/
```

Puedes borrarlo:

```bash
rm -rf bootstrapInfra/charts/
```

Y está ignorado en `.gitignore`.

## 7. Obtener la contraseña inicial de ArgoCD

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Usuario:

```
admin
```

## 8. Añadir entrada en el hosts de Windows

```
192.168.1.70   argocd.local
```

## 9. Acceder a ArgoCD

```
https://argocd.local
```

