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

export async function exportSearch() {
  const blob = await request.get("/export/search", { responseType: "blob" }) as Blob
  downloadBlob(blob, "search.csv")
}

export async function exportFilter() {
  const blob = await request.get("/export/filter", { responseType: "blob" }) as Blob
  downloadBlob(blob, "filter.csv")
}

export async function exportBenchmark(batchIds: number[]) {
  const params = new URLSearchParams()
  batchIds.forEach((id) => params.append("batch_ids", String(id)))
  const blob = await request.get("/export/benchmark", {
    params,
    responseType: "blob",
  }) as Blob
  downloadBlob(blob, `benchmark_${batchIds.join("_")}.csv`)
}
