# Provisioning dinámico con Cloud-Init + perfiles

Este sistema permite generar automáticamente configuraciones `cloud-init` (autoinstall de Ubuntu) a partir de:

* Configuración base
* Perfiles reutilizables
* Overrides por host (MAC)

Además, forma parte de una **arquitectura completa de provisioning**, incluyendo arranque por red (PXE / HTTP Boot).

---

# 🧠 Concepto general

La configuración final se construye así:

```
BASE → PROFILE(s) → HOST
```

* **Base**: configuración común a todos los nodos
* **Profiles**: comportamientos opcionales (ej: `noswap`, `default`, `k3s`, etc.)
* **Host**: personalización final (hostname, selección de perfil, etc.)

---

# 🏗️ Arquitectura de Provisioning

**Objetivo:** provisioning modular compatible con **PXE clásico** y **HTTP Boot**.

## kernel-provisioning

Sirve contenido por **HTTP (nginx)**.

**Contenido:**

* `vmlinuz`
* `initrd`
* `ipxe/boot.ipxe`
* `ipxe/menu.ipxe`
* `ds/<mac>/user-data`
* `ds/<mac>/meta-data`

Se expone vía **Ingress** en:

```
boot.local
```

Este componente incluye el servidor Python que genera dinámicamente el `cloud-init`.

---

## tftp-provisioning

Sirve contenido por **TFTP (xinetd + tftp-hpa)**.

**Contenido:**

* `undionly.kpxe` → BIOS PXE → iPXE
* `ipxe.efi` → UEFI PXE → iPXE

Se expone mediante:

```
hostPort: 69/udp
```

(en el nodo del cluster).

---

# 🔄 Flujos de arranque soportados

## PXE clásico (BIOS / UEFI)

```
DHCP
  → TFTP (undionly.kpxe / ipxe.efi)
  → iPXE
  → HTTP (boot.local/ipxe/boot.ipxe)
  → autoinstall
```

## HTTP Boot (UEFI)

```
UEFI
  → http://boot.local/ipxe/boot.ipxe
  → autoinstall
```

---

# 📁 Modelo de configuración

Todos los YAML viven juntos, pero se diferencian por cabeceras.

## Tipos de documentos

### 1. Base

```yaml
kind: base
name: installer

...contenido cloud-init...
```

Se aplican **todos** los `kind: base`.

---

### 2. Profile

```yaml
kind: profile
name: noswap

...contenido cloud-init...
```

Se aplican solo si el host los referencia.

---

### 3. Host

```yaml
kind: host
name: aa-bb-cc-dd-ee-ff

profile: noswap
hostname: k3s-master
```

---

# ⚙️ Reglas importantes

## 🔹 `kind`

* `base`
* `profile`
* `host`

## 🔹 `name`

* Host → MAC o `default`
* Profile → nombre lógico
* Base → identificador libre

## 🔹 `profile` / `profiles`

Solo en host:

```yaml
profile: noswap
```

O múltiples:

```yaml
profiles:
  - default
  - noswap
```

⚠️ Nunca dentro de `autoinstall`

---

## 🔹 `hostname`

```yaml
hostname: k3s-master
```

Se traduce automáticamente a:

```yaml
autoinstall:
  identity:
    hostname: k3s-master
```

---

# 🔀 Merge de configuración

Orden de aplicación:

1. Base
2. Profiles
3. Host

Reglas:

* Dict → merge recursivo
* List → sobrescribe
* Último gana

---

# 🔐 Esquema de seguridad

El sistema aplica por defecto:

* Disco cifrado con LUKS
* LVM segmentado (`/`, `/var`, `/var/log`, `/tmp`, etc.)
* Integración con **Clevis (TPM2 + Tang)**

Este esquema sigue las directrices de:

**CCN-STIC-610-25**
*Perfilado de seguridad para Distribuciones Linux*

Objetivos:

* Protección de datos en reposo
* Separación de logs y temporales
* Preparación para entornos críticos

---

# 🌐 Red inicial

La configuración base incluye:

```yaml
autoinstall:
  network:
    version: 2
    ethernets:
      eth0:
        dhcp4: true
```

Objetivo:

* Arranque rápido
* Conectividad mínima
* Delegar configuración avanzada a Ansible

---

# 🌐 Endpoints

## User-data

```
http://<server>/ds/<mac>/user-data
```

## Meta-data

```
http://<server>/ds/<mac>/meta-data
```

---

# 🚀 Flujo completo

1. Máquina arranca por red
2. Carga iPXE
3. Descarga `boot.ipxe`
4. Lanza kernel + initrd
5. Ubuntu descarga `cloud-init`
6. Se genera config dinámica
7. Se instala el sistema

---

# 🧪 Debug

```bash
curl http://<server>/ds/<mac>/user-data
```

---

# 🎯 Objetivo

Este sistema permite:

* Provisioning totalmente automatizado
* Seguridad desde el arranque
* Escalabilidad mediante perfiles
* Integración con Kubernetes + GitOps

---

# 🧭 Siguiente paso

Integración con **Ansible** para postconfiguración automática
