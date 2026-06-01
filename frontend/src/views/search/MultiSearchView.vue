<template>
  <AppLayout>
    <div class="multi-search-page">
      <div class="page-header">
        <div>
          <div class="page-crumb">检索 / Multi</div>
          <h2>批量检索与过滤策略对比</h2>
        </div>
        <div class="page-meta">
          <span v-if="resourceLoading">资源加载中...</span>
          <span v-else>选择数据集与索引后开始批量检索或策略对比</span>
        </div>
      </div>

      <a-card class="resource-card" :bordered="false">
        <div class="resource-card__title">后端资源</div>
        <a-form layout="vertical">
          <a-row :gutter="16">
            <a-col :xs="24" :md="8">
              <a-form-item label="数据集">
                <a-select
                  v-model:value="selectedDatasetId"
                  :options="datasetOptions"
                  placeholder="选择 ready 数据集"
                  :loading="resourceLoading"
                  @change="onDatasetChange"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="8">
              <a-form-item label="索引">
                <a-select
                  v-model:value="selectedIndexId"
                  :options="indexOptions"
                  placeholder="选择 ready 索引"
                  :loading="resourceLoading"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="8" class="resource-actions">
              <a-button block :loading="resourceLoading" @click="loadResources">刷新资源</a-button>
            </a-col>
          </a-row>
        </a-form>
      </a-card>

      <a-tabs v-model:activeKey="activeTab" class="multi-tabs">
        <a-tab-pane key="batch" tab="批量检索">
          <a-row :gutter="16">
            <a-col :xs="24" :lg="10">
              <a-card class="panel-card" :bordered="false">
                <div class="panel-title">批量检索设置</div>
                <a-form layout="vertical">
                  <a-form-item label="Cell IDs（逗号或换行分隔）">
                    <a-textarea v-model:value="batchCellIds" :auto-size="{ minRows: 4, maxRows: 8 }" placeholder="cell_0001, cell_0002, ..." />
                  </a-form-item>
                  <a-form-item label="聚合策略">
                    <a-select v-model:value="batchAggregate" :options="aggregateOptions" />
                  </a-form-item>
                  <a-form-item label="Metric">
                    <a-select v-model:value="batchMetric" :options="metricOptions" />
                  </a-form-item>
                  <a-form-item label="Top-K">
                    <a-input-number v-model:value="batchK" :min="1" :max="100" class="control-number" />
                  </a-form-item>
                  <a-divider />
                  <a-form-item label="过滤字段">
                    <a-select
                      v-model:value="batchFilterColumn"
                      :options="columnOptions"
                      allow-clear
                      placeholder="例如: cell_type"
                      @change="batchFilterValues = ''"
                    />
                  </a-form-item>
                  <a-form-item label="过滤值（可多个）">
                    <a-input v-model:value="batchFilterValues" placeholder="例如: Type0, Type1" />
                  </a-form-item>
                  <a-button type="primary" block :loading="batchLoading" @click="runBatchSearch">开始批量检索</a-button>
                </a-form>
              </a-card>
            </a-col>
            <a-col :xs="24" :lg="14">
              <a-card class="panel-card" :bordered="false">
                <div class="panel-title">批量检索结果</div>
                <div v-if="batchResult" class="summary-bar">
                  <span>查询数：{{ batchResult.n_queries }}</span>
                  <span>返回：{{ batchResult.n_returned }}</span>
                  <span>总耗时：{{ Number(batchResult.total_latency_ms).toFixed(2) }} ms</span>
                </div>
                <a-table
                  :columns="batchColumns"
                  :data-source="batchRows"
                  row-key="cell_id"
                  :loading="batchLoading"
                  :pagination="false"
                />
                <div v-if="!batchRows.length" class="empty-state">
                  <a-empty description="尚无结果" />
                </div>
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>

        <a-tab-pane key="compare" tab="过滤策略对比">
          <a-row :gutter="16">
            <a-col :xs="24" :lg="10">
              <a-card class="panel-card" :bordered="false">
                <div class="panel-title">策略对比设置</div>
                <a-form layout="vertical">
                  <a-form-item label="查询类型">
                    <a-radio-group v-model:value="compareQueryType">
                      <a-radio value="id">细胞ID</a-radio>
                      <a-radio value="vector">向量</a-radio>
                    </a-radio-group>
                  </a-form-item>
                  <a-form-item :label="compareQueryType === 'id' ? '细胞ID' : '向量（逗号分隔）'">
                    <a-textarea
                      v-if="compareQueryType === 'vector'"
                      v-model:value="compareQuery"
                      :auto-size="{ minRows: 3, maxRows: 5 }"
                      placeholder="例如: 0.12, -0.03, ..."
                    />
                    <a-input v-else v-model:value="compareQuery" placeholder="例如: cell_0042" />
                  </a-form-item>
                  <a-form-item label="过滤字段">
                    <a-select v-model:value="compareFilterColumn" :options="columnOptions" @change="compareFilterValues = ''" />
                  </a-form-item>
                  <a-form-item label="过滤值（必填，可多个）">
                    <a-input v-model:value="compareFilterValues" placeholder="例如: Type0" />
                  </a-form-item>
                  <a-form-item label="Metric">
                    <a-select v-model:value="compareMetric" :options="metricOptions" />
                  </a-form-item>
                  <a-form-item label="Top-K">
                    <a-input-number v-model:value="compareK" :min="1" :max="100" class="control-number" />
                  </a-form-item>
                  <a-form-item label="Oversample">
                    <a-input-number v-model:value="compareOversample" :min="1" :max="100" class="control-number" />
                  </a-form-item>
                  <a-form-item label="策略">
                    <a-select v-model:value="compareStrategies" mode="multiple" :options="strategyOptions" />
                  </a-form-item>
                  <a-button type="primary" block :loading="compareLoading" @click="runCompare">开始对比</a-button>
                </a-form>
              </a-card>
            </a-col>
            <a-col :xs="24" :lg="14">
              <a-card class="panel-card" :bordered="false">
                <div class="panel-title">策略对比结果</div>
                <div v-if="compareResult" class="summary-bar">
                  <span>总细胞：{{ compareResult.n_total_cells }}</span>
                  <span>匹配数：{{ compareResult.n_matching_filter }}</span>
                  <span>选择率：{{ (compareResult.filter_selectivity * 100).toFixed(2) }}%</span>
                </div>
                <a-table
                  :columns="strategyColumns"
                  :data-source="strategyRows"
                  row-key="strategy"
                  :pagination="false"
                  :loading="compareLoading"
                />
                <div class="strategy-detail" v-if="selectedStrategyHits.length">
                  <div class="strategy-detail__head">
                    <span>命中详情</span>
                    <a-select v-model:value="selectedStrategy" :options="strategySelectOptions" size="small" style="min-width: 160px" />
                  </div>
                  <a-table
                    :columns="strategyHitColumns"
                    :data-source="selectedStrategyHits"
                    row-key="cell_id"
                    size="small"
                    :pagination="false"
                  />
                </div>
                <div v-else class="empty-state">
                  <a-empty description="尚无策略结果" />
                </div>
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>
      </a-tabs>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import { batchSearch, compareStrategies, listDatasets, listIndexes, type CompareStrategiesResponse } from "@/api/search"
