#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY:-xavor}"
TAG="${TAG:-dev}"

echo "Pushing API image..."
docker push ${REGISTRY}/infrawriter-api:${TAG}

echo "Pushing frontend image..."
docker push ${REGISTRY}/infrawriter:${TAG}

echo "Push complete."
