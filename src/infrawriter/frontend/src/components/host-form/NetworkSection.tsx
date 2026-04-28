import { useState } from "react";
import type { UseFormWatch, UseFormSetValue } from "react-hook-form";
import type {
  Host,
  HostNetwork,
  NetworkBridge,
  NetworkVlan,
} from "../../features/hosts/host.types";
import BridgeModal from "../common/BridgeModal";
import VlanModal from "../common/VlanModal";

interface Props {
  watch: UseFormWatch<Host>;
  setValue: UseFormSetValue<Host>;
}

const BOND_MODES = [
  "802.3ad",
  "active-backup",
  "balance-rr",
  "balance-xor",
  "broadcast",
  "balance-tlb",
  "balance-alb",
];

export default function NetworkSection({ watch, setValue }: Props) {
  const net: HostNetwork = watch("automation.vars.network") ?? {};

  const [editingBridge, setEditingBridge] = useState<number | null>(null);
  const [addingBridge, setAddingBridge] = useState(false);
  const [editingVlan, setEditingVlan] = useState<number | null>(null);
  const [addingVlan, setAddingVlan] = useState(false);

  function setNet(patch: Partial<HostNetwork>) {
    setValue("automation.vars.network", { ...net, ...patch }, { shouldDirty: true });
  }

  // ── Provisioning iface ────────────────────────────────────
  const prov = net.provisioning;
  function setProv(field: string, value: unknown) {
    setNet({ provisioning: { interface: "", ...prov, [field]: value } });
  }

  // ── Bond ─────────────────────────────────────────────────
  const bond = net.bond;
  const hasBond = !!bond;

  function toggleBond() {
    if (hasBond) {
      const { bond: _b, ...rest } = net;
      setValue("automation.vars.network", rest, { shouldDirty: true });
    } else {
      setNet({ bond: { name: "bond0", interfaces: [], mode: "802.3ad", options: { miimon: 100 } } });
    }
  }

  function setBond(field: string, value: unknown) {
    setNet({ bond: { ...bond!, [field]: value } });
  }

  function setBondOpt(field: string, value: unknown) {
    setNet({ bond: { ...bond!, options: { ...(bond?.options ?? {}), [field]: value } } });
  }

  // ── Bridges ───────────────────────────────────────────────
  const bridges = net.bridges ?? [];

  function saveBridge(index: number, b: NetworkBridge) {
    const next = [...bridges];
    next[index] = b;
    setNet({ bridges: next });
    setEditingBridge(null);
  }

  function addBridge(b: NetworkBridge) {
    setNet({ bridges: [...bridges, b] });
    setAddingBridge(false);
  }

  function removeBridge(index: number) {
    setNet({ bridges: bridges.filter((_, i) => i !== index) });
  }

  // ── VLANs ─────────────────────────────────────────────────
  const vlans = net.vlans ?? [];

  function saveVlan(index: number, v: NetworkVlan) {
    const next = [...vlans];
    next[index] = v;
    setNet({ vlans: next });
    setEditingVlan(null);
  }

  function addVlan(v: NetworkVlan) {
    setNet({ vlans: [...vlans, v] });
    setAddingVlan(false);
  }

  function removeVlan(index: number) {
    setNet({ vlans: vlans.filter((_, i) => i !== index) });
  }

  return (
    <>
      {/* ── Provisioning NIC ── */}
      <section className="editor-section">
        <h3 className="editor-section-title">Interfaz de provisioning</h3>
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Interfaz</label>
            <input
              className="form-input"
              value={prov?.interface ?? ""}
              onChange={(e) => setProv("interface", e.target.value)}
              placeholder="p1p1"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Route metric</label>
            <input
              className="form-input"
              type="number"
              value={prov?.route_metric ?? ""}
              onChange={(e) => setProv("route_metric", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="500"
            />
          </div>
          <div className="form-field form-field--checkbox">
            <label className="form-label form-label--checkbox">
              <input
                type="checkbox"
                checked={prov?.autoconnect ?? false}
                onChange={(e) => setProv("autoconnect", e.target.checked)}
              />
              Autoconnect
            </label>
          </div>
        </div>
      </section>

      {/* ── Bond ── */}
      <section className="editor-section">
        <div className="section-row">
          <h3 className="editor-section-title" style={{ margin: 0 }}>Bonding</h3>
          <label className="net-toggle">
            <input type="checkbox" checked={hasBond} onChange={toggleBond} />
            <span>{hasBond ? "Activado" : "Desactivado"}</span>
          </label>
        </div>

        {hasBond && bond && (
          <div className="form-grid" style={{ marginTop: "0.75rem" }}>
            <div className="form-field">
              <label className="form-label">Nombre</label>
              <input
                className="form-input"
                value={bond.name}
                onChange={(e) => setBond("name", e.target.value)}
                placeholder="bond0"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Interfaces (separadas por coma)</label>
              <input
                className="form-input"
                value={(bond.interfaces ?? []).join(", ")}
                onChange={(e) =>
                  setBond(
                    "interfaces",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="em1, em2"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Modo</label>
              <select
                className="form-input"
                value={bond.mode}
                onChange={(e) => setBond("mode", e.target.value)}
              >
                {BOND_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">miimon (ms)</label>
              <input
                className="form-input"
                type="number"
                value={bond.options?.miimon ?? ""}
                onChange={(e) => setBondOpt("miimon", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="100"
              />
            </div>
            <div className="form-field">
              <label className="form-label">lacp_rate</label>
              <select
                className="form-input"
                value={bond.options?.lacp_rate ?? "fast"}
                onChange={(e) => setBondOpt("lacp_rate", e.target.value)}
              >
                <option value="fast">fast</option>
                <option value="slow">slow</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">xmit_hash_policy</label>
              <select
                className="form-input"
                value={bond.options?.xmit_hash_policy ?? "layer3+4"}
                onChange={(e) => setBondOpt("xmit_hash_policy", e.target.value)}
              >
                <option value="layer2">layer2</option>
                <option value="layer3+4">layer3+4</option>
                <option value="layer2+3">layer2+3</option>
                <option value="encap2+3">encap2+3</option>
                <option value="encap3+4">encap3+4</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* ── Bridges ── */}
      <section className="editor-section">
        <div className="section-row">
          <h3 className="editor-section-title" style={{ margin: 0 }}>Bridges</h3>
          <button type="button" className="btn-add-app" onClick={() => setAddingBridge(true)}>
            + Añadir bridge
          </button>
        </div>

        {bridges.length === 0 ? (
          <p className="sidebar-message" style={{ marginTop: "0.75rem" }}>Sin bridges configurados.</p>
        ) : (
          <div className="user-list">
            {bridges.map((b, i) => (
              <div key={i} className="user-row">
                <div className="user-row-info">
                  <span className="user-row-name">{b.name}</span>
                  <span className="user-row-meta">
                    {b.method}{b.ip4 ? ` · ${b.ip4}` : ""}
                    {b.stp ? " · STP" : ""}
                  </span>
                </div>
                <div className="user-row-actions">
                  <button type="button" className="app-btn-icon" onClick={() => setEditingBridge(i)}>Editar</button>
                  <button type="button" className="app-btn-icon app-btn-icon--danger" onClick={() => removeBridge(i)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── VLANs ── */}
      <section className="editor-section">
        <div className="section-row">
          <h3 className="editor-section-title" style={{ margin: 0 }}>VLANs</h3>
          <button type="button" className="btn-add-app" onClick={() => setAddingVlan(true)}>
            + Añadir VLAN
          </button>
        </div>

        {vlans.length === 0 ? (
          <p className="sidebar-message" style={{ marginTop: "0.75rem" }}>Sin VLANs configuradas.</p>
        ) : (
          <div className="user-list">
            {vlans.map((v, i) => (
              <div key={i} className="user-row">
                <div className="user-row-info">
                  <span className="user-row-name">vlan{v.id} · {v.name}</span>
                  <span className="user-row-meta">
                    {v.parent}{v.bridge ? ` → ${v.bridge}` : ""}
                    {v.ip4 ? ` · ${v.ip4}` : ""}
                    {v.default_route ? " · default route" : ""}
                  </span>
                </div>
                <div className="user-row-actions">
                  <button type="button" className="app-btn-icon" onClick={() => setEditingVlan(i)}>Editar</button>
                  <button type="button" className="app-btn-icon app-btn-icon--danger" onClick={() => removeVlan(i)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editingBridge !== null && (
        <BridgeModal
          bridge={bridges[editingBridge]}
          onSave={(b) => saveBridge(editingBridge, b)}
          onClose={() => setEditingBridge(null)}
        />
      )}
      {addingBridge && (
        <BridgeModal
          bridge={{ name: "", method: "manual", stp: false }}
          title="Nuevo bridge"
          onSave={addBridge}
          onClose={() => setAddingBridge(false)}
        />
      )}

      {editingVlan !== null && (
        <VlanModal
          vlan={vlans[editingVlan]}
          onSave={(v) => saveVlan(editingVlan, v)}
          onClose={() => setEditingVlan(null)}
        />
      )}
      {addingVlan && (
        <VlanModal
          vlan={{ id: 0, name: "", parent: bond?.name ?? "bond0" }}
          title="Nueva VLAN"
          onSave={addVlan}
          onClose={() => setAddingVlan(false)}
        />
      )}
    </>
  );
}
