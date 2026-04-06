# Configuración continua con Ansible (InfraServer)

Este módulo define cómo los nodos pasan de un sistema recién instalado a un sistema **totalmente configurado, mantenido y convergente en el tiempo**.

No es un "script de instalación".
Es un **sistema de convergencia continua**.

---

# 🧠 Idea clave

Provisioning instala lo mínimo imprescindible.

Ansible construye el sistema real.

---

# 🧭 Filosofía

Este diseño sigue un principio simple:

> El sistema no se configura una vez.
> Se corrige continuamente hasta alcanzar (y mantener) el estado deseado.

Esto permite:

* Reproducibilidad
* Corrección automática de drift
* Evolución sin reinstalar

---

# 🔄 Flujo completo

1. Provisioning (cloud-init)

   * Instala sistema base
   * Configura red mínima
   * Aplica cifrado / requisitos CCN
   * Instala agente básico

2. Arranque del sistema

3. Se activa `ansible-sync`

4. El nodo:

   * Descarga configuración desde el servidor
   * Sincroniza el repositorio
   * Ejecuta Ansible

5. Se aplican roles

6. Se repite periódicamente

👉 Resultado: sistema **autocorregido continuamente**

---

# 📦 Qué hace realmente Ansible

Ansible NO instala el sistema.

Ansible:

* Aplica configuración declarativa
* Mantiene el estado del sistema
* Corrige desviaciones
* Ejecuta cambios de forma idempotente

---

# 📁 Estructura real del módulo

```
configs/ansible/
├── ansible.cfg
├── playbooks/
│   └── bootstrap.yaml
└── roles/
    ├── bootstrap-agent/
    └── ccn-base/
```

---

# ▶️ Playbook principal

`playbooks/bootstrap.yaml`

Este playbook es intencionadamente simple:

* No contiene lógica
* No contiene decisiones
* Solo ejecuta roles

Funciona como un "dispatcher":

```
automation.roles → lista de roles a ejecutar
```

---

# 🧩 Roles

Los roles son el núcleo del sistema.

Cada rol:

* Implementa una capacidad concreta
* Es reutilizable
* Es independiente

Ejemplos reales:

## bootstrap-agent

Responsable de:

* Sincronizar repositorio
* Ejecutar Ansible periódicamente
* Instalar servicios systemd

👉 Es el "motor de convergencia"

---

## ccn-base

Responsable de hardening del sistema:

* PAM
* SSH
* auditd
* sysctl
* servicios
* crypto
* bootloader
* antimalware
* usbguard
* updates

👉 Es la "línea base de seguridad"

---

# 🔁 Orquestación interna

Cada rol tiene un `main.yaml` que define el orden de ejecución.

Ejemplo típico:

```yaml
- import_tasks: pam.yaml
- import_tasks: ssh.yaml
- import_tasks: auditd.yaml
```

👉 Esto permite:

* Modularidad
* Orden controlado
* Separación por capacidades

---

# ⚙️ Servicios que crea el sistema

El sistema instala y mantiene:

## ansible-sync

Wrapper que ejecuta:

1. Sincronización del repositorio
2. Ejecución de Ansible

---

## ansible-repo-sync

* Hace clone/pull del repositorio
* Garantiza código actualizado

---

## ansible-apply

* Descarga configuración del host
* Ejecuta playbook

---

## Timer

* Ejecuta el ciclo periódicamente
* Mantiene la convergencia

---

# 🔐 Variables (configuración dinámica)

Cada nodo obtiene su configuración desde:

```
http://boot.local/ds/<mac>/ansible
```

Ejemplo:

```yaml
automation:
  roles:
    - ccn-base
    - bootstrap-agent

  repo:
    url: ...

  apply:
    interval: 1h

users:
  - name: xavor
```

👉 Importante:

* La lógica está en el repo
* La configuración está fuera

---

# ⚠️ Principios clave

## Idempotencia

Ejecutar 1 o 100 veces produce el mismo resultado.

---

## Declarativo

Se define el estado deseado, no los pasos.

---

## Modularidad

Cada rol resuelve un problema concreto.

---

## Separación de responsabilidades

* Provisioning → arranque mínimo
* Ansible → sistema completo

---

# 🧪 Debug

Logs:

```bash
/var/log/infraserver/apply.log
/var/log/infraserver/repo-sync.log
```

Systemd:

```bash
systemctl status ansible-sync.timer
systemctl status ansible-sync.service
```

---

# 🎯 Qué consigues con este modelo

* Sistemas reproducibles
* Infraestructura declarativa
* Cambios controlados desde Git
* Sin necesidad de reinstalar

---

# 🚀 Hacia dónde evoluciona

Este modelo permite escalar a:

* GitOps completo
* Edge computing autónomo
* Despliegues masivos
* Integración con Kubernetes

---

# 🧠 Resumen final

Provisioning enciende el nodo.

Ansible lo convierte en infraestructura.

Y lo mantiene así continuamente.
