import request from "./request"

export interface RagQueryPayload {
  question: string
  dataset_ids?: number[]
  k?: number
  filters?: {
    equals?: Record<string, string[]>
    gte?: Record<string, number>
    lte?: Record<string, number>
  }
  llm?: {
    provider?: string
    model?: string
    base_url?: string
    api_key?: string
    temperature?: number
  }
}

export interface RagEvidenceCell {
  dataset_id: number
  dataset_name: string
  cell_id: string
  row_index: number
  obs: Record<string, any>
}

export interface RagDatasetEvidence {
  dataset_id: number
  dataset_name: string
  n_cells: number
  total_matches: number
  matched_filters: Record<string, any>
  distributions: Record<string, Record<string, number>>
  sampled_cells: RagEvidenceCell[]
}

export interface RagQueryResponse {
  question: string
  answer: string
  provider: string
  model: string
  llm_used: boolean
  interpreted_filters: Record<string, any>
  target_dataset_ids: number[]
  evidence: RagDatasetEvidence[]
  warnings: string[]
}

export function ragQuery(payload: RagQueryPayload) {
  return request.post("/rag/query", payload) as Promise<RagQueryResponse>
}

export default { ragQuery }
