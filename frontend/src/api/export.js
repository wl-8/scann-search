import request from "./request";
export function exportSearchCsv() {
    return request.get("/export/search", { responseType: "blob" });
}
export function exportFilterCsv() {
    return request.get("/export/filter", { responseType: "blob" });
}
export function exportBenchmarkCsv(batchIds) {
    return request.get("/export/benchmark", { responseType: "blob", params: { batch_ids: batchIds } });
}
export default {
    exportSearchCsv,
    exportFilterCsv,
    exportBenchmarkCsv,
};
