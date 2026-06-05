<template>
  <AppLayout>
    <div class="search-page workbench-page workbench-page--grid">
      <div class="page-header workbench-page__header">
        <div class="page-title">
          <span class="page-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M11 4a7 7 0 105.196 11.688L20 20.5" />
            </svg>
          </span>
          <div>
            <div class="page-crumb workbench-page__eyebrow">ANN Search</div>
            <h2 class="workbench-page__title">单细胞 ANN 检索</h2>
          </div>
        </div>
        <div class="workbench-page__pill">
          <span v-if="loading">检索中...</span>
          <span v-else-if="lastElapsed !== null">后端耗时：{{ Number(lastElapsed).toFixed(2) }} ms，返回 {{ results.length }} 条</span>
          <span v-else>选择数据集和索引后开始检索</span>
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
              <a-button block type="primary" @click="loadResources" :loading="resourceLoading">刷新资源</a-button>
            </a-col>
          </a-row>
        </a-form>
      </a-card>

    <div class="search-layout">
      <div class="search-column search-column--form">
        <SearchForm v-model:modelValue="formData" :obsStats="obsStats" @submit="onSearch" />
      </div>

      <div class="search-column search-column--results">
        <a-card class="results-card workbench-panel" :bordered="false">
          <div class="results-card__toolbar">
            <div class="toolbar-band workbench-control-band">
              <div class="toolbar-band__group toolbar-band__group--meta">
                <span class="toolbar-label">当前索引</span>
                <span v-if="selectedIndexId" class="toolbar-value">#{{ selectedIndexId }}</span>
                <span v-else class="toolbar-value toolbar-value--empty">未选择</span>
              </div>
            </div>
          </div>

          <div class="results-card__body">
            <a-alert
              v-if="!selectedIndexId"
              type="info"
              show-icon
              message="请先选择一个索引后再执行检索。"
              style="margin: 8px 0 12px"
            />
            <a-table
              class="results-table"
              :columns="columns"
              :data-source="results"
              :loading="loading"
              :pagination="false"
              row-key="rank"
              bordered
            >
              <template #expandedRowRender="{ record }">
                <a-descriptions bordered column="2" size="small" class="result-details">
                  <a-descriptions-item label="Cell ID">{{ record.id }}</a-descriptions-item>
                  <a-descriptions-item label="Row Index">{{ record.row_index }}</a-descriptions-item>
                  <a-descriptions-item label="Distance">{{ record.distance }}</a-descriptions-item>
                  <a-descriptions-item label="Cell Type">{{ record.cell_type }}</a-descriptions-item>
                  <a-descriptions-item label="Obs" :span="2">
                    <pre class="details-pre">{{ JSON.stringify(record.obs ?? record.metadata, null, 2) }}</pre>
                  </a-descriptions-item>
                </a-descriptions>
              </template>
            </a-table>

            <div v-if="!results.length" class="empty-state">
              <a-empty description="尚无结果。请先发起检索。" />
            </div>
          </div>
        </a-card>
      </div>
    </div>
  </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import SearchForm from "@/components/search/SearchForm.vue"
import { listDatasets, listIndexes } from "@/api/search"
import request from "@/api/request"
import { useSearch } from "@/composables/useSearch"
import type { DatasetItem, IndexItem, SearchPayload } from "@/api/search"
import { showErrMsg } from "@/utils/error"

const { loading, search } = useSearch()
const results = ref<Array<any>>([])
const lastElapsed = ref<number | null>(null)
const resourceLoading = ref(false)
const datasets = ref<DatasetItem[]>([])
const indexes = ref<IndexItem[]>([])
const selectedDatasetId = ref<number | undefined>()
const selectedIndexId = ref<number | undefined>()
const obsStats = ref<{ obs_columns: string[]; value_counts: Record<string, Record<string, number>> } | null>(null)

const formData = ref<SearchPayload & { filters: { cell_type: string } }>({
  queryType: "id",
  query: "",
  k: 10,
  oversample: 10,
  filterColumn: undefined,
  filterValue: undefined,
  filters: { cell_type: "" },
})

