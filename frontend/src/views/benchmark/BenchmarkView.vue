<template>
  <AppLayout>
    <div class="benchmark-page workbench-page workbench-page--grid">
      <div class="page-header workbench-page__header">
        <div class="page-title">
          <span class="page-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
              <path d="M12 7v5l3 3" />
            </svg>
          </span>
          <div>
            <div class="page-crumb workbench-page__eyebrow">Performance Lab</div>
            <h2 class="workbench-page__title">算法性能评测</h2>
          </div>
        </div>
        <div class="workbench-page__pill">评测 ANN 算法的召回率与延迟</div>
      </div>

      <a-row :gutter="16" class="benchmark-grid">
        <a-col v-if="auth.canResearch" :xs="24" :lg="8">
          <a-card class="panel-card workbench-panel" :bordered="false" title="运行评测">
            <a-form layout="vertical">
              <a-form-item label="数据集">
                <a-select v-model:value="runDatasetId" :options="datasetOptions" placeholder="选择数据集" />
              </a-form-item>
              <a-form-item label="标签（可选）">
                <a-input v-model:value="runLabel" placeholder="例如: run-A" />
              </a-form-item>
              <a-row :gutter="12">
                <a-col :span="12">
                  <a-form-item label="Top-K">
                    <a-input-number v-model:value="runK" :min="1" :max="100" class="control-number" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="查询数量">
                    <a-input-number v-model:value="runQueries" :min="1" :max="10000" class="control-number" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item label="随机种子">
                <a-input-number v-model:value="runSeed" :min="1" :max="9999" class="control-number" />
              </a-form-item>

              <div class="algo-section">
                <div class="algo-section__title">算法组合</div>
                <div class="algo-card-list">
                  <div v-for="(cfg, idx) in algoConfigs" :key="idx" class="algo-card">
                    <a-form-item label="算法">
                      <a-select v-model:value="cfg.algorithm" :options="algorithmOptions" />
                    </a-form-item>
                    <a-form-item label="参数 JSON">
                      <a-input v-model:value="cfg.paramsText" placeholder='{ "M": 16 }' />
                    </a-form-item>
                    <a-button type="primary" danger size="small" @click="removeAlgo(idx)" :disabled="algoConfigs.length <= 1">删除</a-button>
                  </div>
                </div>
                <a-button type="dashed" block @click="addAlgo">添加算法</a-button>
              </div>

              <a-button type="primary" block :loading="runLoading" @click="runBenchmark">开始评测</a-button>
            </a-form>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="16">
          <a-card class="panel-card workbench-panel" :bordered="false" title="评测批次">
            <div class="table-toolbar workbench-table-toolbar">
              <a-select v-model:value="filterDatasetId" :options="datasetOptions" allow-clear placeholder="按数据集过滤" style="min-width: 200px" />
              <a-input v-model:value="filterLabel" placeholder="标签关键词" style="min-width: 200px" />
              <a-button type="primary" @click="loadBatches" :loading="listLoading">查询</a-button>
            </div>
            <a-table
              :columns="batchColumns"
              :data-source="batches"
              row-key="id"
              :loading="listLoading"
              :pagination="false"
              :customRow="rowClick"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'dataset_id'">
                  {{ datasetName(record.dataset_id) }}
                </template>
                <template v-if="column.key === 'actions'">
                  <a-space>
                    <a-button size="small" @click.stop="selectBatch(record.id)">详情</a-button>
                    <a-popconfirm v-if="auth.canResearch" title="确定删除该批次？" @confirm="deleteBatch(record.id)">
                      <a-button size="small" type="primary" danger>删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>

          <a-card v-if="selectedBatch" class="panel-card detail-card workbench-panel" :bordered="false" title="批次详情">
            <div class="detail-meta">
              <span>批次 #{{ selectedBatch.id }}</span>
              <span>数据集：{{ datasetName(selectedBatch.dataset_id) }}</span>
              <span>k={{ selectedBatch.k }}, n={{ selectedBatch.n_queries }}</span>
            </div>
            <BenchmarkChart :results="selectedBatch.results" :k="selectedBatch.k" />
            <a-table
              class="result-table"
              :columns="resultColumns"
              :data-source="selectedBatch.results"
              row-key="id"
              :pagination="false"
              size="small"
            />
          </a-card>
        </a-col>
      </a-row>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import { useAuthStore } from "@/stores/auth"
