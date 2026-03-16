# InfraServer — Bootstrap híbrido con Kustomize + Helm + ArgoCD

Este repositorio define un bootstrap GitOps completo para K3s usando:

* **Kustomize** (con `--enable-helm`)
* **HelmCharts** renderizados por Kustomize
* **ArgoCD** instalado vía Helm en el bootstrap
* **App-of-Apps** (`infra-root`)
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
* App-of-Apps (`infra-root`)
* provisioning

## 6. Instalar la aplicación raíz de ArgoCD

El paso correcto no es borrar artefactos temporales, sino aplicar el manifiesto raíz desde `selfDeploy`, porque ahí es donde se instala la aplicación de ArgoCD.

```bash
cd selfDeploy
kubectl apply -f root.yaml
```

## 7. Obtener la contraseña inicial de ArgoCD

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Usuario:

```text
admin
```

## 8. Añadir el DNS de infraestructura al DHCP de la red

El clúster despliega un **DNS de infraestructura** que resuelve los dominios internos de los servicios.

Para que los equipos de la red puedan resolver estos nombres, hay que añadir la IP del DNS del clúster en la configuración **DHCP** del router o servidor DHCP.

Ejemplo:

```
DNS primario:     192.168.1.1
DNS secundario:   192.168.1.71   (DNS de infra del clúster)
```

También puede añadirse como **tercer servidor DNS** si ya existen dos configurados.

Una vez actualizado el DHCP, los clientes obtendrán automáticamente el DNS de infraestructura y podrán resolver los servicios del clúster.
