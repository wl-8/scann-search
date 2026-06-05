<template>
  <AppLayout>
    <div class="bench-page">
      <section class="bench-hero">
        <div>
          <div class="bench-hero__label">ANN Benchmark</div>
          <h1>算法精度 / 延迟 / 内存对比</h1>
          <p>统一抽样查询，FlatL2 作为 ground truth，直接比较所有已实现 ANN 算法。</p>
        </div>
        <div class="bench-hero__actions">
          <a-button :loading="loading" @click="loadPageData">刷新</a-button>
          <a-button type="primary" :loading="running" @click="run">运行评测</a-button>
        </div>
      </section>

      <section class="bench-grid">
        <a-card :bordered="false" class="control-panel">
          <template #title>实验配置</template>
          <a-form layout="vertical">
            <a-form-item label="数据集">
              <a-select v-model:value="datasetId" :options="datasetOptions" @change="loadBatches" />
            </a-form-item>
            <a-form-item label="批次标签">
              <a-input v-model:value="label" placeholder="例如 hnsw-ivfpq-sweep" />
            </a-form-item>
            <a-row :gutter="10">
              <a-col :span="8">
                <a-form-item label="Top-K">
                  <a-input-number v-model:value="k" :min="1" :max="100" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="查询数">
                  <a-input-number v-model:value="nQueries" :min="1" :max="10000" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="Seed">
                  <a-input-number v-model:value="seed" :min="1" />
                </a-form-item>
              </a-col>
            </a-row>

            <div class="algorithm-toolbar">
              <span>算法</span>
              <a-space>
                <a-button size="small" @click="selectAllAlgorithms">全选</a-button>
                <a-button size="small" @click="selectRecommendedAlgorithms">推荐组合</a-button>
              </a-space>
            </div>
            <div class="algorithm-list">
              <label
                v-for="option in algorithmOptions"
                :key="option.value"
                class="algo-option"
                :class="{ 'algo-option--active': algorithms.includes(option.value) }"
              >
                <input v-model="algorithms" type="checkbox" :value="option.value" />
                <span>
                  <strong>{{ option.label }}</strong>
                  <small>{{ option.caption }}</small>
                </span>
              </label>
            </div>

            <div class="params-preview">
              <div v-for="algo in algorithms" :key="algo" class="param-row">
                <span>{{ algo }}</span>
                <code>{{ JSON.stringify(defaultParams[algo] ?? {}) }}</code>
              </div>
            </div>
          </a-form>
        </a-card>

        <div class="result-panel">
          <a-card v-if="detail && recommendation" :bordered="false" class="recommend-card">
            <div class="recommend-card__main">
              <span class="recommend-card__label">自动推荐</span>
              <strong>{{ recommendation.algorithm }}</strong>
              <span>综合分 {{ pct(recommendation.score) }}</span>
            </div>
            <div class="recommend-card__metrics">
              <div>
                <small>Recall@K</small>
                <b>{{ pct(recommendation.result.recall_at_k) }}</b>
              </div>
              <div>
                <small>Avg</small>
                <b>{{ ms(recommendation.result.avg_latency_ms) }}</b>
              </div>
              <div>
                <small>P95</small>
                <b>{{ ms(recommendation.result.p95_latency_ms) }}</b>
              </div>
              <div>
                <small>Index</small>
                <b>{{ bytes(recommendation.result.index_size_bytes) }}</b>
              </div>
            </div>
          </a-card>

          <a-card :bordered="false" class="comparison-card">
            <template #title>指标对比</template>
            <a-empty v-if="!sortedResults.length" description="运行或选择批次后显示结果" />
            <div v-else class="metric-list">
              <div v-for="item in sortedResults" :key="item.id" class="metric-row">
                <div class="metric-row__head">
                  <strong>{{ item.algorithm }}</strong>
                  <span>{{ ms(item.avg_latency_ms) }} avg · {{ bytes(item.index_size_bytes) }}</span>
                </div>
                <div class="metric-bars">
                  <div class="metric-bar">
                    <span>Recall</span>
                    <a-progress :percent="Math.round(item.recall_at_k * 100)" size="small" :show-info="false" />
                    <b>{{ pct(item.recall_at_k) }}</b>
                  </div>
                  <div class="metric-bar">
                    <span>Speed</span>
                    <a-progress :percent="Math.round(speedScore(item) * 100)" size="small" :show-info="false" status="active" />
                    <b>{{ Math.round(item.qps) }} qps</b>
                  </div>
                  <div class="metric-bar">
                    <span>Memory</span>
                    <a-progress :percent="Math.round(memoryScore(item) * 100)" size="small" :show-info="false" />
                    <b>{{ bytes(item.index_size_bytes) }}</b>
                  </div>
                </div>
              </div>
            </div>
          </a-card>
        </div>
      </section>

      <section class="tables-grid">
        <a-card :bordered="false" title="批次列表">
          <a-table
            :columns="batchColumns"
            :data-source="batches"
            row-key="id"
            :loading="loading"
            :pagination="{ pageSize: 6 }"
            :scroll="{ x: 760 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'created_at'">
                {{ shortDate(record.created_at) }}
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button size="small" @click="loadDetail(record.id)">详情</a-button>
                  <a-popconfirm title="确定删除该批次？" @confirm="remove(record.id)">
                    <a-button danger size="small">删除</a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>

        <a-card :bordered="false" title="评测结果">
          <a-table
            :columns="resultColumns"
            :data-source="sortedResults"
            row-key="id"
            :pagination="{ pageSize: 8 }"
            :scroll="{ x: 1120 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'algorithm'">
                <a-tag color="blue">{{ record.algorithm }}</a-tag>
              </template>
              <template v-else-if="column.key === 'recall_at_k'">{{ pct(record.recall_at_k) }}</template>
              <template v-else-if="column.key === 'avg_latency_ms'">{{ ms(record.avg_latency_ms) }}</template>
              <template v-else-if="column.key === 'p95_latency_ms'">{{ ms(record.p95_latency_ms) }}</template>
              <template v-else-if="column.key === 'p99_latency_ms'">{{ ms(record.p99_latency_ms) }}</template>
              <template v-else-if="column.key === 'qps'">{{ Math.round(record.qps) }}</template>
              <template v-else-if="column.key === 'build_time_ms'">{{ ms(record.build_time_ms) }}</template>
              <template v-else-if="column.key === 'index_size_bytes'">{{ bytes(record.index_size_bytes) }}</template>
              <template v-else-if="column.key === 'params'"><code>{{ JSON.stringify(record.params ?? {}) }}</code></template>
            </template>
          </a-table>
        </a-card>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import { listDatasets } from "@/api/search"
