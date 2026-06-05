import request from "./request"

export function buildIndex(payload: { dataset_id: number; algorithm: string; params?: Record<string, any> }) {
  return request.post("/index/build", payload)
}

export function deleteIndex(indexId: number) {
  return request.delete(`/index/${indexId}`)
}

export function getAlgorithms() {
  return request.get("/index/algorithms") as Promise<string[]>
}

export interface CombinedIndexItem {
  id: number
  name: string
  description: string
  dataset_ids: number[]
  algorithm: string
  params: Record<string, any>
  file_path: string
  mapping_path: string
  status: string
  error_msg: string
  build_time_ms: number
  index_size_bytes: number
  n_vectors: number
  vector_dim: number
  created_at: string
}

export function buildCombinedIndex(payload: {
  name?: string
  description?: string
  dataset_ids: number[]
  algorithm: string
  params?: Record<string, any>
}) {
  return request.post("/index/combined/build", payload) as Promise<CombinedIndexItem>
}

export function listCombinedIndexes(datasetId?: number) {
  return request.get("/index/combined", { params: datasetId ? { dataset_id: datasetId } : undefined }) as Promise<CombinedIndexItem[]>
}

export function deleteCombinedIndex(combinedIndexId: number) {
  return request.delete(`/index/combined/${combinedIndexId}`)
}

export default { buildIndex, deleteIndex, getAlgorithms, buildCombinedIndex, listCombinedIndexes, deleteCombinedIndex }
