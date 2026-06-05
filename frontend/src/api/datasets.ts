import request from "./request"

export type RegisterPayload = {
  name: string
  source_path: string
  description?: string
  embedding_key?: string
}

export function registerDataset(payload: RegisterPayload) {
  return request.post("/datasets/register", payload)
}

export function deleteDataset(datasetId: number) {
  return request.delete(`/datasets/${datasetId}`)
}

export function switchEmbedding(datasetId: number, embedding_key: string) {
  return request.put(`/datasets/${datasetId}/embedding`, { embedding_key })
}

export function listCells(datasetId: number, offset = 0, limit = 50) {
  return request.get(`/datasets/${datasetId}/cells`, { params: { offset, limit } })
}

export function filterCells(
  datasetId: number,
  payload: {
    filters: { equals?: Record<string, string[]>; gte?: Record<string, number>; lte?: Record<string, number> }
    offset?: number
    limit?: number
  }
) {
  return request.post(`/datasets/${datasetId}/cells/filter`, {
    offset: payload.offset ?? 0,
    limit: payload.limit ?? 50,
    filters: {
      equals: payload.filters.equals ?? {},
      gte: payload.filters.gte ?? {},
      lte: payload.filters.lte ?? {},
    },
  })
}

export default { registerDataset, deleteDataset, switchEmbedding, listCells, filterCells }