import request from "@/api/request"
import type { BatchSearchResponse, SearchFilter } from "@/api/search"

const activeTab = ref("batch")
const resourceLoading = ref(false)
const datasets = ref<any[]>([])
const indexes = ref<any[]>([])
const selectedDatasetId = ref<number | undefined>()
const selectedIndexId = ref<number | undefined>()
const obsStats = ref<{ obs_columns: string[]; value_counts: Record<string, Record<string, number>> } | null>(null)

const batchCellIds = ref("")
const batchAggregate = ref("ranked")
const batchMetric = ref("l2")
const batchK = ref(10)
const batchFilterColumn = ref<string | undefined>()
const batchFilterValues = ref("")
const batchResult = ref<BatchSearchResponse | null>(null)
const batchLoading = ref(false)

const compareQueryType = ref<"id" | "vector">("id")
const compareQuery = ref("")
const compareFilterColumn = ref<string | undefined>()
const compareFilterValues = ref("")
const compareMetric = ref("l2")
const compareK = ref(10)
const compareOversample = ref(10)
const compareStrategies = ref<Array<"post" | "pre" | "hybrid">>(["post", "pre", "hybrid"])
const compareResult = ref<CompareStrategiesResponse | null>(null)
const compareLoading = ref(false)
const selectedStrategy = ref("post")

