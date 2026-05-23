"""算法工厂：根据名称返回对应 Index 实例"""
from app.ann.base import BaseANNIndex

def create_index(algorithm: str, **kwargs) -> BaseANNIndex:
    # TODO: 按 algorithm 返回对应实例
    raise NotImplementedError(f"算法 {algorithm} 未实现")
