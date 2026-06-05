<template>
  <AppLayout>
    <div class="combined-search">
      <section class="combined-header">
        <div>
          <div class="combined-header__label">Combined Index</div>
          <h1>严格联合大索引检索</h1>
          <p>多个数据集向量拼接为一个物理 ANN 索引，查询时返回全局行号和原始数据集映射。</p>
        </div>
        <a-button :loading="loading" @click="loadResources">刷新</a-button>
      </section>

      <section class="combined-layout">
        <a-card :bordered="false" class="query-card">
          <template #title>查询</template>
          <a-form layout="vertical">
            <a-form-item label="联合索引">
              <a-select v-model:value="combinedIndexId" :options="combinedIndexOptions" @change="onCombinedIndexChange" />
            </a-form-item>
            <a-form-item label="查询方式">
              <a-radio-group v-model:value="queryType">
                <a-radio-button value="id">Cell ID</a-radio-button>
                <a-radio-button value="vector">Vector</a-radio-button>
              </a-radio-group>
            </a-form-item>
            <a-form-item v-if="queryType === 'id'" label="来源数据集">
              <a-select v-model:value="sourceDatasetId" :options="sourceDatasetOptions" @change="loadSampleCell" />
            </a-form-item>
            <a-form-item :label="queryType === 'id' ? 'Cell ID' : 'Vector'">
              <a-input
                v-model:value="query"
                :placeholder="queryType === 'id' ? '例如 cell_0042' : '逗号或空格分隔的向量'"
              />
            </a-form-item>
            <a-row :gutter="10">
              <a-col :span="8">
                <a-form-item label="Top-K">
                  <a-input-number v-model:value="k" :min="1" :max="100" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="Metric">
                  <a-select v-model:value="metric" :options="metricOptions" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="Oversample">
                  <a-input-number v-model:value="oversample" :min="1" :max="500" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="10">
              <a-col :span="12">
                <a-form-item label="过滤字段">
                  <a-input v-model:value="filterColumn" placeholder="cell_type / disease" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="过滤值">
                  <a-input v-model:value="filterValue" placeholder="Hepatocyte / normal" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-button type="primary" block :loading="searching" @click="runSearch">检索联合索引</a-button>
          </a-form>
        </a-card>

        <div class="result-stack">
          <a-card :bordered="false" class="summary-card">
            <div class="summary-item">
              <span>Combined</span>
              <strong>{{ activeCombinedIndex ? `#${activeCombinedIndex.id}` : "-" }}</strong>
            </div>
            <div class="summary-item">
              <span>Datasets</span>
              <strong>{{ activeCombinedIndex?.dataset_ids?.length ?? 0 }}</strong>
            </div>
            <div class="summary-item">
              <span>Vectors</span>
              <strong>{{ activeCombinedIndex?.n_vectors?.toLocaleString() ?? "-" }}</strong>
            </div>
            <div class="summary-item">
              <span>Latency</span>
              <strong>{{ result ? `${result.latency_ms.toFixed(2)}ms` : "-" }}</strong>
            </div>
          </a-card>

          <a-card :bordered="false" title="结果">
            <a-alert
              v-if="!combinedIndexes.length"
              type="warning"
              show-icon
              message="还没有 ready 的联合大索引，请先在索引管理页构建。"
              class="empty-alert"
            />
            <a-table
              :columns="columns"
              :data-source="rows"
              row-key="key"
              :pagination="{ pageSize: 10 }"
              :scroll="{ x: 960 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'dataset_id'">
                  <a-tag>#{{ record.dataset_id }}</a-tag>
                </template>
                <template v-else-if="column.key === 'distance'">
                  {{ record.distance.toFixed(4) }}
                </template>
                <template v-else-if="column.key === 'cell_type'">
                  {{ record.obs?.cell_type ?? record.obs?.celltype ?? "-" }}
                </template>
              </template>
              <template #expandedRowRender="{ record }">
                <a-descriptions :column="2" size="small" bordered>
                  <a-descriptions-item label="Global Row">{{ record.global_row_index }}</a-descriptions-item>
                  <a-descriptions-item label="Dataset">{{ record.dataset_id }}</a-descriptions-item>
                  <a-descriptions-item v-for="(value, key) in record.obs" :key="key" :label="key">{{ value }}</a-descriptions-item>
                </a-descriptions>
              </template>
            </a-table>
          </a-card>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import { listCombinedIndexes, type CombinedIndexItem } from "@/api/indexes"
import { combinedIndexSearch, getDatasetCells, listDatasets } from "@/api/search"

const loading = ref(false)
const searching = ref(false)
const datasets = ref<any[]>([])
const combinedIndexes = ref<CombinedIndexItem[]>([])
const combinedIndexId = ref<number>()
const sourceDatasetId = ref<number>()
const queryType = ref<"id" | "vector">("id")
const query = ref("")
const k = ref(10)
const metric = ref("l2")
const oversample = ref(10)
const filterColumn = ref("")
const filterValue = ref("")
const result = ref<any | null>(null)

