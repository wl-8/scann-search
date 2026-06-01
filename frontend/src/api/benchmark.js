import request from "./request";
export function runBenchmark(payload) {
    return request.post("/benchmark/run", payload);
}
export function listBenchmarkBatches(params) {
    return request.get("/benchmark/batches", { params });
}
export function getBenchmarkBatch(batchId) {
    return request.get(`/benchmark/batches/${batchId}`);
}
export function getBenchmarkResult(resultId) {
    return request.get(`/benchmark/results/${resultId}`);
}
export function deleteBenchmarkBatch(batchId) {
    return request.delete(`/benchmark/batches/${batchId}`);
}
export default {
    runBenchmark,
    listBenchmarkBatches,
    getBenchmarkBatch,
    getBenchmarkResult,
    deleteBenchmarkBatch,
};
