from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 无默认值，缺失则启动时抛出 ValidationError
    SECRET_KEY: str
    ADMIN_PASSWORD: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DATABASE_URL: str = "sqlite:///./app.db"
    UPLOAD_DIR: str = "data/uploads"
    INDEX_DIR: str = "data/indexes"
    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@scann.local"

    model_config = {"env_file": ".env"}


settings = Settings()
