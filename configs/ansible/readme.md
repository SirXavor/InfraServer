# Configuración continua con Ansible

Este módulo se encarga de la **convergencia del sistema (Día 1+)**.

Su función es:

* Aplicar configuración declarativa
* Mantener el estado deseado del sistema
* Ejecutar cambios de forma idempotente
* Permitir evolución continua de la infraestructura

---

# 🧠 Concepto clave

Provisioning instala la máquina.

Ansible la convierte en lo que debe ser.

---

# 🔄 Flujo de ejecución

El sistema funciona así:

1. Provisioning instala el sistema
2. Se arranca el servicio `ansible-sync`
3. Se descarga la configuración del host
4. Se ejecuta el playbook
5. Se aplican roles
6. Se repite periódicamente (timer)

👉 Resultado: sistema siempre convergente

---

# 📁 Estructura del módulo

```
configs/ansible/
├── ansible.cfg
├── playbooks/
│   └── bootstrap.yaml
└── roles/
    └── base-common/
        └── tasks/
            ├── main.yaml
            ├── repo-sync.yaml
            ├── playbook-runner.yaml
            ├── users.yaml
            └── updates.yaml
```

---

# ▶️ Playbook principal

`playbooks/bootstrap.yaml`

```yaml
- name: Bootstrap localhost
  hosts: localhost
  connection: local
  become: true

  tasks:
    - name: Ejecutar roles definidos
      include_role:
        name: "{{ item }}"
      loop: "{{ automation.roles | default([]) }}"
```

👉 No contiene lógica
👉 Solo ejecuta roles

---

# 🧩 Roles

Un **rol** es una unidad reutilizable de configuración.

Ejemplo:

* usuarios
* servicios
* hardening
* paquetes

---

# 🔁 main.yaml

Cada rol tiene un `main.yaml` que define qué tareas ejecutar:

```yaml
- import_tasks: repo-sync.yaml
- import_tasks: playbook-runner.yaml
- import_tasks: users.yaml
- import_tasks: updates.yaml
```

👉 Es el "orquestador interno" del rol

---

# ⚙️ Tipos de tareas actuales

## repo-sync

* Mantiene el repositorio actualizado
* Usa git pull
* Ejecutado por timer systemd

👉 Garantiza código actualizado

---

## playbook-runner

* Ejecuta Ansible periódicamente
* Descarga configuración del host
* Aplica roles

👉 Garantiza convergencia continua

---

## users

* Crea usuarios
* Gestiona contraseñas
* Añade claves SSH

👉 Sustituye configuración manual

---

## updates

* Define actualización automática
* Crea servicio + timer

👉 Ejemplo de "estado + ejecución"

---

# 🔐 Variables

Las variables vienen del provisioning:

```
http://boot.local/ds/<mac>/ansible
```

Ejemplo:

```yaml
automation:
  roles:
    - base-common

  repo:
    url: ...

  apply:
    interval: 1h

  vars:
    users:
      - name: xavor
```

---

# ⚠️ Principios importantes

## Idempotencia

* Ejecutar 1 vez = ejecutar 100 veces
* Resultado siempre igual

---

## Declarativo

No se define *cómo*, sino *qué estado debe existir*

---

## Modularidad

* Cada rol hace una cosa
* Se pueden combinar

---

## Separación de responsabilidades

* provisioning → instalación
* ansible → configuración

---

# 🔄 Servicios systemd

Ansible instala y mantiene:

* `infraserver-repo-sync`
* `infraserver-apply`

👉 Importante:

Provisioning solo hace bootstrap
Ansible es quien mantiene estos servicios

---

# 🧪 Debug

Logs principales:

```bash
cat /var/log/infraserver/apply.log
cat /var/log/infraserver/repo-sync.log
```

Systemd:

```bash
systemctl status infraserver-apply.timer
systemctl status infraserver-repo-sync.timer
```

---

# 🎯 Objetivo

* Infraestructura declarativa
* Configuración reproducible
* Evolución sin reinstalar
* Base para GitOps real

---

# 🧭 Evolución futura

Este módulo permite:

* Hardening STIC en roles
* Instalación de servicios (k3s, etc.)
* Configuración de red avanzada
* Integración con Kubernetes

---

👉 Ansible es el cerebro de la infraestructura
Provisioning solo es el arranque
