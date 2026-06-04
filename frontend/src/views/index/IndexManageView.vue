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

@media (max-width: 992px) { .index-grid { grid-template-columns: 1fr; } }
</style>