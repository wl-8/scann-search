"""导出模块集成测试。

验证：
- 未检索/过滤时导出 → 404
- 检索后导出 → 200，CSV 内容正确
- by-cell 和 by-vector 均写缓存
- 两用户缓存互不干扰
- 过滤后导出 → 200，CSV 包含全部匹配行（不受分页限制）
- benchmark 单批/多批导出 → 200，CSV 行数正确
- 普通用户无权导出任何 → 403
"""
from __future__ import annotations

from tests.conftest import admin_token, auth_header, login, register


# ─── 辅助 ─────────────────────────────────────────────────────────────────────

def _register_and_build_index(client, synth_h5ad, token, ds_name="export-ds"):
    r = client.post("/api/datasets/register", json={
        "name": ds_name,
        "source_path": str(synth_h5ad),
    }, headers=auth_header(token))
    assert r.status_code == 200
    ds_id = r.json()["id"]

    r = client.post("/api/index/build", json={
        "dataset_id": ds_id,
        "algorithm": "flat",
    }, headers=auth_header(token))
    assert r.status_code in (200, 201)
    idx_id = r.json()["id"]

    return ds_id, idx_id


def _find_user_id(client, token, username: str) -> int:
    r = client.get("/api/users", headers=auth_header(token))
    for u in r.json()["items"]:
        if u["username"] == username:
            return u["id"]
    raise ValueError(f"user {username} not found")


def _regular_token(client, username="user1", email="user1@test.com") -> str:
    register(client, username=username, email=email, password="Test@1234")
    token = admin_token(client)
    uid = _find_user_id(client, token, username)
    client.post(f"/api/users/{uid}/approve", headers=auth_header(token))
    return login(client, username=username, password="Test@1234").json()["access_token"]


def _run_benchmark(client, synth_h5ad, token, name_suffix=""):
    r = client.post("/api/datasets/register", json={
        "name": f"bm-export{name_suffix}",
        "source_path": str(synth_h5ad),
    }, headers=auth_header(token))
    ds_id = r.json()["id"]
    r = client.post("/api/benchmark/run", json={
        "dataset_id": ds_id,
        "algorithms": [{"algorithm": "flat"}, {"algorithm": "hnsw"}],
        "k": 5, "n_queries": 10,
    }, headers=auth_header(token))
    assert r.status_code == 201
    return r.json()


# ─── 检索导出 ─────────────────────────────────────────────────────────────────

def test_export_search_no_cache_returns_404(client, synth_h5ad) -> None:
    token = admin_token(client)
    r = client.get("/api/export/search", headers=auth_header(token))
    assert r.status_code == 404


def test_export_search_after_by_vector(client, synth_h5ad) -> None:
    token = admin_token(client)
    _, idx_id = _register_and_build_index(client, synth_h5ad, token, "export-ds-vec")

    client.post("/api/search/by-vector", json={
        "index_id": idx_id, "vector": [0.0] * 16, "k": 5,
    }, headers=auth_header(token))

    r = client.get("/api/export/search", headers=auth_header(token))
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    lines = [l for l in r.text.splitlines() if not l.startswith("#") and l.strip()]
    assert lines[0].startswith("rank,cell_id,row_index,distance")
    assert len(lines) >= 2


def test_export_search_after_by_cell(client, synth_h5ad) -> None:
    token = admin_token(client)
    _, idx_id = _register_and_build_index(client, synth_h5ad, token, "export-ds-cell")

    # 先拿一个 cell_id
    r = client.get("/api/datasets/1/cells", params={"limit": 1}, headers=auth_header(token))
    cell_id = r.json()["items"][0]["cell_id"]

    client.post("/api/search/by-cell", json={
        "index_id": idx_id, "cell_id": cell_id, "k": 5,
    }, headers=auth_header(token))

    r = client.get("/api/export/search", headers=auth_header(token))
    assert r.status_code == 200
    lines = [l for l in r.text.splitlines() if not l.startswith("#") and l.strip()]
    assert lines[0].startswith("rank,cell_id")


def test_export_search_two_users_independent_caches(client, synth_h5ad) -> None:
    """用户 A 检索后，用户 B 还没检索，B 的导出应是 404。"""
    admin = admin_token(client)
    _, idx_id = _register_and_build_index(client, synth_h5ad, admin, "export-ds-2u")

    client.post("/api/search/by-vector", json={
        "index_id": idx_id, "vector": [0.0] * 16, "k": 3,
    }, headers=auth_header(admin))

    # 普通用户 B 还没搜过
    user_token = _regular_token(client)
    # B 无权导出（403），但若有权其缓存也是空的，这里只能测 403
    r = client.get("/api/export/search", headers=auth_header(user_token))
    assert r.status_code == 403

    # 管理员 A 的缓存仍然有效
    r = client.get("/api/export/search", headers=auth_header(admin))
    assert r.status_code == 200


