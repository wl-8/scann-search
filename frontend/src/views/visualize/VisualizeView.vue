<template>
  <AppLayout>
    <div class="visualize-page workbench-page workbench-page--grid">
      <div class="page-header workbench-page__header">
        <div class="page-title">
          <span class="page-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="6" cy="18" r="2" /><circle cx="12" cy="10" r="2" />
              <circle cx="18" cy="14" r="2" /><circle cx="9" cy="5" r="2" />
              <circle cx="16" cy="6" r="2" /><circle cx="4" cy="12" r="2" />
            </svg>
          </span>
          <div>
            <div class="page-crumb workbench-page__eyebrow">Visualization</div>
            <h2 class="workbench-page__title">单细胞数据嵌入可视化</h2>
          </div>
        </div>
        <div class="workbench-page__pill">选择数据集，探索细胞空间分布</div>
      </div>

      <a-card class="control-panel workbench-panel" :bordered="false">
        <a-form layout="vertical">
          <a-row :gutter="16">
            <a-col :xs="24" :md="7">
              <a-form-item label="数据集">
                <a-select
                  v-model:value="selectedDatasetId"
                  :options="datasetOptions"
                  placeholder="选择数据集"
                  class="control-select"
                  :loading="datasetsLoading"
                  @change="onDatasetChange"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="3">
              <a-form-item label="维度">
                <a-select v-model:value="dimension" class="control-select" :disabled="!selectedDatasetId">
                  <a-select-option :value="2">2D</a-select-option>
                  <a-select-option :value="3" :disabled="!availableModes.includes('3d')">3D</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="6">
              <a-form-item label="着色字段">
                <a-select v-model:value="colorBy" class="control-select">
                  <a-select-option v-for="col in colorOptions" :key="col" :value="col">按 {{ col }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="4">
              <a-form-item label="Top-K">
                <a-input-number v-model:value="topK" :min="1" :max="50" class="control-number" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="4" class="resource-actions">
              <a-button type="primary" block class="refresh-button" :loading="loading" @click="loadPoints">刷新图谱</a-button>
            </a-col>
          </a-row>
        </a-form>
      </a-card>

      <a-row :gutter="16" class="visualize-layout">
        <a-col :xs="24" :lg="16">
          <a-card class="chart-card workbench-panel" :bordered="false">
            <template #title>
              <div class="card-title card-title--accent">
                <span class="card-title__bar" aria-hidden="true"></span>
                <span>嵌入空间可视化</span>
              </div>
            </template>
            <div class="chart-card__body">
              <div v-if="loading" class="chart-loading">
                <a-spin size="large" />
                <p>加载中，共 {{ allDatasets.find(d => d.id === selectedDatasetId)?.n_cells?.toLocaleString() ?? '?' }} 个细胞…</p>
              </div>
              <div v-else-if="!points.length" class="chart-empty">
                <a-empty description="暂无数据，请点击「刷新图谱」" />
              </div>
              <UmapPlot
                v-if="points.length"
                :points="points"
                :dimension="dimension"
                :colorBy="colorBy"
                :selectedId="selectedPoint?.id ?? null"
                :highlightPoints="highlightPoints"
                @point-click="onPointClick"
              />
            </div>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="8">
          <a-collapse v-model:activeKey="sidebarOpenKeys" class="sidebar-collapse" :bordered="false" accordion>
            <a-collapse-panel key="locate" header="高亮定位">
              <div class="locate-panel">
                <a-textarea v-model:value="locateInput" :auto-size="{ minRows: 3, maxRows: 5 }" placeholder="输入 cell_id（逗号或换行分隔）" />
                <a-button type="primary" block :loading="locateLoading" @click="locateCells">定位并高亮</a-button>
              </div>
            </a-collapse-panel>

            <a-collapse-panel key="selected" header="选中细胞">
              <div class="panel-scroll-body">
                <div v-if="selectedPoint" class="selected-panel">
                  <p><strong>ID：</strong>{{ selectedPoint.id }}</p>
                  <p><strong>cell_type：</strong>{{ selectedPoint.cell_type }}</p>
                  <p><strong>dataset：</strong>{{ selectedPoint.dataset }}</p>
                  <p><strong>metadata：</strong></p>
                  <pre>{{ JSON.stringify(selectedPoint.metadata, null, 2) }}</pre>
                </div>
                <div v-else class="empty-waiting">
                  <div class="empty-waiting__box">
                    <div class="empty-waiting__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M4 18h16" /><path d="M6 18V7" /><path d="M10 18V11" /><path d="M14 18V5" /><path d="M18 18V9" />
                      </svg>
                    </div>
                    <p>点击左侧散点图中的任一点查看详情，并自动发起相似性查询。</p>
                  </div>
                </div>
              </div>
            </a-collapse-panel>

            <a-collapse-panel key="neighbors" header="相似细胞结果">
              <div class="panel-scroll-body">
                <a-table
                  class="neighbor-table"
                  :columns="neighborColumns"
                  :data-source="neighbors"
                  :pagination="false"
                  size="small"
                  row-key="rank"
                  :loading="neighborLoading"
                />
              </div>
            </a-collapse-panel>

            <a-collapse-panel key="stats" header="数据分布统计">
              <div class="panel-scroll-body">
                <div v-if="facets" class="facets-visual">
                  <div v-for="(vals, key) in facets" :key="key" class="facet-block">
                    <strong>{{ key }}</strong>
                    <div class="facet-list">
                      <div v-for="(count, name) in vals" :key="name" class="facet-row">
                        <span class="facet-row__name">{{ name }}</span>
                        <span class="facet-row__value">{{ count }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="stats-empty">
                  <div class="stats-skeleton" aria-hidden="true">
                    <span class="stats-skeleton__bar stats-skeleton__bar--1"></span>
                    <span class="stats-skeleton__bar stats-skeleton__bar--2"></span>
                    <span class="stats-skeleton__bar stats-skeleton__bar--3"></span>
                  </div>
                  <div class="stats-empty__text">暂无数据</div>
                </div>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </a-col>
      </a-row>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import UmapPlot from "@/components/visualize/UmapPlot.vue"
import { browseSearch, listDatasets, listIndexes } from "@/api/search"
import { useSearch } from "@/composables/useSearch"
import request from "@/api/request"
import { showErrMsg } from "@/utils/error"

type Point = {
  id: string
  cell_type?: string
  dataset?: string
  umap_x: number
  umap_y: number
  umap_z?: number
  metadata?: Record<string, any>
}

const dimension = ref<2 | 3>(2)
const colorBy = ref("cell_type")
const topK = ref(10)
const points = ref<Point[]>([])
const selectedPoint = ref<Point | null>(null)
const neighbors = ref<any[]>([])
const facets = ref<any>(null)
const loading = ref(false)
const neighborLoading = ref(false)
const activeIndexId = ref<number | undefined>()
const highlightPoints = ref<Array<{ id: string; umap_x: number; umap_y: number; umap_z?: number }>>([])
const locateInput = ref("")
const locateLoading = ref(false)
const sidebarOpenKeys = ref<string[]>(["locate"])

// 数据集选择
const allDatasets = ref<any[]>([])
const datasetsLoading = ref(false)
const selectedDatasetId = ref<number | undefined>()
const colorOptions = ref<string[]>(["cell_type"])
const availableModes = ref<string[]>(["2d", "3d"])

const datasetOptions = computed(() =>
  allDatasets.value.map((d: any) => ({ label: `${d.name} (${d.n_cells ?? "?"} cells)`, value: d.id }))
)

const neighborColumns = [
  { title: "排名", dataIndex: "rank", key: "rank", width: 70 },
  { title: "编号", dataIndex: "id", key: "id" },
  { title: "相似度", dataIndex: "score", key: "score", width: 100 },
  { title: "细胞类型", dataIndex: "cell_type", key: "cell_type", width: 100 },
]

const { search } = useSearch()

async function loadAllDatasets() {
  datasetsLoading.value = true
  try {
    allDatasets.value = await listDatasets()
  } catch (e: any) {
    showErrMsg(e, "加载数据集失败")
  } finally {
    datasetsLoading.value = false
  }
}

async function fetchColorOptions(datasetId: number) {
  try {
    const modes = await request.get(`/visualize/${datasetId}/modes`) as any
    if (modes?.color_options?.length) {
      colorOptions.value = modes.color_options
      if (!colorOptions.value.includes(colorBy.value)) {
        colorBy.value = colorOptions.value[0]
      }
    }
    if (modes?.available_modes?.length) {
      availableModes.value = modes.available_modes
      if (!availableModes.value.includes(dimension.value === 3 ? "3d" : "2d")) {
        dimension.value = 2
      }
    }
  } catch {
    colorOptions.value = []
  }
}

async function onDatasetChange(datasetId: number) {
  selectedDatasetId.value = datasetId
  await fetchColorOptions(datasetId)
  highlightPoints.value = []
}

async function loadPoints() {
  const dsId = selectedDatasetId.value
  if (!dsId) return
  loading.value = true
  try {
    // 顺带拿第一个 ready 索引，供点击相似查询使用
    const indexes = await listIndexes(dsId)
    activeIndexId.value = indexes.find((i: any) => i.status === "ready")?.id
    const res = await browseSearch({ datasetId: dsId, pageSize: 5000, queryType: dimension.value === 3 ? "vector" : "id", colorBy: colorBy.value })
    const pts = res.points ?? []
    points.value = pts.map((item: any, idx: number) => ({
      id: item.cell_id,
      cell_type: item.obs?.[colorBy.value] ?? item.obs?.cell_type ?? item.label,
      dataset: `dataset_${res.dataset_id}`,
      umap_x: item.x,
      umap_y: item.y,
      umap_z: item.z ?? idx / 10,
      metadata: item.obs ?? {},
    }))
    facets.value = res.color_options ? { [res.color_by ?? "color_by"]: res.color_options } : null
    highlightPoints.value = []
  } catch (error: any) {
    showErrMsg(error, "加载可视化数据失败")
    points.value = []
    facets.value = null
  } finally {
    loading.value = false
  }
}

async function onPointClick(point: Point) {
  selectedPoint.value = point
  if (!activeIndexId.value) {
    neighbors.value = []
    return
  }
  neighborLoading.value = true
  try {
    const res = await search({ queryType: "id", query: point.id, indexId: activeIndexId.value, k: topK.value, page: 1, pageSize: topK.value })
    neighbors.value = res.results
  } catch (e) {
    neighbors.value = []
  } finally {
    neighborLoading.value = false
  }
}

async function locateCells() {
  const dsId = selectedDatasetId.value
  if (!dsId) return message.warning("请先选择数据集")
  const ids = locateInput.value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (!ids.length) return message.warning("请输入 cell_id")

  locateLoading.value = true
  try {
    const res = await request.post(`/visualize/${dsId}/locate`, {
      cell_ids: ids,
      mode: dimension.value === 3 ? "3d" : "2d",
    }) as any
    highlightPoints.value = (res.points ?? []).map((p: any) => ({
      id: p.cell_id,
      umap_x: p.x,
      umap_y: p.y,
      umap_z: p.z,
    }))
  } catch (err: any) {
    showErrMsg(err, "定位失败")
  } finally {
    locateLoading.value = false
  }
}

onMounted(async () => {
  await loadAllDatasets()
  await loadPoints()
})

watch(dimension, () => {
  highlightPoints.value = []
})
</script>

<style scoped>
/* ── Page shell ────────────────────────────────────── */
.visualize-page {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 18px;
  gap: 12px;
  background: #ffffff;
  border: 1px solid var(--bio-line);
}

/* ── Control panel ───────────────────────────────────── */
.control-panel { flex-shrink: 0; }
.control-select, .control-number { width: 100%; }
.refresh-button { width: 100%; font-weight: 700; }

/* ── Main layout ─────────────────────────────────────── */
.visualize-layout { flex: 1; min-height: 0; align-items: stretch; }
.visualize-layout :deep(.ant-col) { display: flex; flex-direction: column; }

/* ── Chart card ──────────────────────────────────────── */
.chart-card { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.chart-card :deep(.ant-card-body) { flex: 1; min-height: 0; overflow: hidden; padding: 0; }
.chart-card :deep(.ant-card-head) { background: var(--bio-panel-muted); border-bottom: 1px solid var(--bio-line); }
.chart-card :deep(.ant-card-head-title) { padding: 12px 0; }

.card-title { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--bio-navy); }
.card-title__bar { width: 3px; height: 16px; border-radius: 999px; background: #0072d1; }

.chart-card__body {
  position: relative; height: 100%; min-height: 0; padding: 0; overflow: hidden;
  background:
    linear-gradient(var(--bio-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--bio-line) 1px, transparent 1px),
    #ffffff;
  background-size: 44px 44px;
}
.chart-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 2; background: #ffffff; }
.chart-loading { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--bio-muted); z-index: 2; background: rgba(255,255,255,0.92); }

/* ── Sidebar collapse ────────────────────────────────── */
.sidebar-collapse { flex: 1; min-height: 0; overflow-y: auto; background: transparent; }
.sidebar-collapse :deep(.ant-collapse-item) {
  margin-bottom: 8px; border-radius: 9px !important;
  border: 1px solid var(--bio-line) !important; background: #ffffff; overflow: hidden;
}
.sidebar-collapse :deep(.ant-collapse-header) { font-weight: 700; color: var(--bio-navy); padding: 11px 16px !important; font-size: 13px; }
.sidebar-collapse :deep(.ant-collapse-content) { border-top: 1px solid var(--bio-line); }
.sidebar-collapse :deep(.ant-collapse-content-box) { padding: 0 !important; }

.panel-scroll-body { max-height: 200px; overflow-y: auto; scrollbar-width: thin; padding: 12px 16px; }
.locate-panel { display: grid; gap: 10px; padding: 12px 16px; }

/* ── Selected / empty states ─────────────────────────── */
.selected-panel {
  padding: 14px; border-radius: 9px; background: var(--bio-panel-muted);
  border: 1px solid var(--bio-line); color: var(--bio-text); min-height: 140px;
}
.selected-panel p { margin: 0 0 8px; font-size: 13px; }
.selected-panel pre { white-space: pre-wrap; word-break: break-word; margin: 0; color: var(--bio-muted); font-size: 12px; }

.empty-waiting { display: grid; place-items: center; min-height: 140px; }
.empty-waiting__box {
  width: 100%; padding: 16px; display: grid; gap: 10px; place-items: center;
  text-align: center; border-radius: 9px; background: var(--bio-panel-muted); border: 1px dashed var(--bio-line);
}
.empty-waiting__icon { width: 40px; height: 40px; border-radius: 8px; display: grid; place-items: center; color: var(--bio-muted); background: #eef2f7; }
.empty-waiting__icon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.empty-waiting__box p { margin: 0; color: var(--bio-muted); line-height: 1.6; font-size: 13px; }

/* ── Neighbor table ──────────────────────────────────── */
.neighbor-table :deep(.ant-table) { background: transparent; }
.neighbor-table :deep(.ant-table-thead > tr > th) {
  background: var(--bio-panel-muted) !important; color: var(--bio-navy);
  font-weight: 700; font-size: 12px; border-bottom: 1px solid var(--bio-line);
}
.neighbor-table :deep(.ant-table-thead > tr > th::before) { display: none; }
.neighbor-table :deep(.ant-table-tbody > tr > td) { border-bottom: 1px solid var(--bio-line); }
.neighbor-table :deep(.ant-table-tbody > tr:hover > td) { background: #f0f5fb !important; }

/* ── Facets ──────────────────────────────────────────── */
.facets-visual { display: grid; gap: 12px; }
.facet-block { padding: 12px 14px; border-radius: 9px; background: var(--bio-panel-muted); border: 1px solid var(--bio-line); }
.facet-block strong { display: block; margin-bottom: 8px; color: var(--bio-navy); font-size: 13px; }
.facet-list { display: grid; gap: 6px; }
.facet-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--bio-muted); font-size: 13px; }
.facet-row__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.facet-row__value { font-weight: 700; color: var(--bio-navy); }

.stats-empty { min-height: 140px; display: grid; place-items: center; gap: 10px; }
.stats-empty__text { color: var(--bio-muted); font-size: 13px; }
.stats-skeleton { width: 100%; height: 70px; display: flex; align-items: end; justify-content: center; gap: 12px; }
.stats-skeleton__bar { width: 22%; border-radius: 3px 3px 2px 2px; background: var(--bio-line); }
.stats-skeleton__bar--1 { height: 34%; }
.stats-skeleton__bar--2 { height: 62%; }
.stats-skeleton__bar--3 { height: 46%; }

pre { white-space: pre-wrap; word-break: break-word; margin: 0; }
</style>
