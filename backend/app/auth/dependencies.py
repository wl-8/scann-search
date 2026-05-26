# 从 core 统一导出，避免循环依赖
from app.core.dependencies import get_current_user, require_admin, require_researcher  # noqa: F401
