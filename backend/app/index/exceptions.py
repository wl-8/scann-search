"""索引模块异常。"""
from fastapi import HTTPException, status


class IndexNotFound(HTTPException):
    def __init__(self, index_id: int) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail=f"索引 {index_id} 不存在")


class UnsupportedAlgorithm(HTTPException):
    def __init__(self, algorithm: str, supported: tuple[str, ...]) -> None:
        super().__init__(
            status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的算法 '{algorithm}'，已支持：{list(supported)}",
        )


class IndexNotReady(HTTPException):
    def __init__(self, index_id: int, status_str: str) -> None:
        super().__init__(
            status.HTTP_409_CONFLICT,
            detail=f"索引 {index_id} 状态 '{status_str}'，无法使用",
        )
