<template>
  <AppLayout>
    <section class="visual-workbench">
      <header class="viz-header">
        <div class="viz-header__main">
          <div>
            <div class="viz-header__path">Visual analytics / UMAP</div>
            <h2>单细胞数据 UMAP 可视化</h2>
          </div>
          <div class="viz-header__chips">
            <span class="status-chip status-chip--ready">
              <span class="status-dot" aria-hidden="true"></span>
              {{ activeIndex ? `索引 #${activeIndex.id} ready` : "未选择 ready 索引" }}
            </span>
            <span class="status-chip">{{ activeDataset?.embedding_key ?? "X_pca" }}</span>
          </div>
        </div>

        <div class="metric-strip">
          <article v-for="metric in summaryCards" :key="metric.label" class="metric-card">
            <span class="metric-card__label">{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <span>{{ metric.meta }}</span>
          </article>
        </div>
      </header>

      <div class="workbench-grid">
        <main class="map-column">
          <section class="toolbar-panel" aria-label="UMAP 控制">
            <div class="toolbar-grid">
              <label class="field field--wide">
                <span>数据集</span>
                <a-select v-model:value="selectedDatasetId" :options="datasetOptions" @change="onDatasetChange" />
              </label>
              <label class="field">
                <span>视图</span>
                <a-segmented v-model:value="dimension" :options="dimensionOptions" />
              </label>
              <label class="field">
                <span>着色</span>
                <a-select v-model:value="colorBy">
                  <a-select-option value="cell_type">cell_type</a-select-option>
                  <a-select-option value="dataset">dataset</a-select-option>
                  <a-select-option value="disease">disease</a-select-option>
                </a-select>
              </label>
              <label class="field">
                <span>Top-K</span>
                <a-input-number v-model:value="topK" :min="1" :max="50" />
              </label>
              <a-button type="primary" class="toolbar-action" :loading="loading" @click="loadPoints">刷新图谱</a-button>
            </div>

            <div class="locate-strip">
              <div class="locate-strip__copy">
                <strong>细胞定位</strong>
                <span>输入一个或多个 cell_id，在图谱中高亮并打开检查器。</span>
              </div>
              <a-input v-model:value="locateInput" class="locate-input" placeholder="AAACCTGAGCAGGTCA-1_2" />
              <a-button class="locate-button" :loading="locateLoading" @click="locate">高亮定位</a-button>
            </div>
          </section>

          <section class="map-panel">
            <div class="map-panel__head">
              <div>
                <h3>UMAP embedding</h3>
                <p>{{ pointCountLabel }} points · {{ dimension }}D · colored by {{ colorBy }}</p>
              </div>
              <div class="map-panel__tools">
                <span>{{ activeDataset?.name ?? "dataset" }}</span>
                <span>{{ loading ? "loading" : "live" }}</span>
              </div>
            </div>

            <div class="map-stage">
              <div class="map-grid" aria-hidden="true"></div>
              <div v-if="loading" class="plot-loading">正在刷新 embedding...</div>
              <UmapPlot
                :points="points"
                :dimension="dimension"
                :colorBy="colorBy"
                :selectedId="selectedPoint?.id ?? null"
                @point-click="onPointClick"
              />
              <div v-if="legendRows.length" class="map-legend">
                <div class="map-legend__title">Legend</div>
                <div v-for="item in legendRows" :key="item.name" class="legend-row">
                  <span class="legend-row__swatch" :style="{ background: item.color }"></span>
                  <span>{{ item.name }}</span>
                  <strong>{{ item.count }}</strong>
                </div>
              </div>
            </div>
          </section>
        </main>

        <aside class="inspector-column">
          <section class="inspector-card selected-card">
            <div class="panel-heading">
              <div>
                <span>Selected cell</span>
                <h3>选中细胞</h3>
              </div>
              <span class="mini-chip">{{ selectedPoint ? "active" : "idle" }}</span>
            </div>

            <div v-if="selectedPoint" class="selected-cell">
              <div class="selected-cell__id">{{ selectedPoint.id }}</div>
              <div class="selected-cell__type">{{ selectedCellType }}</div>
              <div class="metadata-grid">
                <div v-for="item in selectedMetadataRows" :key="item.key" class="metadata-row">
                  <span>{{ item.key }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>
            </div>
            <div v-else class="empty-inspector">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 18h16" />
                <path d="M7 15V8" />
                <path d="M12 15V5" />
                <path d="M17 15v-9" />
              </svg>
              <p>点击散点或使用高亮定位打开细胞详情。</p>
            </div>
          </section>

          <section class="inspector-card">
            <div class="panel-heading">
              <div>
                <span>Nearest neighbors</span>
                <h3>相似细胞结果</h3>
              </div>
              <span class="mini-chip">{{ neighbors.length }} hits</span>
            </div>
            <a-table
              class="neighbor-table"
              :columns="neighborColumns"
              :data-source="neighbors"
              :pagination="false"
              size="small"
              row-key="rank"
              :loading="neighborLoading"
            />
          </section>

          <section class="inspector-card">
            <div class="panel-heading">
              <div>
                <span>Distribution</span>
                <h3>数据分布统计</h3>
              </div>
              <span class="mini-chip">{{ colorBy }}</span>
            </div>
            <div v-if="distributionRows.length" class="distribution-list">
              <div v-for="item in distributionRows" :key="item.name" class="distribution-row">
                <div class="distribution-row__top">
                  <span>
                    <i :style="{ background: item.color }" aria-hidden="true"></i>
                    {{ item.name }}
                  </span>
                  <strong>{{ item.count }}</strong>
                </div>
                <div class="distribution-bar">
                  <span :style="{ width: `${item.percent}%`, background: item.color }"></span>
                </div>
              </div>
            </div>
            <div v-else class="empty-mini">暂无分布数据</div>
          </section>
        </aside>
      </div>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import UmapPlot from "@/components/visualize/UmapPlot.vue"
import { browseSearch, getDatasetCells, listDatasets, listIndexes } from "@/api/search"
import { useSearch } from "@/composables/useSearch"
import { locateCells } from "@/api/visualize"

type Point = {
  id: string
  cell_type?: string
  dataset?: string
  umap_x: number
  umap_y: number
  umap_z?: number
  metadata?: Record<string, any>
}

const palette = ["#2563eb", "#14b8a6", "#f97316", "#8b5cf6", "#0ea5e9", "#22c55e", "#e11d48", "#64748b"]
const dimension = ref<2 | 3>(2)
const colorBy = ref("cell_type")
const topK = ref(10)
const points = ref<Point[]>([])
const selectedPoint = ref<Point | null>(null)
const neighbors = ref<any[]>([])
const loading = ref(false)
const neighborLoading = ref(false)
const locateLoading = ref(false)
const locateInput = ref("")
const datasets = ref<any[]>([])
const indexes = ref<any[]>([])
const selectedDatasetId = ref<number>()
const selectedIndexId = ref<number>()

const dimensionOptions = [
  { label: "2D", value: 2 },
  { label: "3D", value: 3 },
]

const datasetOptions = computed(() =>
  datasets.value.map((item) => ({
    value: item.id,
    label: `${item.name} (#${item.id})`,
  }))
)
const activeDataset = computed(() => datasets.value.find((item) => item.id === selectedDatasetId.value))
const activeIndex = computed(() => indexes.value.find((item) => item.id === selectedIndexId.value))
const pointCountLabel = computed(() => formatNumber(points.value.length))
const selectedCellType = computed(() => selectedPoint.value?.cell_type || String(selectedPoint.value?.metadata?.cell_type ?? "unknown"))

const summaryCards = computed(() => [
  { label: "Cells", value: formatNumber(activeDataset.value?.n_cells), meta: "loaded dataset" },
  { label: "Genes", value: formatNumber(activeDataset.value?.n_genes), meta: "feature space" },
  { label: "Vectors", value: formatNumber(activeIndex.value?.n_vectors), meta: activeIndex.value?.algorithm ?? "index" },
  { label: "Rendered", value: formatNumber(points.value.length), meta: `${dimension.value}D canvas` },
])

const distributionRows = computed(() => {
  const counts = new Map<string, number>()
  for (const point of points.value) {
    const raw = (point as any)[colorBy.value] ?? point.metadata?.[colorBy.value] ?? "unknown"
    const name = String(raw || "unknown")
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  const total = Math.max(points.value.length, 1)
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count], index) => ({
      name,
      count,
      percent: Math.max(4, Math.round((count / total) * 100)),
      color: palette[index % palette.length],
    }))
})
const legendRows = computed(() => distributionRows.value.slice(0, 5))
const selectedMetadataRows = computed(() => {
  const metadata = selectedPoint.value?.metadata ?? {}
  const preferred = ["row_index", "cell_type", "author_cell_type", "disease", "sex", "tissue", "Treatment", "Phase"]
  const rows: Array<{ key: string; value: string }> = []
  for (const key of preferred) {
    const value = metadata[key]
    if (value !== undefined && value !== null && value !== "") rows.push({ key, value: String(value) })
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (rows.length >= 8) break
    if (!preferred.includes(key) && value !== undefined && value !== null && value !== "") rows.push({ key, value: String(value) })
  }
  return rows
})

