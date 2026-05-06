"""Application configuration — reads from environment variables."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # OpenAI (primary)
    openai_api_key: str = ""
    openai_model: str = "gpt-5.4-mini"
    site_url: str = "https://ninsiden.com"
    site_name: str = "NInsideN"

    # OpenRouter (legacy fallback — kept for backwards compat)
    openrouter_api_key: str = ""
    openrouter_model: str = "openrouter/auto"

    model_config = {
        # Search order: api/.env → api/.env.local → project-root .env.local
        # Later files override earlier ones. All are optional.
        "env_file": [".env", ".env.local", "../.env.local", "../../.env.local"],
        "env_file_encoding": "utf-8",
        # Ignore env vars the backend doesn't need (e.g. BACKEND_URL, NODE_OPTIONS)
        "extra": "ignore",
    }

    @property
    def openai_configured(self) -> bool:
        return bool(self.openai_api_key.strip())

    @property
    def openrouter_configured(self) -> bool:
        return bool(self.openrouter_api_key.strip())

    @property
    def active_model(self) -> str:
        if self.openai_configured:
            return self.openai_model
        if self.openrouter_configured:
            return self.openrouter_model
        return "local-fallback"


settings = Settings()
