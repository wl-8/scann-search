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
import { buildIndex, deleteIndex, getAlgorithms } from "@/api/indexes"
import { message } from "ant-design-vue"
import { showErrMsg } from "@/utils/error"

const datasets = ref<any[]>([])
const indexes = ref<any[]>([])
const selectedDatasetId = ref<number | null>(null)
const algorithm = ref<string | undefined>(undefined)
const paramsText = ref("{}")
const loading = ref(false)
const building = ref(false)
const algorithms = ref<string[]>([])

const datasetOptions = computed(() => datasets.value.map((d) => ({ label: d.name, value: d.id })))
const algorithmOptions = computed(() => algorithms.value.map((a) => ({ label: a, value: a })))

const baseColumns = [
  { title: "ID", dataIndex: "id", key: "id" },
  { title: "Dataset", dataIndex: "dataset_id", key: "dataset_id" },
  { title: "Algorithm", dataIndex: "algorithm", key: "algorithm" },
  { title: "Status", dataIndex: "status", key: "status" },
  { title: "Vectors", dataIndex: "n_vectors", key: "n_vectors" },
]
const columns = computed(() => auth.canResearch
  ? [...baseColumns, { title: "Action", key: "action", width: 80 }]
  : baseColumns
)

async function loadResources() {
  loading.value = true
  try {
    const [ds, algos, idxs] = await Promise.all([listDatasets(), getAlgorithms(), listIndexes(selectedDatasetId.value ?? undefined)])
    datasets.value = ds
    algorithms.value = algos
    indexes.value = idxs
    if (algos.length > 0 && !algorithm.value) algorithm.value = algos[0]
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
    await buildIndex({ dataset_id: selectedDatasetId.value, algorithm: algorithm.value, params })
    message.success("索引构建请求已提交，后台会异步处理")
    indexes.value = await listIndexes(selectedDatasetId.value)
  } catch (e: any) {
    showErrMsg(e, "构建索引失败")
  } finally {
    building.value = false
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

onMounted(loadResources)
</script>

<style scoped>
.index-page {
  padding: 18px;
  min-height: 100%;
  background: #ffffff;
  border: 1px solid var(--bio-line);
}

.page-header {
  min-height: 68px;
  margin-bottom: 16px;
  padding: 0 4px 14px;
  border-bottom: 1px solid var(--bio-line);
}

.page-header h2 {
  margin: 0;
  color: var(--bio-navy);
  font-size: 21px;
  font-weight: 850;
}

.page-header p {
  margin: 6px 0 0;
  color: #52667c;
  font-size: 13px;
}

.index-grid {
  display: grid !important;
  grid-template-columns: minmax(360px, 460px) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

.index-grid--full {
  grid-template-columns: 1fr !important;
}

.index-grid :deep(.ant-col) {
  width: auto;
  max-width: none;
  flex: none;
  display: flex;
  flex-direction: column;
}

.index-page :deep(.ant-card) {
  border-radius: 9px;
  border: 1px solid var(--bio-line);
  background: var(--bio-panel);
  box-shadow: none;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.index-page :deep(.ant-card-body) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.index-page :deep(.ant-card-head) {
  border-bottom-color: var(--bio-line);
}

.index-page :deep(.ant-card-head-title) {
  color: var(--bio-navy);
  font-weight: 850;
}

@media (max-width: 992px) {
  .index-grid {
    grid-template-columns: 1fr;
  }
}

.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { display: flex; align-items: center; gap: 14px; }
.page-icon { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; background: rgba(0,123,255,0.1); color: #007bff; flex-shrink: 0; }
.page-icon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.page-crumb { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; color: #007bff; text-transform: uppercase; }
.page-header h2 { margin: 4px 0 0; font-size: 1.35rem; line-height: 1.2; font-weight: 800; color: #0f172a; }
.page-meta { color: #64748b; font-size: 0.92rem; font-weight: 600; max-width: 480px; }
</style>
