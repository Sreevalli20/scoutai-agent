import os
from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    anakin_api_key: str = ""
    groq_api_key: str = ""
    
    # Groq Configuration
    groq_model: str = "openai/gpt-oss-20b"  # Default model, can be overridden
    
    # CORS Configuration
    cors_origins: Union[str, List[str]] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    # API Configuration
    api_prefix: str = "/api"
    
    # Timeout Configuration (seconds)
    anakin_timeout: int = 30
    groq_timeout: int = 60
    research_timeout: int = 300  # 5 minutes total research timeout
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS origins to list, handling both string and list inputs."""
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",")]
        return self.cors_origins


def get_settings() -> Settings:
    """Get application settings instance."""
    return Settings()
