<template>
  <AppLayout>
    <div class="index-page">
      <div class="page-header">
        <h2>索引管理</h2>
        <p>为数据集构建与管理向量索引（支持 flat / hnsw / ivf）。</p>
      </div>

      <a-row :gutter="16">
        <a-col :xs="24" :md="8">
          <a-card :bordered="false">
            <a-form layout="vertical">
              <a-form-item label="数据集">
                <a-select v-model:value="selectedDatasetId" :options="datasetOptions" @change="onDatasetChange" />
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
          <a-card :bordered="false" title="索引列表">
            <a-table :columns="columns" :data-source="indexes" :row-key="'id'" :loading="loading" :pagination="false">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'dataset_id'">
                  {{ datasets.find(d => d.id === record.dataset_id)?.name ?? record.dataset_id }}
                </template>
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-popconfirm title="确定删除该索引？" @confirm="onDeleteIndex(record.id)">
                      <a-button type="default">删除</a-button>
                    </a-popconfirm>
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
import { listIndexes } from "@/api/search"
import { buildIndex, deleteIndex, getAlgorithms } from "@/api/indexes"
import { message } from "ant-design-vue"

const datasets = ref<any[]>([])
const indexes = ref<any[]>([])
const selectedDatasetId = ref<number | null>(null)
const algorithm = ref("hnsw")
const paramsText = ref("{}")
const loading = ref(false)
const building = ref(false)
const algorithms = ref<string[]>([])

const datasetOptions = computed(() => datasets.value.map((d) => ({ label: d.name, value: d.id })))
const algorithmOptions = computed(() => algorithms.value.map((a) => ({ label: a, value: a })))

const columns = [
  { title: "ID", dataIndex: "id", key: "id" },
  { title: "Dataset", dataIndex: "dataset_id", key: "dataset_id" },
  { title: "Algorithm", dataIndex: "algorithm", key: "algorithm" },
  { title: "Status", dataIndex: "status", key: "status" },
  { title: "Vectors", dataIndex: "n_vectors", key: "n_vectors" },
  { title: "Action", key: "action", width: 80 },
]

async function loadResources() {
  loading.value = true
  try {
    datasets.value = await listDatasets()
    const first = datasets.value[0]
    selectedDatasetId.value = first?.id ?? null
    indexes.value = await listIndexes(selectedDatasetId.value ?? undefined)
    algorithms.value = await getAlgorithms()
  } catch (e) {
    message.error("加载资源失败，确认后端已启动")
  } finally {
    loading.value = false
  }
}

async function onDatasetChange(id: number) {
  loading.value = true
  try {
    indexes.value = await listIndexes(id)
  } catch (e) {
    message.error("加载索引失败")
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
  } catch (e) {
    message.error("构建索引失败")
  } finally {
    building.value = false
  }
}

async function onDeleteIndex(id: number) {
  try {
    await deleteIndex(id)
    message.success("索引已删除")
    indexes.value = await listIndexes(selectedDatasetId.value ?? undefined)
  } catch (e) {
    message.error("删除索引失败")
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

.index-page :deep(.ant-card) {
  border-radius: 9px;
  border: 1px solid var(--bio-line);
  background: var(--bio-panel);
  box-shadow: none;
}

.index-page :deep(.ant-card-head) {
  border-bottom-color: var(--bio-line);
}

.index-page :deep(.ant-card-head-title) {
  color: var(--bio-navy);
  font-weight: 850;
}
</style>
