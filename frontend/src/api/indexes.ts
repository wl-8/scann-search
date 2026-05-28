import request from "./request"

export function buildIndex(payload: { dataset_id: number; algorithm: string; params?: Record<string, any> }) {
  return request.post("/index/build", payload)
}

export default { buildIndex }

export function deleteIndex(indexId: number) {
  return request.delete(`/index/${indexId}`)
}

export function getAlgorithms() {
  return request.get("/index/algorithms") as Promise<string[]>
}
