<template>
  <AppLayout>
    <div class="index-page workbench-page">
      <div class="page-header workbench-page__header">
        <div class="page-title">
          <span class="page-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <path d="M13 2v7h7" />
              <path d="M9 13h6M9 17h4" />
            </svg>
          </span>
          <div>
            <div class="page-crumb workbench-page__eyebrow">Index Builder</div>
            <h2 class="workbench-page__title">索引管理</h2>
          </div>
        </div>
        <div class="workbench-page__pill">选择数据集和算法，构建 ANN 索引</div>
      </div>

      <div class="stat-bar">
        <div class="stat-item">
          <span class="stat-value">{{ indexes.length }}</span>
          <span class="stat-label">总索引</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item stat-item--green">
          <span class="stat-value">{{ indexes.filter(i => i.status === 'ready').length }}</span>
          <span class="stat-label">就绪</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item stat-item--warn">
          <span class="stat-value">{{ indexes.filter(i => i.status === 'building' || i.status === 'pending').length }}</span>
          <span class="stat-label">构建中</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item stat-item--danger">
          <span class="stat-value">{{ indexes.filter(i => i.status === 'error').length }}</span>
          <span class="stat-label">失败</span>
        </div>
      </div>

      <a-row :gutter="16" class="index-grid" :class="{ 'index-grid--full': !auth.canResearch }">
        <a-col v-if="auth.canResearch" :xs="24" :md="8">
          <a-card class="workbench-panel" :bordered="false">
            <a-form layout="vertical">
              <a-form-item label="数据集">
                <a-select v-model:value="selectedDatasetId" :options="datasetOptions" allow-clear placeholder="选择数据集（可选）" @change="onDatasetChange" @clear="onClearDatasetFilter" />
              </a-form-item>

              <a-form-item label="算法">
                <a-select v-model:value="algorithm" :options="algorithmOptions" />
              </a-form-item>

              <a-form-item label="参数（JSON）">
                <a-input v-model:value="paramsText" placeholder='例如: { "M": 16, "ef_construction": 200 }' />
              </a-form-item>

              <a-button type="primary" :loading="building" @click="onBuildIndex">构建索引</a-button>
            </a-form>
          </a-card>

          <a-card class="workbench-panel combined-builder" :bordered="false" title="联合大索引">
            <a-form layout="vertical">
              <a-form-item label="名称">
                <a-input v-model:value="combinedName" placeholder="例如 liver_pancreas_hnsw" />
              </a-form-item>
              <a-form-item label="数据集">
                <a-select
                  v-model:value="selectedCombinedDatasetIds"
                  mode="multiple"
                  :options="datasetOptions"
                  placeholder="至少选择两个数据集"
                />
              </a-form-item>
              <a-form-item label="算法">
                <a-select v-model:value="combinedAlgorithm" :options="algorithmOptions" />
              </a-form-item>
              <a-form-item label="参数（JSON）">
                <a-input v-model:value="combinedParamsText" placeholder='例如: { "M": 16, "ef_search": 64 }' />
              </a-form-item>
              <a-button type="primary" :loading="buildingCombined" @click="onBuildCombinedIndex">构建联合索引</a-button>
            </a-form>
          </a-card>
        </a-col>

        <a-col :xs="24" :md="16">
          <a-card class="workbench-panel" :bordered="false" title="索引列表">
            <a-table :columns="columns" :data-source="indexes" :row-key="'id'" :loading="loading" :pagination="false">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'dataset_id'">
                  {{ datasets.find(d => d.id === record.dataset_id)?.name ?? record.dataset_id }}
                </template>
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-popconfirm v-if="auth.canResearch" title="确定删除该索引？" @confirm="onDeleteIndex(record.id)">
                      <a-button type="primary" danger>删除</a-button>
                    </a-popconfirm>
                    <span v-else>—</span>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>

          <a-card class="workbench-panel combined-list" :bordered="false" title="联合大索引列表">
            <a-table :columns="combinedColumns" :data-source="combinedIndexes" :row-key="'id'" :loading="loading" :pagination="false" :scroll="{ x: 860 }">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'dataset_ids'">
                  <a-space wrap>
                    <a-tag v-for="id in record.dataset_ids" :key="id">#{{ id }}</a-tag>
                  </a-space>
                </template>
                <template v-if="column.key === 'index_size_bytes'">
                  {{ formatBytes(record.index_size_bytes) }}
                </template>
                <template v-if="column.key === 'action'">
                  <a-popconfirm v-if="auth.canResearch" title="确定删除该联合索引？" @confirm="onDeleteCombinedIndex(record.id)">
                    <a-button type="primary" danger>删除</a-button>
                  </a-popconfirm>
                  <span v-else>—</span>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import { listDatasets } from "@/api/search"
