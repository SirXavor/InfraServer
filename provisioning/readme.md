# Provisioning dinámico con Cloud-Init

Este módulo se encarga exclusivamente de la **instalación del sistema operativo (Día 0)**.

Su función es preparar la máquina con:

* Sistema base instalado
* Red mínima funcional
* Disco configurado (LUKS + LVM)
* Acceso inicial (SSH)
* Bootstrap de Ansible

A partir de ese momento, **toda la configuración evolutiva pasa a Ansible (Día 1+)**.

---

# 🧠 Concepto general

La configuración `cloud-init` se construye dinámicamente mediante:

```
BASE → PROFILE(s) → HOST
```

* **Base**: configuración común obligatoria
* **Profiles**: variaciones reutilizables (ej: storage)
* **Host**: personalización final (hostname, roles, etc.)

👉 Este sistema SOLO define el estado inicial.

---

# ⚠️ Responsabilidades de provisioning vs Ansible

## 🔹 Provisioning (este módulo)

Debe encargarse únicamente de:

* Instalación del sistema
* Configuración de disco
* Configuración mínima de red
* Acceso SSH
* Arranque de Ansible

## 🔹 Ansible (configs/ansible)

Debe encargarse de:

* Usuarios
* Hardening
* Paquetes
* Servicios
* Configuración continua
* Automatización periódica

👉 Regla clave:

> Si algo puede cambiar con el tiempo → va en Ansible

---

# 🏗️ Arquitectura de Provisioning

Este módulo forma parte de una arquitectura mayor de arranque por red.

## kernel-provisioning

Sirve contenido por HTTP.

Contenido:

* Kernel (`vmlinuz`)
* Initrd (`initrd`)
* Scripts iPXE
* Endpoints dinámicos de cloud-init

Endpoints:

```
http://boot.local/ds/<mac>/user-data
http://boot.local/ds/<mac>/meta-data
```

Incluye el servidor que genera configuraciones dinámicas.

---

## tftp-provisioning

Sirve arranque PXE clásico.

Contenido:

* `undionly.kpxe`
* `ipxe.efi`

---

# 🔄 Flujos de arranque

## PXE clásico

```
DHCP
→ TFTP
→ iPXE
→ HTTP
→ autoinstall
```

## HTTP Boot

```
UEFI
→ HTTP
→ autoinstall
```

---

# 📁 Modelo de configuración

Todos los YAML se combinan dinámicamente.

## Tipos de documentos

### Base

```yaml
kind: base
name: installer
```

Se aplican todos.

---

### Profile

```yaml
kind: profile
name: noswap
```

Se aplican según el host.

---

### Host

```yaml
kind: host
name: aa-bb-cc-dd-ee-ff

profile: noswap
hostname: k3s-master
```

---

# ⚙️ Reglas

## kind

* base
* profile
* host

## name

* Host → MAC o default
* Profile → nombre lógico
* Base → libre

## profiles

```yaml
profiles:
  - default
  - noswap
```

---

# 🔀 Merge

Orden:

1. Base
2. Profiles
3. Host

Reglas:

* Dict → merge
* List → sobrescribe
* Último gana

---

# 🔐 Almacenamiento

Provisioning define completamente el disco:

* GPT
* LUKS
* LVM
* Separación de volúmenes

👉 Esto NO debe moverse a Ansible

---

# 🌐 Red

Configuración mínima:

```yaml
eth0:
  dhcp4: true
```

👉 Todo lo avanzado va en Ansible

---

# 🚀 Bootstrap de Ansible

Provisioning instala y lanza el sistema de convergencia:

* Instala dependencias (ansible, git)
* Clona el repositorio
* Define configuración base (`/etc/infraserver/bootstrap.env`)
* Arranca el servicio `ansible-sync`

👉 Este servicio es el puente entre Día 0 y Día 1

---

# 🚀 Flujo completo

1. Arranque por red
2. Descarga kernel/initrd
3. Cloud-init dinámico
4. Instalación del sistema
5. Arranque de Ansible
6. Convergencia del sistema

---

# 🧪 Debug

```bash
curl http://boot.local/ds/<mac>/user-data
```

---

# 🎯 Objetivo

* Instalación reproducible
* Seguridad desde el inicio
* Separación clara de responsabilidades
* Base para automatización completa

---

# 🧭 Relación con otros módulos

* `configs/ansible` → configuración continua
* `provisioning/` → servicios de arranque
* `dnsmasq/` → DHCP
* `coredns/` → resolución

---

👉 Este módulo no configura sistemas: los prepara para ser configurados.
