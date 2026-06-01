"""可视化模块异常。"""
from fastapi import HTTPException, status


class UnsupportedMode(HTTPException):
    def __init__(self, mode: str, available: list[str]) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的可视化模式 '{mode}'，当前 embedding 可用模式：{available}",
        )


class ColorByColumnNotFound(HTTPException):
    def __init__(self, col: str, available: list[str]) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"obs 字段 '{col}' 不存在，可用字段：{available}",
        )


class VisualizationEmbeddingNotFound(HTTPException):
    def __init__(self, embedding_key: str, available: list[str]) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"obsm 中没有 '{embedding_key}'，可用 keys：{available}",
        )
