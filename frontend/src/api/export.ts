import request from "./request"

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportSearchCsv() {
  return request.get("/export/search", { responseType: "blob" }) as Promise<Blob>
}

export function exportFilterCsv() {
  return request.get("/export/filter", { responseType: "blob" }) as Promise<Blob>
}

export function exportBenchmarkCsv(batchIds: number[]) {
  const params = new URLSearchParams()
  batchIds.forEach((id) => params.append("batch_ids", String(id)))
  return request.get("/export/benchmark", {
    params,
    responseType: "blob",
  }) as Promise<Blob>
}

export async function exportSearch() {
  const blob = await exportSearchCsv()
  downloadBlob(blob, "search.csv")
}

export async function exportFilter() {
  const blob = await exportFilterCsv()
  downloadBlob(blob, "filter.csv")
}

export async function exportBenchmark(batchIds: number[]) {
  const blob = await exportBenchmarkCsv(batchIds)
  downloadBlob(blob, `benchmark_${batchIds.join("_")}.csv`)
}

export default {
  exportSearchCsv,
  exportFilterCsv,
  exportBenchmarkCsv,
  exportSearch,
  exportFilter,
  exportBenchmark,
}
