<template>
  <AppLayout>
    <div class="dataset-page workbench-page workbench-page--grid">
      <div class="page-header workbench-page__header">
        <div class="page-title">
          <span class="page-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v5c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
              <path d="M3 10v5c0 1.66 4.03 3 9 3s9-1.34 9-3v-5" />
              <path d="M3 15v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4" />
            </svg>
          </span>
          <div>
            <div class="page-crumb workbench-page__eyebrow">Dataset Management</div>
            <h2 class="workbench-page__title">数据集管理</h2>
          </div>
        </div>
        <div class="workbench-page__pill">上传注册数据集，追踪处理状态</div>
      </div>

      <div class="stat-bar">
        <div class="stat-item">
          <span class="stat-value">{{ datasets.length }}</span>
          <span class="stat-label">数据集</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item stat-item--green">
          <span class="stat-value">{{ datasets.filter(d => d.status === 'ready').length }}</span>
          <span class="stat-label">就绪</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item stat-item--warn">
          <span class="stat-value">{{ datasets.filter(d => d.status === 'processing' || d.status === 'uploading').length }}</span>
          <span class="stat-label">处理中</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ datasets.reduce((s, d) => s + (d.cells || 0), 0).toLocaleString() }}</span>
          <span class="stat-label">总细胞</span>
        </div>
      </div>

      <a-row :gutter="16" class="dataset-grid" :class="{ 'dataset-grid--full': !auth.canResearch }">
        <a-col v-if="auth.canResearch" :xs="24" :lg="10">
          <UploadForm @uploaded="onUploaded" />
        </a-col>
        <a-col :xs="24" :lg="14">
          <a-card class="dataset-table-card workbench-panel" :bordered="false" title="数据集列表">
            <a-table
              class="dataset-table"
              :columns="columns"
              :data-source="datasets"
              row-key="id"
              :pagination="false"
              :rowClassName="() => 'dataset-row'"
              :scroll="{ x: 'max-content' }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <span class="status-badge" :class="statusClass(record.status)">{{ record.status }}</span>
                </template>
                <template v-if="column.key === 'action'">
                  <a-space :size="8">
                    <a-button class="icon-button icon-button--view" size="small" @click="viewDetail(record)">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.75" />
                      </svg>
                    </a-button>
                    <a-popconfirm v-if="auth.canResearch" title="确定删除该数据集？" @confirm="removeDataset(record.id)">
                      <a-button class="icon-button icon-button--delete" size="small" type="primary" danger>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M8 6V4.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5V6" />
                          <path d="M7 6l1 13h8l1-13" />
                          <path d="M10 10v6M14 10v6" />
                        </svg>
                      </a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>

      <a-modal v-model:open="detailOpen" :title="`数据集详情：${activeDataset?.name ?? ''}`" :footer="null" width="720">
        <a-tabs v-model:activeKey="detailTab" @change="onDetailTabChange">
          <a-tab-pane key="stats" tab="统计">
            <div v-if="statsLoading" style="text-align:center;padding:24px"><a-spin /></div>
            <div v-else-if="statsData">
              <a-descriptions :column="2" size="small" bordered style="margin-bottom:16px">
                <a-descriptions-item label="细胞数">{{ detailDataset?.n_cells?.toLocaleString() ?? activeDataset?.cells?.toLocaleString() }}</a-descriptions-item>
                <a-descriptions-item label="基因数">{{ detailDataset?.n_genes?.toLocaleString() ?? activeDataset?.genes?.toLocaleString() }}</a-descriptions-item>
                <a-descriptions-item label="状态">{{ detailDataset?.status ?? activeDataset?.status }}</a-descriptions-item>
                <a-descriptions-item label="Embedding">{{ detailDataset?.embedding_key ?? '-' }}</a-descriptions-item>
                <a-descriptions-item label="来源" :span="2">{{ detailDataset?.source_path ?? activeDataset?.source }}</a-descriptions-item>
              </a-descriptions>
              <div v-for="col in statsData.obs_columns" :key="col" style="margin-bottom:14px">
                <div style="font-weight:700;margin-bottom:6px;color:#334155">{{ col }}</div>
                <div v-for="(cnt, val) in statsData.value_counts[col]" :key="val" style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                  <span style="min-width:120px;font-size:0.88rem;color:#475569">{{ val }}</span>
                  <div style="flex:1;height:8px;background:#f1f5f9;border-radius:999px;overflow:hidden">
                    <div :style="{ width: barWidth(statsData.value_counts[col], cnt) + '%', height: '100%', background: '#3b82f6', borderRadius: '999px' }"></div>
                  </div>
                  <span style="min-width:40px;text-align:right;font-size:0.82rem;color:#64748b">{{ cnt }}</span>
                </div>
              </div>
            </div>
            <div v-else style="color:#94a3b8;text-align:center;padding:24px">暂无统计数据</div>
          </a-tab-pane>

          <a-tab-pane key="cells" tab="细胞列表">
            <a-table
              :columns="cellColumns"
              :data-source="cellsRows"
              row-key="cell_id"
              :loading="cellsLoading"
              :pagination="false"
              size="small"
            />
            <div class="pager">
              <a-pagination
                :current="cellsPage"
                :pageSize="cellsPageSize"
                :total="cellsTotal"
                :show-size-changer="false"
                @change="onCellsPageChange"
              />
            </div>
          </a-tab-pane>

          <a-tab-pane key="filter" tab="条件过滤">
            <a-form layout="vertical">
              <a-row :gutter="12">
                <a-col :span="12">
                  <a-form-item label="过滤字段">
                    <a-select v-model:value="filterColumn" :options="filterColumnOptions" allow-clear placeholder="选择 obs 字段" @change="filterValues = []" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="过滤值（可多个）">
                    <a-select
                      v-if="filterValueOptions.length"
                      v-model:value="filterValues"
                      mode="multiple"
                      :options="filterValueOptions"
                      placeholder="选择过滤值"
                      style="width: 100%"
                    />
                    <a-input v-else :value="filterValuesText" placeholder="例如: Type0, Type1" @change="(e: any) => filterValuesText = e.target.value" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-button type="primary" :loading="filterLoading" @click="runFilter">开始过滤</a-button>
            </a-form>

            <div v-if="filterResult" class="filter-summary">
              <span>匹配：{{ filterResult.total_matched ?? filterResult.total }}</span>
              <span>返回：{{ filterResult.items.length }}</span>
            </div>
            <a-table
              :columns="cellColumns"
              :data-source="filterRows"
              row-key="cell_id"
              :loading="filterLoading"
              :pagination="false"
              size="small"
            />
          </a-tab-pane>

          <a-tab-pane key="embedding" tab="Embedding">
            <div class="embedding-panel">
              <p>当前 embedding：<strong>{{ detailDataset?.embedding_key ?? "-" }}</strong></p>
              <a-select
                v-if="embeddingKeyOptions.length"
                v-model:value="embeddingKeyInput"
                :options="embeddingKeyOptions"
                placeholder="选择向量 key"
                style="max-width: 320px; width: 100%"
              />
              <a-input v-else v-model:value="embeddingKeyInput" placeholder="如 X_umap" style="max-width: 320px" />
              <a-button type="primary" :loading="embeddingLoading" @click="submitEmbedding">切换 Embedding</a-button>
              <p class="embedding-hint">切换后会删除旧索引，需要重新构建。</p>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import UploadForm from "@/components/dataset/UploadForm.vue"
