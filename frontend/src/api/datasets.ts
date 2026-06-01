import request from "./request"

export type RegisterPayload = {
  name: string
  source_path: string
  description?: string
  embedding_key?: string
}

export type DatasetResponse = {
  id: number
  name: string
  description: string
  source_path: string
  n_cells: number
  n_genes: number
  vector_dim: number
  embedding_key: string
  status: string
  error_msg: string
  created_at: string
}

export type CellResponse = {
  cell_id: string
  row_index: number
  obs: Record<string, any>
}

export type CellPageResponse = {
  dataset_id: number
  total: number
  offset: number
  limit: number
  items: CellResponse[]
}

export type CellFilterRequest = {
  filters: {
    equals?: Record<string, string[]>
    gte?: Record<string, number>
    lte?: Record<string, number>
  }
  offset?: number
  limit?: number
}

export type CellFilterResponse = {
  dataset_id: number
  total_matched: number
  offset: number
  limit: number
  items: CellResponse[]
}

export function registerDataset(payload: RegisterPayload) {
  return request.post("/datasets/register", payload)
}

export function getDataset(datasetId: number) {
  return request.get<DatasetResponse>(`/datasets/${datasetId}`)
}

export function switchEmbedding(datasetId: number, embeddingKey: string) {
  return request.put<DatasetResponse>(`/datasets/${datasetId}/embedding`, { embedding_key: embeddingKey })
}

export function listDatasetCells(datasetId: number, params?: { offset?: number; limit?: number }) {
  return request.get<CellPageResponse>(`/datasets/${datasetId}/cells`, { params })
}

export function filterDatasetCells(datasetId: number, payload: CellFilterRequest) {
  return request.post<CellFilterResponse>(`/datasets/${datasetId}/cells/filter`, payload)
}

export function deleteDataset(datasetId: number) {
  return request.delete(`/datasets/${datasetId}`)
}

export default {
  registerDataset,
  deleteDataset,
  getDataset,
  switchEmbedding,
  listDatasetCells,
  filterDatasetCells,
}
