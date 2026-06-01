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
  colorBy?: string
  embeddingKey?: string
  dimension?: 2 | 3
}

export type SearchFilter = {
  equals?: Record<string, string[]>
  gte?: Record<string, number>
  lte?: Record<string, number>
}

export interface DatasetItem {
  id: number
  name: string
  status: string
  n_cells: number
  n_genes?: number
  vector_dim: number
  embedding_key?: string
}

export interface IndexItem {
  id: number
  dataset_id: number
  algorithm: string
  status: string
  n_vectors: number
  vector_dim: number
  build_time_ms?: number
  index_size_bytes?: number
}

export type ApiListOptions = {
  mockFallback?: boolean
}

export type DatasetStatsResponse = {
  dataset_id: number
  obs_columns: string[]
  value_counts: Record<string, Record<string, number>>
  numeric_summary?: Record<string, { count: number; mean: number; median: number; min: number; max: number }>
}

export type VisualizeModesResponse = {
  dataset_id: number
  embedding_key: string
  embedding_options: string[]
  vector_dim: number
  available_modes: string[]
  color_options: string[]
}

export type EmbeddingPoint = {
  cell_id: string
  x: number
  y: number
  z?: number | null
  label: string
  obs: Record<string, any>
}

export type EmbeddingResponse = {
  dataset_id: number
  embedding_key: string
  mode: "2d" | "3d"
  color_by: string
  color_options: string[]
  n_total: number
  n_returned: number
  points: EmbeddingPoint[]
}

export type BatchSearchRequest = {
  indexId: number
  cellIds: string[]
  k?: number
  filters?: SearchFilter
  metric?: "l2" | "cosine"
  aggregate?: "ranked" | "union" | "intersection"
}

export type BatchSearchHit = {
  rank: number
  cell_id: string
  row_index: number
  hit_count: number
  avg_distance: number
  obs: Record<string, any>
}

export type BatchSearchResponse = {
  index_id: number
  dataset_id: number
  algorithm: string
  metric: string
  aggregate: string
  n_queries: number
  k: number
  n_returned: number
  total_latency_ms: number
  hits: BatchSearchHit[]
}

export type CompareStrategiesRequest = {
  indexId: number
  cellId?: string
  vector?: number[]
  k?: number
  filters: SearchFilter
  metric?: "l2" | "cosine"
  strategies?: Array<"post" | "pre" | "hybrid">
  oversample?: number
}

export type StrategyResult = {
  strategy: string
  n_returned: number
  requested_k: number
  latency_ms: number
  recall_at_k: number
  extra: Record<string, any>
  hits: Array<{ rank: number; cell_id: string; row_index: number; distance: number; obs: Record<string, any> }>
}

export type CompareStrategiesResponse = {
  index_id: number
  dataset_id: number
  algorithm: string
  metric: string
  k: number
  n_total_cells: number
  n_matching_filter: number
  filter_selectivity: number
  results: StrategyResult[]
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

export async function listDatasets(options: ApiListOptions = {}) {
  try {
    return (await request.get("/datasets")) as DatasetItem[]
  } catch (e) {
    // 在开发模式下回退到示例数据，便于未启动后端时演示
    if (import.meta.env.DEV && options.mockFallback !== false) {
      return Promise.resolve([
        { id: 1, name: "PBMC-3k", status: "ready", n_cells: 3200, vector_dim: 64 },
      ])
    }
    throw e
  }
}

export async function listIndexes(datasetId?: number, options: ApiListOptions = {}) {
  try {
    return (await request.get("/index", { params: datasetId ? { dataset_id: datasetId } : undefined })) as IndexItem[]
  } catch (e) {
    if (import.meta.env.DEV && options.mockFallback !== false) {
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
    const mode = payload.queryType === "vector" || payload.dimension === 3 ? "3d" : "2d"
    const params: Record<string, any> = {
      mode,
      color_by: payload.colorBy ?? "cell_type",
      max_points: payload.pageSize ?? 5000,
    }
    if (payload.embeddingKey) params.embedding_key = payload.embeddingKey
    return request.get(`/visualize/${payload.datasetId}/embedding`, { params }) as Promise<any>
  }

  throw new Error("browseSearch: 必须提供 datasetId")
}

export async function getDatasetStats(datasetId: number) {
  return request.get(`/datasets/${datasetId}/stats`) as Promise<DatasetStatsResponse>
}

export async function getVisualizeModes(datasetId: number) {
  return request.get(`/visualize/${datasetId}/modes`) as Promise<VisualizeModesResponse>
}

export async function batchSearch(payload: BatchSearchRequest) {
  return request.post("/search/batch", {
    index_id: payload.indexId,
    cell_ids: payload.cellIds,
    k: payload.k ?? 10,
    filters: payload.filters,
    metric: payload.metric ?? "l2",
    aggregate: payload.aggregate ?? "ranked",
  }) as Promise<BatchSearchResponse>
}

export async function compareStrategies(payload: CompareStrategiesRequest) {
  return request.post("/search/compare-strategies", {
    index_id: payload.indexId,
    cell_id: payload.cellId,
    vector: payload.vector,
    k: payload.k ?? 10,
    filters: payload.filters,
    metric: payload.metric ?? "l2",
    strategies: payload.strategies,
    oversample: payload.oversample ?? 10,
  }) as Promise<CompareStrategiesResponse>
}

export default {
  search,
  conditionalSearch,
  multiDatasetSearch,
  browseSearch,
  batchSearch,
  compareStrategies,
  getDatasetStats,
  getVisualizeModes,
}