const columns = [
  { title: "排名", dataIndex: "rank", key: "rank", width: 80 },
  { title: "细胞 ID", dataIndex: "id", key: "id" },
  { title: "距离", dataIndex: "distance", key: "distance", width: 120 },
  { title: "细胞类型", dataIndex: "cell_type", key: "cell_type", width: 140 },
  { title: "行号", dataIndex: "row_index", key: "row_index", width: 100 },
]

const readyDatasets = computed(() => datasets.value.filter((item) => item.status === "ready"))
const readyIndexes = computed(() => indexes.value.filter((item) => item.status === "ready"))
const datasetOptions = computed(() =>
  readyDatasets.value.map((item) => ({
    value: item.id,
    label: `${item.name} (#${item.id}, ${item.n_cells} cells, dim=${item.vector_dim})`,
  }))
)
const indexOptions = computed(() =>
  readyIndexes.value.map((item) => ({
    value: item.id,
    label: `#${item.id} ${item.algorithm} (${item.n_vectors} vectors, dim=${item.vector_dim})`,
  }))
)

async function onSearch(payload: any) {
  if (!selectedIndexId.value) {
    message.warning("请先选择索引")
    return
  }
  try {
    const res = await search({
      ...payload,
      datasetId: selectedDatasetId.value,
      indexId: selectedIndexId.value,
    })
    results.value = res.results
    lastElapsed.value = res.elapsed
  } catch (err: any) {
    showErrMsg(err, "检索失败")
  }
}

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

onMounted(loadResources)
</script>

<style scoped>
/* ── Page shell ────────────────────────────────────── */
.search-page {
  min-height: 100%;
  padding: 18px;
  background: #ffffff;
  border: 1px solid var(--bio-line);
}

/* ── Layout ──────────────────────────────────────────── */
.search-layout {
  display: grid;
  grid-template-columns: minmax(320px, 390px) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}
.search-column { min-width: 0; display: flex; flex-direction: column; }

/* ── Cards ───────────────────────────────────────────── */
.results-card { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.results-card :deep(.ant-card-body) { flex: 1; min-height: 0; overflow-y: auto; padding: 0; }

/* ── Results card toolbar ────────────────────────────── */
.results-card__toolbar { padding: 12px 16px; border-bottom: 1px solid var(--bio-line); }
.toolbar-band { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 10px 14px; border-radius: 9px; background: var(--bio-panel-muted); border: 1px solid var(--bio-line); }
.toolbar-band__group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.toolbar-label { color: var(--bio-muted); font-size: 12px; font-weight: 700; }
.toolbar-value { color: var(--bio-navy); font-size: 13px; font-weight: 700; }

/* ── Results body ────────────────────────────────────── */
.results-card__body { padding: 12px 16px 16px; }
.results-table :deep(.ant-table) { background: transparent; }
.results-table :deep(.ant-table-thead > tr > th) { background: var(--bio-panel-muted) !important; color: var(--bio-navy); font-weight: 700; font-size: 12px; border-bottom: 1px solid var(--bio-line); }
.results-table :deep(.ant-table-thead > tr > th::before) { display: none; }
.results-table :deep(.ant-table-tbody > tr > td) { border-bottom: 1px solid var(--bio-line); }
.results-table :deep(.ant-table-tbody > tr:hover > td) { background: #f0f5fb !important; }
.details-pre { margin: 0; white-space: pre-wrap; word-break: break-word; color: var(--bio-muted); font-size: 12px; }
.result-details :deep(.ant-descriptions-item-label) { color: var(--bio-muted); font-weight: 700; }

/* ── Empty / misc ────────────────────────────────────── */
.empty-state { min-height: 240px; display: grid; place-items: center; color: var(--bio-muted); }
.empty-state :deep(.ant-empty-description) { color: var(--bio-muted); }

@media (max-width: 1100px) { .search-layout { grid-template-columns: 1fr; } }
@media (max-width: 720px) { .search-page { padding: 12px; } }
</style>