# Provisioning (InfraServer)

Este módulo define cómo se genera la configuración inicial de cada nodo durante el arranque automático.

Su objetivo es dejar el sistema:

* Instalado
* Cifrado
* Identificado
* Conectado
* Preparado para converger con Ansible

👉 No realiza configuración completa del sistema ni instala servicios complejos.

---

# 🧠 Concepto clave

El provisioning no describe máquinas.

Describe cómo construir su configuración a partir de capas:

```
BASE → PROFILE(s) → HOST
```

👉 El resultado es un **cloud-init generado dinámicamente** para cada nodo.

---

# 🧱 Modelo de capas

Cada capa aporta información distinta y tiene una prioridad definida.

## 1. Base

Configuración mínima común a todos los nodos.

Ubicación:

```
configs/provisioning/base/
```

Incluye:

### 🔹 Instalación del sistema (`00-installer.yaml`)

* Parámetros de autoinstall
* Usuario inicial
* Paquetes mínimos
* Configuración del datasource NoCloud
* Preparación para Ansible

### 🔹 Red mínima (`10-network.yaml`)

* Interfaz principal
* DHCP
* Conectividad necesaria para contactar con el servidor

### 🔹 Automatización básica (`20-automation.yaml`)

* Instalación del agente de bootstrap
* Scripts de sincronización
* Timer systemd para convergencia
* Preparación de `/etc/infraserver`

👉 La base es el **mínimo obligatorio** para que cualquier nodo pueda arrancar.

---

## 2. Profiles

Definen la intención del nodo, principalmente a nivel de almacenamiento y cifrado.

Ubicación:

```
configs/provisioning/profiles/
```

* Son combinables
* No identifican nodos concretos

### 🔹 Perfiles disponibles

#### `default-storage`

* Particionado estándar
* LVM
* Cifrado LUKS
* Swap incluida
* Desbloqueo mediante TPM2 o Tang (SSS)

👉 Uso general

---

#### `noswap-storage`

Igual que el anterior, pero:

* Sin swap

👉 Pensado para Kubernetes

---

#### `edge-tang-storage`

Perfil orientado a entornos edge con seguridad estricta:

* Particionado estándar
* LVM
* Cifrado LUKS
* Sin TPM2
* Desbloqueo exclusivamente mediante Tang
* Requiere red en initramfs

👉 El nodo solo arranca si puede contactar con Tang
👉 Evita arranque fuera del perímetro

---

## 3. Hosts

Definen la identidad final del nodo.

Ubicación:

```
configs/provisioning/hosts/
```

### 🔹 Identificación

* Una o varias MAC
* Fallback a `default`

---

### 🔹 Ejemplo

```yaml
kind: host
name: edge-node-17

identity:
  mac:
    - aa-bb-cc-dd-ee-ff
    - 11-22-33-44-55-66

profile: edge-tang-storage
hostname: k3s-master

automation:
  repo:
    url: "https://github.com/SirXavor/InfraServer.git"
    local_path: "/opt/InfraServer"
    branch: "main"

  apply:
    playbook: "playbooks/bootstrap.yaml"
    interval: "1h"

  roles:
    - bootstrap-agent
    - ccn-base

  vars:
    users:
      - name: xavor
        groups: [sudo]
```

---

### 🔹 Qué define un host

* `identity` → MACs del nodo
* `profile` → almacenamiento/cifrado
* `hostname` → nombre del sistema
* `automation` → configuración de Ansible
* `vars` → variables específicas

👉 Es la única parte específica por nodo

---

# 🔄 Construcción de la configuración

Cuando un nodo arranca:

1. iPXE carga kernel e initrd
2. cloud-init consulta:

```
http://boot.local/ds/<mac>/user-data
```

3. El servidor:

* Identifica el host
* Selecciona perfiles
* Aplica base
* Realiza el merge

👉 Resultado: un único cloud-init generado en tiempo real

---

# 🧬 Merge de configuración

Merge recursivo:

* `dict + dict` → merge
* `list + list` → concatenación
* valores simples → sobrescritura

Prioridad:

```
HOST > PROFILE > BASE
```

👉 Permite reutilización + overrides limpios

---

# ⚙️ Endpoints generados

El provisioning expone:

```
/ds/<mac>/user-data
/ds/<mac>/meta-data
/ds/<mac>/ansible
```

### 🔹 Contenido

* `user-data` → cloud-init
* `meta-data` → identidad
* `ansible` → configuración de convergencia

---

# 🔌 Integración con el arranque

Flujo completo:

```
PXE → iPXE → kernel/initrd → cloud-init → instalación → primer arranque
```

👉 El provisioning no ejecuta lógica compleja
👉 Solo entrega configuración declarativa

---

# ⚠️ Principios clave

## Declarativo

Se define el estado deseado.

---

## Sin lógica en el instalador

El instalador no decide.

---

## Reutilizable

* Base común
* Perfiles combinables
* Hosts mínimos

---

## Escalable

* Diseñado para muchos nodos
* Diferencias gestionadas por YAML

---

# 🧪 Debug

Ver configuración final:

```bash
curl http://boot.local/ds/aa-bb-cc-dd-ee-ff/user-data
```

Ver hosts cargados:

```bash
curl http://boot.local/debug/hosts
```

---

# 🎯 Objetivo del módulo

* Provisioning mínimo
* Seguridad desde el arranque
* Configuración declarativa
* Perfiles reutilizables
* Identidad determinista
* Base para convergencia con Ansible

---

# 🧠 Resumen final

El provisioning no configura el sistema final.

Construye su configuración inicial combinando:

```
BASE + PROFILE(s) + HOST
```

Y la entrega dinámicamente durante el arranque.
