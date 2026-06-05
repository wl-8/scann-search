import request from "./request"

export type AlgorithmConfig = {
  algorithm: string
  params?: Record<string, any>
}

export type BenchmarkRunRequest = {
  dataset_id: number
  label?: string
  algorithms: AlgorithmConfig[]
  k?: number
  n_queries?: number
  seed?: number
}

export type BenchmarkResultItem = {
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

export type BenchmarkBatchItem = {
  id: number
  label: string
  dataset_id: number
  k: number
  n_queries: number
  seed: number
  created_at: string
}

export type BenchmarkBatchDetail = BenchmarkBatchItem & {
  results: BenchmarkResultItem[]
}

export function runBenchmark(payload: BenchmarkRunRequest) {
  return request.post("/benchmark/run", payload) as Promise<BenchmarkBatchDetail>
}

export function listBenchmarkBatches(params?: { dataset_id?: number; label?: string }) {
  return request.get("/benchmark/batches", { params }) as Promise<BenchmarkBatchItem[]>
}

export function getBenchmarkBatch(batchId: number) {
  return request.get(`/benchmark/batches/${batchId}`) as Promise<BenchmarkBatchDetail>
}

export function getBenchmarkResult(resultId: number) {
  return request.get(`/benchmark/results/${resultId}`) as Promise<BenchmarkResultItem>
}

export function deleteBenchmarkBatch(batchId: number) {
  return request.delete(`/benchmark/batches/${batchId}`)
}

export default {
  runBenchmark,
  listBenchmarkBatches,
  getBenchmarkBatch,
  getBenchmarkResult,
  deleteBenchmarkBatch,
}
