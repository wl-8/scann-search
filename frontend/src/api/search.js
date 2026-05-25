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
    return request.get("/datasets");
}
export async function listIndexes(datasetId) {
    return request.get("/index", { params: datasetId ? { dataset_id: datasetId } : undefined });
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
    return request.post("/search/conditional", payload);
}
export async function multiDatasetSearch(payload) {
    return request.post("/search/multi-dataset", payload);
}
export async function browseSearch(payload) {
    return request.post("/search/browse", payload);
}
export default { search, conditionalSearch, multiDatasetSearch, browseSearch };
