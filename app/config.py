from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")

    database_url: str = "sqlite:///./precios_soley.db"
    secret_key: str = "your-development-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

settings = Settings()