const readyDatasets = computed(() => datasets.value.filter((item) => item.status === "ready"))
const readyIndexes = computed(() => indexes.value.filter((item) => item.status === "ready"))
const datasetOptions = computed(() =>
  readyDatasets.value.map((item: any) => ({
    value: item.id,
    label: `${item.name} (#${item.id}, ${item.n_cells} cells)`
  }))
)
const indexOptions = computed(() =>
  readyIndexes.value.map((item: any) => ({
    value: item.id,
    label: `#${item.id} ${item.algorithm}`
  }))
)

const columnOptions = computed(() => (obsStats.value?.obs_columns ?? []).map((c) => ({ label: c, value: c })))
const aggregateOptions = [
  { label: "ranked", value: "ranked" },
  { label: "union", value: "union" },
  { label: "intersection", value: "intersection" },
]
const metricOptions = [
  { label: "l2", value: "l2" },
  { label: "cosine", value: "cosine" },
]
const strategyOptions = [
  { label: "post", value: "post" },
  { label: "pre", value: "pre" },
  { label: "hybrid", value: "hybrid" },
]

const batchColumns = [
  { title: "Rank", dataIndex: "rank", key: "rank", width: 80 },
  { title: "Cell ID", dataIndex: "cell_id", key: "cell_id" },
  { title: "Avg Dist", dataIndex: "avg_distance", key: "avg_distance", width: 120 },
  { title: "Hit Count", dataIndex: "hit_count", key: "hit_count", width: 110 },
  { title: "Row", dataIndex: "row_index", key: "row_index", width: 90 },
  { title: "Cell Type", dataIndex: "cell_type", key: "cell_type", width: 120 },
]

const strategyColumns = [
  { title: "策略", dataIndex: "strategy", key: "strategy", width: 90 },
  { title: "返回数", dataIndex: "n_returned", key: "n_returned", width: 90 },
  { title: "耗时(ms)", dataIndex: "latency_ms", key: "latency_ms", width: 120 },
  { title: "Recall@K", dataIndex: "recall_at_k", key: "recall_at_k", width: 110 },
  { title: "备注", dataIndex: "note", key: "note" },
]

const strategyHitColumns = [
  { title: "Rank", dataIndex: "rank", key: "rank", width: 70 },
  { title: "Cell ID", dataIndex: "cell_id", key: "cell_id" },
  { title: "Distance", dataIndex: "distance", key: "distance", width: 120 },
  { title: "Row", dataIndex: "row_index", key: "row_index", width: 90 },
  { title: "Cell Type", dataIndex: "cell_type", key: "cell_type", width: 120 },
]

const batchRows = computed(() =>
  (batchResult.value?.hits ?? []).map((hit: any) => ({
    ...hit,
    cell_type: hit.obs?.cell_type ?? "-",
  }))
)

const strategyRows = computed(() =>
  (compareResult.value?.results ?? []).map((item) => ({
    ...item,
    note: item.extra?.skipped_reason ?? "-",
  }))
)

const strategySelectOptions = computed(() =>
  (compareResult.value?.results ?? []).map((r) => ({ label: r.strategy, value: r.strategy }))
)

const selectedStrategyHits = computed(() => {
  const result = compareResult.value?.results.find((r) => r.strategy === selectedStrategy.value)
  return (result?.hits ?? []).map((hit: any) => ({
    ...hit,
    cell_type: hit.obs?.cell_type ?? "-",
  }))
})

async function loadResources() {
  resourceLoading.value = true
  try {
    datasets.value = await listDatasets()
    const initialDatasetId = selectedDatasetId.value ?? readyDatasets.value[0]?.id
    selectedDatasetId.value = initialDatasetId
    indexes.value = await listIndexes(initialDatasetId)
    selectedIndexId.value = readyIndexes.value[0]?.id
    if (initialDatasetId) await fetchObsStats(initialDatasetId)
  } catch (err: any) {
    message.warning(err?.response?.data?.detail ?? err?.message ?? "资源加载失败")
  } finally {
    resourceLoading.value = false
  }
}

async function fetchObsStats(datasetId: number) {
  try {
    obsStats.value = await request.get(`/datasets/${datasetId}/stats`) as any
  } catch {
    obsStats.value = null
  }
}

async function onDatasetChange(datasetId: number) {
  indexes.value = await listIndexes(datasetId)
  selectedIndexId.value = readyIndexes.value[0]?.id
  await fetchObsStats(datasetId)
}