const auth = useAuthStore()
import BenchmarkChart from "@/components/benchmark/BenchmarkChart.vue"
import { listDatasets } from "@/api/search"
import { getAlgorithms } from "@/api/indexes"
import {
  deleteBenchmarkBatch,
  getBenchmarkBatch,
  listBenchmarkBatches,
  runBenchmark as runBenchmarkApi,
  type BenchmarkBatchDetail,
  type BenchmarkBatchItem,
} from "@/api/benchmark"
import { showErrMsg } from "@/utils/error"

const datasets = ref<any[]>([])
const algorithms = ref<string[]>([])
const runDatasetId = ref<number | undefined>()
const runLabel = ref("")
const runK = ref(10)
const runQueries = ref(100)
const runSeed = ref(42)
const algoConfigs = ref<Array<{ algorithm: string; paramsText: string }>>([
  { algorithm: "", paramsText: "{}" },
])
const runLoading = ref(false)

const batches = ref<BenchmarkBatchItem[]>([])
const listLoading = ref(false)
const filterDatasetId = ref<number | undefined>()
const filterLabel = ref("")
const selectedBatch = ref<BenchmarkBatchDetail | null>(null)

const datasetOptions = computed(() => datasets.value.map((d: any) => ({ label: d.name, value: d.id })))
const algorithmOptions = computed(() => algorithms.value.map((a) => ({ label: a, value: a })))

const batchColumns = [
  { title: "编号", dataIndex: "id", key: "id", width: 80 },
  { title: "标签", dataIndex: "label", key: "label" },
  { title: "数据集", dataIndex: "dataset_id", key: "dataset_id" },
  { title: "K 值", dataIndex: "k", key: "k", width: 70 },
  { title: "查询数", dataIndex: "n_queries", key: "n_queries", width: 90 },
  { title: "创建时间", dataIndex: "created_at", key: "created_at", width: 140 },
  { title: "操作", key: "actions", width: 150 },
]

const resultColumns = [
  { title: "算法", dataIndex: "algorithm", key: "algorithm" },
  { title: "Recall@K", dataIndex: "recall_at_k", key: "recall_at_k", width: 110 },
  { title: "平均延迟(ms)", dataIndex: "avg_latency_ms", key: "avg_latency_ms", width: 120 },
  { title: "P95", dataIndex: "p95_latency_ms", key: "p95_latency_ms", width: 90 },
  { title: "QPS", dataIndex: "qps", key: "qps", width: 90 },
  { title: "构建(ms)", dataIndex: "build_time_ms", key: "build_time_ms", width: 110 },
]

function datasetName(id: number) {
  return datasets.value.find((d: any) => d.id === id)?.name ?? `#${id}`
}

function rowClick(record: any) {
  return {
    onClick: () => selectBatch(record.id),
  }
}

function addAlgo() {
  algoConfigs.value.push({ algorithm: algorithms.value[0] ?? "flat", paramsText: "{}" })
}

function removeAlgo(idx: number) {
  if (algoConfigs.value.length <= 1) return
  algoConfigs.value.splice(idx, 1)
}

async function loadResources(silent = false) {
  try {
    const [ds, algos] = await Promise.all([listDatasets(), getAlgorithms()])
    datasets.value = ds
    algorithms.value = algos
    if (algos.length > 0 && !algoConfigs.value[0].algorithm) {
      algoConfigs.value[0].algorithm = algos[0]
    }
  } catch (err: any) {
    if (!silent) showErrMsg(err, "加载资源失败")
    throw err
  }
}