import { listDatasets } from "@/api/search"
import { showErrMsg } from "@/utils/error"
import { useAuthStore } from "@/stores/auth"
const auth = useAuthStore()
import {
  deleteDataset,
  filterDatasetCells,
  getDataset,
  listDatasetCells,
  switchEmbedding,
  type CellFilterResponse,
  type CellPageResponse,
  type DatasetResponse,
} from "@/api/datasets"
import request from "@/api/request"

type DatasetItem = {
  id: number
  name: string
  cells: number
  genes: number
  status: string
  source: string
  updatedAt: string
}

const datasets = ref<DatasetItem[]>([])

async function loadDatasets() {
  try {
    const res = await listDatasets()
    datasets.value = res.map((d: any) => ({
      id: d.id,
      name: d.name,
      cells: d.n_cells,
      genes: d.n_genes,
      status: d.status,
      source: d.source_path ?? "server",
      updatedAt: d.created_at ? new Date(d.created_at).toISOString().slice(0, 10) : "-",
    }))
  } catch (e: any) {
    datasets.value = []
    showErrMsg(e, "加载数据集失败")
  }
}

loadDatasets()

const detailOpen = ref(false)
const activeDataset = ref<DatasetItem | null>(null)
const detailDataset = ref<DatasetResponse | null>(null)
const statsData = ref<{ obs_columns: string[]; value_counts: Record<string, Record<string, number>> } | null>(null)
const statsLoading = ref(false)
const detailTab = ref("stats")

