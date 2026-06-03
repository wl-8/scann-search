"""回归测试：cosine 度量的正确性 + 数据集工件缓存。

覆盖本次修复：
1. cosine 索引在构建时对库向量归一化、检索时对查询归一化 → 真·余弦排序
   （用一个 L2 与 cosine top-1 不同的数据集来证明库向量确实参与了归一化）。
2. load_vectors/find_cell_row 走内存缓存，且失效后会重载。
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from app.ann.metrics import l2_normalize
from app.datasets import service as ds_service
from app.datasets.schemas import DatasetRegisterRequest
from app.index import service as idx_service
from app.index.schemas import IndexBuildRequest
from app.search import service as search_service
from app.search.schemas import SearchByVectorRequest


def test_l2_normalize():
    v = np.array([3.0, 4.0], dtype=np.float32)
    out = l2_normalize(v)
    assert out is not v  # 不修改入参
    np.testing.assert_allclose(np.linalg.norm(out), 1.0, atol=1e-6)

    z = np.zeros(4, dtype=np.float32)
    np.testing.assert_array_equal(l2_normalize(z), z)  # 零向量保持

    m = np.array([[3.0, 4.0], [0.0, 2.0]], dtype=np.float32)
    np.testing.assert_allclose(np.linalg.norm(l2_normalize(m), axis=1), [1.0, 1.0], atol=1e-6)


@pytest.fixture
def cos_vs_l2_h5ad(tmp_path: Path) -> Path:
    """设计成 L2 最近=c2、cosine 最近=c0（方向与 query 完全对齐），两者 top-1 不同。"""
    import anndata as ad
    import pandas as pd

    X = np.array(
        [[100.0, 0.0],   # c0：方向与 query=[1,0] 完全一致，但 L2 极远
         [1.0, 1.0],     # c1
         [0.9, 0.05]],   # c2：L2 最近
        dtype=np.float32,
    )
    obs = pd.DataFrame({"cell_type": ["A", "B", "C"]}, index=["c0", "c1", "c2"])
    var = pd.DataFrame(index=["g0", "g1"])
    adata = ad.AnnData(X=np.zeros((3, 2), dtype=np.float32), obs=obs, var=var)
    adata.obsm["X_pca"] = X
    out = tmp_path / "cos.h5ad"
    adata.write_h5ad(out)
    return out


def _top1(db, index_id: int, vector: list[float]):
    resp = search_service.search_by_vector(
        db, SearchByVectorRequest(index_id=index_id, vector=vector, k=1)
    )
    return resp.metric, resp.hits[0].cell_id


def test_cosine_vs_l2_top1_differs(cos_vs_l2_h5ad, db_session):
    ds = ds_service.register(
        db_session, DatasetRegisterRequest(name="cos-ds", source_path=str(cos_vs_l2_h5ad))
    )
    l2_idx = idx_service.build(
        db_session, IndexBuildRequest(dataset_id=ds.id, algorithm="flat", params={}, metric="l2")
    )
    cos_idx = idx_service.build(
        db_session, IndexBuildRequest(dataset_id=ds.id, algorithm="flat", params={}, metric="cosine")
    )
    assert cos_idx.params.get("metric") == "cosine"  # metric 已持久化

    q = [1.0, 0.0]
    l2_metric, l2_top1 = _top1(db_session, l2_idx.id, q)
    cos_metric, cos_top1 = _top1(db_session, cos_idx.id, q)

    assert (l2_metric, l2_top1) == ("l2", "c2")      # L2 最近是 c2
    assert (cos_metric, cos_top1) == ("cosine", "c0")  # cosine 最近是 c0 → 证明库向量被归一化了


def test_artifact_cache_identity_and_invalidation(synth_h5ad, db_session):
    ds = ds_service.register(
        db_session, DatasetRegisterRequest(name="cache-ds", source_path=str(synth_h5ad))
    )
    v1 = ds_service.load_vectors(ds)
    v2 = ds_service.load_vectors(ds)
    assert v1 is v2  # 命中缓存：同一对象，没重新读盘

    assert ds_service.find_cell_row(ds, "cell_0042") == 42  # 走预建字典
    with pytest.raises(ValueError):
        ds_service.find_cell_row(ds, "ghost")

    ds_service._invalidate_artifacts(ds.id)
    assert ds_service.load_vectors(ds) is not v1  # 失效后重载为新对象
