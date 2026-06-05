<template>
  <AppLayout>
    <div class="multi-search-page workbench-page workbench-page--grid">
      <div class="page-header workbench-page__header">
        <div class="page-title">
          <span class="page-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M11 4a7 7 0 105.196 11.688L20 20.5" />
              <path d="M7 4a7 7 0 105.196 11.688" opacity="0.4" />
            </svg>
          </span>
          <div>
            <div class="page-crumb workbench-page__eyebrow">Multi Search</div>
            <h2 class="workbench-page__title">批量检索与过滤策略对比</h2>
          </div>
        </div>
        <div class="workbench-page__pill">
          <span v-if="resourceLoading">资源加载中...</span>
          <span v-else>选择数据集与索引后开始批量检索</span>
        </div>
      </div>

      <a-card class="resource-card workbench-panel" :bordered="false">
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
              <a-button block type="primary" :loading="resourceLoading" @click="loadResources">刷新资源</a-button>
            </a-col>
          </a-row>
        </a-form>
      </a-card>

      <a-tabs v-model:activeKey="activeTab" class="multi-tabs">
        <a-tab-pane key="batch" tab="批量检索">
          <a-row :gutter="16">
            <a-col :xs="24" :lg="10">
              <a-card class="panel-card workbench-panel" :bordered="false">
                <div class="panel-title workbench-section-title">批量检索设置</div>
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
                      @change="batchFilterValues = []; batchFilterValuesText = ''"
                    />
                  </a-form-item>
                  <a-form-item label="过滤值（可多个）">
                    <a-select
                      v-if="batchValueOptions.length"
                      v-model:value="batchFilterValues"
                      mode="multiple"
                      :options="batchValueOptions"
                      placeholder="选择过滤值"
                      style="width: 100%"
                    />
                    <a-input v-else v-model:value="batchFilterValuesText" placeholder="例如: Type0, Type1" />
                  </a-form-item>
                  <a-button type="primary" block :loading="batchLoading" @click="runBatchSearch">开始批量检索</a-button>
                </a-form>
              </a-card>
            </a-col>
            <a-col :xs="24" :lg="14">
              <a-card class="panel-card result-card workbench-panel" :bordered="false">
                <div class="panel-title workbench-section-title">批量检索结果</div>
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
                <div v-if="!batchRows.length && !batchLoading" class="empty-state">
                  <a-empty description="尚无结果" />
                </div>
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>

        <a-tab-pane key="compare" tab="过滤策略对比">
          <a-row :gutter="16">
            <a-col :xs="24" :lg="10">
              <a-card class="panel-card workbench-panel" :bordered="false">
                <div class="panel-title workbench-section-title">策略对比设置</div>
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
                    <a-select v-model:value="compareFilterColumn" :options="columnOptions" @change="compareFilterValues = []; compareFilterValuesText = ''" />
                  </a-form-item>
                  <a-form-item label="过滤值（必填，可多个）">
                    <a-select
                      v-if="compareValueOptions.length"
                      v-model:value="compareFilterValues"
                      mode="multiple"
                      :options="compareValueOptions"
                      placeholder="选择过滤值"
                      style="width: 100%"
                    />
                    <a-input v-else v-model:value="compareFilterValuesText" placeholder="例如: Type0" />
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
              <a-card class="panel-card result-card workbench-panel" :bordered="false">
                <div class="panel-title workbench-section-title">策略对比结果</div>
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
                <div v-if="!compareResult" class="empty-state">
                  <a-empty description="尚无策略结果" />
                </div>
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
import { batchSearch, compareStrategies as compareStrategiesApi, listDatasets, listIndexes, type CompareStrategiesResponse } from "@/api/search"
import request from "@/api/request"
import type { BatchSearchResponse, SearchFilter } from "@/api/search"
import { showErrMsg } from "@/utils/error"

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
const batchFilterValues = ref<string[]>([])
const batchFilterValuesText = ref("")
const batchResult = ref<BatchSearchResponse | null>(null)
const batchLoading = ref(false)

const compareQueryType = ref<"id" | "vector">("id")
const compareQuery = ref("")
const compareFilterColumn = ref<string | undefined>()
const compareFilterValues = ref<string[]>([])
const compareFilterValuesText = ref("")
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
const batchValueOptions = computed(() => {
  if (!batchFilterColumn.value || !obsStats.value?.value_counts[batchFilterColumn.value]) return []
  return Object.keys(obsStats.value.value_counts[batchFilterColumn.value]).map((v) => ({ label: v, value: v }))
})
const compareValueOptions = computed(() => {
  if (!compareFilterColumn.value || !obsStats.value?.value_counts[compareFilterColumn.value]) return []
  return Object.keys(obsStats.value.value_counts[compareFilterColumn.value]).map((v) => ({ label: v, value: v }))
})
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
  { title: "排名", dataIndex: "rank", key: "rank", width: 80 },
  { title: "细胞 ID", dataIndex: "cell_id", key: "cell_id" },
  { title: "平均距离", dataIndex: "avg_distance", key: "avg_distance", width: 120 },
  { title: "命中数", dataIndex: "hit_count", key: "hit_count", width: 110 },
  { title: "行号", dataIndex: "row_index", key: "row_index", width: 90 },
  { title: "细胞类型", dataIndex: "cell_type", key: "cell_type", width: 120 },
]