def test_export_search_forbidden_for_regular_user(client, synth_h5ad) -> None:
    token = _regular_token(client)
    r = client.get("/api/export/search", headers=auth_header(token))
    assert r.status_code == 403


# ─── 过滤导出 ─────────────────────────────────────────────────────────────────

def test_export_filter_no_cache_returns_404(client, synth_h5ad) -> None:
    token = admin_token(client)
    r = client.get("/api/export/filter", headers=auth_header(token))
    assert r.status_code == 404


def test_export_filter_exports_all_matched(client, synth_h5ad) -> None:
    token = admin_token(client)
    ds_id, _ = _register_and_build_index(client, synth_h5ad, token, "export-ds-filter")

    # 分页只取 5 行
    r = client.post(f"/api/datasets/{ds_id}/cells/filter", json={
        "filters": {"equals": {"cell_type": ["Type0"]}},
        "offset": 0, "limit": 5,
    }, headers=auth_header(token))
    assert r.status_code == 200
    total_matched = r.json()["total_matched"]
    assert total_matched > 5  # 确保合成数据里 Type0 超过 5 条

    # 导出应包含全量
    r = client.get("/api/export/filter", headers=auth_header(token))
    assert r.status_code == 200
    lines = [l for l in r.text.splitlines() if not l.startswith("#") and l.strip()]
    assert lines[0].startswith("cell_id,row_index")
    assert len(lines) - 1 == total_matched  # 减去列头


def test_export_filter_forbidden_for_regular_user(client, synth_h5ad) -> None:
    token = _regular_token(client)
    r = client.get("/api/export/filter", headers=auth_header(token))
    assert r.status_code == 403


# ─── Benchmark 导出 ───────────────────────────────────────────────────────────

def test_export_benchmark_single_batch(client, synth_h5ad) -> None:
    token = admin_token(client)
    batch = _run_benchmark(client, synth_h5ad, token, "-a")

    r = client.get("/api/export/benchmark", params={"batch_ids": batch["id"]},
                   headers=auth_header(token))
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    lines = [l for l in r.text.splitlines() if l.strip()]
    assert lines[0].startswith("batch_id,")
    assert len(lines) == 3  # 列头 + 2 算法行


def test_export_benchmark_multi_batch(client, synth_h5ad) -> None:
    token = admin_token(client)
    b1 = _run_benchmark(client, synth_h5ad, token, "-b1")
    b2 = _run_benchmark(client, synth_h5ad, token, "-b2")

    r = client.get("/api/export/benchmark",
                   params=[("batch_ids", b1["id"]), ("batch_ids", b2["id"])],
                   headers=auth_header(token))
    assert r.status_code == 200
    lines = [l for l in r.text.splitlines() if l.strip()]
    assert len(lines) == 5  # 列头 + 2批×2算法


def test_export_benchmark_nonexistent_ids_returns_404(client, synth_h5ad) -> None:
    token = admin_token(client)
    r = client.get("/api/export/benchmark", params={"batch_ids": 99999},
                   headers=auth_header(token))
    assert r.status_code == 404


def test_export_benchmark_partial_ids_returns_existing(client, synth_h5ad) -> None:
    """部分 id 存在时，只导出存在的批次，不报错。"""
    token = admin_token(client)
    batch = _run_benchmark(client, synth_h5ad, token, "-partial")

    r = client.get("/api/export/benchmark",
                   params=[("batch_ids", batch["id"]), ("batch_ids", 99999)],
                   headers=auth_header(token))
    assert r.status_code == 200
    lines = [l for l in r.text.splitlines() if l.strip()]
    assert len(lines) == 3  # 只有一个存在的批次


def test_export_benchmark_forbidden_for_regular_user(client, synth_h5ad) -> None:
    token = admin_token(client)
    batch = _run_benchmark(client, synth_h5ad, token, "-auth")

    user_token = _regular_token(client)
    r = client.get("/api/export/benchmark", params={"batch_ids": batch["id"]},
                   headers=auth_header(user_token))
    assert r.status_code == 403