const metricOptions = [
  { label: "L2", value: "l2" },
  { label: "Cosine", value: "cosine" },
]

const activeCombinedIndex = computed(() => combinedIndexes.value.find((item) => item.id === combinedIndexId.value))
const combinedIndexOptions = computed(() =>
  combinedIndexes.value
    .filter((item) => item.status === "ready")
    .map((item) => ({
      value: item.id,
      label: `${item.name || `combined #${item.id}`} · ${item.algorithm} · ${item.n_vectors.toLocaleString()} vectors`,
    }))
)
const sourceDatasetOptions = computed(() =>
  (activeCombinedIndex.value?.dataset_ids ?? []).map((id) => {
    const dataset = datasets.value.find((item) => item.id === id)
    return { value: id, label: dataset ? `${dataset.name} (#${id})` : `dataset #${id}` }
  })
)
const rows = computed(() => (result.value?.hits ?? []).map((item: any) => ({ ...item, key: `${item.dataset_id}:${item.global_row_index}` })))

const columns = [
  { title: "Rank", dataIndex: "rank", key: "rank", width: 70 },
  { title: "Cell ID", dataIndex: "cell_id", key: "cell_id" },
  { title: "Dataset", dataIndex: "dataset_id", key: "dataset_id", width: 110 },
  { title: "Global Row", dataIndex: "global_row_index", key: "global_row_index", width: 120 },
  { title: "Row", dataIndex: "row_index", key: "row_index", width: 90 },
  { title: "Distance", dataIndex: "distance", key: "distance", width: 110 },
  { title: "Type", key: "cell_type", width: 140 },
]

async function loadResources() {
  loading.value = true
  try {
    const [datasetRows, combinedRows] = await Promise.all([listDatasets(), listCombinedIndexes()])
    datasets.value = datasetRows
    combinedIndexes.value = combinedRows
    combinedIndexId.value = combinedIndexId.value ?? combinedIndexOptions.value[0]?.value
    onCombinedIndexChange()
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "加载联合索引失败")
  } finally {
    loading.value = false
  }
}

function onCombinedIndexChange() {
  sourceDatasetId.value = activeCombinedIndex.value?.dataset_ids?.[0]
  loadSampleCell()
}

async function loadSampleCell() {
  if (queryType.value !== "id" || !sourceDatasetId.value) return
  try {
    const page = await getDatasetCells(sourceDatasetId.value, 0, 1)
    query.value = page.items[0]?.cell_id ?? query.value
  } catch {
    // sample id is a convenience only
  }
}

async function runSearch() {
  if (!combinedIndexId.value) return message.warning("请先选择联合索引")
  if (!query.value.trim()) return message.warning("请输入查询")
  searching.value = true
  try {
    result.value = await combinedIndexSearch({
      combinedIndexId: combinedIndexId.value,
      sourceDatasetId: queryType.value === "id" ? sourceDatasetId.value : undefined,
      queryType: queryType.value,
      query: query.value,
      k: k.value,
      metric: metric.value,
      oversample: oversample.value,
      filterColumn: filterColumn.value,
      filterValue: filterValue.value,
    })
    message.success(`返回 ${result.value.n_returned} 个细胞`)
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "联合索引检索失败")
  } finally {
    searching.value = false
  }
}

onMounted(loadResources)
</script>

<style scoped>
.combined-search {
  min-height: 100%;
  padding: 20px;
  display: grid;
  gap: 16px;
  background: #f3f6fa;
  overflow-x: hidden;
}

.combined-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 22px;
  border-radius: 8px;
  color: #fff;
  background: linear-gradient(135deg, #111827, #1d4ed8 56%, #0f766e);
}

.combined-header__label {
  color: #bfdbfe;
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.combined-header h1 {
  margin: 6px 0;
  color: #fff;
  font-size: 1.75rem;
}

.combined-header p {
  margin: 0;
  color: rgba(239, 246, 255, 0.86);
}

.combined-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.75fr) minmax(0, 1.5fr);
  gap: 16px;
  min-width: 0;
}

.combined-search :deep(.ant-card) {
  min-width: 0;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.query-card :deep(.ant-input-number) {
  width: 100%;
}

.result-stack {
  min-width: 0;
  display: grid;
  gap: 16px;
  align-content: start;
}

.summary-card :deep(.ant-card-body) {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.summary-item {
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.summary-item span,
.summary-item strong {
  display: block;
}

.summary-item span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.summary-item strong {
  margin-top: 5px;
  color: #0f172a;
  font-size: 1.05rem;
}

.empty-alert {
  margin-bottom: 12px;
}

@media (max-width: 1040px) {
  .combined-layout,
  .summary-card :deep(.ant-card-body) {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .combined-search {
    padding: 12px;
  }

  .combined-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
