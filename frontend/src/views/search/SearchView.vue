<template>
  <div class="search-page">
    <h2>检索（Search）</h2>
    <div style="display:flex; gap:16px; align-items:flex-start">
      <div style="flex:0 0 420px">
        <a-card title="后端资源" style="margin-bottom: 16px">
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
        <SearchForm v-model:modelValue="formData" @submit="onSearch" />
      </div>

      <div style="flex:1">
        <a-card>
          <div class="meta">
            <span v-if="loading">检索中...</span>
            <span v-else-if="lastElapsed !== null">
              后端耗时：{{ lastElapsed }} ms，返回 {{ results.length }} 条
            </span>
            <span v-else>选择数据集和索引后，输入 cell_id 或向量开始检索。</span>
          </div>

          <a-alert
            v-if="!selectedIndexId"
            type="info"
            show-icon
            message="请先选择已构建完成的索引；如列表为空，请先通过后端脚本或索引接口构建索引。"
            style="margin-bottom: 12px"
          />

          <a-table
            :columns="columns"
            :data-source="results"
            :loading="loading"
            :pagination="false"
            row-key="rank"
            bordered
          >
            <template #expandedRowRender="{ record }">
              <a-descriptions bordered column="2" size="small">
                <a-descriptions-item label="Cell ID">{{ record.id }}</a-descriptions-item>
                <a-descriptions-item label="Row Index">{{ record.row_index }}</a-descriptions-item>
                <a-descriptions-item label="Distance">{{ record.distance }}</a-descriptions-item>
                <a-descriptions-item label="Cell Type">{{ record.cell_type }}</a-descriptions-item>
                <a-descriptions-item label="Obs" :span="2">
                  <pre style="margin:0">{{ JSON.stringify(record.obs ?? record.metadata, null, 2) }}</pre>
                </a-descriptions-item>
              </a-descriptions>
            </template>
          </a-table>
          <div v-if="!results.length" class="empty" style="margin-top:12px">尚无结果。请先发起检索。</div>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { message } from "ant-design-vue"
import SearchForm from "@/components/search/SearchForm.vue"
import { listDatasets, listIndexes } from "@/api/search"
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

const formData = ref<SearchPayload & { filters: { cell_type: string } }>({
  queryType: "id",
  query: "",
  k: 10,
  oversample: 10,
  filterColumn: "",
  filterValue: "",
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
  const res = await search({
    ...payload,
    datasetId: selectedDatasetId.value,
    indexId: selectedIndexId.value,
  })
  results.value = res.results
  lastElapsed.value = res.elapsed
}

async function loadResources() {
  resourceLoading.value = true
  try {
    datasets.value = await listDatasets()
    const initialDatasetId = selectedDatasetId.value ?? readyDatasets.value[0]?.id
    selectedDatasetId.value = initialDatasetId
    indexes.value = await listIndexes(initialDatasetId)
    selectedIndexId.value = readyIndexes.value[0]?.id
  } catch (err) {
    message.warning("后端资源加载失败，请确认 FastAPI 服务已启动")
  } finally {
    resourceLoading.value = false
  }
}

async function onDatasetChange(datasetId: number) {
  indexes.value = await listIndexes(datasetId)
  selectedIndexId.value = readyIndexes.value[0]?.id
}

onMounted(loadResources)
</script>

<style scoped>
.results-table { width:100%; border-collapse: collapse; }
.results-table th, .results-table td { border:1px solid #ddd; padding:6px }
.empty { color:#888; padding:12px }
.meta { margin-bottom:8px }
</style>
