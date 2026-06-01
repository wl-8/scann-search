<template>
  <AppLayout>
    <div class="search-page">
      <div class="page-header">
      <div class="page-title">
        <span class="page-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M11 4a7 7 0 105.196 11.688L20 20.5" />
          </svg>
        </span>
        <div>
          <div class="page-crumb">检索 / Search</div>
          <h2>单细胞 ANN 检索页面</h2>
        </div>
      </div>
      <div class="page-meta">
        <span v-if="loading">检索中...</span>
        <span v-else-if="lastElapsed !== null">后端耗时：{{ Number(lastElapsed).toFixed(2) }} ms，返回 {{ results.length }} 条</span>
        <span v-else>选择数据集和索引后开始检索</span>
      </div>
    </div>

    <div class="search-layout">
      <div class="search-column search-column--form">
        <a-card class="resource-card" :bordered="false">
          <div class="resource-card__title">后端资源</div>
          <a-form layout="vertical">
            <a-form-item label="数据集">
              <a-select
                v-model:value="selectedDatasetId"
                :options="datasetOptions"
                placeholder="选择 ready 数据集"
                :loading="resourceLoading"
                @change="onDatasetChange"
              />
            </a-form-item>
            <a-form-item label="索引">
              <a-select
                v-model:value="selectedIndexId"
                :options="indexOptions"
                placeholder="选择 ready 索引"
                :loading="resourceLoading"
              />
            </a-form-item>
            <a-button block @click="loadResources" :loading="resourceLoading">刷新数据集/索引</a-button>
          </a-form>
        </a-card>
        <SearchForm v-model:modelValue="formData" :obsStats="obsStats" @submit="onSearch" />
      </div>

      <div class="search-column search-column--results">
        <a-card class="results-card" :bordered="false">
          <div class="results-card__toolbar">
            <div class="toolbar-band">
              <div class="toolbar-band__group toolbar-band__group--meta">
                <span class="toolbar-label">真实后端检索</span>
                <span v-if="selectedIndexId" class="toolbar-value">索引 #{{ selectedIndexId }}</span>
                <span v-else class="toolbar-value">未选择索引</span>
              </div>
            </div>
          </div>

          <div class="results-card__body">
            <a-alert
              v-if="!selectedIndexId"
              type="info"
              show-icon
              message="请先选择已构建完成的索引；如列表为空，请先通过后端脚本或索引接口构建索引。"
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
  { title: "Rank", dataIndex: "rank", key: "rank", width: 80 },
  { title: "Cell ID", dataIndex: "id", key: "id" },
  { title: "Distance", dataIndex: "distance", key: "distance", width: 120 },
  { title: "Cell Type", dataIndex: "cell_type", key: "cell_type", width: 140 },
  { title: "Row", dataIndex: "row_index", key: "row_index", width: 100 },
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
    const detail = err?.response?.data?.detail ?? err?.message ?? "检索失败"
    message.error(detail)
  }
}

async function loadResources() {
  resourceLoading.value = true
  try {
    datasets.value = await listDatasets()
    const initialDatasetId = selectedDatasetId.value ?? readyDatasets.value[0]?.id
    selectedDatasetId.value = initialDatasetId
    indexes.value = await listIndexes(initialDatasetId)
    selectedIndexId.value = readyIndexes.value[0]?.id
    if (initialDatasetId) await fetchObsStats(initialDatasetId)
  } catch (err) {
    message.warning("后端资源加载失败，请确认 FastAPI 服务已启动")
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
.search-page {
  position: relative;
  isolation: isolate;
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at 14% 12%, rgba(224, 242, 254, 0.9) 0, rgba(224, 242, 254, 0.62) 20%, rgba(224, 242, 254, 0.16) 38%, transparent 62%),
    radial-gradient(circle at 86% 88%, rgba(243, 232, 255, 0.88) 0, rgba(243, 232, 255, 0.58) 20%, rgba(243, 232, 255, 0.16) 38%, transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 52%, #f3f7fb 100%);
  color: #0f172a;
}

.search-page::before {
  content: "";
  position: absolute;
  inset: -18%;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 14%, rgba(224, 242, 254, 0.42) 0 11%, transparent 44%),
    radial-gradient(circle at 82% 84%, rgba(243, 232, 255, 0.38) 0 12%, transparent 46%),
    radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.24) 0 9%, transparent 34%),
    linear-gradient(135deg, rgba(0, 123, 255, 0.03), rgba(38, 166, 154, 0.015), rgba(243, 232, 255, 0.03));
  filter: blur(32px);
  opacity: 0.9;
  animation: searchGlowDrift 26s ease-in-out infinite alternate;
}

