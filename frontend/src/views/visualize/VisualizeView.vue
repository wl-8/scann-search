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
        <div class="control-panel__inner">

          <a-row :gutter="16" align="middle" class="control-row workbench-control-band">
          <a-col :xs="24" :md="6">
            <a-select
              v-model:value="selectedDatasetId"
              :options="datasetOptions"
              placeholder="选择数据集"
              class="control-select"
              :loading="datasetsLoading"
              @change="onDatasetChange"
            />
          </a-col>
          <a-col :xs="24" :md="4">
            <a-select v-model:value="dimension" class="control-select" :disabled="!selectedDatasetId">
              <a-select-option :value="2">2D</a-select-option>
              <a-select-option :value="3" :disabled="!availableModes.includes('3d')">3D</a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :md="6">
            <a-select v-model:value="colorBy" class="control-select">
              <a-select-option v-for="col in colorOptions" :key="col" :value="col">按 {{ col }}</a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :md="4">
            <a-input-number v-model:value="topK" :min="1" :max="50" class="control-number" />
          </a-col>
          <a-col :xs="24" :md="4">
            <a-button type="primary" block class="refresh-button" :loading="loading" @click="loadPoints">刷新图谱</a-button>
          </a-col>
          </a-row>
        </div>
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
  { title: "Rank", dataIndex: "rank", key: "rank", width: 70 },
  { title: "ID", dataIndex: "id", key: "id" },
  { title: "Score", dataIndex: "score", key: "score", width: 100 },
  { title: "Type", dataIndex: "cell_type", key: "cell_type", width: 100 },
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
.visualize-page {
  position: relative;
  isolation: isolate;
  min-height: 100%;
  display: grid;
  gap: 16px;
  padding: 18px 0 8px;
  overflow: hidden;
  background:
    radial-gradient(circle at 14% 12%, rgba(224, 242, 254, 0.9) 0, rgba(224, 242, 254, 0.62) 20%, rgba(224, 242, 254, 0.16) 38%, transparent 62%),
    radial-gradient(circle at 86% 88%, rgba(243, 232, 255, 0.88) 0, rgba(243, 232, 255, 0.58) 20%, rgba(243, 232, 255, 0.16) 38%, transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 52%, #f3f7fb 100%);
}

.visualize-page::before {
  content: "";
  position: absolute;
  inset: -18%;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(circle at 18% 14%, rgba(224, 242, 254, 0.42) 0 11%, transparent 44%),
    radial-gradient(circle at 82% 84%, rgba(243, 232, 255, 0.38) 0 12%, transparent 46%),
    radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.24) 0 9%, transparent 34%),
    linear-gradient(135deg, rgba(0, 123, 255, 0.03), rgba(38, 166, 154, 0.015), rgba(243, 232, 255, 0.03));
  filter: blur(32px);
  opacity: 0.9;
  animation: visualizeGlowDrift 26s ease-in-out infinite alternate;
}

.visualize-page > * {
  position: relative;
  z-index: 1;
}

.control-panel,
.chart-card,
.info-card {
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 24px 54px rgba(15, 23, 42, 0.06),
    0 8px 16px rgba(15, 23, 42, 0.04);
}

.locate-panel {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
}

.control-panel__inner {
  padding: 18px 20px 16px;
}

.control-panel__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.control-panel__eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #007bff;
}

.control-panel__header h2 {
  margin: 6px 0 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.control-panel__header p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
  max-width: 520px;
}