import { useAuthStore } from "@/stores/auth"
const auth = useAuthStore()
import { listIndexes } from "@/api/search"
import { buildCombinedIndex, buildIndex, deleteCombinedIndex, deleteIndex, getAlgorithms, listCombinedIndexes } from "@/api/indexes"
import { message } from "ant-design-vue"
import { showErrMsg } from "@/utils/error"

const datasets = ref<any[]>([])
const indexes = ref<any[]>([])
const combinedIndexes = ref<any[]>([])
const selectedDatasetId = ref<number | null>(null)
const selectedCombinedDatasetIds = ref<number[]>([])
const algorithm = ref<string | undefined>(undefined)
const combinedAlgorithm = ref<string | undefined>("hnsw")
const paramsText = ref("{}")
const combinedParamsText = ref('{ "M": 16, "ef_construction": 200, "ef_search": 64 }')
const combinedName = ref("")
const loading = ref(false)
const building = ref(false)
const buildingCombined = ref(false)
const algorithms = ref<string[]>([])

const datasetOptions = computed(() => datasets.value.map((d) => ({ label: d.name, value: d.id })))
const algorithmOptions = computed(() => algorithms.value.map((a) => ({ label: a, value: a })))

const baseColumns = [
  { title: "编号", dataIndex: "id", key: "id" },
  { title: "数据集", dataIndex: "dataset_id", key: "dataset_id" },
  { title: "算法", dataIndex: "algorithm", key: "algorithm" },
  { title: "状态", dataIndex: "status", key: "status" },
  { title: "向量数", dataIndex: "n_vectors", key: "n_vectors" },
]
const columns = computed(() => auth.canResearch
  ? [...baseColumns, { title: "操作", key: "action", width: 80 }]
  : baseColumns
)
const combinedBaseColumns = [
  { title: "编号", dataIndex: "id", key: "id", width: 70 },
  { title: "名称", dataIndex: "name", key: "name" },
  { title: "数据集", dataIndex: "dataset_ids", key: "dataset_ids" },
  { title: "算法", dataIndex: "algorithm", key: "algorithm", width: 100 },
  { title: "状态", dataIndex: "status", key: "status", width: 100 },
  { title: "向量数", dataIndex: "n_vectors", key: "n_vectors", width: 100 },
  { title: "大小", dataIndex: "index_size_bytes", key: "index_size_bytes", width: 100 },
]
const combinedColumns = computed(() => auth.canResearch
  ? [...combinedBaseColumns, { title: "操作", key: "action", width: 90 }]
  : combinedBaseColumns
)

async function loadResources() {
  loading.value = true
  try {
    const [ds, algos, idxs, combined] = await Promise.all([listDatasets(), getAlgorithms(), listIndexes(selectedDatasetId.value ?? undefined), listCombinedIndexes()])
    datasets.value = ds
    algorithms.value = algos
    indexes.value = idxs
    combinedIndexes.value = combined
    selectedCombinedDatasetIds.value = datasets.value.slice(0, 2).map((item) => item.id)
    if (algos.length > 0 && !algorithm.value) algorithm.value = algos[0]
    if (algos.length > 0 && !combinedAlgorithm.value) combinedAlgorithm.value = algos[0]
  } catch (e: any) {
    showErrMsg(e, "加载资源失败")
  } finally {
    loading.value = false
  }
}

