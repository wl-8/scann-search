<template>
  <AppLayout>
    <div class="export-page workbench-page workbench-page--grid">
      <div class="export-page__header workbench-page__header">
        <div>
          <div class="export-page__eyebrow workbench-page__eyebrow">Export Center</div>
          <h2 class="workbench-page__title">结果导出</h2>
        </div>
        <p class="workbench-page__meta">导出最近一次检索、过滤或指定 Benchmark 批次的 CSV。</p>
      </div>

      <a-row :gutter="16" class="export-grid">
        <a-col :xs="24" :lg="8">
          <a-card class="export-card workbench-panel" :bordered="false">
            <div class="export-card__title">检索结果导出</div>
            <p class="export-card__desc">导出最近一次 ANN 检索结果（需要先在检索页执行查询）。</p>
            <a-button type="primary" block :loading="searchLoading" @click="exportSearch">导出检索 CSV</a-button>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="8">
          <a-card class="export-card workbench-panel" :bordered="false">
            <div class="export-card__title">过滤结果导出</div>
            <p class="export-card__desc">导出最近一次细胞过滤结果（需要先执行条件过滤）。</p>
            <a-button type="primary" block :loading="filterLoading" @click="exportFilter">导出过滤 CSV</a-button>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="8">
          <a-card class="export-card workbench-panel" :bordered="false">
            <div class="export-card__title">Benchmark 导出</div>
            <p class="export-card__desc">输入批次 ID（可多个），导出性能评测 CSV。</p>
            <a-input v-model:value="batchIdsText" placeholder="例如: 12, 15" style="margin-bottom: 12px" />
            <a-button type="primary" block :loading="benchmarkLoading" @click="exportBenchmark">导出 Benchmark CSV</a-button>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import { exportBenchmarkCsv, exportFilterCsv, exportSearchCsv } from "@/api/export"

const searchLoading = ref(false)
const filterLoading = ref(false)
const benchmarkLoading = ref(false)
const batchIdsText = ref("")

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

async function exportSearch() {
  searchLoading.value = true
  try {
    const blob = await exportSearchCsv()
    downloadBlob(blob, "search_export.csv")
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "导出失败")
  } finally {
    searchLoading.value = false
  }
}

async function exportFilter() {
  filterLoading.value = true
  try {
    const blob = await exportFilterCsv()
    downloadBlob(blob, "filter_export.csv")
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "导出失败")
  } finally {
    filterLoading.value = false
  }
}

function parseBatchIds(text: string) {
  return text
    .split(/[\s,]+/)
    .map((item) => Number(item.trim()))
    .filter((num) => Number.isFinite(num))
}

async function exportBenchmark() {
  const ids = parseBatchIds(batchIdsText.value)
  if (!ids.length) return message.warning("请输入至少一个批次 ID")

  benchmarkLoading.value = true
  try {
    const blob = await exportBenchmarkCsv(ids)
    downloadBlob(blob, `benchmark_${ids.join("_")}.csv`)
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "导出失败")
  } finally {
    benchmarkLoading.value = false
  }
}
</script>

<style scoped>
.export-page {
  position: relative;
  min-height: 100%;
  display: grid;
  gap: 16px;
  padding: 18px 0 8px;
}

.export-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.export-page__eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #007bff;
}

.export-page__header h2 {
  margin: 6px 0 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.export-page__header p {
  margin: 0;
  max-width: 520px;
  color: #64748b;
  line-height: 1.6;
}

.export-card {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 24px 54px rgba(15, 23, 42, 0.06),
    0 8px 16px rgba(15, 23, 42, 0.04);
}

.export-card__title {
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
}

.export-card__desc {
  color: #64748b;
  margin-bottom: 16px;
  line-height: 1.6;
}

.export-grid {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(260px, 1fr));
  gap: 16px;
  align-items: start;
}

.export-grid :deep(.ant-col) {
  width: auto;
  max-width: none;
  flex: none;
}

@media (max-width: 992px) {
  .export-page__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .export-grid {
    grid-template-columns: 1fr;
  }
}

.export-page {
  min-height: 100%;
  align-content: start;
  padding: 18px;
  background: #ffffff;
  border: 1px solid var(--bio-line);
}

.export-page__header {
  min-height: 68px;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px 14px;
  border-bottom: 1px solid var(--bio-line);
}

.export-page__eyebrow {
  color: var(--bio-muted);
  font-size: 12px;
  letter-spacing: 0.06em;
}

.export-page__header h2 {
  color: var(--bio-navy);
  font-size: 21px;
  font-weight: 850;
}

.export-page__header p {
  color: #52667c;
  font-size: 13px;
}

.export-card {
  min-height: 190px;
  border-radius: 9px;
  border: 1px solid var(--bio-line);
  background: var(--bio-panel);
  box-shadow: none;
}

.export-card__title {
  color: var(--bio-navy);
  font-size: 16px;
  font-weight: 850;
}

.export-card__desc {
  color: #52667c;
}
</style>