.control-row {
  padding: 12px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.control-select,
.control-number {
  width: 100%;
}

.control-row :deep(.ant-select-selector),
.control-row :deep(.ant-input-number),
.control-row :deep(.ant-input-number-input-wrap),
.control-row :deep(.ant-select-selection-search-input) {
  border-radius: 12px !important;
}

.control-row :deep(.ant-select-selector),
.control-row :deep(.ant-input-number) {
  background: #fff !important;
  border: 1px solid #d8e3ee !important;
  box-shadow: none !important;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.control-row :deep(.ant-select-focused .ant-select-selector),
.control-row :deep(.ant-input-number-focused) {
  border-color: #007bff !important;
  box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.12) !important;
}

.refresh-button {
  width: 100%;
  height: 40px;
  border-radius: 12px;
  font-weight: 800;
  box-shadow: 0 14px 26px rgba(0, 123, 255, 0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.refresh-button:hover {
  transform: translateY(-1px) scale(1.02);
  filter: brightness(1.03);
  box-shadow: 0 18px 30px rgba(0, 123, 255, 0.24);
}

.visualize-layout {
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

.visualize-layout :deep(.ant-col) {
  display: flex;
  flex-direction: column;
}

.chart-card {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-card :deep(.ant-card-body) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

.chart-card :deep(.ant-card-head),
.info-card :deep(.ant-card-head) {
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.chart-card :deep(.ant-card-head-title),
.info-card :deep(.ant-card-head-title) {
  padding: 16px 0;
}

.card-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.98rem;
  font-weight: 800;
  color: #0f172a;
}

.card-title--accent {
  position: relative;
}

.card-title__bar {
  width: 4px;
  height: 18px;
  border-radius: 999px;
  background: #007bff;
}

.chart-card__body {
  position: relative;
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.chart-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
  z-index: 2;
}

.chart-skeleton {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 14px;
  pointer-events: none;
  opacity: 0.65;
  background:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 100% 20%, 14.285% 100%;
  border-radius: 14px;
}

.chart-skeleton__dot {
  align-self: end;
  justify-self: center;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(0, 123, 255, 0.14);
  opacity: 0.85;
  animation: pulseDot 4.5s ease-in-out infinite;
  animation-delay: var(--delay);
}

.chart-card :deep(.plot-wrap) {
  position: relative;
  z-index: 1;
  height: 100%;
  min-height: 0;
}

.chart-card :deep(.js-plotly-plot .plotly),
.chart-card :deep(.js-plotly-plot .svg-container) {
  background: transparent !important;
}

.sidebar-collapse {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: transparent;
}

.sidebar-collapse :deep(.ant-collapse-item) {
  margin-bottom: 8px;
  border-radius: 9px !important;
  border: 1px solid var(--bio-line) !important;
  background: #ffffff;
  overflow: hidden;
}

.sidebar-collapse :deep(.ant-collapse-header) {
  font-weight: 700;
  color: var(--bio-navy);
  padding: 12px 16px !important;
}

.sidebar-collapse :deep(.ant-collapse-content) {
  border-top: 1px solid var(--bio-line);
}

.sidebar-collapse :deep(.ant-collapse-content-box) {
  padding: 0 !important;
}

.panel-scroll-body {
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  padding: 14px 16px;
}

.locate-panel {
  padding: 0;
}

.info-card {
  overflow: hidden;
}

.info-card :deep(.ant-card-body) {
  padding: 20px;
}

.selected-panel {
  padding: 18px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  color: #334155;
  min-height: 220px;
}

.selected-panel p {
  margin: 0 0 10px;
}

.selected-panel pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  color: #475569;
}

.empty-waiting {
  display: grid;
  place-items: center;
  min-height: 220px;
}

.empty-waiting__box {
  width: 100%;
  padding: 18px;
  display: grid;
  gap: 12px;
  place-items: center;
  text-align: center;
  border-radius: 14px;
  background: #fafcff;
  border: 1px dashed rgba(148, 163, 184, 0.35);
}

.empty-waiting__icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.08);
}

.empty-waiting__icon svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.empty-waiting__box p {
  margin: 0;
  color: #94a3b8;
  line-height: 1.7;
}

.neighbor-table :deep(.ant-table) {
  background: transparent;
}

.neighbor-table :deep(.ant-table-thead > tr > th) {
  background: #f9fafb;
  color: #334155;
  font-weight: 800;
  border-bottom: 1px solid rgba(226, 232, 240, 1);
}

.neighbor-table :deep(.ant-table-thead > tr > th::before) {
  display: none;
}

.neighbor-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  border-left: 0;
  border-right: 0;
}

.neighbor-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fafc !important;
}