import { deleteBenchmarkBatch, getBenchmarkBatch, listBenchmarkBatches, runBenchmark, type BenchmarkBatch, type BenchmarkResult } from "@/api/benchmark"
import { getAlgorithms } from "@/api/indexes"

type Recommendation = {
  algorithm: string
  score: number
  result: BenchmarkResult
}

const loading = ref(false)
const running = ref(false)
const datasets = ref<any[]>([])
const batches = ref<BenchmarkBatch[]>([])
const detail = ref<BenchmarkBatch | null>(null)
const supportedAlgorithms = ref<string[]>([])
const datasetId = ref<number>()
const label = ref("")
const algorithms = ref<string[]>(["hnsw", "ivf", "ivf_pq", "pq"])
const k = ref(10)
const nQueries = ref(30)
const seed = ref(42)

const defaultParams: Record<string, Record<string, any>> = {
  flat: {},
  hnsw: { M: 16, ef_construction: 200, ef_search: 64 },
  lsh: { nbits: 64 },
  ivf: { nlist: 100, nprobe: 10 },
  pq: { m: 6, nbits: 8 },
  opq: { m: 6, nbits: 8, niter: 5 },
  ivf_pq: { nlist: 100, nprobe: 10, m: 6, nbits: 8 },
  ivf_hnsw: { nlist: 100, nprobe: 10, M: 32 },
}

const algorithmCaptions: Record<string, string> = {
  flat: "精确基线，召回最高但耗时/内存高",
  hnsw: "图索引，通常延迟低、召回稳定",
  lsh: "哈希索引，构建快，精度依赖位数",
  ivf: "倒排分桶，速度和召回由 nprobe 控制",
  pq: "乘积量化，显著降低索引体积",
  opq: "优化量化，压缩前做旋转优化",
  ivf_pq: "倒排 + PQ，兼顾速度和内存",
  ivf_hnsw: "HNSW coarse quantizer 的 IVF",
}

