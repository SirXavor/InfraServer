from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Repo de hosts (CRUD de definiciones de host)
    git_hosts_url: str
    git_hosts_repo_path: str = "/data/repo/hosts"

    # Repo de configs (lectura de catálogo: distros, perfiles, roles)
    git_configs_url: str
    git_configs_repo_path: str = "/data/repo/configs"

    git_token: str = ""
    git_branch: str = "main"
    git_user_name: str = "InfraWriter"
    git_user_email: str = "infrawriter@local"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()