.search-page > * {
  position: relative;
  z-index: 1;
}

.page-header {
  width: min(100%, 1280px);
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.page-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(0, 123, 255, 0.1);
  color: #007bff;
}

.page-icon svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
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
  line-height: 1.2;
  font-weight: 800;
}

.page-meta {
  color: #64748b;
  font-size: 0.92rem;
  font-weight: 600;
}

.search-layout {
  width: min(100%, 1280px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.search-column {
  min-width: 0;
}

.search-column--form {
  position: sticky;
  top: 24px;
}

.resource-card {
  margin-bottom: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.05),
    0 5px 14px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.resource-card__title {
  margin-bottom: 12px;
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.results-card {
  min-height: calc(100% - 140px);
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 24px 56px rgba(15, 23, 42, 0.06),
    0 6px 18px rgba(15, 23, 42, 0.04);
}

.results-card__toolbar {
  padding: 16px 16px 12px;
  background: linear-gradient(180deg, #f8fafc 0%, #f3f6fa 100%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.toolbar-band {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.toolbar-band__group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-label {
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 700;
}

.toolbar-value {
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 800;
}

.toolbar-input {
  width: 240px;
}

.toolbar-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid rgba(0, 123, 255, 0.14);
  background: #fff;
  color: #334155;
  box-shadow: none;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    background-color 0.18s ease;
}

.toolbar-button:hover {
  transform: translateY(-1px) scale(1.02);
  border-color: rgba(0, 123, 255, 0.24);
  box-shadow: 0 12px 22px rgba(0, 123, 255, 0.08);
  color: #007bff;
}

.toolbar-button__icon {
  display: inline-flex;
  color: currentColor;
}

.toolbar-button__icon svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.results-card__body {
  position: relative;
  min-height: calc(100vh - 220px);
  padding: 8px 12px 16px;
}

.results-table {
  width: 100%;
}

.results-table :deep(.ant-table) {
  background: transparent;
}

.results-table :deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  color: #334155;
  font-weight: 800;
  border-color: rgba(226, 232, 240, 0.9);
}

.results-table :deep(.ant-table-thead > tr > th::before) {
  display: none;
}

.results-table :deep(.ant-table-tbody > tr > td) {
  border-color: rgba(226, 232, 240, 0.9);
}

.results-table :deep(.ant-table-cell) {
  border-left: 0;
  border-right: 0;
}

.results-table :deep(.ant-table-container) {
  border-color: rgba(226, 232, 240, 0.9);
}

.results-table :deep(.ant-table-expanded-row .ant-descriptions) {
  background: #f8fafc;
}

.result-details :deep(.ant-descriptions-item-label) {
  color: #64748b;
  font-weight: 700;
}

.details-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #475569;
}

.gene-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.gene-item {
  min-width: 120px;
  padding: 8px 10px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.9);
  color: #334155;
}

.empty-state {
  min-height: 220px;
  display: grid;
  place-items: center;
  color: #94a3b8;
}

.empty-state :deep(.ant-empty-image) {
  opacity: 0.42;
}

.empty-state :deep(.ant-empty-description) {
  color: #94a3b8;
}

.facets-panel {
  margin-top: 14px;
  padding: 14px 8px 4px;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
}

.facets-panel h4 {
  margin: 0 0 10px;
  color: #334155;
}

.facets-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.facet-group {
  min-width: 160px;
}

.facet-group ul {
  margin: 6px 0 0 16px;
  color: #475569;
}

.meta {
  margin-bottom: 0;
}

@media (max-width: 1100px) {
  .search-layout {
    grid-template-columns: 1fr;
  }

  .search-column--form {
    position: static;
  }

  .results-card {
    min-height: auto;
  }
}

@media (max-width: 720px) {
  .search-page {
    padding: 16px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-band {
    padding: 10px;
  }

  .toolbar-input {
    width: 100%;
  }

  .toolbar-band__group--actions {
    width: 100%;
  }

  .toolbar-button {
    width: 100%;
    justify-content: center;
  }
}

@keyframes searchGlowDrift {
  from {
    transform: translate3d(-1%, -0.8%, 0) scale(1);
  }

  to {
    transform: translate3d(1%, 0.8%, 0) scale(1.02);
  }
}
</style>
