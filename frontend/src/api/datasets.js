import request from "./request";
export function registerDataset(payload) {
    return request.post("/datasets/register", payload);
}
export function getDataset(datasetId) {
    return request.get(`/datasets/${datasetId}`);
}
export function switchEmbedding(datasetId, embeddingKey) {
    return request.put(`/datasets/${datasetId}/embedding`, { embedding_key: embeddingKey });
}
export function listDatasetCells(datasetId, params) {
    return request.get(`/datasets/${datasetId}/cells`, { params });
}
export function filterDatasetCells(datasetId, payload) {
    return request.post(`/datasets/${datasetId}/cells/filter`, payload);
}
export function deleteDataset(datasetId) {
    return request.delete(`/datasets/${datasetId}`);
}
export default {
    registerDataset,
    deleteDataset,
    getDataset,
    switchEmbedding,
    listDatasetCells,
    filterDatasetCells,
};
