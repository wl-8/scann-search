<template>
  <AppLayout>
    <div class="export-page workbench-page">
      <div class="page-header workbench-page__header">
        <div class="page-title">
          <span class="page-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M12 10v6M9 13h6" />
            </svg>
          </span>
          <div>
            <div class="page-crumb workbench-page__eyebrow">Export Center</div>
            <h2 class="workbench-page__title">结果导出</h2>
          </div>
        </div>
        <div class="workbench-page__pill">将检索、过滤与评测结果导出为 CSV 文件</div>
      </div>

      <div class="export-stack">

        <!-- 检索结果导出 -->
        <div class="export-item">
          <div class="export-item__left">
            <div class="export-item__icon export-item__icon--blue">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <div class="export-item__meta">
              <div class="export-item__header">
                <span class="export-item__title">ANN 检索结果</span>
                <span class="export-item__badge">CSV</span>
              </div>
              <p class="export-item__desc">导出最近一次 ANN 向量检索的返回结果，包含命中细胞的完整元数据与距离分数，可用于下游分析或报告。</p>
              <div class="export-item__prereq">
                <svg viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                前置条件：需先在 <strong>Search</strong> 页执行一次检索查询
              </div>
              <div class="export-item__fields">
                <span class="fields-label">输出字段</span>
                <div class="fields-list">
                  <span class="field-tag">rank</span>
                  <span class="field-tag">cell_id</span>
                  <span class="field-tag">distance</span>
                  <span class="field-tag">cell_type</span>
                  <span class="field-tag">dataset</span>
                  <span class="field-tag">obs.*</span>
                </div>
              </div>
            </div>
          </div>
          <div class="export-item__action">
            <div class="export-item__action-hint">下载为 <code>search_export.csv</code></div>
            <a-button type="primary" size="large" :loading="searchLoading" @click="exportSearch" class="export-btn">
              <span class="btn-inner"><svg class="btn-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>导出检索 CSV</span>
            </a-button>
          </div>
        </div>

        <!-- 过滤结果导出 -->
        <div class="export-item">
          <div class="export-item__left">
            <div class="export-item__icon export-item__icon--teal">
              <svg viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            </div>
            <div class="export-item__meta">
              <div class="export-item__header">
                <span class="export-item__title">条件过滤结果</span>
                <span class="export-item__badge">CSV</span>
              </div>
              <p class="export-item__desc">导出最近一次按 obs 字段条件过滤后的细胞列表，包含行号、细胞 ID 及全量元数据，适合精细化子群分析。</p>
              <div class="export-item__prereq">
                <svg viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                前置条件：需先在 <strong>Datasets</strong> 页执行一次条件过滤操作
              </div>
              <div class="export-item__fields">
                <span class="fields-label">输出字段</span>
                <div class="fields-list">
                  <span class="field-tag">row_index</span>
                  <span class="field-tag">cell_id</span>
                  <span class="field-tag">cell_type</span>
                  <span class="field-tag">tissue</span>
                  <span class="field-tag">obs.*</span>
                </div>
              </div>
            </div>
          </div>
          <div class="export-item__action">
            <div class="export-item__action-hint">下载为 <code>filter_export.csv</code></div>
            <a-button type="primary" size="large" :loading="filterLoading" @click="exportFilter" class="export-btn">
              <span class="btn-inner"><svg class="btn-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>导出过滤 CSV</span>
            </a-button>
          </div>
        </div>

        <!-- Benchmark 导出 -->
        <div class="export-item">
          <div class="export-item__left">
            <div class="export-item__icon export-item__icon--amber">
              <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></svg>
            </div>
            <div class="export-item__meta">
              <div class="export-item__header">
                <span class="export-item__title">性能评测报告</span>
                <span class="export-item__badge">CSV</span>
              </div>
              <p class="export-item__desc">按批次 ID 导出 Benchmark 性能评测数据，包含各算法的召回率、延迟、QPS 及内存占用，支持多批次合并导出。</p>
              <div class="export-item__prereq">
                <svg viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                前置条件：需先在 <strong>Benchmark</strong> 页运行评测并获取批次 ID
              </div>
              <div class="export-item__fields">
                <span class="fields-label">输出字段</span>
                <div class="fields-list">
                  <span class="field-tag">batch_id</span>
                  <span class="field-tag">algorithm</span>
                  <span class="field-tag">recall@k</span>
                  <span class="field-tag">avg_latency_ms</span>
                  <span class="field-tag">qps</span>
                  <span class="field-tag">index_size_mb</span>
                </div>
              </div>
            </div>
          </div>
          <div class="export-item__action">
            <div class="batch-input-wrap">
              <label class="batch-input-label">批次 ID</label>
              <a-input v-model:value="batchIdsText" placeholder="例如: 12, 15, 20" class="batch-input" />
            </div>
            <div class="export-item__action-hint">下载为 <code>benchmark_&lt;ids&gt;.csv</code></div>
            <a-button type="primary" size="large" :loading="benchmarkLoading" @click="exportBenchmark" class="export-btn">
              <span class="btn-inner"><svg class="btn-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>导出 Benchmark CSV</span>
            </a-button>
          </div>
        </div>

      </div>
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
  return text.split(/[\s,]+/).map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0)
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
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 18px;
  gap: 12px;
  background: #ffffff;
  border: 1px solid var(--bio-line);
}

