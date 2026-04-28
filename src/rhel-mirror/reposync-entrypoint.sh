#!/usr/bin/env bash
set -Eeuo pipefail

log() {
  echo "[$(date '+%F %T')] $*"
}

cleanup() {
  local rc=$?
  log "Cleanup final (rc=${rc})"

  subscription-manager unregister >/dev/null 2>&1 || true
  subscription-manager clean >/dev/null 2>&1 || true
  rm -f /etc/yum.repos.d/redhat.repo || true
  rm -rf /var/cache/dnf/* || true

  exit "${rc}"
}

trap cleanup EXIT

RHSM_USERNAME="${RHSM_USERNAME:-}"
RHSM_PASSWORD="${RHSM_PASSWORD:-}"
RHSM_ORG="${RHSM_ORG:-}"
RHSM_ACTIVATION_KEY="${RHSM_ACTIVATION_KEY:-}"

RELEASEVER="${RELEASEVER:-9}"
ARCH="${ARCH:-x86_64}"
SYNC_ROOT="${SYNC_ROOT:-/content/reposync/rhel/9}"
REPOS="${REPOS:-rhel-9-for-x86_64-baseos-rpms,rhel-9-for-x86_64-appstream-rpms}"

mkdir -p "${SYNC_ROOT}"

log "Registrando contenedor temporalmente"

if [[ -n "${RHSM_ORG}" && -n "${RHSM_ACTIVATION_KEY}" ]]; then
  subscription-manager register \
    --org="${RHSM_ORG}" \
    --activationkey="${RHSM_ACTIVATION_KEY}" \
    --force
elif [[ -n "${RHSM_USERNAME}" && -n "${RHSM_PASSWORD}" ]]; then
  subscription-manager register \
    --username="${RHSM_USERNAME}" \
    --password="${RHSM_PASSWORD}" \
    --force
else
  echo "ERROR: faltan credenciales RHSM"
  exit 1
fi

subscription-manager refresh
subscription-manager repos --disable='*'

IFS=',' read -r -a repo_array <<< "${REPOS}"

for repo in "${repo_array[@]}"; do
  repo="$(echo "$repo" | xargs)"
  [[ -z "$repo" ]] && continue
  log "Habilitando repo $repo"
  subscription-manager repos --enable="$repo"
done

for repo in "${repo_array[@]}"; do
  repo="$(echo "$repo" | xargs)"
  [[ -z "$repo" ]] && continue

  log "Sincronizando $repo"
  reposync \
    --repoid="$repo" \
    --releasever="$RELEASEVER" \
    --arch="$ARCH" \
    --download-path="$SYNC_ROOT" \
    --download-metadata \
    --delete
done

log "Repos sincronizados correctamente"