async function loadBatches(silent = false) {
  listLoading.value = true
  try {
    batches.value = await listBenchmarkBatches({
      dataset_id: filterDatasetId.value,
      label: filterLabel.value || undefined,
    })
  } catch (err: any) {
    if (!silent) showErrMsg(err, "加载批次失败")
    throw err
  } finally {
    listLoading.value = false
  }
}

async function selectBatch(batchId: number) {
  try {
    selectedBatch.value = await getBenchmarkBatch(batchId)
  } catch (err: any) {
    showErrMsg(err, "获取批次详情失败")
  }
}

async function deleteBatch(batchId: number) {
  try {
    await deleteBenchmarkBatch(batchId)
    message.success("批次已删除")
    if (selectedBatch.value?.id === batchId) selectedBatch.value = null
    await loadBatches()
  } catch (err: any) {
    showErrMsg(err, "删除失败")
  }
}

async function runBenchmark() {
  if (!runDatasetId.value) return message.warning("请选择数据集")
  let algorithmsPayload: any[] = []
  try {
    algorithmsPayload = algoConfigs.value.map((cfg) => ({
      algorithm: cfg.algorithm,
      params: cfg.paramsText ? JSON.parse(cfg.paramsText) : {},
    }))
  } catch {
    return message.warning("算法参数必须是有效 JSON")
  }

  runLoading.value = true
  try {
    const batch = await runBenchmarkApi({
      dataset_id: runDatasetId.value,
      label: runLabel.value,
      algorithms: algorithmsPayload,
      k: runK.value,
      n_queries: runQueries.value,
      seed: runSeed.value,
    })
    message.success("评测任务完成")
    selectedBatch.value = batch
    await loadBatches()
  } catch (err: any) {
    showErrMsg(err, "评测失败")
  } finally {
    runLoading.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadResources(true), loadBatches(true)])
  } catch (err: any) {
    showErrMsg(err, "加载失败")
  }
})
</script>

<style scoped>
/* ── Page shell ────────────────────────────────────── */
.benchmark-page {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 18px;
  gap: 12px;
  background: #ffffff;
  border: 1px solid var(--bio-line);
}

.workbench-page__title, .benchmark-page__header h2, .page-header h2 { margin: 3px 0 0; font-size: 1.3rem; font-weight: 800; color: var(--bio-navy); }

/* ── Grid ────────────────────────────────────────────── */
.benchmark-grid {
  flex: 1; min-height: 0;
  display: grid !important;
  grid-template-columns: minmax(320px, 400px) minmax(0, 1fr);
  gap: 14px; align-items: stretch;
}
.benchmark-grid :deep(.ant-col) { width: auto; max-width: none; flex: none; display: flex; flex-direction: column; }

/* ── Cards ───────────────────────────────────────────── */
.panel-card { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.panel-card :deep(.ant-card-body) { flex: 1; min-height: 0; overflow-y: auto; }

.detail-card { flex: 0 0 auto; margin-top: 14px; }

/* ── Algo config ─────────────────────────────────────── */
.algo-section { margin-bottom: 14px; }
.algo-section__title {
  font-size: 11px; font-weight: 700; color: var(--bio-muted);
  margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.06em;
}
.algo-card-list {
  display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;
  max-height: 280px; overflow-y: auto;
}
.algo-card { padding: 12px 14px; border-radius: 9px; background: var(--bio-panel-muted); border: 1px solid var(--bio-line); }

/* ── Toolbar / meta ──────────────────────────────────── */
.table-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 14px; }
.detail-meta {
  display: flex; flex-wrap: wrap; gap: 12px;
  padding: 8px 12px; border-radius: 9px;
  background: var(--bio-panel-muted); border: 1px solid var(--bio-line);
  font-weight: 600; color: var(--bio-muted); font-size: 13px; margin-bottom: 12px;
}
.control-number { width: 100%; }

@media (max-width: 992px) { .benchmark-grid { grid-template-columns: 1fr; } }
</style>
