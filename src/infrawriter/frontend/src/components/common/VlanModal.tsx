import { useState } from "react";
import type { NetworkVlan } from "../../features/hosts/host.types";

interface Props {
  vlan: Partial<NetworkVlan>;
  title?: string;
  onSave: (vlan: NetworkVlan) => void;
  onClose: () => void;
}

export default function VlanModal({ vlan, title, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    id: vlan.id ?? 0,
    name: vlan.name ?? "",
    parent: vlan.parent ?? "",
    bridge: vlan.bridge ?? "",
    ip4: vlan.ip4 ?? "",
    gateway4: vlan.gateway4 ?? "",
    dns4: (vlan.dns4 ?? []).join(", "),
    default_route: vlan.default_route ?? false,
    route_metric: vlan.route_metric ?? "",
  });

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function handleSave() {
    if (!form.name.trim() || !form.parent.trim()) return;
    onSave({
      id: Number(form.id),
      name: form.name.trim(),
      parent: form.parent.trim(),
      ...(form.bridge && { bridge: form.bridge.trim() }),
      ...(form.ip4 && { ip4: form.ip4.trim() }),
      ...(form.gateway4 && { gateway4: form.gateway4.trim() }),
      ...(form.dns4 && {
        dns4: form.dns4.split(",").map((s) => s.trim()).filter(Boolean),
      }),
      ...(form.default_route && { default_route: true }),
      ...(form.route_metric !== "" && { route_metric: Number(form.route_metric) }),
    });
  }

  const isValid = form.name.trim() && form.parent.trim() && form.id > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {title ?? (vlan.name ? `Editar ${vlan.name}` : "Nueva VLAN")}
          </h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">VLAN ID</label>
              <input
                className="form-input"
                type="number"
                value={form.id || ""}
                onChange={(e) => set("id", Number(e.target.value))}
                placeholder="10"
                autoFocus
              />
            </div>
            <div className="form-field">
              <label className="form-label">Nombre</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="vlan10"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Parent (interfaz o bond)</label>
              <input
                className="form-input"
                value={form.parent}
                onChange={(e) => set("parent", e.target.value)}
                placeholder="bond0"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Bridge (opcional)</label>
              <input
                className="form-input"
                value={form.bridge}
                onChange={(e) => set("bridge", e.target.value)}
                placeholder="br-admin"
              />
            </div>
            <div className="form-field">
              <label className="form-label">IP (CIDR)</label>
              <input
                className="form-input"
                value={form.ip4}
                onChange={(e) => set("ip4", e.target.value)}
                placeholder="172.16.30.1/24"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Gateway</label>
              <input
                className="form-input"
                value={form.gateway4}
                onChange={(e) => set("gateway4", e.target.value)}
                placeholder="192.168.99.1"
              />
            </div>
            <div className="form-field">
              <label className="form-label">DNS (separados por coma)</label>
              <input
                className="form-input"
                value={form.dns4}
                onChange={(e) => set("dns4", e.target.value)}
                placeholder="1.1.1.1, 8.8.8.8"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Route metric</label>
              <input
                className="form-input"
                type="number"
                value={form.route_metric}
                onChange={(e) => set("route_metric", e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="form-field form-field--checkbox">
              <label className="form-label form-label--checkbox">
                <input
                  type="checkbox"
                  checked={form.default_route}
                  onChange={(e) => set("default_route", e.target.checked)}
                />
                Ruta por defecto
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn-cancel" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="modal-btn-save"
            onClick={handleSave}
            disabled={!isValid}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
