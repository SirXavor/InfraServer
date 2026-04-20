#!/usr/bin/env bash
set -euo pipefail

# --- helpers ---
die() { echo "ERROR: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Falta '$1' en PATH"; }

need htpasswd
need kustomize

ROOT_DIR="$(pwd)"
BASE_DIR="${ROOT_DIR}/base"
OVERLAYS_DIR="${ROOT_DIR}/overlays"

[[ -d "$BASE_DIR" ]] || die "No existe ${BASE_DIR}. Ejecuta el script desde la raíz del repo (donde está ./base y ./overlays)."
mkdir -p "$OVERLAYS_DIR"

echo "=== Crear overlay wg-apolo ==="

read -r -p "Índice de instancia (N): " IDX
[[ "$IDX" =~ ^[0-9]+$ ]] || die "Índice inválido: '$IDX' (usa un número)"

TARGET_DIR="${OVERLAYS_DIR}/${IDX}"
if [[ -e "$TARGET_DIR" ]]; then
  die "Ya existe ${TARGET_DIR}. Borra/renombra antes o elige otro índice."
fi

read -r -p "Puerto WireGuard UDP/WG_PORT (ej: 51818): " PORT
[[ "$PORT" =~ ^[0-9]+$ ]] || die "Puerto inválido: '$PORT'"
(( PORT >= 1 && PORT <= 65535 )) || die "Puerto fuera de rango: $PORT"

read -r -p "Dominio/host de la instancia (ej: ${IDX}.wireguard.apolo.c2et.com): " HOST
[[ -n "$HOST" ]] || die "Host vacío"

# Password sin eco
read -r -s -p "Password en claro (no se mostrará): " PASS
echo
[[ -n "$PASS" ]] || die "Password vacío"

read -r -s -p "Repite password: " PASS2
echo
[[ "$PASS" == "$PASS2" ]] || die "Las passwords no coinciden"

HASH="$(htpasswd -nbBC 10 "" "$PASS" | cut -d ":" -f 2 | tr -d '\n')"
[[ -n "$HASH" ]] || die "No se pudo generar el hash"

# Crear estructura
mkdir -p "$TARGET_DIR"

# --- write files ---
cat > "${TARGET_DIR}/kustomization.yaml" <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base
  - svc-udp.yaml
  - secret.yaml

nameSuffix: "-${IDX}"

patchesStrategicMerge:
  - patch.yaml

patches:
  - target:
      group: networking.k8s.io
      version: v1
      kind: Ingress
      name: wg-web-admin
      namespace: wireguard-apolo
    patch: |-
      - op: replace
        path: /spec/tls/0/hosts/0
        value: ${HOST}
      - op: replace
        path: /spec/rules/0/host
        value: ${HOST}

  - target:
      group: networking.k8s.io
      version: v1
      kind: Ingress
      name: wg-web-srv
      namespace: wireguard-apolo
    patch: |-
      - op: replace
        path: /spec/tls/0/hosts/0
        value: ${HOST}
      - op: replace
        path: /spec/rules/0/host
        value: ${HOST}
EOF

cat > "${TARGET_DIR}/patch.yaml" <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wg-apolo
  namespace: wireguard-apolo
spec:
  selector:
    matchLabels:
      app: wg-apolo-${IDX}
  template:
    metadata:
      labels:
        app: wg-apolo-${IDX}
    spec:
      containers:
      - name: wg-easy
        env:
        - name: PASSWORD_HASH
          valueFrom:
            secretKeyRef:
              name: wg-apolo-secret-${IDX}
              key: PASSWORD_HASH
        - name: WG_HOST
          value: "c2et.com"
        - name: WG_PORT
          value: "${PORT}"
      volumes:
      - name: config
        persistentVolumeClaim:
          claimName: wg-apolo-config-${IDX}
---
apiVersion: v1
kind: Service
metadata:
  name: wg-apolo-web
  namespace: wireguard-apolo
spec:
  selector:
    app: wg-apolo-${IDX}
EOF

cat > "${TARGET_DIR}/secret.yaml" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: wg-apolo-secret
  namespace: wireguard-apolo
type: Opaque
stringData:
  PASSWORD_HASH: "${HASH}"
EOF

cat > "${TARGET_DIR}/svc-udp.yaml" <<EOF
apiVersion: v1
kind: Service
metadata:
  name: wg-udp
  namespace: wireguard-apolo
  annotations:
    metallb.universe.tf/allow-shared-ip: wireguard-apolo-shared
spec:
  type: LoadBalancer
  loadBalancerIP: 192.168.0.108
  selector:
    app: wg-apolo-${IDX}
  ports:
    - name: wireguard
      protocol: UDP
      port: ${PORT}
      targetPort: ${PORT}
EOF

echo
echo "✅ Overlay creado en: ${TARGET_DIR}"
echo

echo "=== Sanity check (build) ==="
kustomize build "${TARGET_DIR}" | grep -nE 'kind: Ingress|name: wg-web-|host:|kind: Service|name: wg-udp|port: '"${PORT}"'' || true

echo
echo "Para aplicar:"
echo "  kubectl apply -k overlays/${IDX}"
echo
echo "Para borrar:"
echo "  kubectl delete -k overlays/${IDX}"
