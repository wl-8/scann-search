import request from "./request"

export interface SearchPayload {
  queryType?: "id" | "vector"
  query?: string
  datasetId?: number
  indexId?: number
  indexIds?: number[]
  combinedIndexId?: number
  sourceDatasetId?: number
  sourceIndexId?: number
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
  cell_ids?: string[]
  colorBy?: string
  dimension?: number
}

export interface DatasetItem {
  id: number
  name: string
  status: string
  n_cells: number
  n_genes?: number
  vector_dim: number
  source_path?: string
  created_at?: string
}

export interface IndexItem {
  id: number
  dataset_id: number
  algorithm: string
  status: string
  n_vectors: number
  vector_dim: number
}

export interface CellItem {
  cell_id: string
  row_index: number
  obs: Record<string, any>
}

export interface CellPageResponse {
  dataset_id: number
  total: number
  offset: number
  limit: number
  items: CellItem[]
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
  return (await request.get("/datasets")) as DatasetItem[]
}

export async function listIndexes(datasetId?: number) {
  return (await request.get("/index", { params: datasetId ? { dataset_id: datasetId } : undefined })) as IndexItem[]
}

export async function getDatasetCells(datasetId: number, offset = 0, limit = 1) {
  return (await request.get(`/datasets/${datasetId}/cells`, { params: { offset, limit } })) as CellPageResponse
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
  // backend does not have a dedicated /search/conditional endpoint.
  // Reuse by-cell / by-vector endpoints depending on queryType.
  if (!payload.indexId) throw new Error("请先选择索引")
  const base = {
    index_id: payload.indexId,
    k: payload.k ?? 10,
    filters: buildSearchFilter(payload),
    oversample: payload.oversample ?? 10,
  }
  if (payload.queryType === "vector") {
    return request.post("/search/by-vector", { ...base, vector: parseVector(payload.query) }) as Promise<any>
  }
  return request.post("/search/by-cell", { ...base, cell_id: payload.query }) as Promise<any>
}

export async function multiDatasetSearch(payload: SearchPayload) {
  const indexIds = payload.indexIds ?? (payload.indexId ? [payload.indexId] : [])
  if (!indexIds.length) throw new Error("multiDatasetSearch: 请至少选择一个索引")

  const base = {
    index_ids: indexIds,
    source_index_id: payload.sourceIndexId ?? payload.indexId,
    k: payload.k ?? 10,
    filters: buildSearchFilter(payload),
    metric: payload.metric ?? "l2",
    oversample: payload.oversample,
  }
  if (payload.queryType === "vector") {
    return request.post("/search/multi-dataset", { ...base, vector: parseVector(payload.query) }) as Promise<any>
  }
  return request.post("/search/multi-dataset", { ...base, cell_id: payload.query }) as Promise<any>
}

export async function combinedIndexSearch(payload: SearchPayload) {
  if (!payload.combinedIndexId) throw new Error("请先选择联合索引")
  const base = {
    combined_index_id: payload.combinedIndexId,
    source_dataset_id: payload.sourceDatasetId,
    k: payload.k ?? 10,
    filters: buildSearchFilter(payload),
    metric: payload.metric ?? "l2",
    oversample: payload.oversample,
  }
  if (payload.queryType === "vector") {
    return request.post("/search/combined-index", { ...base, vector: parseVector(payload.query) }) as Promise<any>
  }
  return request.post("/search/combined-index", { ...base, cell_id: payload.query }) as Promise<any>
}

export async function batchSearch(payload: SearchPayload & { aggregate?: "ranked" | "union" | "intersection" }) {
  if (!payload.indexId) throw new Error("请先选择索引")
  const cellIds = String(payload.query ?? "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  return request.post("/search/batch", {
    index_id: payload.indexId,
    cell_ids: cellIds,
    k: payload.k ?? 10,
    filters: buildSearchFilter(payload),
    metric: payload.metric ?? "l2",
    aggregate: payload.aggregate ?? "ranked",
  }) as Promise<any>
}

export async function compareStrategies(payload: SearchPayload) {
  if (!payload.indexId) throw new Error("请先选择索引")
  const filter = buildSearchFilter(payload)
  if (!filter) throw new Error("请填写过滤字段和过滤值")
  const base = {
    index_id: payload.indexId,
    k: payload.k ?? 10,
    filters: filter,
    metric: payload.metric ?? "l2",
    oversample: payload.oversample ?? 10,
  }
  if (payload.queryType === "vector") {
    return request.post("/search/compare-strategies", { ...base, vector: parseVector(payload.query) }) as Promise<any>
  }
  return request.post("/search/compare-strategies", { ...base, cell_id: payload.query }) as Promise<any>
}

export async function browseSearch(payload: SearchPayload) {
  // Prefer per-dataset visualize embedding when datasetId provided.
  if (payload.datasetId) {
    const mode = payload.queryType === "vector" || payload.dimension === 3 ? "3d" : "2d"
    const params: Record<string, any> = {
      mode,
      color_by: payload.colorBy ?? "cell_type",
      max_points: payload.pageSize ?? 5000,
    }
    return request.get(`/visualize/${payload.datasetId}/embedding`, { params }) as Promise<any>
  }

  // Fallback to legacy mock endpoint if no dataset specified
  return request.post("/search/browse", payload) as Promise<any>
}

export default { search, conditionalSearch, multiDatasetSearch, combinedIndexSearch, batchSearch, compareStrategies, browseSearch }
