"""全局配置，读取 .env 文件。"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SECRET_KEY: str = "dev-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DATABASE_URL: str = "sqlite:///./app.db"
    UPLOAD_DIR: str = "data/uploads"
    INDEX_DIR: str = "data/indexes"


settings = Settings()