const neighborColumns = [
  { title: "Rank", dataIndex: "rank", key: "rank", width: 64 },
  { title: "Cell ID", dataIndex: "id", key: "id" },
  { title: "Distance", dataIndex: "distance", key: "distance", width: 96 },
  { title: "Type", dataIndex: "cell_type", key: "cell_type", width: 96 },
]

const { search } = useSearch()

function formatNumber(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "-"
  return new Intl.NumberFormat("en-US").format(Number(value))
}

async function loadPoints() {
  loading.value = true
  try {
    if (!selectedDatasetId.value) {
      points.value = []
      return
    }
    const res = await browseSearch({
      datasetId: selectedDatasetId.value,
      pageSize: 5000,
      queryType: dimension.value === 3 ? "vector" : "id",
      colorBy: colorBy.value,
    })
    const pts = res.points ?? []
    points.value = pts.map((item: any, idx: number) => ({
      id: item.cell_id,
      cell_type: item.obs?.cell_type ?? item.label,
      dataset: activeDataset.value?.name ?? `dataset_${res.dataset_id}`,
      umap_x: item.x,
      umap_y: item.y,
      umap_z: item.z ?? idx / 10,
      metadata: item.obs ?? {},
    }))
    if (selectedPoint.value && !points.value.some((point) => point.id === selectedPoint.value?.id)) {
      selectedPoint.value = null
      neighbors.value = []
    }
  } catch (error) {
    console.error("Failed to load visualize points:", error)
    points.value = []
  } finally {
    loading.value = false
  }
}

