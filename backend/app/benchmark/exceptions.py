"""性能评测模块异常。"""
from fastapi import HTTPException, status


class BenchmarkBatchNotFound(HTTPException):
    def __init__(self, batch_id: int) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail=f"Benchmark 批次 {batch_id} 不存在")


class BenchmarkResultNotFound(HTTPException):
    def __init__(self, result_id: int) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail=f"Benchmark 结果 {result_id} 不存在")
