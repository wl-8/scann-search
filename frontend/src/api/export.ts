import request from "./request"

export function exportSearchCsv() {
  return request.get<Blob>("/export/search", { responseType: "blob" })
}

export function exportFilterCsv() {
  return request.get<Blob>("/export/filter", { responseType: "blob" })
}

export function exportBenchmarkCsv(batchIds: number[]) {
  return request.get<Blob>("/export/benchmark", { responseType: "blob", params: { batch_ids: batchIds } })
}

export default {
  exportSearchCsv,
  exportFilterCsv,
  exportBenchmarkCsv,
}
