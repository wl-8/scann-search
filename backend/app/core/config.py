"""全局配置，读取 .env 文件。"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # 无默认值，缺失则启动时抛出 ValidationError
    SECRET_KEY: str
    ADMIN_PASSWORD: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DATABASE_URL: str = "sqlite:///./app.db"
    UPLOAD_DIR: str = "data/uploads"
    INDEX_DIR: str = "data/indexes"
    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@scann.local"
    AUTO_BOOTSTRAP_DATA: bool = True
    BOOTSTRAP_DATASET_NAME: str = "liver"
    BOOTSTRAP_DATASET_PATH: str = "data/liver.h5ad"
    BOOTSTRAP_EMBEDDING_KEY: str = "X_pca"
    BOOTSTRAP_INDEX_ALGORITHM: str = "hnsw"


settings = Settings()
