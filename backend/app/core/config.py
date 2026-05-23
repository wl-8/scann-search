"""全局配置，读取 .env 文件"""
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DATABASE_URL: str = "sqlite:///./app.db"
    UPLOAD_DIR: str = "data/uploads"
    INDEX_DIR: str = "data/indexes"
    class Config:
        env_file = ".env"

settings = Settings()
