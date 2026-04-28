import re
from pathlib import Path

from app.services.git_service import GitService
from config import settings

_KUSTOMIZATION_PATH = "provisioning/kustomization.yaml"
_HOSTS_COMMENT = "      # Hosts"
_HOST_LINE_PREFIX = "      - hosts/"


class KustomizationService:
    def __init__(self):
        self.repo_path = Path(settings.git_configs_repo_path)
        self.kustomization_file = self.repo_path / _KUSTOMIZATION_PATH
        self.git = GitService(
            repo_path=settings.git_configs_repo_path,
            branch=settings.git_branch,
            user_name=settings.git_user_name,
            user_email=settings.git_user_email,
        )

    def _ensure_repo(self) -> None:
        self.git.clone_if_needed(settings.git_configs_url, token=settings.git_token)
        self.git.sync()

    def _host_entry(self, mac: str) -> str:
        return f"{_HOST_LINE_PREFIX}80-host-{mac}.yaml"

    def _read_lines(self) -> list[str]:
        return self.kustomization_file.read_text(encoding="utf-8").splitlines(keepends=True)

    def _write_lines(self, lines: list[str]) -> None:
        self.kustomization_file.write_text("".join(lines), encoding="utf-8")

    def register_host(self, mac: str) -> None:
        self._ensure_repo()

        entry = self._host_entry(mac) + "\n"
        lines = self._read_lines()

        if any(line.rstrip("\n") == entry.rstrip("\n") for line in lines):
            return

        # Insert after the last existing host entry or after the # Hosts comment
        insert_at = None
        for i, line in enumerate(lines):
            stripped = line.rstrip("\n")
            if stripped.startswith(_HOST_LINE_PREFIX) or stripped == _HOSTS_COMMENT:
                insert_at = i + 1

        if insert_at is not None:
            lines.insert(insert_at, entry)
        else:
            lines.append(entry)

        self._write_lines(lines)
        self.git.commit_and_push(
            f"feat(provisioning): register host {mac}",
            token=settings.git_token,
        )

    def unregister_host(self, mac: str) -> None:
        self._ensure_repo()

        entry = self._host_entry(mac)
        lines = self._read_lines()
        new_lines = [l for l in lines if l.rstrip("\n") != entry]

        if len(new_lines) == len(lines):
            return

        self._write_lines(new_lines)
        self.git.commit_and_push(
            f"feat(provisioning): unregister host {mac}",
            token=settings.git_token,
        )

    def rename_host(self, old_mac: str, new_mac: str) -> None:
        if old_mac == new_mac:
            return
        self._ensure_repo()

        old_entry = self._host_entry(old_mac)
        new_entry = self._host_entry(new_mac) + "\n"
        lines = self._read_lines()
        replaced = False
        for i, line in enumerate(lines):
            if line.rstrip("\n") == old_entry:
                lines[i] = new_entry
                replaced = True
                break

        if not replaced:
            self.register_host(new_mac)
            return

        self._write_lines(lines)
        self.git.commit_and_push(
            f"feat(provisioning): rename host {old_mac} -> {new_mac}",
            token=settings.git_token,
        )
