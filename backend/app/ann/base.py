"""ANN 算法抽象基类（P3 按此接口实现各算法）"""
from abc import ABC, abstractmethod
import numpy as np

class BaseANNIndex(ABC):
    @abstractmethod
    def build(self, vectors: np.ndarray, **kwargs) -> None:
        """构建索引"""
        pass
    @abstractmethod
    def search(self, query: np.ndarray, k: int) -> tuple[list[int], list[float]]:
        """返回 (indices, distances)"""
        pass
    @abstractmethod
    def save(self, path: str) -> None:
        """保存索引到文件"""
        pass
    @abstractmethod
    def load(self, path: str) -> None:
        """从文件加载索引"""
        pass
    @abstractmethod
    def add(self, vectors: np.ndarray, ids: list[int]) -> None:
        """动态添加向量"""
        pass
    @abstractmethod
    def remove(self, ids: list[int]) -> None:
        """动态删除向量"""
        pass
