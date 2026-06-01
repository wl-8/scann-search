<template>
  <AppLayout>
    <div class="benchmark-page">
      <div class="benchmark-page__header">
        <div>
          <div class="benchmark-page__eyebrow">Performance Lab</div>
          <h2>算法性能评测</h2>
        </div>
        <p>选择数据集与算法组合，生成召回率/延迟对比。</p>
      </div>

      <a-row :gutter="16">
        <a-col :xs="24" :lg="8">
          <a-card class="panel-card" :bordered="false" title="运行评测">
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
                <div v-for="(cfg, idx) in algoConfigs" :key="idx" class="algo-card">
                  <a-form-item label="算法">
                    <a-select v-model:value="cfg.algorithm" :options="algorithmOptions" />
                  </a-form-item>
                  <a-form-item label="参数 JSON">
                    <a-input v-model:value="cfg.paramsText" placeholder='{ "M": 16 }' />
                  </a-form-item>
                  <a-button danger size="small" @click="removeAlgo(idx)" :disabled="algoConfigs.length <= 1">删除</a-button>
                </div>
                <a-button type="dashed" block @click="addAlgo">添加算法</a-button>
              </div>

              <a-button type="primary" block :loading="runLoading" @click="runBenchmark">开始评测</a-button>
            </a-form>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="16">
          <a-card class="panel-card" :bordered="false" title="评测批次">
            <div class="table-toolbar">
              <a-select v-model:value="filterDatasetId" :options="datasetOptions" allow-clear placeholder="按数据集过滤" style="min-width: 200px" />
              <a-input v-model:value="filterLabel" placeholder="标签关键词" style="min-width: 200px" />
              <a-button @click="loadBatches" :loading="listLoading">查询</a-button>
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
                    <a-popconfirm title="确定删除该批次？" @confirm="deleteBatch(record.id)">
                      <a-button size="small" danger>删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>

          <a-card v-if="selectedBatch" class="panel-card detail-card" :bordered="false" title="批次详情">
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

const datasets = ref<any[]>([])
const algorithms = ref<string[]>([])
const runDatasetId = ref<number | undefined>()
const runLabel = ref("")
const runK = ref(10)
const runQueries = ref(100)
const runSeed = ref(42)
const algoConfigs = ref<Array<{ algorithm: string; paramsText: string }>>([
  { algorithm: "flat", paramsText: "{}" },
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
  { title: "ID", dataIndex: "id", key: "id", width: 80 },
  { title: "Label", dataIndex: "label", key: "label" },
  { title: "Dataset", dataIndex: "dataset_id", key: "dataset_id" },
  { title: "K", dataIndex: "k", key: "k", width: 70 },
  { title: "Queries", dataIndex: "n_queries", key: "n_queries", width: 90 },
  { title: "Created", dataIndex: "created_at", key: "created_at", width: 140 },
  { title: "操作", key: "actions", width: 150 },
]

const resultColumns = [
  { title: "Algorithm", dataIndex: "algorithm", key: "algorithm" },
  { title: "Recall@K", dataIndex: "recall_at_k", key: "recall_at_k", width: 110 },
  { title: "Avg Latency", dataIndex: "avg_latency_ms", key: "avg_latency_ms", width: 120 },
  { title: "P95", dataIndex: "p95_latency_ms", key: "p95_latency_ms", width: 90 },
  { title: "QPS", dataIndex: "qps", key: "qps", width: 90 },
  { title: "Build (ms)", dataIndex: "build_time_ms", key: "build_time_ms", width: 110 },
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

async function loadResources() {
  try {
    const [ds, algos] = await Promise.all([listDatasets(), getAlgorithms()])
    datasets.value = ds
    algorithms.value = algos
    if (!runDatasetId.value) runDatasetId.value = ds[0]?.id
  } catch {
    message.error("加载资源失败，请确认后端已启动")
  }
}

async function loadBatches() {
  listLoading.value = true
  try {
    batches.value = await listBenchmarkBatches({
      dataset_id: filterDatasetId.value,
      label: filterLabel.value || undefined,
    })
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "加载批次失败")
  } finally {
    listLoading.value = false
  }
}

async function selectBatch(batchId: number) {
  try {
    selectedBatch.value = await getBenchmarkBatch(batchId)
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "获取批次详情失败")
  }
}

async function deleteBatch(batchId: number) {
  try {
    await deleteBenchmarkBatch(batchId)
    message.success("批次已删除")
    if (selectedBatch.value?.id === batchId) selectedBatch.value = null
    await loadBatches()
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "删除失败")
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
    message.error(err?.response?.data?.detail ?? err?.message ?? "评测失败")
  } finally {
    runLoading.value = false
  }
}

onMounted(async () => {
  await loadResources()
  await loadBatches()
})
</script>

<style scoped>
.benchmark-page {
  position: relative;
  min-height: 100%;
  display: grid;
  gap: 16px;
  padding: 18px 0 8px;
}

.benchmark-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.benchmark-page__eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #007bff;
}

.benchmark-page__header h2 {
  margin: 6px 0 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.benchmark-page__header p {
  margin: 0;
  max-width: 520px;
  color: #64748b;
  line-height: 1.6;
}

.panel-card {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 24px 54px rgba(15, 23, 42, 0.06),
    0 8px 16px rgba(15, 23, 42, 0.04);
}

.algo-section {
  margin-bottom: 14px;
}

.algo-section__title {
  font-weight: 800;
  margin-bottom: 8px;
  color: #0f172a;
}

.algo-card {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #f8fafc;
  margin-bottom: 10px;
}

.table-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.detail-card {
  margin-top: 16px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 12px;
}

.control-number {
  width: 100%;
}

@media (max-width: 992px) {
  .benchmark-page__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
