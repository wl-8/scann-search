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

    # RAG / LLM provider settings. All providers use OpenAI-compatible
    # /chat/completions semantics; request payloads can still override them.
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL: str = "deepseek-chat"
    DASHSCOPE_API_KEY: str = ""
    DASHSCOPE_BASE_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    DASHSCOPE_MODEL: str = "qwen-plus"
    MOONSHOT_API_KEY: str = ""
    MOONSHOT_BASE_URL: str = "https://api.moonshot.cn/v1"
    MOONSHOT_MODEL: str = "moonshot-v1-8k"
    ZHIPUAI_API_KEY: str = ""
    ZHIPUAI_BASE_URL: str = "https://open.bigmodel.cn/api/paas/v4"
    ZHIPUAI_MODEL: str = "glm-4-flash"
    SILICONFLOW_API_KEY: str = ""
    SILICONFLOW_BASE_URL: str = "https://api.siliconflow.cn/v1"
    SILICONFLOW_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"


settings = Settings()