const strategyColumns = [
  { title: "策略", dataIndex: "strategy", key: "strategy", width: 90 },
  { title: "返回数", dataIndex: "n_returned", key: "n_returned", width: 90 },
  { title: "耗时(ms)", dataIndex: "latency_ms", key: "latency_ms", width: 120 },
  { title: "Recall@K", dataIndex: "recall_at_k", key: "recall_at_k", width: 110 },
]

const strategyHitColumns = [
  { title: "排名", dataIndex: "rank", key: "rank", width: 70 },
  { title: "细胞 ID", dataIndex: "cell_id", key: "cell_id" },
  { title: "距离", dataIndex: "distance", key: "distance", width: 120 },
  { title: "行号", dataIndex: "row_index", key: "row_index", width: 90 },
  { title: "细胞类型", dataIndex: "cell_type", key: "cell_type", width: 120 },
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
    if (selectedDatasetId.value) {
      indexes.value = await listIndexes(selectedDatasetId.value)
      await fetchObsStats(selectedDatasetId.value)
    }
  } catch (err: any) {
    showErrMsg(err, "加载资源失败")
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

function buildEqualsFilter(column?: string, values?: string[]): SearchFilter | undefined {
  if (!column || !values?.length) return undefined
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
    const batchVals = batchValueOptions.value.length ? batchFilterValues.value : batchFilterValuesText.value.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
    const filters = buildEqualsFilter(batchFilterColumn.value, batchVals)
    batchResult.value = await batchSearch({
      indexId: selectedIndexId.value,
      cellIds,
      k: batchK.value,
      metric: batchMetric.value as any,
      aggregate: batchAggregate.value as any,
      filters,
    })
  } catch (err: any) {
    showErrMsg(err, "批量检索失败")
  } finally {
    batchLoading.value = false
  }
}

async function runCompare() {
  if (!selectedIndexId.value) return message.warning("请先选择索引")
  const compareVals = compareValueOptions.value.length ? compareFilterValues.value : compareFilterValuesText.value.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
  if (!compareFilterColumn.value || !compareVals.length) {
    return message.warning("过滤条件不能为空")
  }

  const filters = buildEqualsFilter(compareFilterColumn.value, compareVals)
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

    compareResult.value = await compareStrategiesApi(payload)
    selectedStrategy.value = compareResult.value.results[0]?.strategy ?? "post"
  } catch (err: any) {
    showErrMsg(err, "策略对比失败")
  } finally {
    compareLoading.value = false
  }
}

onMounted(loadResources)
</script>

<style scoped>
/* ── Page shell ────────────────────────────────────── */
.multi-search-page {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 18px;
  gap: 16px;
  background: #ffffff;
  border: 1px solid var(--bio-line);
}

/* ── Resource card ───────────────────────────────────── */
.resource-card { flex-shrink: 0; }
.resource-actions { display: flex; align-items: flex-end; padding-bottom: 24px; }

/* ── Tabs ────────────────────────────────────────────── */
.multi-tabs {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
}
.multi-tabs :deep(.ant-tabs-content-holder) { flex: 1; min-height: 0; }
.multi-tabs :deep(.ant-tabs-content) { height: 100%; }
.multi-tabs :deep(.ant-tabs-tabpane) { height: 100%; overflow: hidden; }
.multi-tabs :deep(.ant-tabs-nav) { margin-bottom: 12px; border-bottom: 1px solid var(--bio-line); }
.multi-tabs :deep(.ant-tabs-tabpane > .ant-row) {
  display: grid !important;
  grid-template-columns: minmax(340px, 420px) minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
  height: 100%;
}
.multi-tabs :deep(.ant-tabs-tabpane > .ant-row > .ant-col) {
  width: auto; max-width: none; flex: none; display: flex; flex-direction: column;
}
/* ── Panel cards ─────────────────────────────────────── */
.panel-card { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.panel-card :deep(.ant-card-body) { flex: 1; min-height: 0; overflow-y: auto; }
/* 结果面板：和左边等高，内部 padding 紧凑 */
.result-card :deep(.ant-card-body) { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 14px; }

/* ── Result areas ────────────────────────────────────── */
.summary-bar {
  display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 12px;
  padding: 8px 12px; border-radius: 9px; background: var(--bio-panel-muted);
  border: 1px solid var(--bio-line); font-weight: 600; color: var(--bio-muted); font-size: 13px;
}
.strategy-detail { margin-top: 14px; }
.strategy-detail__head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px; font-weight: 700; color: var(--bio-navy); font-size: 13px;
}
.empty-state { margin-top: 12px; }
.control-number { width: 100%; }

@media (max-width: 992px) {
  .multi-tabs :deep(.ant-tabs-tabpane > .ant-row) { grid-template-columns: 1fr; }
}
</style>