async function onPointClick(point: Point) {
  selectedPoint.value = point
  neighborLoading.value = true
  try {
    if (!selectedIndexId.value) throw new Error("当前数据集没有 ready 索引")
    const res = await search({ queryType: "id", query: point.id, k: topK.value, indexId: selectedIndexId.value, page: 1, pageSize: topK.value })
    neighbors.value = res.results
  } catch (e: any) {
    neighbors.value = []
    message.error(e?.response?.data?.detail ?? e?.message ?? "相似细胞查询失败")
  } finally {
    neighborLoading.value = false
  }
}

async function loadResources() {
  datasets.value = await listDatasets()
  selectedDatasetId.value = selectedDatasetId.value ?? datasets.value[0]?.id
  await onDatasetChange(selectedDatasetId.value)
}

async function onDatasetChange(datasetId?: number) {
  if (!datasetId) return
  indexes.value = await listIndexes(datasetId)
  selectedIndexId.value = indexes.value.find((item) => item.status === "ready")?.id
  const page = await getDatasetCells(datasetId, 0, 1)
  locateInput.value = page.items[0]?.cell_id ?? ""
  selectedPoint.value = null
  neighbors.value = []
  await loadPoints()
}

async function locate() {
  if (!selectedDatasetId.value) return
  const ids = locateInput.value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean)
  if (!ids.length) return message.warning("请输入 cell_id")
  locateLoading.value = true
  try {
    const res = await locateCells(selectedDatasetId.value, ids, dimension.value === 3 ? "3d" : "2d")
    const first = res.points[0]
    if (!first) return message.warning("未找到匹配细胞")
    const existing = points.value.find((item) => item.id === first.cell_id)
    let point = existing
    if (!point) {
      let metadata: Record<string, any> = { row_index: first.row_index }
      try {
        const page = await getDatasetCells(selectedDatasetId.value, first.row_index, 1)
        const cell = page.items?.find((item: any) => item.cell_id === first.cell_id) ?? page.items?.[0]
        if (cell?.obs) metadata = { row_index: first.row_index, ...cell.obs }
      } catch {
        // Detail enrichment is best-effort; location itself already succeeded.
      }
      point = {
        id: first.cell_id,
        cell_type: metadata.cell_type,
        dataset: activeDataset.value?.name,
        umap_x: first.x,
        umap_y: first.y,
        umap_z: first.z ?? undefined,
        metadata,
      }
    }
    await onPointClick(point)
    message.success(`定位到 ${res.points.length} 个细胞`)
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "定位失败")
  } finally {
    locateLoading.value = false
  }
}