const cellsData = ref<CellPageResponse | null>(null)
const cellsLoading = ref(false)
const cellsPage = ref(1)
const cellsPageSize = ref(50)

const filterColumn = ref<string | undefined>()
const filterValues = ref<string[]>([])
const filterValuesText = ref("")
const filterResult = ref<CellFilterResponse | null>(null)
const filterLoading = ref(false)

const embeddingKeyInput = ref("")
const embeddingKeyOptions = ref<{ label: string; value: string }[]>([])
const embeddingLoading = ref(false)

function barWidth(counts: Record<string, number>, val: number): number {
  const max = Math.max(...Object.values(counts))
  return max > 0 ? Math.round((val / max) * 100) : 0
}

const columns = [
  { title: "名称", dataIndex: "name", key: "name", width: 120 },
  { title: "细胞数", dataIndex: "cells", key: "cells", width: 90 },
  { title: "基因数", dataIndex: "genes", key: "genes", width: 90 },
  { title: "状态", dataIndex: "status", key: "status", width: 100 },
  { title: "来源", dataIndex: "source", key: "source", ellipsis: true, minWidth: 160 },
  { title: "更新时间", dataIndex: "updatedAt", key: "updatedAt", width: 110 },
  { title: "操作", key: "action", width: 80 },
]

const cellColumns = [
  { title: "细胞 ID", dataIndex: "cell_id", key: "cell_id" },
  { title: "行号", dataIndex: "row_index", key: "row_index", width: 80 },
  { title: "细胞类型", dataIndex: "cell_type", key: "cell_type", width: 120 },
]

const cellsRows = computed(() =>
  (cellsData.value?.items ?? []).map((item) => ({
    ...item,
    cell_type: item.obs?.cell_type ?? "-",
  }))
)

const filterRows = computed(() =>
  (filterResult.value?.items ?? []).map((item) => ({
    ...item,
    cell_type: item.obs?.cell_type ?? "-",
  }))
)

const cellsTotal = computed(() => cellsData.value?.total ?? 0)
const filterColumnOptions = computed(() => (statsData.value?.obs_columns ?? []).map((c) => ({ label: c, value: c })))
const filterValueOptions = computed(() => {
  if (!filterColumn.value || !statsData.value?.value_counts[filterColumn.value]) return []
  return Object.keys(statsData.value.value_counts[filterColumn.value]).map((v) => ({ label: v, value: v }))
})

function statusClass(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === "ready" || normalized === "uploaded") return "status-badge--ready"
  if (normalized === "indexed") return "status-badge--indexed"
  if (normalized === "processing" || normalized === "uploading") return "status-badge--processing"
  return "status-badge--default"
}

function onUploaded(file: { name: string; size: number }) {
  // after upload/register, refresh dataset list from backend
  loadDatasets()
}

async function viewDetail(record: DatasetItem) {
  activeDataset.value = record
  statsData.value = null
  cellsData.value = null
  filterResult.value = null
  filterColumn.value = undefined
  filterValues.value = []
  filterValuesText.value = ""
  embeddingKeyOptions.value = []
  cellsPage.value = 1
  detailOpen.value = true
  detailTab.value = "stats"
  if (!record.id) return
  statsLoading.value = true
  try {
    const [dataset, stats, modes] = await Promise.allSettled([
      getDataset(record.id),
      request.get(`/datasets/${record.id}/stats`),
      request.get(`/visualize/${record.id}/modes`),
    ])
    if (dataset.status === "fulfilled") {
      detailDataset.value = dataset.value as any
      embeddingKeyInput.value = (dataset.value as any).embedding_key ?? ""
    }
    if (stats.status === "fulfilled") statsData.value = stats.value as any
    if (modes.status === "fulfilled") {
      const m = modes.value as any
      if (m.embedding_options?.length) {
        embeddingKeyOptions.value = m.embedding_options.map((k: string) => ({ label: k, value: k }))
      }
    }
  } finally {
    statsLoading.value = false
  }
}

async function loadCells(page = 1) {
  if (!activeDataset.value?.id) return
  cellsLoading.value = true
  try {
    const offset = (page - 1) * cellsPageSize.value
    cellsData.value = await listDatasetCells(activeDataset.value.id, { offset, limit: cellsPageSize.value })
    cellsPage.value = page
  } catch (err: any) {
    showErrMsg(err, "加载细胞列表失败")
  } finally {
    cellsLoading.value = false
  }
}

