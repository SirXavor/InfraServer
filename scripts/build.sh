#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY:-xavor}"
TAG="${TAG:-dev}"

echo "Building API image..."
docker build -t ${REGISTRY}/infrawriter-api:${TAG} ./src/infrawriter/backend

echo "Building frontend image..."
docker build -t ${REGISTRY}/infrawriter:${TAG} ./src/infrawriter/frontend

echo "Done."
echo "${REGISTRY}/infrawriter-api:${TAG}"
echo "${REGISTRY}/infrawriter:${TAG}"
