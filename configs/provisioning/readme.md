# Provisioning (InfraServer)

Este módulo define cómo se genera la configuración inicial de cada nodo durante el arranque automático.

Su función NO es configurar completamente el sistema.

Su función es:

* Generar configuraciones dinámicas de instalación (cloud-init)
* Identificar cada nodo
* Aplicar una base común segura
* Permitir personalización por perfil y host

---

# 🧠 Concepto clave

El provisioning no describe máquinas.

Describe cómo construir su configuración a partir de capas.

```
BASE → PROFILE(s) → HOST
```

---

# 🧱 Capas de configuración

## 1. Base

Configuración común a todos los nodos.

Incluye:

* Instalación del sistema
* Red mínima
* Hardening inicial
* Automatización básica

Ejemplo:

```
configs/provisioning/base/
```

👉 Es el "mínimo obligatorio"

---

## 2. Profiles

Definen la intención del nodo.

Ejemplos:

* `default`
* `noswap`
* `storage`

Ubicación:

```
configs/provisioning/profiles/
```

👉 Son combinables
👉 No identifican nodos concretos

---

## 3. Hosts

Definen la identidad final del nodo.

Ubicación:

```
configs/provisioning/hosts/
```

Se identifican por:

* MAC (principal)
* fallback: default

Ejemplo:

```
90-host-aa-bb-cc-dd-ee-ff.yaml
```

---

# 🔄 Cómo se construye la configuración

Cuando un nodo arranca:

1. Se identifica por su MAC
2. El servidor devuelve su configuración
3. Se construye dinámicamente:

```
BASE
+ PROFILE(s)
+ HOST
```

👉 Resultado: un único cloud-init final

---

# 🧬 Merge de configuración

El sistema realiza un merge recursivo:

* dict + dict → merge
* list + list → concatenación
* valores simples → sobrescritura

👉 Orden de prioridad:

```
HOST > PROFILE > BASE
```

---

# 📁 Estructura típica

```
configs/provisioning/
├── base/
│   ├── 00-installer.yaml
│   ├── 10-network.yaml
│   └── 20-automation.yaml
│
├── profiles/
│   ├── default/
│   └── noswap/
│
├── hosts/
│   ├── default.yaml
│   └── aa-bb-cc-dd-ee-ff.yaml
│
└── kustomization.yaml
```

---

# 🧾 Archivos de host (lo importante)

Los archivos de host son la pieza clave.

Definen:

* hostname
* perfiles aplicados
* overrides específicos

Ejemplo:

```yaml
hostname: k3s-master
profiles:
  - default
  - k3s
```

---

## 🔹 Qué debe contener un host

Mínimo:

* hostname
* perfiles

Opcional:

* configuración específica
* variables personalizadas

---

## 🔹 default.yaml

Se usa cuando no hay match por MAC.

👉 Permite comportamiento por defecto

---

# ⚙️ Generación de cloud-init

El provisioning genera dinámicamente:

* `user-data`
* `meta-data`

A partir del merge de capas.

👉 No hay archivos finales estáticos
👉 Todo se construye en tiempo de petición

---

# 🔌 Integración con el arranque

El provisioning se expone vía HTTP:

```
http://boot.local/ds/<mac>/user-data
```

Flujo:

1. Nodo arranca por red
2. iPXE carga cloud-init
3. cloud-init consulta endpoint
4. recibe configuración generada

---

# ⚠️ Principios importantes

## No lógica en el instalador

El instalador no decide.

👉 Solo consume configuración

---

## Declarativo

Se define el estado deseado del nodo.

---

## Reutilizable

* base común
* perfiles combinables
* hosts mínimos

---

## Escalable

Permite:

* cientos de nodos
* configuraciones distintas
* mantenimiento sencillo

---

# 🧪 Debug

Para probar un host:

```bash
curl http://boot.local/ds/aa-bb-cc-dd-ee-ff/user-data
```

👉 Permite ver el resultado final del merge

---

# 🎯 Objetivo

* Provisioning mínimo
* Configuración flexible
* Separación total de responsabilidades
* Base para convergencia con Ansible

---

# 🧠 Resumen final

Provisioning no configura máquinas.

Construye configuraciones.

Y las entrega dinámicamente a cada nodo.