async function onDatasetChange(id: number) {
  loading.value = true
  try {
    indexes.value = await listIndexes(id)
    combinedIndexes.value = await listCombinedIndexes()
  } catch (e: any) {
    showErrMsg(e, "加载索引失败")
  } finally {
    loading.value = false
  }
}

async function onBuildIndex() {
  if (!selectedDatasetId.value) return message.warning("请先选择数据集")
  let params = {}
  try {
    params = JSON.parse(paramsText.value || "{}")
  } catch (e) {
    return message.warning("参数不是有效的 JSON")
  }
  building.value = true
  try {
    const selectedAlgorithm = algorithm.value ?? "hnsw"
    await buildIndex({ dataset_id: selectedDatasetId.value, algorithm: selectedAlgorithm, params })
    message.success("索引构建请求已提交，后台会异步处理")
    indexes.value = await listIndexes(selectedDatasetId.value)
  } catch (e: any) {
    showErrMsg(e, "构建索引失败")
  } finally {
    building.value = false
  }
}

async function onBuildCombinedIndex() {
  if (selectedCombinedDatasetIds.value.length < 2) return message.warning("联合索引至少选择两个数据集")
  let params = {}
  try {
    params = JSON.parse(combinedParamsText.value || "{}")
  } catch (e) {
    return message.warning("联合索引参数不是有效的 JSON")
  }
  buildingCombined.value = true
  try {
    const selectedAlgorithm = combinedAlgorithm.value ?? algorithm.value ?? "hnsw"
    await buildCombinedIndex({
      name: combinedName.value,
      dataset_ids: selectedCombinedDatasetIds.value,
      algorithm: selectedAlgorithm,
      params,
    })
    message.success("联合大索引构建请求已提交，后台会异步处理")
    combinedIndexes.value = await listCombinedIndexes()
  } catch (e: any) {
    showErrMsg(e, "构建联合索引失败")
  } finally {
    buildingCombined.value = false
  }
}

async function onDeleteIndex(id: number) {
  try {
    await deleteIndex(id)
    message.success("索引已删除")
    indexes.value = await listIndexes(selectedDatasetId.value ?? undefined)
  } catch (e: any) {
    showErrMsg(e, "删除索引失败")
  }
}

async function onDeleteCombinedIndex(id: number) {
  try {
    await deleteCombinedIndex(id)
    message.success("联合索引已删除")
    combinedIndexes.value = await listCombinedIndexes()
  } catch (e: any) {
    showErrMsg(e, "删除联合索引失败")
  }
}

async function onClearDatasetFilter() {
  loading.value = true
  try {
    indexes.value = await listIndexes()
  } catch (e: any) {
    showErrMsg(e, "加载索引失败")
  } finally {
    loading.value = false
  }
}

function formatBytes(value: number) {
  if (!Number.isFinite(value)) return "-"
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${value} B`
}

onMounted(loadResources)
</script>

<style scoped>
/* ── Page shell ────────────────────────────────────── */
.index-page {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 18px;
  gap: 12px;
  background: #ffffff;
  border: 1px solid var(--bio-line);
}

/* ── Grid ────────────────────────────────────────────── */
.index-grid {
  flex: 1;
  min-height: 0;
  display: grid !important;
  grid-template-columns: minmax(320px, 400px) minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
}
.index-grid--full { grid-template-columns: 1fr !important; }
.index-grid :deep(.ant-col) { width: auto; max-width: none; flex: none; display: flex; flex-direction: column; }

/* ── Cards ───────────────────────────────────────────── */
.index-page :deep(.workbench-panel.ant-card) { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.index-page :deep(.ant-card-body) { flex: 1; min-height: 0; overflow-y: auto; }
.combined-builder,
.combined-list { margin-top: 14px; }

@media (max-width: 992px) { .index-grid { grid-template-columns: 1fr; } }
</style>
