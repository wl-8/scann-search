import request from "./request"

export type BenchmarkBatch = {
  id: number
  label: string
  dataset_id: number
  k: number
  n_queries: number
  seed: number
  created_at: string
  results?: BenchmarkResult[]
}

export type BenchmarkResult = {
  id: number
  batch_id: number
  algorithm: string
  params: Record<string, any>
  recall_at_k: number
  avg_latency_ms: number
  p50_latency_ms: number
  p95_latency_ms: number
  p99_latency_ms: number
  qps: number
  build_time_ms: number
  index_size_bytes: number
}

export function runBenchmark(payload: {
  dataset_id: number
  label?: string
  algorithms: Array<{ algorithm: string; params?: Record<string, any> }>
  k?: number
  n_queries?: number
  seed?: number
}) {
  return request.post("/benchmark/run", payload) as Promise<BenchmarkBatch>
}

export function listBenchmarkBatches(datasetId?: number) {
  return request.get("/benchmark/batches", { params: datasetId ? { dataset_id: datasetId } : undefined }) as Promise<BenchmarkBatch[]>
}

export function getBenchmarkBatch(batchId: number) {
  return request.get(`/benchmark/batches/${batchId}`) as Promise<BenchmarkBatch>
}

export function deleteBenchmarkBatch(batchId: number) {
  return request.delete(`/benchmark/batches/${batchId}`)
}
