"""检索模块异常。"""
from fastapi import HTTPException, status


class CellNotFound(HTTPException):
    def __init__(self, cell_id: str, dataset_id: int) -> None:
        super().__init__(
            status.HTTP_404_NOT_FOUND,
            detail=f"数据集 {dataset_id} 中找不到 cell_id='{cell_id}'",
        )


class InvalidQueryVector(HTTPException):
    def __init__(self, got: int, expected: int) -> None:
        super().__init__(
            status.HTTP_400_BAD_REQUEST,
            detail=f"查询向量维度 {got} 与索引维度 {expected} 不一致",
        )
