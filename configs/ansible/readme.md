# Configuración continua con Ansible (InfraServer)

Este módulo define cómo los nodos pasan de un sistema recién instalado a un sistema **totalmente configurado, seguro y convergente en el tiempo**.

No es un script de instalación.
Es un **sistema de convergencia continua**.

---

# 🧠 Idea clave

Provisioning instala lo mínimo imprescindible.

Ansible construye el sistema real y lo mantiene.

---

# 🧭 Filosofía

Principio fundamental:

> El sistema no se configura una vez.
> Se corrige continuamente hasta alcanzar (y mantener) el estado deseado.

Esto permite:

* Reproducibilidad
* Corrección automática de drift
* Evolución sin reinstalar
* Operación continua en entornos edge

---

# 🔄 Flujo completo

1. **Provisioning (cloud-init)**

   * Instalación del sistema
   * Red mínima
   * Cifrado y requisitos CCN/STIC
   * Instalación del agente de bootstrap

2. **Primer arranque**

3. **Activación de `ansible-sync`**

4. El nodo:

   * Descarga configuración dinámica
   * Sincroniza el repositorio
   * Ejecuta Ansible

5. Se aplican roles

6. El proceso se repite periódicamente

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

# 📁 Estructura del módulo

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

Diseñado como dispatcher:

* Sin lógica
* Sin decisiones
* Solo ejecuta roles

Fuente de verdad:

```
automation.roles
```

---

# 🧩 Roles

Los roles son el núcleo del sistema.

Cada rol:

* Implementa una capacidad concreta
* Es reutilizable
* Es independiente

---

## 🔹 bootstrap-agent

Responsable de:

* Sincronizar el repositorio
* Ejecutar Ansible periódicamente
* Instalar servicios systemd (`ansible-sync`)

👉 Es el **motor de convergencia**

---

## 🔹 ccn-base

Responsable de la línea base de seguridad alineada con CCN/STIC:

* PAM (políticas de autenticación)
* SSH (endurecimiento y control de acceso)
* auditd (auditoría)
* sysctl (hardening kernel/red)
* servicios (reducción de superficie de ataque)
* crypto (políticas criptográficas)
* bootloader (protección GRUB)
* antimalware (ClamAV, AppArmor)
* usbguard (control de dispositivos)
* updates (actualización automática)

👉 Es la **baseline de seguridad del sistema**

---

# 🔁 Orquestación interna

Cada rol define su orden mediante `main.yaml`:

```yaml
- import_tasks: pam.yaml
- import_tasks: ssh.yaml
- import_tasks: auditd.yaml
```

👉 Permite:

* Modularidad
* Orden controlado
* Separación por capacidades

---

# ⚙️ Servicios del sistema

## ansible-sync

Wrapper principal:

1. Sincroniza repositorio
2. Ejecuta Ansible

---

## ansible-repo-sync

* Clone / pull del repositorio
* Garantiza código actualizado

---

## ansible-apply

* Descarga configuración del host
* Ejecuta el playbook

---

## Timer systemd

* Ejecuta el ciclo periódicamente
* Mantiene convergencia continua

---

# 🔐 Configuración dinámica

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

👉 Principio clave:

* Código → en Git
* Configuración → externa y dinámica

---

# 🛡️ Estado de implementación de seguridad

| Componente   | Implementado | Validado | Notas                    |
| ------------ | ------------ | -------- | ------------------------ |
| PAM          | ✔            | ✔        | Políticas completas      |
| SSH          | ✔            | ✔        | Sin password login       |
| auditd       | ✔            | ✔        | Reglas CCN               |
| sysctl       | ✔            | ✔        | Hardening kernel         |
| servicios    | ✔            | ✔        | Reducción superficie     |
| crypto       | ✔            | ⚠        | Nivel 2 validado         |
| bootloader   | ✔            | ✔        | Protección GRUB          |
| antimalware  | ✔            | ⚠        | Pendiente tuning         |
| usbguard     | ✔            | ⚠        | Reglas iniciales         |
| updates      | ✔            | ✔        | Automático               |
| firewall     | ❌            | ❌        | Pendiente implementación |
| red avanzada | ❌            | ❌        | Pendiente diseño final   |

👉 Este bloque crecerá conforme evolucione el sistema.

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

# 🎯 Qué aporta este modelo

* Sistemas reproducibles
* Infraestructura declarativa
* Corrección automática de desviaciones
* Sin necesidad de reinstalar

---

# 🚀 Evolución prevista

Este módulo está diseñado para crecer hacia:

* Nuevos roles (firewall, networking, observabilidad)
* Endurecimiento adicional CCN/STIC
* Integración completa con Kubernetes
* Edge autónomo a gran escala

---

# 🧠 Resumen final

Provisioning enciende el nodo.

Ansible lo convierte en infraestructura.

Y lo mantiene así continuamente.
