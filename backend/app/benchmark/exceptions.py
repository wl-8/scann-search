"""性能评测模块异常。"""
from fastapi import HTTPException, status


class BenchmarkRunNotFound(HTTPException):
    def __init__(self, run_id: int) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail=f"Benchmark 记录 {run_id} 不存在")


class BenchmarkBatchNotFound(HTTPException):
    def __init__(self, batch_id: str) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail=f"Benchmark 批次 '{batch_id}' 不存在")
