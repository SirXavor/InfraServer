# InfraServer — Bootstrap GitOps + Provisioning + Convergencia con Ansible

InfraServer no es un clúster Kubernetes.

Es un **sistema completo de despliegue de infraestructura** donde los nodos:

1. **Se instalan automáticamente (provisioning)** con lo mínimo imprescindible
2. **Arrancan en un estado base seguro (hardening CCN/STIC)**
3. **Convergen a su estado final mediante Ansible + GitOps**

---

# 🧠 Filosofía del sistema (actualizada)

El modelo ha evolucionado a separar claramente responsabilidades:

```
Provisioning mínimo → Convergencia (Ansible) → Operación (GitOps / Kubernetes)
```

---

## 🔹 Principio clave

👉 El provisioning **NO configura el sistema completo**
👉 Solo deja el nodo en un estado:

* Instalado
* Seguro
* Conectado
* Identificable

Todo lo demás se delega a **Ansible**.

---

# 1. Provisioning (día 0)

El provisioning instala **lo mínimo necesario** para cumplir:

* Arranque automático
* Seguridad base (CCN/STIC)
* Capacidad de gestión remota

## Qué hace el provisioning

* Instalación automática de Ubuntu (cloud-init)
* Configuración de red mínima
* Creación de usuario y acceso SSH
* **Particionado de discos cifrados (LUKS)**
* Aplicación de hardening base (CCN-STIC)

Esto viene definido en los archivos base:

```
configs/base/
```

Ejemplos:

* updates automáticos
* antivirus
* bloqueo de cuentas
* endurecimiento criptográfico

---

## Qué NO hace el provisioning

El provisioning deliberadamente **NO hace**:

* Instalación completa de servicios
* Configuración avanzada del sistema
* Despliegue de aplicaciones
* Configuración de Kubernetes completa

👉 Esto es intencional.

---

# 2. Identidad del nodo

Cada máquina se identifica por:

* MAC
* hostname

Y recibe su configuración base mediante:

```
BASE → PROFILE(s) → HOST
```

* **Base** → hardening y sistema mínimo
* **Profiles** → intención (ej: k3s, storage, etc.)
* **Host** → identidad final

---

# 3. Convergencia con Ansible (día 1)

Una vez instalado el sistema:

👉 **Ansible toma el control del nodo**

Ansible es responsable de:

* Configuración completa del sistema
* Instalación de software
* Configuración de red avanzada
* Roles (kubernetes, almacenamiento, etc.)

---

## 🔹 Por qué Ansible

Separar provisioning de configuración permite:

* Idempotencia real
* Reconfiguración sin reinstalar
* Control declarativo fuera del instalador
* Auditoría y versionado limpio

👉 Cloud-init solo "siembra"
👉 Ansible "construye"

---

# 4. Kubernetes / GitOps (día 2)

Una vez el nodo está convergido:

* Se instala Kubernetes (si aplica)
* Se despliega ArgoCD
* El sistema pasa a modelo GitOps

👉 A partir de aquí:

* Git = fuente de verdad
* ArgoCD aplica cambios

---

# 🏗️ Arquitectura de Provisioning

InfraServer incluye toda la cadena de arranque:

---

## 🔹 DHCP Proxy (dnsmasq)

* Detecta BIOS vs UEFI
* Entrega iPXE
* No sustituye DHCP existente

---

## 🔹 TFTP (iPXE stage)

* `undionly.kpxe` → BIOS
* `ipxe.efi` → UEFI

---

## 🔹 HTTP Boot (kernel-provisioning)

Servidor principal:

* Kernel + initrd
* iPXE menu
* Cloud-init dinámico por MAC

---

## 🔹 DNS de infraestructura (CoreDNS)

* Resolución interna
* Servicios del clúster

---

# 🔁 Flujo completo de arranque

```
DHCP → PXE → iPXE → HTTP → cloud-init → sistema mínimo → Ansible → Kubernetes → ArgoCD
```

1. Arranque por red
2. Carga iPXE
3. Instalación automática
4. Sistema base seguro
5. Ansible configura el nodo
6. Kubernetes (si aplica)
7. GitOps toma control

---

# 🚀 Bootstrap del clúster

Este repositorio define el bootstrap GitOps:

* Kustomize + Helm
* ArgoCD
* App-of-Apps
* Ingress NGINX

---

## 1. Instalar K3s (si no lo hace Ansible)

```bash
curl -sfL https://get.k3s.io | \
  INSTALL_K3S_EXEC="--disable traefik --disable servicelb --write-kubeconfig-mode=644" \
  sh -
```

---

## 2. Quitar taints

```bash
kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true
kubectl taint nodes --all node-role.kubernetes.io/master:NoSchedule- || true
```

---

## 3. Instalar Kustomize

```bash
curl -s https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh | bash
sudo mv kustomize /usr/local/bin/
```

---

## 4. Clonar repositorio

```bash
git clone https://github.com/SirXavor/InfraServer.git
cd InfraServer
```

---

## 5. Desplegar bootstrap

```bash
kustomize build bootstrapInfra --enable-helm | kubectl apply -f -
```

---

## 6. Activar App of Apps

```bash
cd selfDeploy
kubectl apply -f root.yaml
```

---

## 7. Obtener password ArgoCD

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Usuario:

```
admin
```

---

# 🌐 DNS de infraestructura

Ejemplo:

```
192.168.1.71
```

Configurar en DHCP:

```
DNS primario:     192.168.1.1
DNS secundario:   192.168.1.71
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
* Seguridad desde el inicio (CCN/STIC)
* Configuración delegada a Ansible
* Git como fuente de verdad
* Infraestructura reproducible
* Separación clara de responsabilidades
