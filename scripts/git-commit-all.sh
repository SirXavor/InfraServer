#!/usr/bin/env bash
# Commits and pushes all changes from innermost submodule out to the root repo.
# Orden: configs/submodulos → configs → catalog → InfraServer → k3s-hermes
# Usage: git-commit-all.sh "commit message"
set -euo pipefail

INFRASERVER_DIR="$(cd "$(dirname "$0")/.." && pwd)"
K3S_DIR="$(cd "$INFRASERVER_DIR/.." && pwd)"

if [ $# -eq 0 ]; then
    echo "Usage: $0 \"commit message\"" >&2
    exit 1
fi

MSG="$1"

commit_and_push() {
    local dir="$1"
    local label="$2"

    echo ""
    echo "=== [$label] ==="

    cd "$dir"

    # Si está en detached HEAD, cambiar a main
    if ! git symbolic-ref --quiet HEAD > /dev/null; then
        echo "  (detached HEAD -> checkout main)"
        git checkout main
    fi

    if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
        echo "  (nada que commitear)"
        return
    fi

    git add -A
    git commit -m "$MSG"
    git push
    echo "  OK"
}

# ── 1. Submodulos anidados dentro de configs ──────────────────────────────────
CONFIGS_DIR="$INFRASERVER_DIR/configs"
if [ -f "$CONFIGS_DIR/.gitmodules" ]; then
    while IFS= read -r subpath; do
        subpath="$(echo "$subpath" | sed 's/^[ \t]*//')"
        full_path="$CONFIGS_DIR/$subpath"
        { [ -d "$full_path/.git" ] || [ -f "$full_path/.git" ]; } && \
            commit_and_push "$full_path" "configs/$subpath"
    done < <(git -C "$CONFIGS_DIR" config --file .gitmodules --get-regexp 'submodule\..*\.path' | awk '{print $2}')
fi

# ── 2. Submodulo configs ──────────────────────────────────────────────────────
commit_and_push "$CONFIGS_DIR" "configs"

# ── 3. Submodulo catalog ──────────────────────────────────────────────────────
commit_and_push "$INFRASERVER_DIR/catalog" "catalog"

# ── 4. InfraServer ───────────────────────────────────────────────────────────
commit_and_push "$INFRASERVER_DIR" "InfraServer"

# ── 5. k3s-hermes (repo externo que contiene InfraServer como submodulo) ──────
commit_and_push "$K3S_DIR" "k3s-hermes"

echo ""
echo "=== Todo subido correctamente ==="
