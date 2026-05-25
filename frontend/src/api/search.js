import request from "./request";
// 调用后端检索接口（POST /search）
export async function search(payload) {
    // Expect backend to accept POST /search with payload and return { items: [], total: number }
    return request.post("/search", payload);
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
