#!/usr/bin/env bash
set -euo pipefail

kubectl rollout restart deployment/infrawriter-api -n infrawriter
kubectl rollout restart deployment/infrawriter-frontend -n infrawriter
