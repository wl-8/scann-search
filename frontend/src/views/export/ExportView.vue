<template>
  <AppLayout>
    <div class="export-page">
      <div class="page-header">
        <div>
          <div class="eyebrow">Export</div>
          <h2>结果导出</h2>
        </div>
        <a-button :loading="loading" @click="loadBatches">刷新 benchmark 批次</a-button>
      </div>

      <a-row :gutter="16">
        <a-col :xs="24" :md="8">
          <a-card :bordered="false" title="检索结果 CSV">
            <p>导出当前用户最近一次 ANN 检索结果。请先在检索页执行一次检索。</p>
            <a-button type="primary" block :loading="exporting === 'search'" @click="downloadSearch">导出检索结果</a-button>
          </a-card>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-card :bordered="false" title="过滤结果 CSV">
            <p>导出当前用户最近一次细胞过滤结果。请先在数据集详情中执行一次细胞过滤。</p>
            <a-button block :loading="exporting === 'filter'" @click="downloadFilter">导出过滤结果</a-button>
          </a-card>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-card :bordered="false" title="Benchmark CSV">
            <a-select v-model:value="batchIds" mode="multiple" :options="batchOptions" style="width: 100%; margin-bottom: 12px" placeholder="选择批次" />
            <a-button block :disabled="!batchIds.length" :loading="exporting === 'benchmark'" @click="downloadBenchmark">导出 benchmark</a-button>
          </a-card>
        </a-col>
      </a-row>

      <a-card :bordered="false" title="Benchmark 批次">
        <a-table :columns="columns" :data-source="batches" row-key="id" :loading="loading" :pagination="{ pageSize: 8 }" />
      </a-card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import { listBenchmarkBatches, type BenchmarkBatch } from "@/api/benchmark"
import { exportBenchmark, exportFilter, exportSearch } from "@/api/export"

const loading = ref(false)
const exporting = ref<"" | "search" | "filter" | "benchmark">("")
const batches = ref<BenchmarkBatch[]>([])
const batchIds = ref<number[]>([])

const batchOptions = computed(() => batches.value.map((item) => ({ value: item.id, label: `#${item.id} ${item.label}` })))
const columns = [
  { title: "ID", dataIndex: "id", key: "id", width: 70 },
  { title: "Label", dataIndex: "label", key: "label" },
  { title: "Dataset", dataIndex: "dataset_id", key: "dataset_id" },
  { title: "K", dataIndex: "k", key: "k" },
  { title: "Queries", dataIndex: "n_queries", key: "n_queries" },
  { title: "Created", dataIndex: "created_at", key: "created_at" },
]

async function loadBatches() {
  loading.value = true
  try {
    batches.value = await listBenchmarkBatches()
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "benchmark 批次加载失败")
  } finally {
    loading.value = false
  }
}

async function runExport(kind: typeof exporting.value, action: () => Promise<void>) {
  exporting.value = kind
  try {
    await action()
    message.success("导出已开始")
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "导出失败")
  } finally {
    exporting.value = ""
  }
}

function downloadSearch() {
  runExport("search", exportSearch)
}

function downloadFilter() {
  runExport("filter", exportFilter)
}

function downloadBenchmark() {
  runExport("benchmark", () => exportBenchmark(batchIds.value))
}

onMounted(loadBatches)
</script>

<style scoped>
.export-page {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.eyebrow {
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-header h2 {
  margin: 4px 0 0;
}
</style>
