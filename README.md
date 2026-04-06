# InfraServer — Bootstrap GitOps + Provisioning + Convergencia con Ansible

InfraServer no es un clúster Kubernetes.

Es un **sistema completo de despliegue de infraestructura** orientado a entornos reales, donde los nodos:

1. Se instalan automáticamente (provisioning)
2. Arrancan en un estado base seguro
3. Convergen a su estado final
4. Pasan a operación bajo GitOps

---

# 🎯 Objetivo principal

InfraServer está diseñado con una premisa explícita:

> **Si no escala, no sirve.**

El sistema debe poder desplegar y mantener **decenas o cientos de nodos (especialmente edge)** con:

* Configuración declarativa por host
* Perfiles reutilizables
* Provisioning sin intervención
* Convergencia automática
* Operación predecible

👉 En la práctica, **añadir un nodo equivale a añadir un YAML al repositorio**.

---

# 🧠 Filosofía del sistema

Separación estricta de responsabilidades:

```
Provisioning → Convergencia (Ansible) → Operación (GitOps)
```

## 🔹 Principio clave

El provisioning **NO configura el sistema completo**.

Solo deja el nodo en un estado:

* Instalado
* Seguro (hardening base)
* Conectado
* Identificable

👉 Toda la configuración real se delega a Ansible.

---

# 📚 Documentación del sistema

Para entender InfraServer completamente:

* 👉 [Provisioning:](/configs/provisioning/readme.md)
* 👉 [Convergencia con Ansible:](/configs/ansible/readme.md)

Este documento es **la visión global**.

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
* Hardening inicial (CCN/STIC)
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

## 3. Operación (día 2)

Dependiendo del entorno:

### 🔹 Core

* Kubernetes desplegado
* ArgoCD activo
* Git como fuente de verdad

👉 **GitOps centralizado y continuo**

---

### 🔹 Edge

* Kubernetes local (k3s)
* Sin dependencia de control central en tiempo real
* GitOps aplicado localmente

👉 **GitOps autónomo y resiliente**

---

# 🛰️ Modelo Edge

InfraServer está especialmente diseñado para entornos edge, donde se asume:

* Nodos desechables o reemplazables
* Hardware heterogéneo
* Conectividad intermitente
* Riesgo físico elevado

## 🔹 Principios de diseño en edge

* Identidad basada en múltiples MACs
* Provisioning completamente automático
* Configuración generada por plantillas + variables por host
* Convergencia desde Git mediante Ansible
* Sin dependencia de control central en tiempo real

## 🔹 Qué permite este modelo

* Desplegar muchos nodos con el mismo perfil
* Ajustar diferencias por host vía YAML
* Reinstalar nodos sin intervención manual
* Mantener comportamiento homogéneo

---

# 📦 Stack típico de un nodo edge

Un nodo edge puede desplegar, por ejemplo:

* **Apolo** — servicios de apoyo en terreno
* **VPN** — túnel seguro hacia el core
* **Argos / Frigate / IA** — análisis de vídeo e inferencia local
* **Radiochat** — comunicaciones en entorno degradado

## 🔹 Cómo se define

* Roles de Ansible
* Plantillas Helm propias
* Variables declaradas en el YAML del host

## 🔹 Resultado

Cada nodo edge:

* Se instala automáticamente
* Se cifra y securiza
* Se configura con su stack específico
* Se puede reproducir o reemplazar sin intervención

👉 Todo está descrito en Git y es reproducible.

---

# 🔄 GitOps en InfraServer

## 🛰️ Edge (sin ArgoCD)

Los nodos edge operan en entornos:

* Desconectados
* Hostiles
* Con hardware limitado
* Sin alta disponibilidad

Por eso **no usan ArgoCD**.

En su lugar:

* Plantillas Helm propias
* Variables declarativas por host
* Renderizado local mediante Ansible
* Aplicación directa sobre k3s
* Convergencia periódica desde Git

👉 Resultado:

* Despliegues reproducibles
* Configuración declarativa
* Independencia del core
* Operación autónoma

---

## 🧭 Core (con ArgoCD)

El core sí usa ArgoCD porque:

* Tiene conectividad estable
* Aloja servicios críticos
* Requiere despliegues frecuentes
* Necesita auditoría y rollback

👉 Modelo:

* GitOps centralizado
* Control continuo del estado

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
* Escalabilidad real (edge masivo)

---

# 🧠 Resumen

Provisioning inicia el nodo.

Ansible lo convierte en infraestructura.

GitOps lo mantiene en producción.

👉 Todo definido en Git.
👉 Todo reproducible.
👉 Todo escalable.