const datasetOptions = computed(() => datasets.value.map((item) => ({ value: item.id, label: `${item.name} (#${item.id})` })))
const allAlgorithmValues = computed(() => supportedAlgorithms.value.length ? [...supportedAlgorithms.value] : Object.keys(defaultParams))
const algorithmOptions = computed(() =>
  allAlgorithmValues.value.map((value) => ({ value, label: value, caption: algorithmCaptions[value] ?? "自定义 ANN 算法" }))
)
const sortedResults = computed(() => [...(detail.value?.results ?? [])].sort((a, b) => scoreResult(b) - scoreResult(a)))
const recommendation = computed<Recommendation | null>(() => {
  const best = sortedResults.value[0]
  if (!best) return null
  return { algorithm: best.algorithm, score: scoreResult(best), result: best }
})
const minAvgLatency = computed(() => Math.min(...(detail.value?.results ?? []).map((item) => item.avg_latency_ms).filter(Boolean), Infinity))
const minSize = computed(() => Math.min(...(detail.value?.results ?? []).map((item) => item.index_size_bytes).filter(Boolean), Infinity))

const batchColumns = [
  { title: "ID", dataIndex: "id", key: "id", width: 70 },
  { title: "Label", dataIndex: "label", key: "label" },
  { title: "Dataset", dataIndex: "dataset_id", key: "dataset_id", width: 100 },
  { title: "K", dataIndex: "k", key: "k", width: 70 },
  { title: "Queries", dataIndex: "n_queries", key: "n_queries", width: 90 },
  { title: "Created", dataIndex: "created_at", key: "created_at", width: 170 },
  { title: "Action", key: "action", width: 150 },
]

const resultColumns = [
  { title: "Algorithm", dataIndex: "algorithm", key: "algorithm", width: 120 },
  { title: "Recall@K", dataIndex: "recall_at_k", key: "recall_at_k", width: 110 },
  { title: "Avg", dataIndex: "avg_latency_ms", key: "avg_latency_ms", width: 95 },
  { title: "P95", dataIndex: "p95_latency_ms", key: "p95_latency_ms", width: 95 },
  { title: "P99", dataIndex: "p99_latency_ms", key: "p99_latency_ms", width: 95 },
  { title: "QPS", dataIndex: "qps", key: "qps", width: 90 },
  { title: "Build", dataIndex: "build_time_ms", key: "build_time_ms", width: 110 },
  { title: "Index Size", dataIndex: "index_size_bytes", key: "index_size_bytes", width: 120 },
  { title: "Params", dataIndex: "params", key: "params" },
]

async function loadPageData() {
  loading.value = true
  try {
    const [datasetRows, algos] = await Promise.all([listDatasets(), getAlgorithms()])
    datasets.value = datasetRows
    supportedAlgorithms.value = algos
    datasetId.value = datasetId.value ?? datasets.value[0]?.id
    await loadBatches()
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "加载 benchmark 数据失败")
  } finally {
    loading.value = false
  }
}

async function loadBatches() {
  batches.value = await listBenchmarkBatches(datasetId.value)
}

async function run() {
  if (!datasetId.value) return message.warning("请先选择数据集")
  if (!algorithms.value.length) return message.warning("请至少选择一个算法")
  running.value = true
  try {
    detail.value = await runBenchmark({
      dataset_id: datasetId.value,
      label: label.value,
      algorithms: algorithms.value.map((algorithm) => ({ algorithm, params: defaultParams[algorithm] ?? {} })),
      k: k.value,
      n_queries: nQueries.value,
      seed: seed.value,
    })
    await loadBatches()
    message.success("benchmark 完成")
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "benchmark 运行失败")
  } finally {
    running.value = false
  }
}

async function loadDetail(id: number) {
  detail.value = await getBenchmarkBatch(id)
}

async function remove(id: number) {
  await deleteBenchmarkBatch(id)
  if (detail.value?.id === id) detail.value = null
  await loadBatches()
}

function selectAllAlgorithms() {
  algorithms.value = [...allAlgorithmValues.value]
}

function selectRecommendedAlgorithms() {
  algorithms.value = ["hnsw", "ivf", "ivf_pq", "pq"].filter((item) => allAlgorithmValues.value.includes(item))
}

function speedScore(item: BenchmarkResult) {
  if (!Number.isFinite(minAvgLatency.value) || item.avg_latency_ms <= 0) return 0
  return Math.min(1, minAvgLatency.value / item.avg_latency_ms)
}

function memoryScore(item: BenchmarkResult) {
  if (!Number.isFinite(minSize.value) || item.index_size_bytes <= 0) return 0
  return Math.min(1, minSize.value / item.index_size_bytes)
}

