#!/usr/bin/env bash
# Commits and pushes all changes from innermost submodule out to the root repo.
# Usage: git-commit-all.sh "commit message"
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ $# -eq 0 ]; then
    echo "Usage: $0 \"commit message\"" >&2
    exit 1
fi

MSG="$1"

commit_and_push() {
    local dir="$1"
    local label="$2"

    echo ""
    echo "=== [$label] $dir ==="

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
CONFIGS_DIR="$ROOT_DIR/configs"
if [ -f "$CONFIGS_DIR/.gitmodules" ]; then
    while IFS= read -r subpath; do
        subpath="$(echo "$subpath" | sed 's/^[ \t]*//')"
        full_path="$CONFIGS_DIR/$subpath"
        [ -d "$full_path/.git" ] || [ -f "$full_path/.git" ] && \
            commit_and_push "$full_path" "configs/$subpath"
    done < <(git -C "$CONFIGS_DIR" config --file .gitmodules --get-regexp 'submodule\..*\.path' | awk '{print $2}')
fi

# ── 2. Submodulo configs ──────────────────────────────────────────────────────
commit_and_push "$CONFIGS_DIR" "configs"

# ── 3. Repo raíz ─────────────────────────────────────────────────────────────
commit_and_push "$ROOT_DIR" "root"

echo ""
echo "=== Todo subido correctamente ==="
