<template>
  <AppLayout>
    <div class="index-page">
      <div class="page-header">
        <h2>索引管理</h2>
        <p>为单数据集或多个数据集构建物理 ANN 索引。</p>
      </div>

      <a-row :gutter="16">
        <a-col :xs="24" :md="8">
          <a-card :bordered="false">
            <template #title>单数据集索引</template>
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

          <a-card :bordered="false" class="combined-builder">
            <template #title>联合大索引</template>
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
          <a-card :bordered="false" title="索引列表">
            <a-table :columns="columns" :data-source="indexes" :row-key="'id'" :loading="loading" :pagination="false">
              <template #bodyCell="{ column, record }">
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

          <a-card :bordered="false" title="联合大索引列表" class="combined-list">
            <a-table :columns="combinedColumns" :data-source="combinedIndexes" :row-key="'id'" :loading="loading" :pagination="false">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'dataset_ids'">
                  <a-space wrap>
                    <a-tag v-for="id in record.dataset_ids" :key="id">#{{ id }}</a-tag>
                  </a-space>
                </template>
                <template v-else-if="column.key === 'index_size_bytes'">
                  {{ formatBytes(record.index_size_bytes) }}
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-popconfirm title="确定删除该联合索引？" @confirm="onDeleteCombinedIndex(record.id)">
                    <a-button type="default">删除</a-button>
                  </a-popconfirm>
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
import { buildCombinedIndex, buildIndex, deleteCombinedIndex, deleteIndex, getAlgorithms, listCombinedIndexes } from "@/api/indexes"
import { message } from "ant-design-vue"

const datasets = ref<any[]>([])
const indexes = ref<any[]>([])
const combinedIndexes = ref<any[]>([])
const selectedDatasetId = ref<number | null>(null)
const selectedCombinedDatasetIds = ref<number[]>([])
const algorithm = ref("hnsw")
const combinedAlgorithm = ref("hnsw")
const paramsText = ref("{}")
const combinedParamsText = ref('{ "M": 16, "ef_construction": 200, "ef_search": 64 }')
const combinedName = ref("")
const loading = ref(false)
const building = ref(false)
const buildingCombined = ref(false)
const algorithms = ref<string[]>([])

const datasetOptions = computed(() => datasets.value.map((d) => ({ label: d.name, value: d.id })))
const algorithmOptions = computed(() => algorithms.value.map((a) => ({ label: a, value: a })))

const columns = [
  { title: "ID", dataIndex: "id", key: "id" },
  { title: "Dataset", dataIndex: "dataset_id", key: "dataset_id" },
  { title: "Algorithm", dataIndex: "algorithm", key: "algorithm" },
  { title: "Status", dataIndex: "status", key: "status" },
  { title: "Vectors", dataIndex: "n_vectors", key: "n_vectors" },
  { title: "Action", key: "action" },
]

const combinedColumns = [
  { title: "ID", dataIndex: "id", key: "id", width: 70 },
  { title: "Name", dataIndex: "name", key: "name" },
  { title: "Datasets", dataIndex: "dataset_ids", key: "dataset_ids" },
  { title: "Algorithm", dataIndex: "algorithm", key: "algorithm", width: 120 },
  { title: "Status", dataIndex: "status", key: "status", width: 100 },
  { title: "Vectors", dataIndex: "n_vectors", key: "n_vectors", width: 100 },
  { title: "Size", dataIndex: "index_size_bytes", key: "index_size_bytes", width: 110 },
  { title: "Action", key: "action", width: 100 },
]

async function loadResources() {
  loading.value = true
  try {
    datasets.value = await listDatasets()
    const first = datasets.value[0]
    selectedDatasetId.value = first?.id ?? null
    selectedCombinedDatasetIds.value = datasets.value.slice(0, 2).map((item) => item.id)
    indexes.value = await listIndexes(selectedDatasetId.value ?? undefined)
    combinedIndexes.value = await listCombinedIndexes()
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
    combinedIndexes.value = await listCombinedIndexes()
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
    message.success("索引已构建")
    indexes.value = await listIndexes(selectedDatasetId.value)
  } catch (e) {
    message.error("构建索引失败")
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
    await buildCombinedIndex({
      name: combinedName.value,
      dataset_ids: selectedCombinedDatasetIds.value,
      algorithm: combinedAlgorithm.value,
      params,
    })
    message.success("联合大索引已构建")
    combinedIndexes.value = await listCombinedIndexes()
  } catch (e: any) {
    message.error(e?.response?.data?.detail ?? "构建联合索引失败")
  } finally {
    buildingCombined.value = false
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

async function onDeleteCombinedIndex(id: number) {
  try {
    await deleteCombinedIndex(id)
    message.success("联合索引已删除")
    combinedIndexes.value = await listCombinedIndexes()
  } catch (e) {
    message.error("删除联合索引失败")
  }
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)}MB`
  if (value >= 1024) return `${(value / 1024).toFixed(1)}KB`
  return `${value}B`
}

onMounted(loadResources)
</script>

<style scoped>
.index-page {
  min-height: 100%;
  padding: 18px;
  background: #f3f6fa;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
}

.page-header p {
  margin: 6px 0 0;
  color: #64748b;
}

.index-page :deep(.ant-card) {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.combined-builder,
.combined-list {
  margin-top: 16px;
}
</style>
