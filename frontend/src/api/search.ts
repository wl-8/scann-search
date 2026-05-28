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
  try {
    return (await request.get("/datasets")) as Promise<DatasetItem[]>
  } catch (e) {
    // 在开发模式下回退到示例数据，便于未启动后端时演示
    if (import.meta.env.DEV) {
      return Promise.resolve([
        { id: 1, name: "PBMC-3k", status: "ready", n_cells: 3200, vector_dim: 64 },
      ])
    }
    throw e
  }
}

export async function listIndexes(datasetId?: number) {
  try {
    return (await request.get("/index", { params: datasetId ? { dataset_id: datasetId } : undefined })) as Promise<IndexItem[]>
  } catch (e) {
    if (import.meta.env.DEV) {
      return Promise.resolve([
        { id: 1, dataset_id: datasetId ?? 1, algorithm: "hnsw", status: "ready", n_vectors: 3200, vector_dim: 64 },
      ])
    }
    throw e
  }
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
  // Backend exposes a batch endpoint for multiple cell ids: /search/batch
  // If caller provided `cell_ids` in filters, use batch; otherwise raise.
  const cellIds = (payload as any).cell_ids ?? (payload.query ? [payload.query] : undefined)
  if (Array.isArray(cellIds) && cellIds.length > 0) {
    return request.post("/search/batch", {
      index_id: payload.indexId,
      cell_ids: cellIds,
      k: payload.k ?? 10,
      filters: buildSearchFilter(payload),
      metric: payload.metric ?? "l2",
    }) as Promise<any>
  }
  throw new Error("multiDatasetSearch: 请提供 cell_ids 或使用单次 search 接口")
}

export async function browseSearch(payload: SearchPayload) {
  // Prefer per-dataset visualize embedding when datasetId provided.
  if (payload.datasetId) {
    const mode = payload.queryType === "vector" || (payload as any).dimension === 3 ? "3d" : "2d"
    const params: Record<string, any> = {
      mode,
      color_by: (payload as any).colorBy ?? "cell_type",
      max_points: payload.pageSize ?? 5000,
    }
    return request.get(`/visualize/${payload.datasetId}/embedding`, { params }) as Promise<any>
  }

  // Fallback to legacy mock endpoint if no dataset specified
  return request.post("/search/browse", payload) as Promise<any>
}

export default { search, conditionalSearch, multiDatasetSearch, browseSearch }
