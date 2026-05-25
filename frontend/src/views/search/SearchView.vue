<template>
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
        <span v-else-if="lastElapsed !== null">耗时：{{ lastElapsed }} ms，返回 {{ results.length }} 条</span>
      </div>
    </div>

    <div class="search-layout">
      <div class="search-column search-column--form">
        <SearchForm v-model:modelValue="formData" @submit="onSearch" />
      </div>

      <div class="search-column search-column--results">
        <a-card class="results-card" :bordered="false">
          <div class="results-card__toolbar">
            <div class="toolbar-band">
              <div class="toolbar-band__group toolbar-band__group--meta">
                <span class="toolbar-label">批量数据集</span>
                <a-input v-model:value="multiDatasetsInput" class="toolbar-input" placeholder="datasetA,datasetB" />
              </div>
              <div class="toolbar-band__group toolbar-band__group--actions">
                <a-button class="toolbar-button toolbar-button--ghost" @click="handleConditional" size="small">
                  <span class="toolbar-button__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                  </span>
                  <span>条件检索</span>
                </a-button>
                <a-button class="toolbar-button toolbar-button--ghost" @click="handleMultiDataset" size="small">
                  <span class="toolbar-button__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M4 7h6v6H4zM14 7h6v6h-6zM9 15h6v2H9z" /></svg>
                  </span>
                  <span>跨数据集检索</span>
                </a-button>
                <a-button class="toolbar-button toolbar-button--ghost" @click="handleBrowse" size="small">
                  <span class="toolbar-button__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M4 7h16v10H4zM4 11h16" /></svg>
                  </span>
                  <span>浏览数据</span>
                </a-button>
              </div>
            </div>
          </div>

          <div class="results-card__body">
            <a-table
              class="results-table"
              :columns="columns"
              :data-source="pagedData"
              :loading="loading"
              :pagination="pagination"
              @change="onTableChange"
              row-key="rank"
              bordered
            >
              <template #expandedRowRender="{ record }">
                <a-descriptions bordered column="2" size="small" class="result-details">
                  <a-descriptions-item label="Cell ID">{{ record.id }}</a-descriptions-item>
                  <a-descriptions-item label="Score">{{ record.score }}</a-descriptions-item>
                  <a-descriptions-item label="Cell Type">{{ record.cell_type }}</a-descriptions-item>
                  <a-descriptions-item label="Dataset">{{ record.dataset }}</a-descriptions-item>
                  <a-descriptions-item label="UMAP X">{{ record.umap_x }}</a-descriptions-item>
                  <a-descriptions-item label="UMAP Y">{{ record.umap_y }}</a-descriptions-item>
                  <a-descriptions-item label="Metadata" :span="2">
                    <pre class="details-pre">{{ JSON.stringify(record.metadata, null, 2) }}</pre>
                  </a-descriptions-item>
                  <a-descriptions-item label="Gene Expr" :span="2">
                    <div class="gene-grid">
                      <div v-for="(v,k) in record.gene_expr" :key="k" class="gene-item">
                        <strong>{{ k }}</strong>: {{ v }}
                      </div>
                    </div>
                  </a-descriptions-item>
                </a-descriptions>
              </template>
            </a-table>

            <div v-if="!results.length" class="empty-state">
              <a-empty description="尚无结果。请先发起检索。" />
            </div>

            <div v-if="facets" class="facets-panel">
              <h4>Facets</h4>
              <div class="facets-grid">
                <div v-for="(vals, key) in facets" :key="key" class="facet-group">
                  <strong>{{ key }}</strong>
                  <ul>
                    <li v-for="(count, name) in vals" :key="name">{{ name }}: {{ count }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import SearchForm from "@/components/search/SearchForm.vue"
import { browseSearch, conditionalSearch, multiDatasetSearch } from "@/api/search"
import { useSearch } from "@/composables/useSearch"
import type { SearchPayload } from "@/api/search"

const { loading, search } = useSearch()
const results = ref<Array<any>>([])
const lastElapsed = ref<number | null>(null)

const formData = ref<SearchPayload & { filters: { cell_type: string } }>({
  queryType: "id",
  query: "",
  indexType: "HNSW",
  metric: "cosine",
  k: 10,
  filters: { cell_type: "" },
})

// table / pagination state
const currentPage = ref(1)
const pageSize = ref(10)

const columns = [
  { title: "Rank", dataIndex: "rank", key: "rank", width: 80 },
  { title: "ID", dataIndex: "id", key: "id" },
  { title: "Score", dataIndex: "score", key: "score", width: 120 },
  { title: "Cell Type", dataIndex: "cell_type", key: "cell_type", width: 140 },
  { title: "Dataset", dataIndex: "dataset", key: "dataset", width: 140 },
]

const total = ref(0)

const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
}))

// When backend supports server-side paging, `results` should be the current page items.
const pagedData = computed(() => results.value)

async function onTableChange(pag: { current?: number; pageSize?: number }) {
  currentPage.value = pag.current ?? 1
  pageSize.value = pag.pageSize ?? 10
  // request the new page from backend
  const payload = { ...formData.value, page: currentPage.value, pageSize: pageSize.value }
  const res = await search(payload)
  results.value = res.results
  lastElapsed.value = res.elapsed
  total.value = res.total ?? res.results.length
}

async function onSearch(payload: any) {
  currentPage.value = 1
  const res = await search({ ...payload, page: 1, pageSize: pageSize.value })
  results.value = res.results
  lastElapsed.value = res.elapsed
  total.value = res.total ?? res.results.length
}

const multiDatasetsInput = ref("datasetA,datasetB")
const facets = ref<any>(null)

async function handleConditional() {
  const payload = { ...formData.value, filters: formData.value.filters ?? {}, page: 1, pageSize: pageSize.value }
  const start = performance.now()
  const res = await conditionalSearch(payload)
  const elapsed = Math.round(performance.now() - start)
  results.value = res.items ?? res.results ?? []
  lastElapsed.value = elapsed
  total.value = res.total ?? results.value.length
  facets.value = res.facets ?? null
}

async function handleMultiDataset() {
  const datasets = multiDatasetsInput.value.split(",").map((s) => s.trim()).filter(Boolean)
  const payload = { datasets, page: 1, pageSize: pageSize.value }
  const start = performance.now()
  const res = await multiDatasetSearch(payload)
  const elapsed = Math.round(performance.now() - start)
  results.value = res.items ?? res.results ?? []
  lastElapsed.value = elapsed
  total.value = res.total ?? results.value.length
  facets.value = res.facets ?? null
}

async function handleBrowse() {
  const payload = { page: 1, pageSize: pageSize.value }
  const start = performance.now()
  const res = await browseSearch(payload)
  const elapsed = Math.round(performance.now() - start)
  results.value = res.items ?? res.results ?? []
  lastElapsed.value = elapsed
  total.value = res.total ?? results.value.length
  facets.value = res.facets ?? null
}
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
