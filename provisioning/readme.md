# Arquitectura de Provisioning

**Objetivo:** provisioning modular compatible con **PXE clásico** y **HTTP Boot**.

## kernel-provisioning

Sirve contenido por **HTTP (nginx)**.

**Contenido:**

* `vmlinuz`
* `initrd`
* `ipxe/boot.ipxe`
* `ipxe/menu.ipxe`
* `ubuntu/user-data`
* `ubuntu/meta-data`

Se expone vía **Ingress** en:

```
boot.local
```

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

# Flujos de arranque soportados

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
