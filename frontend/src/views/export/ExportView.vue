<template>
  <AppLayout>
    <div class="export-page workbench-page workbench-page--grid">
      <div class="page-header workbench-page__header">
        <div class="page-title">
          <span class="page-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M9 13h6M12 10v6" />
            </svg>
          </span>
          <div>
            <div class="page-crumb workbench-page__eyebrow">Export Center</div>
            <h2 class="workbench-page__title">结果导出</h2>
          </div>
        </div>
        <div class="workbench-page__pill">将检索与过滤结果导出为 CSV</div>
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
import { showErrMsg } from "@/utils/error"

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
    showErrMsg(err, "导出失败")
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
    showErrMsg(err, "导出失败")
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
    showErrMsg(err, "导出失败")
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
  align-items: stretch;
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
  height: 100%;
  border-radius: 9px;
  border: 1px solid var(--bio-line);
  background: var(--bio-panel);
  box-shadow: none;
}

.export-card :deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.export-card__title {
  color: var(--bio-navy);
  font-size: 16px;
  font-weight: 850;
}

.export-card__desc {
  color: #52667c;
  flex: 1;
}

.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { display: flex; align-items: center; gap: 14px; }
.page-icon { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; background: rgba(0,123,255,0.1); color: #007bff; flex-shrink: 0; }
.page-icon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.page-crumb { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; color: #007bff; text-transform: uppercase; }
.page-header h2 { margin: 4px 0 0; font-size: 1.35rem; line-height: 1.2; font-weight: 800; color: #0f172a; }
.page-meta { color: #64748b; font-size: 0.92rem; font-weight: 600; max-width: 480px; }
</style>
