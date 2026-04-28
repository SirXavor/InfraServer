export type HostKind = "host";

export interface HostIdentity {
  mac?: string[];
}

export interface HostProvisioning {
  distro: string;
  version: string;
  server?: string;
  luks_passphrase?: string;
  tang_url?: string;
  ubuntu_iso?: string;
  [key: string]: unknown;
}

export interface HostAutomationRepo {
  url: string;
  local_path: string;
  branch: string;
}

export interface HostAutomationApply {
  playbook: string;
  interval: string;
}

export interface HostUser {
  name: string;
  password?: string;
  groups?: string[];
  shell?: string;
  ssh_keys?: string[];
}

export interface NetworkProvisioningIface {
  interface: string;
  route_metric?: number;
  autoconnect?: boolean;
}

export interface NetworkBondOptions {
  miimon?: number;
  updelay?: number;
  downdelay?: number;
  lacp_rate?: string;
  xmit_hash_policy?: string;
}

export interface NetworkBond {
  name: string;
  interfaces: string[];
  mode: string;
  options?: NetworkBondOptions;
}

export interface NetworkBridge {
  name: string;
  method: "manual" | "disabled" | "auto";
  ip4?: string;
  dns4?: string[];
  stp?: boolean;
}

export interface NetworkVlan {
  id: number;
  name: string;
  parent: string;
  bridge?: string;
  ip4?: string;
  gateway4?: string;
  dns4?: string[];
  default_route?: boolean;
  route_metric?: number;
}

export interface HostNetwork {
  provisioning?: NetworkProvisioningIface;
  bond?: NetworkBond;
  bridges?: NetworkBridge[];
  vlans?: NetworkVlan[];
}

export interface HostAutomationVars {
  test_message?: string;
  users?: HostUser[];
  network?: HostNetwork;
  [key: string]: unknown;
}

export interface HostAutomation {
  repo: HostAutomationRepo;
  apply: HostAutomationApply;
  roles: string[];
  vars: HostAutomationVars;
}

export interface AppConfig {
  kind: string;
  enabled: boolean;
  values: Record<string, unknown>;
}

export interface Host {
  id?: string;
  kind: HostKind;
  name: string;
  identity?: HostIdentity;
  profile: string;
  hostname: string;
  provisioning: HostProvisioning;
  automation: HostAutomation;
  apps?: Record<string, AppConfig>;
}