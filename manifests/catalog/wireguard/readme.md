# 📦 WireGuard Apolo – Guía Operativa (Modo Ultra Manco)

Este repositorio despliega múltiples instancias independientes de WireGuard (wg-easy) en Kubernetes usando **Kustomize**.

⚠️ A partir de ahora **NO se crean overlays a mano**.
Se utiliza el script:

```bash
./make-overlay.sh
```
---

# 🔢 Instancias actuales desplegadas

| Instancia | Host                              | Puerto UDP | Password     |
| --------- | --------------------------------- | ---------- | ------------ |
| 0         | wireguard.apolo.c2et.com          | 51818      | Pozuelo12345 |
| 1         | comgeceu.wireguard.apolo.c2et.com | 51822      | _5le39mP#LQZ |
| 2         | comgemel.wireguard.apolo.c2et.com | 51823      | _8tR42kN#XqL |
| 3         | comgebal.wireguard.apolo.c2et.com | 51824      | _7mQ58xL#RkZ |

---

# 📁 Estructura del proyecto

```
base/
overlays/
  ├── 0
  ├── 1
  ├── 2
  ├── 3
  └── ...
make-overlay.sh
```

---

# 🧱 ¿Qué es cada parte?

## 🔹 base/

Contiene la configuración común:

* Deployment base
* Services
* Ingress (admin y srv)
* Certificate wildcard
* Namespace

⚠️ **NO aplicar nunca `base/` directamente.**
Siempre se aplica un overlay.

---

# 🚀 Crear una nueva instancia (MODO ULTRA MANCO)

## ✅ 1️⃣ Ejecutar el script

Desde la raíz del repo:

```bash
./make-overlay.sh
```

El script preguntará:

1. Número de instancia
2. Puerto UDP
3. Dominio (host del ingress)
4. Password en claro

El script:

* Genera el hash automáticamente
* Crea la carpeta `overlays/N`
* Genera:

  * kustomization.yaml
  * patch.yaml
  * secret.yaml
  * svc-udp.yaml
* Hace un sanity check automático

---

## ✅ 2️⃣ Aplicar la instancia

```bash
kubectl apply -k overlays/N
```

---

## ✅ 3️⃣ Borrar una instancia

```bash
kubectl delete -k overlays/N
```

---

# 🌐 IMPORTANTE – Añadir DNS tras crear una nueva instancia

⚠️ Después de crear una nueva instancia, **hay que añadir su registro DNS interno** en los dos CoreDNS.

Si no se hace esto, la web no resolverá aunque el Ingress esté bien.

---

## 🔹 1️⃣ CoreDNS ADMIN

Editar archivo:

```
coredns-admin/configmaps/coredns-configmap.yaml
```

Añadir línea dentro del bloque correspondiente:

```
192.168.0.100 comgebal.wireguard.apolo.c2et.com
```

Aplicar cambios:

```bash
kubectl apply -f coredns-admin/configmaps/coredns-configmap.yaml
```

---

## 🔹 2️⃣ CoreDNS SRV

Editar archivo:

```
coredns-srv/configmaps/coredns-configmap.yaml
```

Añadir línea:

```
192.168.200.10 comgebal.wireguard.apolo.c2et.com
```

Aplicar cambios:

```bash
kubectl apply -f coredns-srv/configmaps/coredns-configmap.yaml
```

---



# 🌐 Certificados

Se utiliza un único certificado wildcard:

```
*.wireguard.apolo.c2et.com
```

Gestionado automáticamente por cert-manager.

No es necesario crear certificados adicionales.

---

# 🧠 Cómo funciona

* Todas las instancias comparten la IP pública de MetalLB de este despliegue (192.168.0.108)
* Cada instancia usa un puerto UDP diferente
* WG_HOST es siempre `c2et.com`
* Kubernetes redirige el puerto externo al puerto interno
* Cada instancia está aislada por labels
* Cada instancia tiene:

  * 1 Pod
  * 1 Service UDP (LoadBalancer)
  * 1 Service web
  * 2 Ingress (admin y srv)

---

# ✅ Checklist final tras crear instancia nueva

1. `kubectl apply -k overlays/X`
2. Abrir puerto UDP en router/firewall
3. Añadir registro en CoreDNS ADMIN
4. Añadir registro en CoreDNS SRV
5. Verificar:

```bash
kubectl -n wireguard-apolo get pods
kubectl -n wireguard-apolo get svc wg-udp-X
```

El pod debe estar en estado `Running`.
Si el servicio tiene `EXTERNAL-IP 192.168.0.108` y el puerto está abierto → el túnel debe funcionar.


# 🚫 Qué NO hacer
❌ No aplicar `base/` directamente
❌ No reutilizar el mismo puerto UDP
❌ No borrar PVC con usuarios activos
❌ No modificar labels manualmente
❌ No editar overlays a mano (usar el script)

---

# 🧩 Regla de oro

Una carpeta dentro de `overlays/` = una instancia independiente.

Si algo falla:

1. Revisar puerto
2. Revisar host
3. Revisar que el overlay correcto esté aplicado

---

# 🎯 Comando estándar de despliegue

Siempre:

```bash
kubectl apply -k overlays/X
```

Donde `X` es el número de la instancia.

Nada más.