.page-header h2 { margin: 3px 0 0; font-size: 1.3rem; font-weight: 800; color: var(--bio-navy); }


.export-stack {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-item {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: 0;
  border-radius: 10px;
  border: 1px solid var(--bio-line);
  background: var(--bio-panel);
  overflow: hidden;
  transition: box-shadow 0.18s ease, border-color 0.18s ease;
}

.export-item:hover {
  border-color: #b6d0f5;
  box-shadow: 0 4px 18px rgba(0, 123, 255, 0.07);
}

.export-item__left {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 20px 24px;
  border-right: 1px solid var(--bio-line);
}

.export-item__icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
}

.export-item__icon svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.export-item__icon--blue  { background: rgba(0, 123, 255, 0.1);  color: #0070e0; }
.export-item__icon--teal  { background: rgba(20, 184, 166, 0.1);  color: #0d9488; }
.export-item__icon--amber { background: rgba(245, 158, 11, 0.1);  color: #d97706; }

.export-item__meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.export-item__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.export-item__title {
  font-size: 15px;
  font-weight: 800;
  color: var(--bio-navy);
}

.export-item__badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #007bff;
  background: rgba(0, 123, 255, 0.08);
  border: 1px solid rgba(0, 123, 255, 0.18);
  border-radius: 4px;
  padding: 1px 7px;
}

.export-item__desc {
  margin: 0;
  font-size: 13px;
  color: #52667c;
  line-height: 1.65;
}

.export-item__prereq {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 5px 10px;
  width: fit-content;
}

.export-item__prereq svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: #d97706;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.export-item__prereq strong {
  color: #92400e;
}

.export-item__fields {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.fields-label {
  font-size: 11px;
  font-weight: 700;
  color: #8b98a8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.fields-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.field-tag {
  font-size: 11.5px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  color: #334155;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 1px 7px;
}

.export-item__action {
  flex-shrink: 0;
  width: 280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px 24px;
  gap: 0;
}

.export-item__action-hint {
  font-size: 11.5px;
  color: #8b98a8;
  margin-bottom: 10px;
}

.export-item__action-hint code {
  font-family: 'SFMono-Regular', Consolas, monospace;
  color: #475569;
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 3px;
}

.export-btn {
  width: 100%;
  font-weight: 700;
  border-radius: 7px;
}

.btn-inner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-icon {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.batch-input-wrap {
  margin-bottom: 8px;
}

.batch-input-label {
  display: block;
  font-size: 11.5px;
  font-weight: 700;
  color: #8b98a8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 5px;
}

.batch-input {
  border-radius: 7px;
}

@media (max-width: 860px) {
  .export-item {
    flex-direction: column;
  }
  .export-item__left {
    border-right: none;
    border-bottom: 1px solid var(--bio-line);
  }
  .export-item__action {
    width: auto;
  }
}
</style>