onMounted(loadResources)
</script>

<style scoped>
.visual-workbench {
  min-height: 100%;
  display: grid;
  gap: 16px;
  color: #0f172a;
}

.viz-header {
  display: grid;
  gap: 14px;
}

.viz-header__main {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 2px 2px 0;
}

.viz-header__path {
  margin-bottom: 4px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.viz-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.55rem;
  font-weight: 850;
  line-height: 1.2;
  letter-spacing: 0;
}

.viz-header__chips,
.map-panel__tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.status-chip,
.map-panel__tools span,
.mini-chip {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #dfe7ef;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 780;
}

.status-chip--ready {
  color: #0f766e;
  background: #f0fdfa;
  border-color: #b2f5ea;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.14);
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  min-height: 86px;
  padding: 14px 16px;
  display: grid;
  align-content: center;
  gap: 5px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.035);
}

.metric-card__label {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.metric-card strong {
  color: #0f172a;
  font-size: 1.34rem;
  line-height: 1;
}

.metric-card span:last-child {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 650;
}

.workbench-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(360px, 0.85fr);
  gap: 16px;
  align-items: start;
}

.map-column,
.inspector-column {
  min-width: 0;
  display: grid;
  gap: 16px;
}

.toolbar-panel,
.map-panel,
.inspector-card {
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e1e8f0;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.045);
}

.toolbar-panel {
  padding: 14px;
}

.toolbar-grid {
  display: grid;
  grid-template-columns: minmax(220px, 1.35fr) 132px minmax(150px, 0.8fr) 104px 128px;
  gap: 10px;
  align-items: end;
}

.field {
  min-width: 0;
  display: grid;
  gap: 6px;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 800;
}

.field :deep(.ant-select),
.field :deep(.ant-input-number),
.locate-input {
  width: 100%;
}

.field :deep(.ant-select-selector),
.field :deep(.ant-input-number),
.locate-input :deep(.ant-input),
.locate-strip :deep(.ant-input) {
  border-radius: 8px !important;
  border-color: #dbe4ee !important;
  box-shadow: none !important;
}

.field :deep(.ant-segmented) {
  width: 100%;
  padding: 3px;
  border-radius: 8px;
  background: #f1f5f9;
}

.field :deep(.ant-segmented-item) {
  min-height: 28px;
  border-radius: 6px;
  font-weight: 750;
}

.toolbar-action,
.locate-button {
  height: 36px;
  border-radius: 8px;
  font-weight: 800;
}

.toolbar-action {
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
}

.locate-strip {
  margin-top: 12px;
  padding-top: 12px;
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(260px, 1fr) 112px;
  gap: 10px;
  align-items: center;
  border-top: 1px solid #eef2f7;
}

.locate-strip__copy {
  display: grid;
  gap: 2px;
}

.locate-strip__copy strong {
  font-size: 0.82rem;
  color: #0f172a;
}

.locate-strip__copy span {
  color: #64748b;
  font-size: 0.76rem;
  line-height: 1.45;
}

.map-panel {
  overflow: hidden;
}

.map-panel__head {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid #e7edf4;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbfd 100%);
}

