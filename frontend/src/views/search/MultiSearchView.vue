<template>
  <div class="multi-search-view">
    <div class="page-header">
      <div>
        <div class="page-crumb">检索 / Multi Dataset</div>
        <h2>多数据集联合检索</h2>
      </div>
      <div class="page-meta">
        <span v-if="loading">检索中...</span>
        <span v-else-if="lastResponse">返回 {{ lastResponse.n_returned }} 条，跳过 {{ lastResponse.skipped.length }} 个索引</span>
        <span v-else>选择多个 ready 索引后开始检索</span>
      </div>
    </div>

    <div class="multi-layout">
      <a-card class="query-panel" :bordered="false">
        <div class="panel-title">查询配置</div>
        <a-form layout="vertical">
          <a-form-item label="目标索引">
            <a-select
              v-model:value="selectedIndexIds"
              mode="multiple"
              :options="indexOptions"
              :loading="resourceLoading"
              placeholder="选择一个或多个 ready 索引"
              @change="syncSourceIndex"
            />
          </a-form-item>

          <a-form-item label="查询类型">
            <a-segmented
              v-model:value="queryType"
              :options="[
                { label: 'Cell ID', value: 'id' },
                { label: 'Vector', value: 'vector' },
              ]"
            />
          </a-form-item>

          <a-form-item v-if="queryType === 'id'" label="Source Index">
            <a-select
              v-model:value="sourceIndexId"
              :options="selectedIndexOptions"
              placeholder="用于解析 cell_id 的源索引"
            />
          </a-form-item>

          <a-form-item :label="queryType === 'vector' ? '查询向量' : 'Cell ID'">
            <a-textarea
              v-if="queryType === 'vector'"
              v-model:value="query"
              :auto-size="{ minRows: 4, maxRows: 8 }"
              placeholder="0.12, -0.03, 1.25 ..."
            />
            <a-input v-else v-model:value="query" placeholder="cell_0042" />
          </a-form-item>

          <div class="form-grid">
            <a-form-item label="Top-K">
              <a-input-number v-model:value="k" :min="1" :max="100" style="width: 100%" />
            </a-form-item>
            <a-form-item label="Oversample">
              <a-input-number v-model:value="oversample" :min="1" :max="500" style="width: 100%" />
            </a-form-item>
            <a-form-item label="Metric">
              <a-select
                v-model:value="metric"
                :options="[
                  { label: 'L2', value: 'l2' },
                  { label: 'Cosine', value: 'cosine' },
                ]"
              />
            </a-form-item>
          </div>

          <div class="form-grid form-grid--filter">
            <a-form-item label="过滤字段">
              <a-input v-model:value="filterColumn" placeholder="cell_type" />
            </a-form-item>
            <a-form-item label="过滤值">
              <a-input v-model:value="filterValue" placeholder="Type0" />
            </a-form-item>
          </div>

          <div class="actions">
            <a-button @click="loadResources" :loading="resourceLoading">刷新索引</a-button>
            <a-button type="primary" @click="runSearch" :loading="loading">联合检索</a-button>
          </div>
        </a-form>
      </a-card>

      <a-card class="result-panel" :bordered="false">
        <div class="result-toolbar">
          <div class="panel-title">检索结果</div>
          <span v-if="lastResponse" class="result-meta">{{ lastResponse.total_latency_ms.toFixed(2) }} ms</span>
        </div>

        <a-alert
          v-if="lastResponse?.skipped.length"
          type="warning"
          show-icon
          :message="skippedMessage"
          style="margin-bottom: 12px"
        />

        <a-table
          class="result-table"
          :columns="columns"
          :data-source="hits"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          :locale="tableLocale"
          row-key="rowKey"
          bordered
        >
          <template #expandedRowRender="{ record }">
            <a-descriptions bordered column="2" size="small">
              <a-descriptions-item label="Cell ID">{{ record.cell_id }}</a-descriptions-item>
              <a-descriptions-item label="Row Index">{{ record.row_index }}</a-descriptions-item>
              <a-descriptions-item label="Dataset">{{ record.datasetLabel }}</a-descriptions-item>
              <a-descriptions-item label="Index">{{ record.indexLabel }}</a-descriptions-item>
              <a-descriptions-item label="Obs" :span="2">
                <pre class="details-pre">{{ JSON.stringify(record.obs, null, 2) }}</pre>
              </a-descriptions-item>
            </a-descriptions>
          </template>
        </a-table>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { message } from "ant-design-vue"
import { getDatasetCells, listDatasets, listIndexes, multiDatasetSearch } from "@/api/search"
import type { DatasetItem, IndexItem } from "@/api/search"

const resourceLoading = ref(false)
const loading = ref(false)
const datasets = ref<DatasetItem[]>([])
const indexes = ref<IndexItem[]>([])
const selectedIndexIds = ref<number[]>([])
const sourceIndexId = ref<number | undefined>()
const queryType = ref<"id" | "vector">("id")
const query = ref("cell_0042")
const k = ref(10)
const oversample = ref<number | undefined>(10)
const metric = ref<"l2" | "cosine">("l2")
const filterColumn = ref("")
const filterValue = ref("")
const lastResponse = ref<any>(null)

