# Provisioning dinámico con Cloud-Init + perfiles

Este sistema permite generar automáticamente configuraciones `cloud-init` (autoinstall de Ubuntu) a partir de:

* Configuración base
* Perfiles reutilizables
* Overrides por host (MAC)

Todo se compone dinámicamente mediante un servidor Python (Flask) que sirve los datos a los nodos durante el arranque.

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

# 📁 Estructura lógica

Todos los archivos YAML viven en el mismo directorio (`/configs` en el contenedor), pero se diferencian por cabeceras:

## Tipos de documentos

### 1. Base

```yaml
kind: base
name: installer

...contenido cloud-init...
```

Se aplican **todos** los `kind: base` en orden.

---

### 2. Profile

```yaml
kind: profile
name: noswap

...contenido cloud-init...
```

Se aplican solo los perfiles indicados por el host.

Puedes tener múltiples perfiles:

```yaml
kind: profile
name: k3s
```

```yaml
kind: profile
name: hardening
```

---

### 3. Host

```yaml
kind: host
name: aa-bb-cc-dd-ee-ff

profile: noswap
hostname: k3s-master
```

O por defecto:

```yaml
kind: host
name: default

profile: default
hostname: default-node
```

---

# ⚙️ Reglas importantes

## 🔹 `kind`

Define el tipo de documento:

* `base`
* `profile`
* `host`

## 🔹 `name`

* En `host`: MAC (o `default`)
* En `profile`: nombre del perfil
* En `base`: identificador libre

## 🔹 `profile` / `profiles`

Se define **solo en host**:

```yaml
profile: noswap
```

O múltiples:

```yaml
profiles:
  - base
  - noswap
  - hardening
```

⚠️ Nunca dentro de `autoinstall`

---

## 🔹 `hostname`

Se puede definir así:

```yaml
hostname: k3s-master
```

El sistema lo convierte automáticamente en:

```yaml
autoinstall:
  identity:
    hostname: k3s-master
```

---

# 🔀 Cómo funciona el merge

El servidor aplica las siguientes reglas:

* Diccionarios → merge recursivo
* Listas → **sobrescribe** (NO concatena)
* Último valor gana (host > profile > base)

---

# 🌐 Endpoints

## Obtener configuración por MAC

```
http://<server>/ds/<mac>/user-data
```

Ejemplo:

```
http://192.168.1.70:8081/ds/aa-bb-cc-dd-ee-ff/user-data
```

## Metadata

```
http://<server>/ds/<mac>/meta-data
```

---

# 🚀 Flujo completo

1. Máquina arranca por PXE/iPXE
2. Ubuntu installer descarga `user-data`
3. El servidor genera config según:

   * base
   * perfil
   * host
4. Se ejecuta autoinstall

---

# 🧩 Ejemplo práctico

## Base

```yaml
kind: base
name: network

autoinstall:
  network:
    version: 2
    ethernets:
      eth0:
        dhcp4: true
```

## Profile (noswap)

```yaml
kind: profile
name: noswap

autoinstall:
  late-commands:
    - swapoff -a
```

## Host

```yaml
kind: host
name: aa-bb-cc-dd-ee-ff

profile: noswap
hostname: k3s-master
```

---

# 🧪 Debug

Puedes probar qué genera el sistema con:

```bash
curl http://<server>/ds/<mac>/user-data
```

---

# 🎯 Objetivo

Este sistema permite:

* Infraestructura reproducible
* Configuración declarativa
* Escalar fácilmente con nuevos perfiles
* Integración con GitOps (ArgoCD)

---


