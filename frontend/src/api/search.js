import request from "./request";
function buildSearchFilter(payload) {
    const equals = {};
    const column = payload.filterColumn?.trim();
    const value = payload.filterValue?.trim();
    if (column && value)
        equals[column] = [value];
    if (payload.filters?.cell_type)
        equals.cell_type = [String(payload.filters.cell_type)];
    return Object.keys(equals).length ? { equals } : undefined;
}
function parseVector(raw) {
    return String(raw ?? "")
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map(Number);
}
export async function listDatasets() {
    try {
        return (await request.get("/datasets"));
    }
    catch (e) {
        // 在开发模式下回退到示例数据，便于未启动后端时演示
        if (import.meta.env.DEV) {
            return Promise.resolve([
                { id: 1, name: "PBMC-3k", status: "ready", n_cells: 3200, vector_dim: 64 },
            ]);
        }
        throw e;
    }
}
export async function listIndexes(datasetId) {
    try {
        return (await request.get("/index", { params: datasetId ? { dataset_id: datasetId } : undefined }));
    }
    catch (e) {
        if (import.meta.env.DEV) {
            return Promise.resolve([
                { id: 1, dataset_id: datasetId ?? 1, algorithm: "hnsw", status: "ready", n_vectors: 3200, vector_dim: 64 },
            ]);
        }
        throw e;
    }
}
// 调用 sjq 后端检索接口：POST /search/by-cell 或 /search/by-vector
export async function search(payload) {
    if (!payload.indexId)
        throw new Error("请先选择索引");
    const base = {
        index_id: payload.indexId,
        k: payload.k ?? 10,
        filters: buildSearchFilter(payload),
        oversample: payload.oversample ?? 10,
    };
    if (payload.queryType === "vector") {
        return request.post("/search/by-vector", {
            ...base,
            vector: parseVector(payload.query),
        });
    }
    return request.post("/search/by-cell", {
        ...base,
        cell_id: payload.query,
    });
}
export async function conditionalSearch(payload) {
    // backend does not have a dedicated /search/conditional endpoint.
    // Reuse by-cell / by-vector endpoints depending on queryType.
    if (!payload.indexId)
        throw new Error("请先选择索引");
    const base = {
        index_id: payload.indexId,
        k: payload.k ?? 10,
        filters: buildSearchFilter(payload),
        oversample: payload.oversample ?? 10,
    };
    if (payload.queryType === "vector") {
        return request.post("/search/by-vector", { ...base, vector: parseVector(payload.query) });
    }
    return request.post("/search/by-cell", { ...base, cell_id: payload.query });
}
export async function multiDatasetSearch(payload) {
    // Backend exposes a batch endpoint for multiple cell ids: /search/batch
    // If caller provided `cell_ids` in filters, use batch; otherwise raise.
    const cellIds = payload.cell_ids ?? (payload.query ? [payload.query] : undefined);
    if (Array.isArray(cellIds) && cellIds.length > 0) {
        return request.post("/search/batch", {
            index_id: payload.indexId,
            cell_ids: cellIds,
            k: payload.k ?? 10,
            filters: buildSearchFilter(payload),
            metric: payload.metric ?? "l2",
        });
    }
    throw new Error("multiDatasetSearch: 请提供 cell_ids 或使用单次 search 接口");
}
export async function browseSearch(payload) {
    // Prefer per-dataset visualize embedding when datasetId provided.
    if (payload.datasetId) {
        const mode = payload.queryType === "vector" || payload.dimension === 3 ? "3d" : "2d";
        const params = {
            mode,
            color_by: payload.colorBy ?? "cell_type",
            max_points: payload.pageSize ?? 5000,
        };
        return request.get(`/visualize/${payload.datasetId}/embedding`, { params });
    }
    throw new Error("browseSearch: 必须提供 datasetId");
}
export async function batchSearch(payload) {
    return request.post("/search/batch", {
        index_id: payload.indexId,
        cell_ids: payload.cellIds,
        k: payload.k ?? 10,
        filters: payload.filters,
        metric: payload.metric ?? "l2",
        aggregate: payload.aggregate ?? "ranked",
    });
}
export async function compareStrategies(payload) {
    return request.post("/search/compare-strategies", {
        index_id: payload.indexId,
        cell_id: payload.cellId,
        vector: payload.vector,
        k: payload.k ?? 10,
        filters: payload.filters,
        metric: payload.metric ?? "l2",
        strategies: payload.strategies,
        oversample: payload.oversample ?? 10,
    });
}
export default { search, conditionalSearch, multiDatasetSearch, browseSearch, batchSearch, compareStrategies };