.neighbor-table :deep(.ant-empty-image) {
  opacity: 0.45;
}

.neighbor-table :deep(.ant-empty-description) {
  color: #94a3b8;
}

.facets-visual {
  display: grid;
  gap: 16px;
}

.facet-block {
  padding: 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.facet-block strong {
  display: inline-block;
  margin-bottom: 12px;
  color: #334155;
}

.facet-list {
  display: grid;
  gap: 8px;
}

.facet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #475569;
}

.facet-row__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.facet-row__value {
  font-weight: 700;
  color: #0f172a;
}

.stats-empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  gap: 14px;
}

.stats-skeleton {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: end;
  justify-content: center;
  gap: 14px;
  padding: 0 26px;
}

.stats-skeleton__bar {
  width: 22%;
  border-radius: 10px 10px 4px 4px;
  background: rgba(148, 163, 184, 0.2);
}

.stats-skeleton__bar--1 { height: 34%; }
.stats-skeleton__bar--2 { height: 62%; }
.stats-skeleton__bar--3 { height: 46%; }

.stats-empty__text {
  color: #94a3b8;
  font-weight: 600;
}

@keyframes pulseDot {
  0%, 100% { transform: translateY(0); opacity: 0.65; }
  50% { transform: translateY(-4px); opacity: 1; }
}

@media (max-width: 992px) {
  .control-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .visualize-page {
    padding-top: 12px;
  }

  .control-panel__inner,
  .chart-card__body,
  .info-card :deep(.ant-card-body) {
    padding: 14px;
  }

  .chart-card__body {
    min-height: 420px;
  }

  .chart-card :deep(.plot-wrap) {
    min-height: 420px;
  }
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

@keyframes visualizeGlowDrift {
  from {
    transform: translate3d(-1%, -0.8%, 0) scale(1);
  }

  to {
    transform: translate3d(1%, 0.8%, 0) scale(1.02);
  }
}

.visualize-page {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 18px;
  background: #ffffff;
  border: 1px solid var(--bio-line);
}

.visualize-page::before {
  display: none;
}

.control-panel,
.chart-card,
.info-card {
  border-radius: 9px;
  border: 1px solid var(--bio-line);
  background: var(--bio-panel);
  box-shadow: none;
}

.control-panel :deep(.ant-card-body) {
  padding: 0;
}

.control-panel__inner {
  padding: 14px 18px;
}

.control-panel__header {
  align-items: center;
  margin-bottom: 12px;
}

.control-panel__eyebrow {
  color: var(--bio-muted);
  font-size: 12px;
  letter-spacing: 0.06em;
}

.control-panel__header h2,
.card-title {
  color: var(--bio-navy);
  font-weight: 850;
}

.control-panel__header p,
.stats-empty__text {
  color: #52667c;
}

.control-row {
  padding: 10px 12px;
  border-radius: 9px;
}

.chart-card :deep(.ant-card-head),
.info-card :deep(.ant-card-head) {
  border-bottom-color: var(--bio-line);
  background: #ffffff;
}

.chart-card__body {
  background:
    linear-gradient(#eff4f8 1px, transparent 1px),
    linear-gradient(90deg, #eff4f8 1px, transparent 1px),
    #ffffff;
  background-size: 44px 44px;
}

.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { display: flex; align-items: center; gap: 14px; }
.page-icon { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; background: rgba(0,123,255,0.1); color: #007bff; flex-shrink: 0; }
.page-icon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.page-crumb { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; color: #007bff; text-transform: uppercase; }
.page-header h2 { margin: 4px 0 0; font-size: 1.35rem; line-height: 1.2; font-weight: 800; color: #0f172a; }
.page-meta { color: #64748b; font-size: 0.92rem; font-weight: 600; max-width: 480px; }
</style>
