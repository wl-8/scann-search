import request from "./request"

export interface SearchPayload {
  queryType?: "id" | "vector"
  query?: string
  datasetId?: number
  indexId?: number
  indexType?: string
  metric?: string
  k?: number
  oversample?: number
  filterColumn?: string
  filterValue?: string
  filters?: Record<string, any>
  page?: number
  pageSize?: number
  datasets?: string[]
}

export interface DatasetItem {
  id: number
  name: string
  status: string
  n_cells: number
  vector_dim: number
}

export interface IndexItem {
  id: number
  dataset_id: number
  algorithm: string
  status: string
  n_vectors: number
  vector_dim: number
}

function buildSearchFilter(payload: SearchPayload) {
  const equals: Record<string, string[]> = {}
  const column = payload.filterColumn?.trim()
  const value = payload.filterValue?.trim()
  if (column && value) equals[column] = [value]
  if (payload.filters?.cell_type) equals.cell_type = [String(payload.filters.cell_type)]
  return Object.keys(equals).length ? { equals } : undefined
}

function parseVector(raw: string | undefined) {
  return String(raw ?? "")
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number)
}

export async function listDatasets() {
  return request.get("/datasets") as Promise<DatasetItem[]>
}

export async function listIndexes(datasetId?: number) {
  return request.get("/index", { params: datasetId ? { dataset_id: datasetId } : undefined }) as Promise<IndexItem[]>
}

// 调用 sjq 后端检索接口：POST /search/by-cell 或 /search/by-vector
export async function search(payload: SearchPayload) {
  if (!payload.indexId) throw new Error("请先选择索引")

  const base = {
    index_id: payload.indexId,
    k: payload.k ?? 10,
    filters: buildSearchFilter(payload),
    oversample: payload.oversample ?? 10,
  }

  if (payload.queryType === "vector") {
    return request.post("/search/by-vector", {
      ...base,
      vector: parseVector(payload.query),
    }) as Promise<any>
  }

  return request.post("/search/by-cell", {
    ...base,
    cell_id: payload.query,
  }) as Promise<any>
}

export async function conditionalSearch(payload: SearchPayload) {
  return request.post("/search/conditional", payload) as Promise<any>
}

export async function multiDatasetSearch(payload: SearchPayload) {
  return request.post("/search/multi-dataset", payload) as Promise<any>
}

export async function browseSearch(payload: SearchPayload) {
  return request.post("/search/browse", payload) as Promise<any>
}

export default { search, conditionalSearch, multiDatasetSearch, browseSearch }
