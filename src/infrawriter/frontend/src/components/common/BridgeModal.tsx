import { useState } from "react";
import type { NetworkBridge } from "../../features/hosts/host.types";

interface Props {
  bridge: Partial<NetworkBridge>;
  title?: string;
  onSave: (bridge: NetworkBridge) => void;
  onClose: () => void;
}

export default function BridgeModal({ bridge, title, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: bridge.name ?? "",
    method: bridge.method ?? "manual",
    ip4: bridge.ip4 ?? "",
    dns4: (bridge.dns4 ?? []).join(", "),
    stp: bridge.stp ?? false,
  });

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function handleSave() {
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      method: form.method as NetworkBridge["method"],
      ...(form.ip4 && { ip4: form.ip4.trim() }),
      ...(form.dns4 && {
        dns4: form.dns4.split(",").map((s) => s.trim()).filter(Boolean),
      }),
      stp: form.stp,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {title ?? (bridge.name ? `Editar ${bridge.name}` : "Nuevo bridge")}
          </h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Nombre</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="br-admin"
                autoFocus
              />
            </div>
            <div className="form-field">
              <label className="form-label">Método</label>
              <select
                className="form-input"
                value={form.method}
                onChange={(e) => set("method", e.target.value)}
              >
                <option value="manual">manual</option>
                <option value="auto">auto (DHCP)</option>
                <option value="disabled">disabled</option>
              </select>
            </div>
            {form.method !== "disabled" && (
              <>
                <div className="form-field">
                  <label className="form-label">IP (CIDR)</label>
                  <input
                    className="form-input"
                    value={form.ip4}
                    onChange={(e) => set("ip4", e.target.value)}
                    placeholder="172.16.10.1/24"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">DNS (separados por coma)</label>
                  <input
                    className="form-input"
                    value={form.dns4}
                    onChange={(e) => set("dns4", e.target.value)}
                    placeholder="172.16.10.10, 1.1.1.1"
                  />
                </div>
              </>
            )}
            <div className="form-field form-field--checkbox">
              <label className="form-label form-label--checkbox">
                <input
                  type="checkbox"
                  checked={form.stp}
                  onChange={(e) => set("stp", e.target.checked)}
                />
                STP
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
            disabled={!form.name.trim()}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