function onCellsPageChange(page: number) {
  loadCells(page)
}

async function runFilter() {
  if (!activeDataset.value?.id) return
  if (!filterColumn.value) return message.warning("请选择过滤字段")
  const values = filterValueOptions.value.length
    ? filterValues.value
    : filterValuesText.value.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
  if (!values.length) return message.warning("请输入过滤值")

  filterLoading.value = true
  try {
    filterResult.value = await filterDatasetCells(activeDataset.value.id, {
      filters: { equals: { [filterColumn.value]: values } },
      offset: 0,
      limit: 50,
    })
  } catch (err: any) {
    showErrMsg(err, "过滤失败")
  } finally {
    filterLoading.value = false
  }
}

async function submitEmbedding() {
  if (!activeDataset.value?.id) return
  if (!embeddingKeyInput.value.trim()) return message.warning("请输入 embedding key")

  embeddingLoading.value = true
  try {
    detailDataset.value = await switchEmbedding(activeDataset.value.id, embeddingKeyInput.value.trim())
    message.success("Embedding 已切换")
    await loadDatasets()
  } catch (err: any) {
    showErrMsg(err, "切换失败")
  } finally {
    embeddingLoading.value = false
  }
}

function onDetailTabChange(key: string) {
  if (key === "cells" && !cellsData.value) loadCells(1)
}

async function removeDataset(datasetId: number) {
  try {
    await deleteDataset(datasetId)
    // refresh list from backend
    await loadDatasets()
  } catch (e) {
    // optimistic fallback: remove locally
    datasets.value = datasets.value.filter((item: any) => item.id !== datasetId)
  }
}
</script>

<style scoped>
/* ── Page shell ────────────────────────────────────── */
.dataset-page {
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
.dataset-grid {
  flex: 1;
  min-height: 0;
  display: grid !important;
  grid-template-columns: minmax(400px, 500px) minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
}
.dataset-grid--full { grid-template-columns: 1fr !important; }
.dataset-grid :deep(.ant-col) { width: auto; max-width: none; flex: none; display: flex; flex-direction: column; }

/* ── Table card ──────────────────────────────────────── */
.dataset-table-card { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.dataset-table-card :deep(.ant-card-body) { flex: 1; min-height: 0; overflow-y: auto; padding: 0; }

/* ── Table styles ────────────────────────────────────── */
.dataset-table :deep(.ant-table) { background: transparent; }
.dataset-table :deep(.ant-table-thead > tr > th) {
  background: var(--bio-panel-muted) !important;
  color: var(--bio-navy); font-weight: 700; font-size: 12px;
  letter-spacing: 0.02em; border-bottom: 1px solid var(--bio-line);
}
.dataset-table :deep(.ant-table-thead > tr > th::before) { display: none; }
.dataset-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid var(--bio-line); color: var(--bio-text);
}
.dataset-table :deep(.ant-table-tbody > tr:hover > td) { background: #f0f5fb !important; }

/* ── Status badges ───────────────────────────────────── */
.status-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 68px; padding: 3px 10px;
  border-radius: 4px; font-size: 12px; font-weight: 700;
}
.status-badge--ready    { color: #107c10; background: #dff6dd; }
.status-badge--indexed  { color: #005a9e; background: #deecf9; }
.status-badge--processing { color: #9a5f00; background: #fef7e6; }
.status-badge--default  { color: #5a5a5a; background: #f0f0f0; }

/* ── Icon buttons ────────────────────────────────────── */
.icon-button {
  width: 30px; height: 30px;
  display: inline-grid; place-items: center;
  border-radius: 9px;
  border: 1px solid var(--bio-line);
  background: #ffffff;
  color: var(--bio-muted);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.icon-button svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.icon-button--view:hover { background: #eef5fc; border-color: #0072d1; color: #0072d1; }
.icon-button--delete:hover { background: #fde7e9; border-color: #a4262c; color: #a4262c; }

/* ── Misc ────────────────────────────────────────────── */
.pager { display: flex; justify-content: center; padding: 14px 0; }
.filter-summary { display: flex; gap: 12px; margin: 12px 0; font-weight: 600; color: var(--bio-muted); }
.embedding-panel { display: grid; gap: 12px; color: var(--bio-text); }
.embedding-hint { color: #9aabb8; font-size: 0.86rem; margin: 0; }
pre { white-space: pre-wrap; word-break: break-word; margin: 0; }

@media (max-width: 992px) { .dataset-grid { grid-template-columns: 1fr; } }
</style>