const datasetNameById = computed(() => new Map(datasets.value.map((item) => [item.id, item.name])))
const readyIndexes = computed(() => indexes.value.filter((item) => item.status === "ready"))
const indexOptions = computed(() =>
  readyIndexes.value.map((item) => ({
    value: item.id,
    label: `#${item.id} ${item.algorithm} · ${datasetNameById.value.get(item.dataset_id) ?? `dataset_${item.dataset_id}`} · dim=${item.vector_dim}`,
  }))
)
const selectedIndexOptions = computed(() =>
  indexOptions.value.filter((option) => selectedIndexIds.value.includes(option.value))
)

const hits = computed(() =>
  (lastResponse.value?.hits ?? []).map((hit: any) => ({
    ...hit,
    rowKey: `${hit.dataset_id}:${hit.index_id}:${hit.row_index}:${hit.rank}`,
    datasetLabel: datasetNameById.value.get(hit.dataset_id) ?? `dataset_${hit.dataset_id}`,
    indexLabel: `#${hit.index_id} ${hit.algorithm}`,
    cellType: hit.obs?.cell_type ?? hit.obs?.CellType ?? "-",
  }))
)

const skippedMessage = computed(() =>
  (lastResponse.value?.skipped ?? [])
    .map((item: any) => `#${item.index_id}: ${item.reason}`)
    .join("；")
)

const columns = [
  { title: "Rank", dataIndex: "rank", key: "rank", width: 70 },
  { title: "Cell ID", dataIndex: "cell_id", key: "cell_id" },
  { title: "Dataset", dataIndex: "datasetLabel", key: "datasetLabel", width: 160 },
  { title: "Index", dataIndex: "indexLabel", key: "indexLabel", width: 150 },
  { title: "Distance", dataIndex: "distance", key: "distance", width: 120 },
  { title: "Type", dataIndex: "cellType", key: "cellType", width: 120 },
]

const tableLocale = { emptyText: "暂无联合检索结果" }

function syncSourceIndex() {
  if (!selectedIndexIds.value.length) {
    sourceIndexId.value = undefined
    return
  }
  if (!sourceIndexId.value || !selectedIndexIds.value.includes(sourceIndexId.value)) {
    sourceIndexId.value = selectedIndexIds.value[0]
  }
}

async function loadResources() {
  resourceLoading.value = true
  try {
    datasets.value = await listDatasets()
    indexes.value = await listIndexes()
    if (!selectedIndexIds.value.length) {
      selectedIndexIds.value = readyIndexes.value.slice(0, 2).map((item) => item.id)
    }
    syncSourceIndex()
    await loadSampleQuery()
  } catch (err) {
    message.warning("后端资源加载失败")
  } finally {
    resourceLoading.value = false
  }
}

async function loadSampleQuery() {
  if (queryType.value !== "id" || !sourceIndexId.value) return
  const sourceIndex = indexes.value.find((item) => item.id === sourceIndexId.value)
  if (!sourceIndex?.dataset_id) return
  try {
    const page = await getDatasetCells(sourceIndex.dataset_id, 0, 1)
    query.value = page.items[0]?.cell_id ?? query.value
  } catch (err) {
    // Keep manual input if sample lookup fails.
  }
}

async function runSearch() {
  if (!selectedIndexIds.value.length) {
    message.warning("请至少选择一个索引")
    return
  }
  if (!query.value.trim()) {
    message.warning(queryType.value === "vector" ? "请输入查询向量" : "请输入 Cell ID")
    return
  }

  loading.value = true
  try {
    lastResponse.value = await multiDatasetSearch({
      queryType: queryType.value,
      query: query.value,
      indexIds: selectedIndexIds.value,
      sourceIndexId: queryType.value === "id" ? sourceIndexId.value : undefined,
      k: k.value,
      oversample: oversample.value,
      metric: metric.value,
      filterColumn: filterColumn.value,
      filterValue: filterValue.value,
    })
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "联合检索失败")
  } finally {
    loading.value = false
  }
}

onMounted(loadResources)
</script>

<style scoped>
.multi-search-view {
  min-height: 100%;
  padding: 24px;
  background: #f7fafc;
  color: #0f172a;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-crumb {
  margin-bottom: 4px;
  color: #64748b;
  font-size: 13px;
}

.page-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.25;
}

.page-meta {
  color: #475569;
  font-size: 13px;
}

.multi-layout {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.query-panel,
.result-panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.panel-title {
  margin-bottom: 14px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.form-grid--filter {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.result-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.result-meta {
  color: #64748b;
  font-size: 13px;
}

.details-pre {
  max-height: 220px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px;
}

@media (max-width: 980px) {
  .multi-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .multi-search-view {
    padding: 16px;
  }

  .page-header,
  .actions {
    align-items: stretch;
    flex-direction: column;
  }

  .form-grid,
  .form-grid--filter {
    grid-template-columns: 1fr;
  }
}
</style>