function parseCellIds(raw: string) {
  return raw
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildEqualsFilter(column?: string, valuesText?: string): SearchFilter | undefined {
  const values = parseCellIds(valuesText ?? "")
  if (!column || values.length === 0) return undefined
  return { equals: { [column]: values } }
}

function parseVector(raw: string) {
  return raw
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number)
    .filter((num) => Number.isFinite(num))
}

async function runBatchSearch() {
  if (!selectedIndexId.value) return message.warning("请先选择索引")
  const cellIds = parseCellIds(batchCellIds.value)
  if (!cellIds.length) return message.warning("请输入至少一个 Cell ID")

  batchLoading.value = true
  try {
    const filters = buildEqualsFilter(batchFilterColumn.value, batchFilterValues.value)
    batchResult.value = await batchSearch({
      indexId: selectedIndexId.value,
      cellIds,
      k: batchK.value,
      metric: batchMetric.value as any,
      aggregate: batchAggregate.value as any,
      filters,
    })
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "批量检索失败")
  } finally {
    batchLoading.value = false
  }
}

async function runCompare() {
  if (!selectedIndexId.value) return message.warning("请先选择索引")
  if (!compareFilterColumn.value || !compareFilterValues.value.trim()) {
    return message.warning("过滤条件不能为空")
  }

  const filters = buildEqualsFilter(compareFilterColumn.value, compareFilterValues.value)
  if (!filters) return message.warning("过滤条件不能为空")

  compareLoading.value = true
  try {
    const payload: any = {
      indexId: selectedIndexId.value,
      k: compareK.value,
      filters,
      metric: compareMetric.value,
      strategies: compareStrategies.value,
      oversample: compareOversample.value,
    }
    if (compareQueryType.value === "vector") {
      payload.vector = parseVector(compareQuery.value)
    } else {
      payload.cellId = compareQuery.value.trim()
    }
    if (!payload.cellId && (!payload.vector || payload.vector.length === 0)) {
      return message.warning("请输入查询内容")
    }

    compareResult.value = await compareStrategies(payload)
    selectedStrategy.value = compareResult.value.results[0]?.strategy ?? "post"
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "策略对比失败")
  } finally {
    compareLoading.value = false
  }
}

onMounted(loadResources)
</script>

<style scoped>
.multi-search-page {
  position: relative;
  min-height: 100%;
  display: grid;
  gap: 16px;
  padding: 12px 0 8px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-crumb {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #64748b;
  text-transform: uppercase;
}

.page-header h2 {
  margin: 4px 0 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.page-meta {
  color: #64748b;
  font-size: 0.92rem;
  font-weight: 600;
}

.resource-card {
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.05),
    0 5px 14px rgba(15, 23, 42, 0.04);
}

.resource-card__title {
  margin-bottom: 12px;
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.resource-actions {
  display: flex;
  align-items: flex-end;
}

.multi-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}

.panel-card {
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 24px 54px rgba(15, 23, 42, 0.06),
    0 8px 16px rgba(15, 23, 42, 0.04);
}

.panel-title {
  font-weight: 800;
  margin-bottom: 12px;
  color: #0f172a;
}

.summary-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #475569;
}

.strategy-detail {
  margin-top: 14px;
}

.strategy-detail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 700;
  color: #0f172a;
}

.empty-state {
  margin-top: 12px;
}

.control-number {
  width: 100%;
}

@media (max-width: 992px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

.multi-search-page {
  min-height: 100%;
  align-content: start;
  padding: 18px;
  background: #ffffff;
  border: 1px solid var(--bio-line);
}

.page-header {
  min-height: 68px;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px 14px;
  border-bottom: 1px solid var(--bio-line);
}

.page-crumb {
  color: var(--bio-muted);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.06em;
}

.page-header h2 {
  color: var(--bio-navy);
  font-size: 21px;
  font-weight: 850;
}

.page-meta {
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--bio-panel-muted);
  color: #52667c;
  font-size: 12px;
  font-weight: 800;
}

.resource-card,
.panel-card {
  border-radius: 9px;
  border: 1px solid var(--bio-line);
  background: var(--bio-panel);
  box-shadow: none;
}

.resource-card__title,
.panel-title {
  color: var(--bio-navy);
  font-weight: 850;
}

.multi-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 14px;
  border-bottom: 1px solid var(--bio-line);
}
</style>
