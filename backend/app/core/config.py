from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "mysql://admin:admin123@localhost:3306/admin_panel"
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    rabbitmq_required: bool = True
    ai_service_url: str = "http://localhost:8100"
    backend_cors_origins: str = "http://localhost:3000,http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


settings = Settings()
