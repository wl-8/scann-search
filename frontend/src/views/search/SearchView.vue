<template>
  <div class="search-page">
    <h2>检索（Search）</h2>
    <div style="display:flex; gap:16px; align-items:flex-start">
      <div style="flex:0 0 420px">
        <SearchForm v-model:modelValue="formData" @submit="onSearch" />
      </div>

      <div style="flex:1">
        <a-card>
                  <div class="meta" style="display:flex; justify-content:space-between; align-items:center; gap:12px">
                    <div>
                      <span v-if="loading">检索中...</span>
                      <span v-else-if="lastElapsed !== null">耗时：{{ lastElapsed }} ms，返回 {{ results.length }} 条</span>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center">
                      <a-input v-model:value="multiDatasetsInput" style="width:220px" placeholder="datasetA,datasetB" />
                      <a-button @click="handleConditional" size="small">条件检索</a-button>
                      <a-button @click="handleMultiDataset" size="small">跨数据集检索</a-button>
                      <a-button @click="handleBrowse" size="small">浏览数据</a-button>
                    </div>
                  </div>

                  <a-table
            :columns="columns"
            :data-source="pagedData"
            :loading="loading"
            :pagination="pagination"
            @change="onTableChange"
            row-key="rank"
            bordered
          >
                    <template #expandedRowRender="{ record }">
                      <a-descriptions bordered column="2" size="small">
                        <a-descriptions-item label="Cell ID">{{ record.id }}</a-descriptions-item>
                        <a-descriptions-item label="Score">{{ record.score }}</a-descriptions-item>
                        <a-descriptions-item label="Cell Type">{{ record.cell_type }}</a-descriptions-item>
                        <a-descriptions-item label="Dataset">{{ record.dataset }}</a-descriptions-item>
                        <a-descriptions-item label="UMAP X">{{ record.umap_x }}</a-descriptions-item>
                        <a-descriptions-item label="UMAP Y">{{ record.umap_y }}</a-descriptions-item>
                        <a-descriptions-item label="Metadata" :span="2">
                          <pre style="margin:0">{{ JSON.stringify(record.metadata, null, 2) }}</pre>
                        </a-descriptions-item>
                        <a-descriptions-item label="Gene Expr" :span="2">
                          <div style="display:flex; gap:8px; flex-wrap:wrap">
                            <div v-for="(v,k) in record.gene_expr" :key="k" style="min-width:120px">
                              <strong>{{ k }}</strong>: {{ v }}
                            </div>
                          </div>
                        </a-descriptions-item>
                      </a-descriptions>
                    </template>
                  </a-table>
          <div v-if="!results.length" class="empty" style="margin-top:12px">尚无结果。请先发起检索。</div>

          <div v-if="facets" style="margin-top:12px">
            <h4>Facets</h4>
            <div style="display:flex; gap:16px; flex-wrap:wrap">
              <div v-for="(vals, key) in facets" :key="key" style="min-width:160px">
                <strong>{{ key }}</strong>
                <ul style="margin:4px 0 0 12px">
                  <li v-for="(count, name) in vals" :key="name">{{ name }}: {{ count }}</li>
                </ul>
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
.results-table { width:100%; border-collapse: collapse; }
.results-table th, .results-table td { border:1px solid #ddd; padding:6px }
.empty { color:#888; padding:12px }
.meta { margin-bottom:8px }
</style>
