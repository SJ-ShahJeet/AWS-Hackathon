from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_secret_key: str = "dev-secret-key-change-in-prod"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_public_url: str = "http://localhost:8000"
    demo_login_enabled: bool = True

    ghost_database_url: str = ""

    auth0_domain: str = ""
    auth0_client_id: str = ""
    auth0_audience: str = ""
    auth0_management_api_audience: str = ""
    auth0_m2m_client_id: str = ""
    auth0_m2m_client_secret: str = ""

    bland_api_key: str = ""
    bland_support_voice_id: str = ""
    bland_approval_voice_id: str = ""
    bland_model: str = "base"
    bland_base_url: str = "https://api.bland.ai/v1"

    nim_base_url: str = "https://integrate.api.nvidia.com/v1"
    nim_api_key: str = ""
    nim_model: str = "qwen/qwen3-next-80b-a3b-instruct"

    @property
    def is_dev(self) -> bool:
        return self.app_env == "development"

    @property
    def auth0_enabled(self) -> bool:
        return bool(self.auth0_domain and self.auth0_audience)

    @property
    def management_api_enabled(self) -> bool:
        return bool(
            self.auth0_domain
            and self.auth0_management_api_audience
            and self.auth0_m2m_client_id
            and self.auth0_m2m_client_secret
        )

    @property
    def ghost_enabled(self) -> bool:
        return bool(self.ghost_database_url)

@lru_cache()
def get_settings() -> Settings:
    return Settings()
