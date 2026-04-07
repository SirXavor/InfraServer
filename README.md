# InfraServer — Provisioning + Convergencia + Kubernetes Declarativo

InfraServer no es un clúster Kubernetes.

Es un **sistema completo de despliegue de infraestructura** orientado a entornos reales, donde los nodos:

1. Se instalan automáticamente (provisioning)
2. Arrancan en un estado base seguro
3. Convergen a su estado final
4. Despliegan su plataforma (Kubernetes si aplica)
5. Pasan a operación bajo Git

---

# 🎯 Objetivo principal

InfraServer está diseñado con una premisa explícita:

> **Si no escala, no sirve.**

El sistema debe poder desplegar y mantener **cientos o miles de nodos (especialmente edge desechable)** con:

* Configuración declarativa por host
* Perfiles reutilizables
* Provisioning sin intervención
* Convergencia automática
* Operación predecible
* **Y SIN OPERADOR**

👉 En la práctica, **añadir un nodo equivale a añadir un YAML al repositorio**.

---

# 🧠 Filosofía del sistema

Separación estricta de responsabilidades:

```
Provisioning → Convergencia (Ansible) → Plataforma (Kubernetes) → Operación (Git)
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

* 👉 [Cloud-init:](/configs/cloud-init/readme.md)
* 👉 [Ansible:](/configs/ansible/readme.md)

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
5. Despliegue de Kubernetes (si aplica)
6. Aplicación de manifiestos
7. Operación

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

## 3. Plataforma (día 1+)

En esta fase el nodo pasa a ejecutar su función real.

### 🔹 Edge (k3s autónomo)

El nodo:

* Instala K3s
* Elimina restricciones iniciales (taints)
* Aplica un **bootstrap declarativo** mediante manifests

```bash
kubectl apply -k manifests/k3s-edge/bootstrap
```

👉 Stack típico:

* VPN server/client
* Apolo
* Argos / Frigate / IA
* Radio Chat

👉 Sin dependencia de control central

---

### 🔹 Core (Kubernetes + ArgoCD)

El nodo forma parte de un clúster más complejo:

* Kubernetes completo
* ArgoCD instalado
* Helm/Kustomize gestionado por GitOps

👉 Flujo:

* Bootstrap mínimo del clúster
* ArgoCD toma control
* Despliegues gestionados desde Git

👉 Stack típico:

* Ingress avanzado
* Cert-manager
* Rook/Ceph u otro almacenamiento
* Aplicaciones corporativas

---

## 4. Operación (día 2)

### 🔹 Edge

* Operación autónoma
* Convergencia periódica con Ansible
* Aplicación directa de manifests

---

### 🔹 Core

* Operación centralizada
* GitOps continuo (ArgoCD)
* Observabilidad, control y auditoría

---

# 🛰️ Modelo Edge

InfraServer está especialmente diseñado para entornos edge:

* Nodos desechables o reemplazables
* Hardware heterogéneo
* Conectividad intermitente
* Riesgo físico elevado

---

## 🔐 Perfil: edge-tang-storage

Perfil orientado a entornos edge con seguridad estricta:

* Particionado estándar
* LVM
* Cifrado LUKS
* Sin TPM2
* Desbloqueo exclusivamente mediante Tang
* Requiere red en initramfs

👉 El nodo **solo arranca si puede contactar con Tang**
👉 Evita arranque fuera del perímetro

---

## 🔹 Principios

* Provisioning automático
* Identidad por MAC
* Convergencia desde Git
* Sin dependencia del core en tiempo real

## 🔹 Resultado

Cada nodo:

* Se instala solo
* Se configura solo
* Despliega su stack
* Es reproducible

---

# 📦 Despliegue de Kubernetes

El despliegue de Kubernetes no se define en Ansible.

👉 Se define en **manifests declarativos** dentro del repositorio.

Ejemplo de estructura:

```
manifests/
  k3s-edge/
    bootstrap/
      kustomization.yaml
    metallb/
    ingress/
```

## 🔹 Bootstrap

El bootstrap compone el stack:

```yaml
resources:
  - ../metallb/
  - ../ingress/
```

👉 Añadir un componente = añadir una línea

---

# 🧠 Separación clave

| Capa         | Responsabilidad          |
| ------------ | ------------------------ |
| Provisioning | Instalar nodo            |
| Ansible      | Configurar sistema       |
| Kustomize    | Definir stack Kubernetes |
| Git          | Fuente de verdad         |

---

# 🏗️ Cadena de arranque

InfraServer incluye:

## DHCP (dnsmasq)

* Detecta BIOS / UEFI
* Entrega iPXE

## TFTP

* undionly.kpxe
* ipxe.efi

## HTTP Boot

* Kernel + initrd
* Configuración dinámica

## DNS

* Resolución interna

---

# ⚙️ Principios clave

* Provisioning mínimo
* Seguridad desde el inicio
* Convergencia continua
* Kubernetes declarativo
* Git como fuente de verdad
* Infraestructura reproducible
* Separación de responsabilidades
* Escalabilidad real

---

# 🧠 Resumen

Provisioning inicia el nodo.

Ansible lo convierte en sistema.

Kubernetes despliega la plataforma.

Git define el estado.

👉 Todo reproducible.
👉 Todo automatizado.
👉 Todo escalable.
