from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Dict

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")

    database_url: str = "sqlite:///./precios_soley_clean.db"
    secret_key: str = "your-development-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # IVA percentages per country (in percent)
    iva_percentages: Dict[str, float] = {
        "Spain": 21.0,
        "Germany": 19.0,
        "France": 20.0,
        "Italy": 22.0,
        "Portugal": 23.0,
        "Ecuador": 12.0,  # Example for user's timezone
        "Default": 21.0
    }

settings = Settings()