function scoreResult(item: BenchmarkResult) {
  const recall = Math.max(0, Math.min(1, item.recall_at_k))
  const score = recall * 0.62 + speedScore(item) * 0.23 + memoryScore(item) * 0.15
  return recall < 0.75 ? score * 0.65 : score
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function ms(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`
  return `${value.toFixed(2)}ms`
}

function bytes(value: number) {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)}MB`
  if (value >= 1024) return `${(value / 1024).toFixed(1)}KB`
  return `${value}B`
}

function shortDate(value: string) {
  return value ? value.replace("T", " ").slice(0, 19) : "-"
}

onMounted(loadPageData)
</script>

<style scoped>
.bench-page {
  min-height: 100%;
  padding: 20px;
  display: grid;
  gap: 16px;
  background: #f3f6fa;
  overflow-x: hidden;
}

.bench-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 22px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0f172a, #1d4ed8 58%, #0f766e);
  color: #fff;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.16);
}

.bench-hero__label {
  color: #bfdbfe;
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.bench-hero h1 {
  margin: 6px 0 6px;
  color: #fff;
  font-size: 1.85rem;
  line-height: 1.15;
}

.bench-hero p {
  margin: 0;
  color: rgba(239, 246, 255, 0.86);
}

.bench-hero__actions {
  display: flex;
  gap: 10px;
}

.bench-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.4fr);
  gap: 16px;
}

.control-panel,
.comparison-card,
.recommend-card,
.tables-grid :deep(.ant-card) {
  min-width: 0;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.control-panel :deep(.ant-input-number) {
  width: 100%;
}

.algorithm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0 10px;
  color: #0f172a;
  font-weight: 800;
}

.algorithm-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.algo-option {
  min-height: 64px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border: 1px solid #dbe5ef;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.algo-option input {
  margin-top: 3px;
}

.algo-option strong,
.algo-option small {
  display: block;
}

.algo-option strong {
  color: #0f172a;
  font-size: 0.9rem;
}

.algo-option small {
  margin-top: 2px;
  color: #64748b;
  line-height: 1.35;
}

.algo-option--active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

.params-preview {
  margin-top: 14px;
  display: grid;
  gap: 6px;
}

.param-row {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  font-size: 0.78rem;
}

.param-row span {
  color: #334155;
  font-weight: 800;
}

.param-row code {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 4px 6px;
  border-radius: 6px;
  color: #1e293b;
  background: #f1f5f9;
}

.result-panel {
  min-width: 0;
  display: grid;
  gap: 16px;
  align-content: start;
}

.recommend-card :deep(.ant-card-body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.recommend-card__main {
  display: grid;
  gap: 3px;
}

.recommend-card__label {
  color: #2563eb;
  font-size: 0.76rem;
  font-weight: 850;
}

.recommend-card__main strong {
  color: #0f172a;
  font-size: 1.7rem;
}

.recommend-card__main span:last-child {
  color: #64748b;
  font-weight: 750;
}

.recommend-card__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(86px, 1fr));
  gap: 10px;
}

.recommend-card__metrics div {
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.recommend-card__metrics small,
.recommend-card__metrics b {
  display: block;
}

.recommend-card__metrics small {
  color: #64748b;
  font-weight: 750;
}

.recommend-card__metrics b {
  margin-top: 4px;
  color: #0f172a;
}

.metric-list {
  display: grid;
  gap: 12px;
}

.metric-row {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.metric-row__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.metric-row__head strong {
  color: #0f172a;
}

.metric-row__head span {
  color: #64748b;
  font-weight: 700;
}

.metric-bars {
  display: grid;
  gap: 7px;
}

.metric-bar {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 82px;
  gap: 10px;
  align-items: center;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 750;
}

.metric-bar b {
  color: #0f172a;
  text-align: right;
}

.tables-grid {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(0, 1.5fr);
  gap: 16px;
  min-width: 0;
}

.tables-grid code {
  display: block;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
}

@media (max-width: 1120px) {
  .bench-grid,
  .tables-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .bench-page {
    padding: 12px;
  }

  .bench-hero,
  .recommend-card :deep(.ant-card-body) {
    align-items: stretch;
    flex-direction: column;
  }

  .bench-hero__actions {
    width: 100%;
  }

  .bench-hero__actions :deep(.ant-btn) {
    flex: 1;
  }

  .algorithm-list,
  .recommend-card__metrics {
    grid-template-columns: 1fr;
  }

  .metric-bar {
    grid-template-columns: 54px minmax(0, 1fr) 72px;
  }
}
</style>
