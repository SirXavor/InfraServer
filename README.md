# InfraServer — Bootstrap GitOps + Provisioning + Convergencia con Ansible

InfraServer no es un clúster Kubernetes.

Es un **sistema completo de despliegue de infraestructura** donde los nodos:

1. Se instalan automáticamente (provisioning)
2. Arrancan en un estado base seguro
3. Convergen a su estado final
4. Pasan a operación bajo GitOps

---

# 🧠 Filosofía del sistema

Separación estricta de responsabilidades:

```
Provisioning → Convergencia (Ansible) → Operación (GitOps / Kubernetes)
```

---

# 📚 Documentación del sistema

Para entender InfraServer completamente:

* 👉 [Provisioning:](/configs/provisioning/readme.md)
* 👉 [Convergencia con Ansible:](/configs/ansible/readme.md) 

Este documento es **la visión global**.

---

# 🔹 Principio clave

El provisioning **NO configura el sistema completo**.

Solo deja el nodo en un estado:

* Instalado
* Seguro
* Conectado
* Identificable

👉 Toda la configuración real se delega a Ansible.

---

# 🔄 Flujo completo

```
DHCP → PXE → iPXE → HTTP → cloud-init → sistema mínimo → Ansible → Kubernetes → Servicios
```

1. Arranque por red
2. Instalación automática
3. Sistema base seguro
4. Convergencia con Ansible
5. Kubernetes (si aplica)
6. GitOps toma control

---

# 🧩 Fases del sistema

## 1. Provisioning (día 0)

* Instalación automática (cloud-init)
* Configuración mínima
* Hardening inicial
* Identidad del nodo

👉 No instala servicios complejos
👉 No configura Kubernetes

---

## 2. Convergencia con Ansible (día 1)

* Configuración completa del sistema
* Instalación de software
* Aplicación de roles
* Corrección continua del estado

👉 El sistema pasa a ser **declarativo y autocorregido**

---

## 3. Operación GitOps (día 2)

* Kubernetes desplegado
* ArgoCD activo
* Git como fuente de verdad

👉 El sistema queda gestionado por GitOps

---

# 🏗️ Cadena de arranque

InfraServer incluye toda la infraestructura necesaria:

## DHCP Proxy (dnsmasq)

* Detecta BIOS / UEFI
* Entrega iPXE

## TFTP

* `undionly.kpxe` (BIOS)
* `ipxe.efi` (UEFI)

## HTTP Boot (kernel-provisioning)

* Kernel + initrd
* Menú iPXE
* Configuración dinámica por MAC

## DNS (CoreDNS)

* Resolución interna
* Servicios del clúster

---

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
kustomize build bootstrapInfra --enable-helm | kubectl apply -f -
```

```bash
cd selfDeploy
kubectl apply -f root.yaml
```

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Usuario:

```
admin
```

---

# 📦 Estructura del repositorio

```
bootstrapInfra/
provisioning/
dnsmasq/
tftp-provisioning/
coredns/
selfDeploy/
```

---

# ⚙️ Principios clave

* Provisioning mínimo
* Seguridad desde el inicio
* Convergencia continua
* Git como fuente de verdad
* Infraestructura reproducible
* Separación de responsabilidades

---

# 🧠 Resumen

Provisioning inicia el nodo.

Ansible lo convierte en infraestructura.

GitOps lo mantiene en producción.
