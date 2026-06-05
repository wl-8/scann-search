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
  source_path?: string
  n_cells?: number
  n_genes?: number
  status?: string
  embedding_key?: string
  created_at?: string
  updated_at?: string
}

export type CellResponse = {
  cell_id: string
  row_index: number
  obs?: Record<string, any>
}

export type CellPageResponse = {
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

export type CellFilterResponse = CellPageResponse & {
  total_matched?: number
}

export function registerDataset(payload: RegisterPayload) {
  return request.post("/datasets/register", payload) as Promise<DatasetResponse>
}

export function deleteDataset(datasetId: number) {
  return request.delete(`/datasets/${datasetId}`)
}

export function switchEmbedding(datasetId: number, embedding_key: string) {
  return request.put(`/datasets/${datasetId}/embedding`, { embedding_key }) as Promise<DatasetResponse>
}

export function getDataset(datasetId: number) {
  return request.get(`/datasets/${datasetId}`) as Promise<DatasetResponse>
}

export function listDatasetCells(datasetId: number, params?: { offset?: number; limit?: number }) {
  return request.get(`/datasets/${datasetId}/cells`, {
    params: {
      offset: params?.offset ?? 0,
      limit: params?.limit ?? 50,
    },
  }) as Promise<CellPageResponse>
}

export function filterDatasetCells(datasetId: number, payload: CellFilterRequest) {
  return request.post(`/datasets/${datasetId}/cells/filter`, {
    offset: payload.offset ?? 0,
    limit: payload.limit ?? 50,
    filters: {
      equals: payload.filters.equals ?? {},
      gte: payload.filters.gte ?? {},
      lte: payload.filters.lte ?? {},
    },
  }) as Promise<CellFilterResponse>
}

export function listCells(datasetId: number, offset = 0, limit = 50) {
  return listDatasetCells(datasetId, { offset, limit })
}

export function filterCells(datasetId: number, payload: CellFilterRequest) {
  return filterDatasetCells(datasetId, payload)
}

export default {
  registerDataset,
  deleteDataset,
  switchEmbedding,
  getDataset,
  listDatasetCells,
  filterDatasetCells,
  listCells,
  filterCells,
}
