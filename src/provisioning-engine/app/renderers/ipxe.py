from typing import Any, Dict

from renderers.common import build_render_context, render_templates


def infer_installer(distro: str) -> str:
    distro = str(distro).strip().lower()

    if distro == "ubuntu":
        return "autoinstall"

    if distro in {"rhel", "rocky", "almalinux", "centos"}:
        return "kickstart"

    return "unknown"


def render_unknown_menu(cfg: Dict[str, Any]) -> str:
    template = """#!ipxe
dhcp

menu InfraServer Provisioning
item --key u ubuntu  Instalar Ubuntu
item --key r rhel    Instalar RHEL
item --key s shell   iPXE shell
choose --default ubuntu --timeout 5000 target && goto ${target}

:ubuntu
kernel http://{{ ds_host }}/vmlinuz ip=dhcp url=http://{{ ds_host }}/content/ubuntu/{{ provisioning.ubuntu_iso }} autoinstall ds=nocloud;s=http://{{ ds_host }}/ds/default/ ---
initrd http://{{ ds_host }}/initrd
boot

:rhel
kernel http://{{ ds_host }}/content/rhel/{{ provisioning.version }}/images/pxeboot/vmlinuz ip=dhcp inst.repo=http://{{ ds_host }}/content/repos/rhel/{{ provisioning.version }}/ inst.ks=http://{{ ds_host }}/ks/default.cfg
initrd http://{{ ds_host }}/content/rhel/{{ provisioning.version }}/images/pxeboot/initrd.img
boot

:shell
shell
"""
    return render_templates(template, build_render_context(cfg))


def render_host_boot(mac: str, cfg: Dict[str, Any]) -> str:
    provisioning = cfg.get("provisioning", {})
    distro = str(provisioning.get("distro", "ubuntu")).strip().lower()
    version = str(provisioning.get("version", "9")).strip()

    installer = infer_installer(distro)

    if distro == "ubuntu":
        template = """#!ipxe
dhcp
kernel http://{{ ds_host }}/vmlinuz ip=dhcp url=http://{{ ds_host }}/content/ubuntu/{{ provisioning.ubuntu_iso }} autoinstall ds=nocloud;s=http://{{ ds_host }}/ds/{{ mac }}/ ---
initrd http://{{ ds_host }}/initrd
boot
"""
        return render_templates(template, {**build_render_context(cfg), "mac": mac})

    if installer == "kickstart":
        template = """#!ipxe
dhcp
kernel http://{{ ds_host }}/content/{{ provisioning.distro }}/{{ provisioning.version }}/images/pxeboot/vmlinuz ip=dhcp inst.repo=http://{{ ds_host }}/content/repos/{{ provisioning.distro }}/{{ provisioning.version }}/ inst.ks=http://{{ ds_host }}/ks/{{ mac }}.cfg
initrd http://{{ ds_host }}/content/{{ provisioning.distro }}/{{ provisioning.version }}/images/pxeboot/initrd.img
boot
"""
        return render_templates(template, {**build_render_context(cfg), "mac": mac})

    return render_unknown_menu(cfg)