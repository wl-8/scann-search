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

export default { registerDataset, deleteDataset }
