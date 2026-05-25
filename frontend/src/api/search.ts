import request from "./request"

export interface SearchPayload {
  queryType?: "id" | "vector"
  query?: string
  indexType?: string
  metric?: string
  k?: number
  filters?: Record<string, any>
  page?: number
  pageSize?: number
  datasets?: string[]
}

// 调用后端检索接口（POST /search）
export async function search(payload: SearchPayload) {
  // Expect backend to accept POST /search with payload and return { items: [], total: number }
  return request.post("/search", payload) as Promise<any>
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
