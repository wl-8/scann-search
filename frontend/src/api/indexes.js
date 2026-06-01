import request from "./request";
export function buildIndex(payload) {
    return request.post("/index/build", payload);
}
export default { buildIndex };
export function deleteIndex(indexId) {
    return request.delete(`/index/${indexId}`);
}
export function getAlgorithms() {
    return request.get("/index/algorithms");
}
