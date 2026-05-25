"""数据集模块异常。"""
from fastapi import HTTPException, status


class DatasetNotFound(HTTPException):
    def __init__(self, dataset_id: int) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail=f"数据集 {dataset_id} 不存在")


class DatasetNameConflict(HTTPException):
    def __init__(self, name: str) -> None:
        super().__init__(status.HTTP_409_CONFLICT, detail=f"数据集名称 '{name}' 已存在")


class DatasetFileMissing(HTTPException):
    def __init__(self, path: str) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, detail=f"文件不存在：{path}")


class EmbeddingKeyMissing(HTTPException):
    def __init__(self, key: str, available: list[str]) -> None:
        super().__init__(
            status.HTTP_400_BAD_REQUEST,
            detail=f"adata.obsm 中没有 '{key}'，可选：{available}",
        )


class DatasetNotReady(HTTPException):
    def __init__(self, dataset_id: int, status_str: str) -> None:
        super().__init__(
            status.HTTP_409_CONFLICT,
            detail=f"数据集 {dataset_id} 当前状态 '{status_str}'，无法使用",
        )