.map-panel__head h3,
.panel-heading h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 850;
}

.map-panel__head p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 650;
}

.map-stage {
  position: relative;
  min-height: 620px;
  padding: 10px;
  background: #fbfdff;
}

.map-grid {
  position: absolute;
  inset: 10px;
  pointer-events: none;
  border-radius: 8px;
  background:
    linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.2));
}

.plot-loading {
  position: absolute;
  z-index: 3;
  top: 18px;
  left: 18px;
  padding: 7px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e2e8f0;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.map-stage :deep(.plot-shell) {
  position: relative;
  z-index: 1;
  min-height: 620px;
  border-radius: 8px;
  background: transparent;
}

.map-stage :deep(.plot-wrap) {
  min-height: 620px;
}

.map-legend {
  position: absolute;
  z-index: 2;
  right: 20px;
  top: 20px;
  width: min(230px, calc(100% - 40px));
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.94);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(10px);
}

.map-legend__title {
  margin-bottom: 8px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.legend-row {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
}

.legend-row span:nth-child(2) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-row__swatch,
.distribution-row__top i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}

.inspector-card {
  padding: 14px;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-heading span:first-child {
  display: block;
  margin-bottom: 3px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mini-chip {
  min-height: 24px;
  padding-inline: 8px;
  background: #f8fafc;
  font-size: 0.72rem;
}

.selected-cell {
  display: grid;
  gap: 12px;
}

.selected-cell__id {
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.82rem;
  font-weight: 800;
  word-break: break-word;
}

.selected-cell__type {
  width: fit-content;
  padding: 5px 8px;
  border-radius: 8px;
  color: #0f766e;
  background: #f0fdfa;
  border: 1px solid #b2f5ea;
  font-size: 0.78rem;
  font-weight: 850;
}

.metadata-grid {
  display: grid;
  gap: 7px;
}

.metadata-row {
  display: grid;
  grid-template-columns: minmax(92px, 0.7fr) minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid #eef2f7;
}

.metadata-row span {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 750;
}

.metadata-row strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
  font-size: 0.78rem;
}

.empty-inspector,
.empty-mini {
  min-height: 160px;
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 18px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  color: #94a3b8;
  text-align: center;
  line-height: 1.65;
}

.empty-inspector svg {
  width: 34px;
  height: 34px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.empty-inspector p {
  margin: 0;
}

.neighbor-table :deep(.ant-table) {
  background: transparent;
}

.neighbor-table :deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 850;
  border-bottom: 1px solid #e2e8f0;
}

.neighbor-table :deep(.ant-table-thead > tr > th::before) {
  display: none;
}

.neighbor-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #eef2f7;
  color: #334155;
  font-size: 0.76rem;
}

.neighbor-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fafc !important;
}

.neighbor-table :deep(.ant-empty-image) {
  height: 38px;
  margin-bottom: 4px;
  opacity: 0.45;
}

.neighbor-table :deep(.ant-empty-description) {
  color: #94a3b8;
  font-size: 0.78rem;
}

.distribution-list {
  display: grid;
  gap: 10px;
}

.distribution-row {
  display: grid;
  gap: 7px;
}

.distribution-row__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 780;
}

.distribution-row__top span {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.distribution-bar {
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #eef2f7;
}

.distribution-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

@media (max-width: 1280px) {
  .workbench-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .inspector-column {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .metric-strip,
  .inspector-column {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar-grid,
  .locate-strip {
    grid-template-columns: 1fr 1fr;
  }

  .toolbar-action,
  .locate-button,
  .locate-strip__copy {
    grid-column: 1 / -1;
  }
}

@media (max-width: 680px) {
  .viz-header__main {
    align-items: flex-start;
    flex-direction: column;
  }

  .metric-strip,
  .inspector-column,
  .toolbar-grid,
  .locate-strip {
    grid-template-columns: 1fr;
  }

  .map-stage,
  .map-stage :deep(.plot-shell),
  .map-stage :deep(.plot-wrap) {
    min-height: 460px;
  }

  .map-legend {
    position: static;
    width: auto;
    margin: 10px;
  }
}
</style>
