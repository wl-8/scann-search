<template>
  <AppLayout flush-content>
    <template #toolbarControls>
      <div class="dashboard-toolbar-controls">
        <div class="select-control">
          <span>Dataset</span>
          <a-select
            v-model:value="selectedDatasetId"
            :bordered="false"
            size="small"
            style="width: 100%; margin-left: -4px"
            @change="onDatasetChange"
          >
            <a-select-option v-for="ds in allDatasets" :key="ds.id" :value="ds.id">{{ ds.name }}</a-select-option>
            <a-select-option v-if="!allDatasets.length" :value="undefined">{{ datasetName }}</a-select-option>
          </a-select>
        </div>

        <div class="select-control">
          <span>Embedding</span>
          <a-select
            v-model:value="selectedEmbeddingKey"
            :bordered="false"
            size="small"
            style="width: 100%; margin-left: -4px"
            @change="onEmbeddingChange"
          >
            <a-select-option v-for="key in availableEmbeddingKeys" :key="key" :value="key">{{ embeddingLabel(key) }}</a-select-option>
            <a-select-option v-if="!availableEmbeddingKeys.length" value="">—</a-select-option>
          </a-select>
        </div>

        <label class="opacity-control">
          <span>Spot opacity</span>
          <input v-model.number="spotOpacity" type="range" min="35" max="100" />
        </label>

        <button class="autocam-btn" :class="{ 'autocam-btn--active': autoCam }" type="button" @click="autoCam = !autoCam">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path v-if="autoCam" d="M5 3l14 9-14 9V3z"/>
            <path v-else d="M6 4h4v16H6zM14 4h4v16h-4z"/>
          </svg>
          {{ autoCam ? 'Live' : 'Static' }}
        </button>
      </div>
    </template>

    <template #toolbarActions>
      <div class="dashboard-toolbar-actions">
        <button class="tool-button" type="button" title="Search" @click="go('/search')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="5.5" />
            <path d="M15 15l5 5" />
          </svg>
        </button>
        <button class="tool-button" type="button" title="Visualize" @click="go('/visualize')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 19V5M4 19h16" />
            <path d="M8 16v-5M12 16V8M16 16v-7" />
          </svg>
        </button>
        <button v-if="auth.canResearch" class="export-button" type="button" @click="go('/export')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 13V3" />
            <path d="m7 8 5-5 5 5" />
            <path d="M4 20h16" />
          </svg>
          Export
        </button>
      </div>
    </template>

    <main class="dashboard-workbench">
      <button v-if="isOnline" class="demo-toggle" type="button" @click="toggleDemoMode">
        {{ isDemoMode ? 'Show Real Data' : 'Show Demo Data' }}
      </button>
      <aside class="groups-panel">
        <div class="panel-heading">
          <span>Pipeline-generated groups</span>
          <button class="ghost-icon" type="button" aria-label="下载分组" :disabled="!clusters.length" @click="downloadGroups">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 20h14" />
            </svg>
          </button>
        </div>

        <label class="group-source">
          <input type="radio" name="cluster-mode" v-model="clusterMode" value="graph" @change="onClusterModeChange('graph')" />
          <span>Graph-Based</span>
        </label>

        <div v-if="clusterMode === 'graph' && colorOptions.length > 1" class="color-by-select">
          <span>Color by</span>
          <a-select
            v-model:value="colorByField"
            size="small"
            style="flex: 1; max-width: 160px"
            @change="onColorByChange"
          >
            <a-select-option v-for="opt in colorOptions" :key="opt" :value="opt">{{ opt }}</a-select-option>
          </a-select>
        </div>

        <!-- Graph 模式：勾选框紧跟在 Graph-Based 下 -->
        <div v-if="clusterMode === 'graph'" class="cluster-list">
          <template v-if="clusters.length">
            <label class="cluster-row cluster-row--all">
              <input type="checkbox" :checked="allClustersEnabled" @change="toggleAllClusters" />
              <span class="cluster-swatch cluster-swatch--all"></span>
              <span class="cluster-name">All cells</span>
              <span class="cluster-count">{{ totalCellsDisplay }}</span>
            </label>
            <label
              v-for="cluster in clusters"
              :key="cluster.name"
              class="cluster-row"
              :class="{ 'cluster-row--selected': selectedCluster?.name === cluster.name }"
              @mouseenter="selectedCluster = cluster"
            >
              <input v-model="cluster.enabled" type="checkbox" />
              <span class="cluster-swatch" :style="{ background: cluster.color }"></span>
              <span class="cluster-name" :title="cluster.name">{{ cluster.name }}</span>
              <span class="cluster-count">{{ cluster.count.toLocaleString() }}</span>
            </label>
          </template>
          <div v-else class="cluster-empty">
            <span>{{ isOnline ? 'No cell groups — upload a dataset first' : 'Workspace offline' }}</span>
          </div>
        </div>

        <label class="group-source group-source--secondary">
          <input type="radio" name="cluster-mode" v-model="clusterMode" value="kmeans" @change="onClusterModeChange('kmeans')" />
          <span>K-Means</span>
        </label>

        <!-- K-Means 模式：先显示参数控制，再显示勾选框 -->
        <template v-if="clusterMode === 'kmeans'">
          <div class="kmeans-controls">
            <label>K clusters
              <input type="number" v-model.number="kmeansK" min="2" max="20" />
            </label>
            <button class="kmeans-run-btn" :disabled="kmeansRunning || !spots.length" @click="applyKMeans">
              {{ kmeansRunning ? 'Running…' : 'Re-run' }}
            </button>
          </div>

          <div class="cluster-list">
            <template v-if="clusters.length">
              <label class="cluster-row cluster-row--all">
                <input type="checkbox" :checked="allClustersEnabled" @change="toggleAllClusters" />
                <span class="cluster-swatch cluster-swatch--all"></span>
                <span class="cluster-name">All cells</span>
                <span class="cluster-count">{{ totalCellsDisplay }}</span>
              </label>
              <label
                v-for="cluster in clusters"
                :key="cluster.name"
                class="cluster-row"
                :class="{ 'cluster-row--selected': selectedCluster?.name === cluster.name }"
                @mouseenter="selectedCluster = cluster"
              >
                <input v-model="cluster.enabled" type="checkbox" />
                <span class="cluster-swatch" :style="{ background: cluster.color }"></span>
                <span class="cluster-name" :title="cluster.name">{{ cluster.name }}</span>
                <span class="cluster-count">{{ cluster.count.toLocaleString() }}</span>
                </label>
            </template>
            <div v-else class="cluster-empty">
              <span>{{ kmeansRunning ? 'Computing clusters…' : 'Click Re-run to cluster' }}</span>
            </div>
          </div>
        </template>

        <div v-if="auth.canResearch" class="groups-panel__footer">
          <button class="link-button" type="button" @click="go('/datasets')">+ Upload Dataset</button>
          <button class="primary-action" type="button" @click="go('/benchmark')">Run Benchmark</button>
        </div>
      </aside>

      <section class="viewer-panel">
        <div class="viewer-head">
          <div>
            <div class="viewer-kicker">{{ projectionTypeLabel }}</div>
            <h2>{{ datasetName }}</h2>
          </div>
          <div class="viewer-stats">
            <span>{{ datasetCount }} datasets</span>
            <span>{{ indexCount }} indexes</span>
            <span>{{ totalCellsDisplay }} cells</span>
          </div>
        </div>

        <!-- 统一 canvas：2D/3D 使用相同 CSS 点阵，3D 额外加 CSS perspective + translateZ -->
        <div
          ref="canvasEl"
          class="spatial-canvas"
          :style="{ cursor: canvasScale > 1 ? 'grab' : 'default' }"
          @mousedown="onCanvasMouseDown"
          @mousemove="onCanvasMouseMove"
          @mouseup="onCanvasMouseUp"
          @mouseleave="onCanvasMouseLeave"
          @wheel.prevent="onCanvasWheel"
        >
          <div class="canvas-grid" aria-hidden="true"></div>
          <div class="tissue-halo" aria-hidden="true"></div>
          <div v-if="projectionLoading" class="canvas-loading-overlay">
            <svg class="canvas-spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="40 20" /></svg>
          </div>
          <div class="canvas-controls">
            <button class="canvas-control" type="button" aria-label="还原视图" @click.stop="fitCanvas">
              <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64L3 8" /><path d="M3 3v5h5" /></svg>
            </button>
            <button class="canvas-control" type="button" aria-label="缩小" @click.stop="zoomOut">
              <svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.5" /><path d="M15 15l5 5M8 10.5h5" /></svg>
            </button>
            <button class="canvas-control" type="button" aria-label="放大" @click.stop="zoomIn">
              <svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.5" /><path d="M15 15l5 5M10.5 8v5M8 10.5h5" /></svg>
            </button>
          </div>

          <div class="canvas-perspective">
            <div
              class="canvas-content"
              :style="{ transform: `translate(${canvasPanX}px, ${canvasPanY}px) scale(${canvasScale})` }"
            >
              <div
                v-for="spot in spots"
                :key="spot.id"
                class="spot"
                :class="{ 'spot--dim': !spot.enabled }"
                :style="{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  width: `${spot.size}px`,
                  height: `${spot.size}px`,
                  background: spot.color,
                  opacity: spot.enabled ? spot.opacity : 0.08,
                }"
              ></div>

              <div v-if="isOnline && !spots.length && !isDemoMode" class="canvas-empty">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                  <circle cx="24" cy="20" r="8"/>
                  <path d="M8 40c0-8.84 7.16-16 16-16s16 7.16 16 16"/>
                  <path d="M32 12l8-8M36 12h4v-4"/>
                </svg>
                <span>No datasets available</span>
                <button type="button" @click="go('/datasets')">Upload a dataset</button>
              </div>
            </div>
          </div>

          <div v-if="projectionType === 'spatial'" class="scale-bar"><span>5 mm</span></div>
        </div>

        <section class="de-output">
          <div class="de-tabs">
            <button :class="['de-tab', activeTab === 'summary' && 'de-tab--active']" type="button" @click="activeTab = 'summary'">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 4h14v16H5z" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
              Cell Type Summary
            </button>
            <button :class="['de-tab', activeTab === 'distribution' && 'de-tab--active']" type="button" @click="activeTab = 'distribution'">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19V5M4 19h16" />
                <path d="M8 16v-5M12 16V8M16 16v-7" />
              </svg>
              Expression Distribution
            </button>
          </div>

          <!-- Tab 1: 基本信息表格，无切换 -->
          <template v-if="activeTab === 'summary'">
            <div class="de-toolbar">
              <p>Grouped by <strong>{{ colorByField }}</strong> · {{ datasetName }}</p>
            </div>
            <div class="de-table-wrap">
              <table class="de-table">
                <colgroup>
                  <col style="width: 29%" />
                  <col style="width: 14%" />
                  <col style="width: 14%" />
                  <col style="width: 14%" />
                  <col style="width: 29%" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Cell type</th>
                    <th>Cells</th>
                    <th>Dataset %</th>
                    <th>Status</th>
                    <th>Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in cellTypeRows" :key="row.name">
                    <td>
                      <span class="celltype-chip" :style="{ background: row.color }"></span>
                      <span class="gene-name">{{ row.name }}</span>
                    </td>
                    <td>{{ row.count.toLocaleString() }}</td>
                    <td>{{ row.percent.toFixed(2) }}%</td>
                    <td>{{ row.enabled ? "Visible" : "Hidden" }}</td>
                    <td>
                      <div class="specificity">
                        <span :style="{ width: `${Math.max(row.percent, 2)}%`, background: row.color }"></span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <!-- Tab 2: 两种图表切换 -->
          <template v-else>
            <div class="de-toolbar">
              <div class="segmented">
                <button :class="['segmented__item', !showDistribution && 'segmented__item--active']" type="button" @click="showDistribution = false">Horizontal</button>
                <button :class="['segmented__item', showDistribution && 'segmented__item--active']" type="button" @click="showDistribution = true">Column</button>
              </div>
              <p>Grouped by <strong>{{ colorByField }}</strong> · {{ datasetName }}</p>
            </div>

            <!-- 水平条形图 -->
            <div v-if="!showDistribution" class="dist-chart-wrap">
              <div v-if="!cellTypeRows.length" class="dist-empty">No data</div>
              <div v-for="row in cellTypeRows" v-else :key="row.name" class="dist-bar-row">
                <span class="dist-label" :title="row.name">{{ row.name }}</span>
                <div class="dist-bar-track">
                  <div class="dist-bar-fill" :style="{ width: `${Math.max(row.percent, 0.5)}%`, background: row.color, opacity: row.enabled ? 1 : 0.3 }"></div>
                </div>
                <span class="dist-pct">{{ row.percent.toFixed(1) }}%</span>
                <span class="dist-count">{{ row.count.toLocaleString() }}</span>
              </div>
            </div>

            <!-- 纵向柱状图 -->
            <div v-else class="expr-col-wrap">
              <div v-if="!cellTypeRows.length" class="dist-empty">No data</div>
              <template v-else>
                <div class="expr-col-chart">
                  <div
                    v-for="row in cellTypeRows"
                    :key="row.name"
                    class="expr-col"
                    :title="`${row.name}: ${row.count.toLocaleString()} cells (${row.percent.toFixed(1)}%)`"
                  >
                    <span class="expr-col__pct">{{ row.percent.toFixed(0) }}%</span>
                    <div class="expr-col__bar-wrap">
                      <div class="expr-col__bar" :style="{ height: `${Math.max(row.percent, 1)}%`, background: row.color, opacity: row.enabled ? 1 : 0.25 }"></div>
                    </div>
                    <span class="expr-col__label" :title="row.name">{{ row.name.split(' ')[0] }}</span>
                  </div>
                </div>
                <div class="expr-col-axis"><span>0%</span><span>50%</span><span>100%</span></div>
              </template>
            </div>
          </template>
        </section>
      </section>

      <aside class="inspector-panel">
        <section class="inspector-card">
          <div class="inspector-card__head">
            <span>Dataset Summary</span>
            <strong>{{ datasetName }}</strong>
          </div>
          <div class="summary-grid">
            <div>
              <span>Cells</span>
              <strong>{{ totalCellsDisplay }}</strong>
            </div>
            <div>
              <span>Ready indexes</span>
              <strong>{{ indexCount === 0 ? '—' : indexCount }}</strong>
            </div>
            <div>
              <span>Vector dim</span>
              <strong>{{ vectorDim }}</strong>
            </div>
            <div>
              <span>Annotations</span>
              <strong>{{ obsAnnotationCount }}</strong>
            </div>
          </div>
        </section>

        <section class="inspector-card">
          <div class="inspector-card__head">
            <span>Quality Control</span>
            <strong>{{ qcRows.every(r => r.value === '—') ? '—' : qcRows.filter(r => r.value !== '—').length + ' fields' }}</strong>
          </div>
          <div class="qc-list qc-list--scroll">
            <div v-for="row in qcRows" :key="row.label" class="qc-row">
              <span>{{ row.label }}</span>
              <div class="qc-bar" :class="[row.cls, { 'qc-bar--neg': row.neg }]"><i :style="{ width: row.pct + '%' }"></i></div>
              <strong>{{ row.value }}</strong>
            </div>
          </div>
        </section>

        <section class="inspector-card">
          <div class="inspector-card__head">
            <span>Index Runtime</span>
            <strong>{{ benchFromReal ? benchLatency : (isDemoMode ? animatedLatency : '—') }} ms</strong>
          </div>
          <div class="runtime-grid">
            <div>
              <span>QPS</span>
              <strong>{{ benchFromReal ? benchQps : (isDemoMode ? animatedQps : '—') }}</strong>
            </div>
            <div>
              <span>Memory</span>
              <strong>{{ benchFromReal ? benchMemory + ' MB' : (isDemoMode ? animatedMemory + ' MB' : '—') }}</strong>
            </div>
          </div>
          <svg class="runtime-line" viewBox="0 0 160 52" aria-hidden="true">
            <path :d="latencySparklinePathWide" />
          </svg>
        </section>

        <section class="inspector-card">
          <div class="inspector-card__head">
            <span>Active Algorithms</span>
            <strong>{{ algorithms.length ? 'Ready' : '—' }}</strong>
          </div>
          <div class="algorithm-list">
            <span v-for="algo in algorithms" :key="algo" class="algorithm-pill">{{ algo }}</span>
            <span v-if="!algorithms.length" style="color:#8a97a8;font-size:13px;">No indexes built</span>
          </div>
        </section>
      </aside>
    </main>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import AppLayout from "@/components/layout/AppLayout.vue"
import {
  browseSearch,
  getDatasetStats,
  getVisualizeModes,
  listDatasets,
  listIndexes,
  type DatasetItem,
  type DatasetStatsResponse,
  type EmbeddingPoint,
  type IndexItem,
  type VisualizeModesResponse,
} from "@/api/search"
import { listBenchmarkBatches, getBenchmarkBatch } from "@/api/benchmark"

type Cluster = {
  name: string
  count: number
  color: string
  enabled: boolean
}

type Spot = {
  id: string
  x: number
  y: number
  size: number
  color: string
  opacity: number
  enabled: boolean
  clusterName?: string
}

const router = useRouter()
const auth = useAuthStore()

const datasetCount = ref<number | string>("—")
const indexCount = ref<number | string>("—")
const totalCells = ref(0)
const isOnline = ref(false)
const datasetName = ref("—")
const colorByField = ref("—")
const vectorDim = ref<number | string>("—")
const projectionType = ref<"spatial" | "umap" | "pca">("umap")
const spotOpacity = ref(78)
const autoCam = ref(true)
const realSpots = ref<Spot[]>([])

// Real dataset selector
const allDatasets = ref<DatasetItem[]>([])
const selectedDatasetId = ref<number | undefined>()
// Real embedding selector
const availableEmbeddingKeys = ref<string[]>([])
const selectedEmbeddingKey = ref("")
const qcRows = ref<{ label: string; value: string; cls: string; pct: number; neg?: boolean }[]>([
  { label: "Median genes", value: "—", cls: "", pct: 0 },
  { label: "MT fraction", value: "—", cls: "qc-bar--amber", pct: 0 },
  { label: "Doublet score", value: "—", cls: "qc-bar--green", pct: 0 },
])
// Real obs annotations
const obsAnnotationCount = ref<number | string>("—")
// Real benchmark runtime
const benchLatency = ref<number | string>("—")
const benchQps = ref<number | string>("—")
const benchMemory = ref<number | string>("—")
const benchFromReal = ref(false)

const latency = ref(0)
const memory = ref(0)
const qps = ref(0)
const load = ref<number | string>("—")
const animatedLatency = ref<number | string>("—")
const animatedMemory = ref<number | string>("—")
const animatedQps = ref<number | string>("—")
const latencyHistory = ref<number[]>([])

const palette = [
  "#3b1b48",
  "#b7f230",
  "#5571d9",
  "#f5c542",
  "#4aa3ff",
  "#ff7a1a",
  "#2bc7bb",
  "#d93b00",
  "#48e87e",
  "#9b1b10",
  "#8b5cf6",
  "#14b8a6",
]

const isDemoMode = ref(false)
const userForcedReal = ref(false)

// Cluster mode
const clusterMode = ref<"graph" | "kmeans">("graph")
const kmeansK = ref(5)
const kmeansRunning = ref(false)
const kmeansAssignments = ref<number[]>([])
const colorOptions = ref<string[]>([])

// Tab / view state
const activeTab = ref<"summary" | "distribution">("summary")
const showDistribution = ref(false)

// Canvas zoom & pan
const canvasScale = ref(1.6)
const canvasPanX = ref(0)
const canvasPanY = ref(0)
let isPanning = false
let panStartX = 0
let panStartY = 0

const demoClusters = (): Cluster[] => [
  { name: "Hepatocyte",   count: 41242, color: "#3b1b48", enabled: true },
  { name: "Kupffer cell", count: 22156, color: "#b7f230", enabled: true },
  { name: "Endothelial",  count: 19005, color: "#5571d9", enabled: true },
  { name: "Stellate cell",count: 14870, color: "#f5c542", enabled: true },
  { name: "Cholangiocyte",count: 11509, color: "#4aa3ff", enabled: true },
  { name: "NK cell",      count: 8234,  color: "#ff7a1a", enabled: true },
  { name: "T cell",       count: 6891,  color: "#2bc7bb", enabled: true },
  { name: "B cell",       count: 4528,  color: "#d93b00", enabled: true },
  { name: "Monocyte",     count: 796,   color: "#48e87e", enabled: true },
  { name: "Plasma cell",  count: 469,   color: "#9b1b10", enabled: true },
]

const clusters = reactive<Cluster[]>([])
const projectionLoading = ref(false)

const selectedCluster = ref<Cluster | null>(null)
const algorithms = ref<string[]>([])

const projectionTypeLabel = computed(() => {
  if (projectionType.value === "umap") return "UMAP projection"
  if (projectionType.value === "pca") return "PCA projection"
  return "Spatial projection"
})

const totalCellsDisplay = computed(() => {
  if (!totalCells.value) return "—"
  return totalCells.value.toLocaleString("en-US")
})

const allClustersEnabled = computed(() => clusters.every((cluster) => cluster.enabled))

const cellTypeRows = computed(() => {
  const total = totalCells.value || clusters.reduce((sum, cluster) => sum + cluster.count, 0) || 1
  return clusters.map((cluster) => ({
    ...cluster,
    percent: (cluster.count / total) * 100,
  }))
})

const spots = computed<Spot[]>(() => {
  if (realSpots.value.length) {
    // K-Means mode: reassign colors by cluster assignment
    if (clusterMode.value === "kmeans" && kmeansAssignments.value.length === realSpots.value.length) {
      return realSpots.value.map((spot, i) => {
        const ki = kmeansAssignments.value[i]
        const cluster = clusters[ki]
        return {
          ...spot,
          color: cluster?.color ?? spot.color,
          opacity: spotOpacity.value / 100,
          enabled: cluster?.enabled ?? true,
          clusterName: cluster?.name ?? spot.clusterName,
        }
      })
    }
    const enabledByCluster = new Map(clusters.map((cluster) => [cluster.name, cluster.enabled]))
    return realSpots.value.map((spot) => ({
      ...spot,
      opacity: spotOpacity.value / 100,
      enabled: enabledByCluster.get(spot.clusterName ?? "") ?? true,
    }))
  }

  // 仅在 demo 模式下生成 demo 点位
  if (!isDemoMode.value || !clusters.length) return []

  const count = 220
  return Array.from({ length: count }, (_, index) => {
    const cluster = clusters[index % clusters.length]
    const t = index / (count - 1)
    const wave = Math.sin(t * Math.PI * 6)
    const jitterX = seeded(index, 3) * 13 - 6.5
    const jitterY = seeded(index, 7) * 14 - 7
    const lobe = index % 3 === 0 ? -7 : index % 5 === 0 ? 6 : 0
    const x = clamp(29 + t * 43 + jitterX + wave * 3, 12, 88)
    const y = clamp(74 - t * 55 + jitterY + lobe, 10, 88)
    return {
      id: `demo-${index}`,
      x,
      y,
      size: 4 + seeded(index, 11) * 5,
      color: cluster.color,
      opacity: spotOpacity.value / 100,
      enabled: cluster.enabled,
      clusterName: cluster.name,
    }
  })
})

const latencySparklinePath = computed(() => sparkline(latencyHistory.value, 100, 24))
const latencySparklinePathWide = computed(() => sparkline(latencyHistory.value, 160, 52))

function seeded(index: number, salt: number) {
  const x = Math.sin(index * 999 + salt * 37) * 10000
  return x - Math.floor(x)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sparkline(data: number[], width: number, height: number) {
  if (data.length < 2) return ""
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width
      const y = height - 4 - ((val - min) / range) * (height - 8)
      return idx === 0 ? `M${x},${y}` : `L${x},${y}`
    })
    .join(" ")
}

function toggleAllClusters(event: Event) {
  const target = event.target as HTMLInputElement
  clusters.forEach((cluster) => {
    cluster.enabled = target.checked
  })
}

function updatePerformanceMetrics() {
  latency.value = Math.floor(Math.random() * 18) + 6
  memory.value = Math.floor(Math.random() * 360) + 220
  qps.value = Math.floor(Math.random() * 90) + 70
  load.value = Math.floor(Math.random() * 36) + 32

  if (isDemoMode.value && !benchFromReal.value) {
    animatedLatency.value = latency.value
    animatedMemory.value = memory.value
    animatedQps.value = qps.value
  }
  if (isDemoMode.value && !benchFromReal.value) {
    latencyHistory.value.push(latency.value)
    if (latencyHistory.value.length > 18) latencyHistory.value.shift()
  }
}

let metricsInterval: number | null = null

function applyDemoData() {
  isDemoMode.value = true
  clusterMode.value = "graph"
  kmeansAssignments.value = []
  datasetCount.value = 3
  indexCount.value = 5
  totalCells.value = 130_257
  datasetName.value = "Demo Atlas (liver)"
  colorByField.value = "cell_type"
  colorOptions.value = ["cell_type", "leiden", "louvain", "disease", "author_cell_type"]
  vectorDim.value = 50
  obsAnnotationCount.value = 12
  algorithms.value = ["FLAT", "HNSW", "IVF"]
  availableEmbeddingKeys.value = ["X_umap", "X_pca"]
  selectedEmbeddingKey.value = "X_umap"
  projectionType.value = "umap"
  qcRows.value = [
    { label: "Median genes", value: "2,746", cls: "", pct: 68 },
    { label: "MT fraction", value: "4.8%", cls: "qc-bar--amber", pct: 48 },
    { label: "Doublet score", value: "0.06", cls: "qc-bar--green", pct: 30 },
  ]
  benchLatency.value = "14.2"
  benchQps.value = 142
  benchMemory.value = 38
  benchFromReal.value = true
  realSpots.value = []
  resetDemoClusters()
}

function clearState() {
  isDemoMode.value = false
  clusterMode.value = "graph"
  kmeansAssignments.value = []
  colorOptions.value = []
  datasetCount.value = "—"
  indexCount.value = "—"
  totalCells.value = 0
  datasetName.value = "—"
  colorByField.value = "—"
  vectorDim.value = "—"
  obsAnnotationCount.value = "—"
  algorithms.value = []
  availableEmbeddingKeys.value = []
  selectedEmbeddingKey.value = ""
  qcRows.value = [
    { label: "Median genes", value: "—", cls: "", pct: 0 },
    { label: "MT fraction", value: "—", cls: "qc-bar--amber", pct: 0 },
    { label: "Doublet score", value: "—", cls: "qc-bar--green", pct: 0 },
  ]
  benchLatency.value = "—"
  benchQps.value = "—"
  benchMemory.value = "—"
  benchFromReal.value = false
  realSpots.value = []
  latencyHistory.value = []
  clusters.splice(0, clusters.length)
  selectedCluster.value = null
}

async function toggleDemoMode() {
  if (isDemoMode.value) {
    userForcedReal.value = true
    clearState()
    projectionLoading.value = true
    await loadMetrics()
  } else {
    userForcedReal.value = false
    applyDemoData()
  }
}

async function loadMetrics() {
  try {
    const [datasets, allIndexes] = await Promise.all([
      listDatasets({ mockFallback: false }),
      listIndexes(undefined, { mockFallback: false }),
    ])
    allDatasets.value = datasets
    const activeDataset = datasets.find((item) => item.status === "ready") ?? datasets[0]
    selectedDatasetId.value = activeDataset?.id

    datasetCount.value = datasets.length
    indexCount.value = allIndexes.filter((item) => item.status === "ready").length
    totalCells.value = datasets.reduce((sum, item) => sum + (item.n_cells ?? 0), 0)
    datasetName.value = activeDataset?.name ?? "—"
    vectorDim.value = activeDataset?.vector_dim ?? allIndexes[0]?.vector_dim ?? "—"
    algorithms.value = buildAlgorithmList(allIndexes)
    isOnline.value = true

    if (datasets.length === 0) {
      applyDemoData()
    } else if (activeDataset?.status === "ready") {
      isDemoMode.value = false
      const statsPromise = getDatasetStats(activeDataset.id)
      statsPromise.then(s => {
        obsAnnotationCount.value = s.obs_columns?.length ?? "—"
      }).catch(() => {})
      await loadProjection(activeDataset.id, undefined, statsPromise)
    }
  } catch {
    // 后端离线：空状态
    isOnline.value = false
    clearState()
  } finally {
    updatePerformanceMetrics()
    metricsInterval = window.setInterval(updatePerformanceMetrics, 4000)
  }
}

async function loadProjection(datasetId: number, embeddingKeyOverride?: string, preloadedStats?: Promise<any>) {
  projectionLoading.value = true
  try {
    const [stats, modes] = await Promise.all([
      preloadedStats ?? getDatasetStats(datasetId),
      getVisualizeModes(datasetId),
    ])

    obsAnnotationCount.value = stats.obs_columns?.length ?? "—"

    const num = stats.numeric_summary ?? {}
    const stdPriority: Record<string, { label: string; stat: string }> = {
      n_genes_by_counts: { label: "Median genes", stat: "median" },
      n_genes: { label: "Median genes", stat: "median" },
      pct_counts_mt: { label: "MT fraction", stat: "mean" },
      mt_frac: { label: "MT fraction", stat: "mean" },
      doublet_score: { label: "Doublet score", stat: "median" },
    }
    const clsPalette = ["", "qc-bar--amber", "qc-bar--green", "", "qc-bar--amber", "qc-bar--green"]
    const found: { label: string; value: string; cls: string; pct: number; neg?: boolean }[] = []
    const seenLabels = new Set<string>()
    // Standard fields first
    for (const [key, { label, stat }] of Object.entries(stdPriority)) {
      if (seenLabels.has(label)) continue
      const col = num[key]
      const v = col?.[stat]
      if (v !== undefined) {
        const fieldMax = col?.max || 1
        const fmt = key.includes("pct") || key.includes("mt_frac") ? `${Number(v).toFixed(1)}%` : Math.round(Number(v)).toLocaleString()
        const rawPct = Math.round((Number(v) / fieldMax) * 100)
        found.push({ label, value: fmt, cls: clsPalette[found.length % clsPalette.length], pct: Math.min(100, Math.abs(rawPct)), neg: rawPct < 0 })
        seenLabels.add(label)
      }
    }
    // All remaining numeric columns
    for (const [key, col] of Object.entries(num)) {
      if (stdPriority[key]) continue
      const v = (col as any)?.median ?? (col as any)?.mean
      if (v === undefined) continue
      const fieldMax = (col as any)?.max || 1
      const label = key.replace(/_/g, " ")
      const rawPct = Math.round((Number(v) / fieldMax) * 100)
      found.push({ label, value: Number(v).toFixed(2), cls: clsPalette[found.length % clsPalette.length], pct: Math.min(100, Math.abs(rawPct)), neg: rawPct < 0 })
    }
    qcRows.value = found.length ? found : [
      { label: "Median genes", value: "—", cls: "", pct: 0 },
      { label: "MT fraction", value: "—", cls: "qc-bar--amber", pct: 0 },
      { label: "Doublet score", value: "—", cls: "qc-bar--green", pct: 0 },
    ]

    availableEmbeddingKeys.value = modes.embedding_options?.length
      ? modes.embedding_options
      : [modes.embedding_key]

    const allColorOpts = Array.from(new Set([
      ...Object.keys(stats.value_counts ?? {}),
      ...(modes.color_options ?? []),
    ])).filter(Boolean)
    colorOptions.value = allColorOpts

    const colorBy = (colorByField.value && allColorOpts.includes(colorByField.value))
      ? colorByField.value
      : chooseColorBy(stats, modes)
    colorByField.value = colorBy
    applyClusters(stats.value_counts[colorBy] ?? {})

    const chosenKey = embeddingKeyOverride ?? chooseEmbeddingKey(modes)
    selectedEmbeddingKey.value = chosenKey
    const lk = chosenKey.toLowerCase()
    projectionType.value = lk.includes("umap")
      ? "umap"
      : lk.includes("pca")
        ? "pca"
        : lk.includes("spatial") || lk.includes("visium")
          ? "spatial"
          : "umap"

    const embedding = await browseSearch({
      datasetId,
      pageSize: 1800,
      colorBy,
      embeddingKey: chosenKey,
      dimension: 2,
    })
    totalCells.value = embedding.n_total ?? totalCells.value
    realSpots.value = normalizeEmbeddingPoints(embedding.points ?? [], colorBy)
  } finally {
    projectionLoading.value = false
  }

  // benchmark 后台异步，不阻塞画布渲染
  ;(async () => {
    try {
      const batches = (await listBenchmarkBatches({ dataset_id: datasetId })) as unknown as any[]
      if (batches.length > 0) {
        const detail = (await getBenchmarkBatch(batches[0].id)) as unknown as any
        const results: any[] = detail.results ?? []
        if (results.length > 0) {
          const best = results.reduce((a: any, b: any) => (a.avg_latency_ms < b.avg_latency_ms ? a : b))
          benchLatency.value = best.avg_latency_ms.toFixed(1)
          benchQps.value = Math.round(best.qps)
          benchMemory.value = Math.round(best.index_size_bytes / 1024 / 1024)
          benchFromReal.value = true
          // 折线图用实际各算法延迟，不再随机生成
          latencyHistory.value = results.map((r: any) => r.avg_latency_ms)
        }
      }
    } catch {
      // benchmark data not available
    }
  })()
}

async function onDatasetChange() {
  const ds = allDatasets.value.find((item) => item.id === selectedDatasetId.value)
  if (!ds) return
  datasetName.value = ds.name
  vectorDim.value = ds.vector_dim ?? "—"
  totalCells.value = ds.n_cells ?? 0
  benchFromReal.value = false
  selectedEmbeddingKey.value = ""
  availableEmbeddingKeys.value = []
  clusterMode.value = "graph"
  kmeansAssignments.value = []
  resetDemoClusters()
  if (ds.status === "ready") {
    const statsPromise = getDatasetStats(ds.id)
    statsPromise.then(s => {
      obsAnnotationCount.value = s.obs_columns?.length ?? "—"
    }).catch(() => {})
    await loadProjection(ds.id, undefined, statsPromise)
  }
}

async function onEmbeddingChange() {
  if (!selectedDatasetId.value || !selectedEmbeddingKey.value) return
  await loadProjection(selectedDatasetId.value, selectedEmbeddingKey.value)
}

// ── Auto-camera (2D CSS canvas — 逐聚簇注视) ──────────────────────────────────
const canvasEl = ref<HTMLElement | null>(null)
let camRaf: number | null = null
let camClusterIdx = 0
let camHold = 0
let camTargetX = 0
let camTargetY = 0
const CAM_HOLD_FRAMES = 220   // 约 3.5 秒停留在每个聚簇

function clusterCentroids() {
  const groups = new Map<string, { sx: number; sy: number; n: number }>()
  for (const s of spots.value) {
    if (!s.enabled) continue
    const k = s.clusterName ?? '__all'
    const g = groups.get(k) ?? { sx: 0, sy: 0, n: 0 }
    g.sx += s.x; g.sy += s.y; g.n++
    groups.set(k, g)
  }
  return Array.from(groups.values())
    .filter(g => g.n > 10)
    .map(g => ({ x: g.sx / g.n, y: g.sy / g.n }))
}

function startAutoCam() {
  if (camRaf) cancelAnimationFrame(camRaf)
  camHold = CAM_HOLD_FRAMES
  const loop = () => {
    camHold++
    if (camHold >= CAM_HOLD_FRAMES) {
      const cxs = clusterCentroids()
      if (cxs.length) {
        camClusterIdx = (camClusterIdx + 1) % cxs.length
        const c = cxs[camClusterIdx]
        const W = canvasEl.value?.clientWidth  ?? 700
        const H = canvasEl.value?.clientHeight ?? 350
        camTargetX = (50 - c.x) / 100 * W * 0.55
        camTargetY = (50 - c.y) / 100 * H * 0.55
      }
      camHold = 0
    }
    canvasPanX.value += (camTargetX - canvasPanX.value) * 0.022
    canvasPanY.value += (camTargetY - canvasPanY.value) * 0.022
    camRaf = requestAnimationFrame(loop)
  }
  camRaf = requestAnimationFrame(loop)
}

function stopAutoCam() {
  if (camRaf) { cancelAnimationFrame(camRaf); camRaf = null }
  canvasPanX.value = 0
  canvasPanY.value = 0
}

function embeddingLabel(key: string): string {
  if (key.toLowerCase().includes("umap")) return "UMAP"
  if (key.toLowerCase().includes("pca")) return "PCA"
  if (key.toLowerCase().includes("spatial")) return "Spatial"
  return key
}

function chooseColorBy(stats: DatasetStatsResponse, modes: VisualizeModesResponse) {
  const preferred = ["cell_type", "author_cell_type", "disease", "AgeGroup", "Treatment"]
  const available = new Set([
    ...Object.keys(stats.value_counts ?? {}),
    ...(modes.color_options ?? []),
  ])
  return preferred.find((item) => available.has(item)) ?? Object.keys(stats.value_counts ?? {})[0] ?? "cell_type"
}

function chooseEmbeddingKey(modes: VisualizeModesResponse) {
  const options = modes.embedding_options ?? []
  if (options.includes("X_umap")) return "X_umap"
  if (options.includes("X_pca")) return "X_pca"
  return modes.embedding_key
}

function applyClusters(counts: Record<string, number>) {
  const next = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count], index) => ({
      name,
      count,
      color: palette[index % palette.length],
      enabled: true,
    }))

  if (!next.length) {
    resetDemoClusters()
    return
  }

  clusters.splice(0, clusters.length, ...next)
  selectedCluster.value = null
}

function resetDemoClusters() {
  clusters.splice(0, clusters.length, ...demoClusters())
  selectedCluster.value = null
}

function normalizeEmbeddingPoints(points: EmbeddingPoint[], colorBy: string): Spot[] {
  if (!points.length) return []

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs), rangeX = maxX - minX || 1
  const minY = Math.min(...ys), maxY = Math.max(...ys), rangeY = maxY - minY || 1
  const clusterByName = new Map(clusters.map((c) => [c.name, c]))

  return points.map((point, index) => {
    const clusterName = String(point.label ?? point.obs?.[colorBy] ?? "Unassigned")
    const cluster = clusterByName.get(clusterName)
    return {
      id: point.cell_id,
      x: clamp(9 + ((point.x - minX) / rangeX) * 82, 6, 94),
      y: clamp(91 - ((point.y - minY) / rangeY) * 82, 6, 94),
      size: 3.8 + seeded(index, 19) * 4.2,
      color: cluster?.color ?? palette[hashString(clusterName) % palette.length],
      opacity: spotOpacity.value / 100,
      enabled: cluster?.enabled ?? true,
      clusterName,
    }
  })
}

function buildAlgorithmList(indexes: IndexItem[]) {
  const readyAlgorithms = Array.from(
    new Set(indexes.filter((item) => item.status === "ready").map((item) => item.algorithm.toUpperCase())),
  )
  return readyAlgorithms
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function shortLabel(value: string, maxLength = 18) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value
}

function go(path: string) {
  router.push(path)
}

// ── K-Means ──────────────────────────────────────────────────────────────────
function kMeansOnSpots(pts: { x: number; y: number }[], k: number): number[] {
  if (pts.length === 0 || k <= 0) return []

  // K-Means++ init
  const centroids: { x: number; y: number }[] = [{ ...pts[Math.floor(Math.random() * pts.length)] }]
  while (centroids.length < k) {
    const dists = pts.map((p) => Math.min(...centroids.map((c) => (p.x - c.x) ** 2 + (p.y - c.y) ** 2)))
    const total = dists.reduce((a, b) => a + b, 0)
    let rand = Math.random() * total
    let chosen = 0
    for (let i = 0; i < dists.length; i++) {
      rand -= dists[i]
      if (rand <= 0) { chosen = i; break }
    }
    centroids.push({ ...pts[chosen] })
  }

  const assignments = new Array(pts.length).fill(0)
  for (let iter = 0; iter < 60; iter++) {
    let changed = false
    for (let i = 0; i < pts.length; i++) {
      let minD = Infinity, nearest = 0
      for (let j = 0; j < k; j++) {
        const d = (pts[i].x - centroids[j].x) ** 2 + (pts[i].y - centroids[j].y) ** 2
        if (d < minD) { minD = d; nearest = j }
      }
      if (assignments[i] !== nearest) { assignments[i] = nearest; changed = true }
    }
    if (!changed) break
    const sums = Array.from({ length: k }, () => ({ x: 0, y: 0, n: 0 }))
    for (let i = 0; i < pts.length; i++) {
      sums[assignments[i]].x += pts[i].x
      sums[assignments[i]].y += pts[i].y
      sums[assignments[i]].n++
    }
    for (let j = 0; j < k; j++) {
      if (sums[j].n > 0) centroids[j] = { x: sums[j].x / sums[j].n, y: sums[j].y / sums[j].n }
    }
  }
  return assignments
}

async function applyKMeans() {
  const currentSpots = spots.value
  if (!currentSpots.length) return
  kmeansRunning.value = true
  await nextTick()

  const k = Math.max(2, Math.min(kmeansK.value, currentSpots.length))
  const pts = currentSpots.map((s) => ({ x: s.x, y: s.y }))
  const assignments = kMeansOnSpots(pts, k)
  kmeansAssignments.value = assignments

  const counts = Array.from({ length: k }, () => 0)
  assignments.forEach((a) => counts[a]++)

  const next: typeof clusters = Array.from({ length: k }, (_, i) => ({
    name: `Cluster ${i + 1}`,
    count: counts[i],
    color: palette[i % palette.length],
    enabled: true,
  }))
  clusters.splice(0, clusters.length, ...next)
  selectedCluster.value = null
  kmeansRunning.value = false
}

async function onClusterModeChange(mode: "graph" | "kmeans") {
  if (mode === "graph") {
    kmeansAssignments.value = []
    if (selectedDatasetId.value) {
      await loadProjection(selectedDatasetId.value, selectedEmbeddingKey.value || undefined)
    } else if (isDemoMode.value) {
      resetDemoClusters()
    }
  } else {
    await applyKMeans()
  }
}

async function onColorByChange() {
  if (!selectedDatasetId.value) return
  await loadProjection(selectedDatasetId.value, selectedEmbeddingKey.value || undefined)
}

// ── Download groups ────────────────────────────────────────────────────────────
function downloadGroups() {
  if (!clusters.length) return
  const total = totalCells.value || clusters.reduce((s, c) => s + c.count, 0) || 1
  const rows = [["Cell type", "Count", "Percentage"]]
  for (const c of clusters) {
    rows.push([c.name, String(c.count), ((c.count / total) * 100).toFixed(2) + "%"])
  }
  const csv = rows.map((r) => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${datasetName.value}-groups.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Canvas zoom & pan ─────────────────────────────────────────────────────────
function fitCanvas() {
  canvasScale.value = 1
  canvasPanX.value = 0
  canvasPanY.value = 0
}

function zoomIn() {
  canvasScale.value = Math.min(canvasScale.value * 1.5, 8)
}

function zoomOut() {
  const next = canvasScale.value / 1.5
  if (next < 1) {
    fitCanvas()
  } else {
    canvasScale.value = next
  }
}

function onCanvasMouseDown(e: MouseEvent) {
  if (e.button !== 0 || canvasScale.value <= 1) return
  isPanning = true
  panStartX = e.clientX - canvasPanX.value
  panStartY = e.clientY - canvasPanY.value
  ;(e.currentTarget as HTMLElement).style.cursor = "grabbing"
}

function onCanvasMouseMove(e: MouseEvent) {
  if (!isPanning) return
  canvasPanX.value = e.clientX - panStartX
  canvasPanY.value = e.clientY - panStartY
}

function onCanvasMouseUp(e: MouseEvent) {
  isPanning = false
  ;(e.currentTarget as HTMLElement).style.cursor = canvasScale.value > 1 ? "grab" : "default"
}

function onCanvasMouseLeave(e: MouseEvent) {
  isPanning = false
  ;(e.currentTarget as HTMLElement).style.cursor = "default"
}

function onCanvasWheel(e: WheelEvent) {
  const delta = e.deltaY < 0 ? 1.12 : 1 / 1.12
  const next = canvasScale.value * delta
  if (next < 0.95) {
    fitCanvas()
  } else {
    canvasScale.value = Math.min(next, 8)
  }
}

onMounted(async () => {
  await loadMetrics()
  if (autoCam.value) startAutoCam()
})

onUnmounted(() => {
  if (metricsInterval) clearInterval(metricsInterval)
  stopAutoCam()
})

watch(autoCam, (val) => {
  if (val) startAutoCam()
  else stopAutoCam()
})

</script>

<style scoped>
.dashboard-workbench {
  position: relative;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 330px minmax(520px, 1fr) 310px;
  background: #ffffff;
  color: #10233f;
  overflow: hidden;
}

.titlebar {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 0 18px;
  background: #f5f7fa;
  border-bottom: 1px solid #dce3ea;
}

.titlebar__identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.app-mark {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: #0d294a;
  color: #fff;
  font-weight: 800;
}

.titlebar h1 {
  margin: 0;
  color: #0d294a;
  font-size: 14px;
  line-height: 1.2;
}

.titlebar p {
  margin: 1px 0 0;
  color: #718196;
  font-size: 12px;
}

.titlebar__status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eaf8ef;
  color: #1b7f43;
  font-size: 12px;
  font-weight: 750;
}

.status-pill--offline {
  background: #fff4e5;
  color: #9a5a00;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 10px 18px 10px 0;
  background: #ffffff;
  border-bottom: 1px solid #d9e1ea;
}

.toolbar-home,
.export-button,
.tool-button,
.icon-button,
.ghost-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: #0d294a;
  cursor: pointer;
}

.toolbar-home,
.export-button {
  gap: 8px;
  height: 42px;
  padding: 0 12px;
  border-radius: 8px;
  font-weight: 750;
}

.toolbar-home {
  width: 86px;
  flex: 0 0 86px;
  padding: 0;
  border-radius: 0;
}

.toolbar-home:hover,
.export-button:hover,
.tool-button:hover {
  background: #eef6fc;
}

.dashboard-toolbar-actions svg,
.de-output svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.toolbar-divider {
  height: 40px;
  width: 1px;
  margin-right: 16px;
  background: #d9e1ea;
}

.select-control,
.opacity-control {
  min-width: 170px;
  display: grid;
  align-content: center;
  gap: 3px;
  margin-right: 8px;
  padding: 6px 10px 6px 12px;
  border-radius: 8px;
  background: #f7fafc;
  border: 1px solid #dce5ee;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.select-control:focus-within,
.select-control:hover {
  border-color: #147bd1;
  box-shadow: 0 0 0 3px rgba(20, 123, 209, 0.1);
}

.select-control span,
.opacity-control span {
  color: #8b98a8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1;
}

.select-control :deep(.ant-select-selector) {
  padding-left: 0 !important;
  font-size: 14px;
  font-weight: 700;
  color: #10233f;
}

.opacity-control input {
  width: 140px;
  accent-color: #147bd1;
}

.autocam-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 80px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #dce5ee;
  background: #f7fafc;
  color: #8b98a8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  align-self: stretch;
}
.autocam-btn svg { width: 12px; height: 12px; fill: currentColor; stroke: none; }
.autocam-btn--active {
  background: #e8f4ff;
  border-color: #147bd1;
  color: #147bd1;
}
.autocam-btn--active:hover { background: #daeeff; }

.canvas-perspective {
  position: absolute;
  inset: 0;
}

.dashboard-toolbar-controls {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.dashboard-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard-toolbar-actions {
  margin-left: auto;
}

.tool-button {
  width: 42px;
  height: 42px;
  border-radius: 8px;
}

.tool-button--active {
  background: #0d294a;
  color: #fff;
}

.export-button {
  margin-left: 16px;
  background: #f7fafc;
}

.module-rail {
  display: grid;
  align-content: start;
  border-right: 1px solid #d9e1ea;
  background: #fbfcfd;
}

.rail-item {
  min-height: 86px;
  display: grid;
  place-items: center;
  gap: 6px;
  border: 0;
  border-bottom: 1px solid #e6edf3;
  background: transparent;
  color: #273d59;
  font-size: 13px;
  cursor: pointer;
}

.rail-item--active {
  background: #eaf6fd;
}

.rail-icon {
  width: 28px;
  height: 28px;
  position: relative;
}

.rail-icon::before,
.rail-icon::after {
  content: "";
  position: absolute;
  inset: 6px;
  border: 2px solid #0d294a;
  border-radius: 50%;
}

.rail-icon--clusters::after {
  inset: 2px 16px 16px 2px;
}

.rail-icon--features::before {
  border-radius: 2px;
  transform: rotate(45deg);
}

.rail-icon--search::before {
  inset: 4px 8px 8px 4px;
}

.rail-icon--search::after {
  inset: auto 2px 4px auto;
  width: 10px;
  height: 2px;
  border: 0;
  border-radius: 0;
  background: #0d294a;
  transform: rotate(45deg);
}

.rail-icon--datasets::before {
  border-radius: 4px;
}

.rail-icon--datasets::after {
  inset: 10px 5px;
  border: 0;
  border-top: 2px solid #0d294a;
  border-bottom: 2px solid #0d294a;
}

.rail-icon--index::before {
  inset: 5px;
  border-radius: 5px;
}

.rail-icon--index::after {
  inset: 12px 6px;
  border: 0;
  border-top: 2px solid #0d294a;
}

.groups-panel,
.inspector-panel {
  min-height: 0;
  overflow: auto;
  border-right: 1px solid #d9e1ea;
  background: #ffffff;
}

.groups-panel {
  display: flex;
  flex-direction: column;
  padding: 22px 18px 16px;
}

.panel-heading,
.inspector-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-heading span {
  color: #7d8b9b;
  font-size: 16px;
  font-weight: 700;
}

.ghost-icon {
  width: 32px;
  height: 32px;
  color: #8392a4;
}

.ghost-icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.group-source {
  display: grid;
  grid-template-columns: 18px minmax(0, auto) minmax(72px, 1fr);
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  color: #0d294a;
  font-size: 17px;
  font-weight: 750;
}

.group-source strong {
  min-width: 0;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #8a97a7;
  font-size: 12px;
}

.group-source__hover-label {
  opacity: 0;
  transition: opacity 0.15s;
}

.group-source:hover .group-source__hover-label {
  opacity: 1;
}

.cluster-list {
  margin-top: 14px;
  padding: 12px;
  border-radius: 10px;
  background: #f7fbfd;
}

.cluster-row {
  height: 39px;
  display: grid;
  grid-template-columns: 18px 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 0 6px;
  border-radius: 7px;
  color: #24405f;
  cursor: pointer;
}

.cluster-row:hover,
.cluster-row--selected {
  background: #e7f4fb;
}

.cluster-row input {
  accent-color: #147bd1;
}

.cluster-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
}

.cluster-swatch--all {
  background: #0d294a;
}

.cluster-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 15px;
}

.cluster-count {
  color: #9aa5b1;
  font-size: 12px;
}

.cluster-more {
  border: 0;
  background: transparent;
  color: #98a5b5;
  cursor: pointer;
}

.group-source--secondary {
  margin-top: 14px;
  color: #243a57;
}

.groups-panel__footer {
  margin: auto -18px -16px;
  padding: 16px 18px 20px;
  border-top: 1px solid #d9e1ea;
  display: grid;
  gap: 14px;
}

.link-button {
  justify-self: start;
  border: 0;
  background: transparent;
  color: #147bd1;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.primary-action {
  height: 48px;
  border: 0;
  border-radius: 7px;
  background: #147bd1;
  color: #fff;
  font-size: 16px;
  font-weight: 850;
  cursor: pointer;
}

.viewer-panel {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: 76px minmax(260px, 1fr) 320px;
  background: #ffffff;
}

.viewer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 0 22px;
  border-bottom: 1px solid #e2e8ef;
}

.viewer-kicker {
  color: #7d8b9b;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.viewer-head h2 {
  margin: 4px 0 0;
  color: #0d294a;
  font-size: 20px;
  line-height: 1.2;
}

.viewer-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.viewer-stats span {
  padding: 7px 10px;
  border-radius: 999px;
  background: #f2f6f9;
  color: #52667c;
  font-size: 12px;
  font-weight: 750;
}

.spatial-canvas {
  position: relative;
  overflow: hidden;
  background: #ffffff;
}

.canvas-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(2px);
}

.canvas-spinner {
  width: 36px;
  height: 36px;
  color: #007bff;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.canvas-grid {
  position: absolute;
  inset: 0;
  opacity: 0.38;
  background-image:
    linear-gradient(#eff4f8 1px, transparent 1px),
    linear-gradient(90deg, #eff4f8 1px, transparent 1px);
  background-size: 44px 44px;
}

.tissue-halo {
  position: absolute;
  left: 29%;
  top: 14%;
  width: 45%;
  height: 70%;
  border-radius: 58% 42% 54% 46% / 60% 37% 63% 40%;
  background:
    radial-gradient(circle at 38% 24%, rgba(162, 79, 172, 0.16), transparent 28%),
    radial-gradient(circle at 58% 46%, rgba(242, 139, 203, 0.2), transparent 34%),
    radial-gradient(circle at 44% 76%, rgba(190, 122, 72, 0.12), transparent 26%);
  filter: blur(8px);
  transform: rotate(29deg);
}

.spot {
  position: absolute;
  z-index: 2;
  border-radius: 999px;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.35), 0 0 10px currentColor;
}

.spot--dim {
  filter: grayscale(1);
}

.canvas-controls {
  position: absolute;
  z-index: 3;
  bottom: 20px;
  left: 22px;
  display: flex;
}

.canvas-control {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid #d9e1ea;
  border-right: none;
  background: rgba(255, 255, 255, 0.92);
  color: #0d294a;
  cursor: pointer;
}

.canvas-control:first-child { border-radius: 8px 0 0 8px; }
.canvas-control:last-child { border-radius: 0 8px 8px 0; border-right: 1px solid #d9e1ea; }

.canvas-control:hover { background: #eef6fc; }

.canvas-control svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.scale-bar {
  position: absolute;
  right: 26px;
  bottom: 24px;
  width: 190px;
  height: 24px;
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 800;
  text-align: center;
}

.scale-bar::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 1px;
  height: 2px;
  background: #1d1d1f;
}

.demo-toggle {
  position: absolute;
  right: 20px;
  bottom: 20px;
  z-index: 20;
  height: 28px;
  padding: 0 12px;
  border: 1px solid #c8d6e2;
  border-radius: 999px;
  background: rgba(255,255,255,0.92);
  color: #147bd1;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.15s, border-color 0.15s;
  z-index: 10;
}

.demo-toggle:hover {
  background: #eef6fc;
  border-color: #147bd1;
}

.canvas-content {
  position: absolute;
  inset: 0;
  transform-origin: center center;
  transition: transform 0.2s ease;
}

.color-by-select {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: 7px;
  background: #f0f6fb;
  font-size: 12px;
  color: #52667c;
}

.color-by-select span {
  font-weight: 700;
  white-space: nowrap;
}


.kmeans-controls {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 7px;
  background: #f0f6fb;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #52667c;
}

.kmeans-controls label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}

.kmeans-controls input[type="number"] {
  width: 52px;
  border: 1px solid #d0dae3;
  border-radius: 5px;
  padding: 3px 6px;
  font-size: 13px;
  text-align: center;
  outline: none;
}

.kmeans-run-btn {
  margin-left: auto;
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 6px;
  background: #147bd1;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.kmeans-run-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dist-chart-wrap {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 180px;
  padding: 14px 18px;
}

.dist-chart-wrap--expression {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dist-bar-row {
  display: grid;
  grid-template-columns: 120px 1fr 44px 72px;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.dist-label {
  font-size: 12px;
  font-weight: 600;
  color: #24405f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dist-bar-track {
  height: 10px;
  border-radius: 999px;
  background: #e8eef3;
  overflow: hidden;
}

.dist-bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
}

.dist-pct {
  font-size: 11px;
  font-weight: 700;
  color: #52667c;
  text-align: right;
}

.dist-count {
  font-size: 11px;
  color: #9aa5b1;
  text-align: right;
}

.expr-bar-row {
  display: grid;
  grid-template-columns: 160px 1fr 72px 44px;
  align-items: center;
  gap: 10px;
}

.expr-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #24405f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expr-bar-track {
  height: 14px;
  border-radius: 999px;
  background: #e8eef3;
  overflow: hidden;
}

.expr-bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
}

.expr-stat {
  font-size: 12px;
  color: #52667c;
  text-align: right;
}

.expr-pct {
  font-size: 12px;
  font-weight: 700;
  color: #0d294a;
  text-align: right;
}

.expr-col-wrap {
  height: 180px;
  display: flex;
  flex-direction: column;
  padding: 10px 18px 0;
  overflow: hidden;
}

.expr-col-chart {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  min-height: 0;
}

.expr-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  height: 100%;
}

.expr-col__pct {
  font-size: 10px;
  color: #52667c;
  font-weight: 700;
  line-height: 1;
}

.expr-col__bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  background: #f0f4f8;
  border-radius: 4px 4px 0 0;
  overflow: hidden;
}

.expr-col__bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 0.4s ease;
  min-height: 2px;
}

.expr-col__label {
  font-size: 10px;
  color: #52667c;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1;
}

.expr-col-axis {
  display: flex;
  justify-content: space-between;
  padding: 4px 0 6px;
  font-size: 10px;
  color: #9aa5b1;
  writing-mode: horizontal-tb;
}

.dist-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a97a8;
  font-size: 13px;
}

.canvas-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #8a97a8;
}

.canvas-empty svg {
  width: 52px;
  height: 52px;
  opacity: 0.4;
}

.canvas-empty span {
  font-size: 14px;
  font-weight: 600;
}

.canvas-empty button {
  border: 0;
  background: transparent;
  color: #147bd1;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.canvas-empty button:hover {
  text-decoration: underline;
}

.cluster-empty {
  padding: 18px 4px;
  color: #8a97a8;
  font-size: 13px;
  text-align: center;
}

.de-output {
  min-height: 0;
  margin: 0 18px 18px;
  border: 1px solid #d9e1ea;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.de-tabs {
  height: 56px;
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid #d9e1ea;
}

.de-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border: 0;
  background: transparent;
  color: #0d294a;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
}

.de-tab--active::after {
  content: "";
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 0;
  height: 4px;
  background: #147bd1;
}

.de-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 18px;
}

.de-toolbar p {
  margin: 0;
  color: #24405f;
  font-size: 14px;
}

.segmented {
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  background: #f3f6f9;
  border: 1px solid #d9e1ea;
}

.segmented__item {
  min-width: 110px;
  height: 34px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #52667c;
  font-weight: 800;
  cursor: pointer;
}

.segmented__item--active {
  background: #147bd1;
  color: #ffffff;
}

.de-table-wrap {
  overflow: auto;
  height: 180px;
  border-top: 1px solid #e3e9ef;
}

.de-table {
  width: 100%;
  min-width: 500px;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 13px;
}

.de-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 10px 12px;
  background: #f4f8fa;
  border-bottom: 1px solid #d9e1ea;
  border-right: 1px solid #d9e1ea;
  color: #0d294a;
  text-align: left;
}

.de-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e3e9ef;
  border-right: 1px solid #edf2f6;
  color: #24405f;
}

.gene-name {
  font-weight: 750;
}

.celltype-chip {
  width: 9px;
  height: 9px;
  display: inline-block;
  margin-right: 8px;
  border-radius: 3px;
  box-shadow: 0 0 0 1px rgba(13, 41, 74, 0.08);
}

.gene-menu {
  float: right;
  color: #9aa5b1;
}

.specificity {
  height: 7px;
  border-radius: 999px;
  background: #e8eef3;
  overflow: hidden;
}

.specificity span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #147bd1;
}

.inspector-panel {
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 14px;
  border-right: 0;
  border-left: 1px solid #d9e1ea;
  background: #f8fafc;
}

.inspector-card {
  padding: 14px;
  border: 1px solid #d9e1ea;
  border-radius: 10px;
  background: #ffffff;
}

.inspector-card__head span {
  color: #7d8b9b;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.inspector-card__head strong {
  color: #0d294a;
  font-size: 13px;
}

.summary-grid,
.runtime-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
}

.summary-grid div,
.runtime-grid div {
  padding: 10px;
  border-radius: 8px;
  background: #f4f8fa;
}

.summary-grid span,
.runtime-grid span {
  display: block;
  color: #7d8b9b;
  font-size: 12px;
  font-weight: 700;
}

.summary-grid strong,
.runtime-grid strong {
  display: block;
  margin-top: 5px;
  color: #10233f;
  font-size: 18px;
}

.qc-list {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.qc-list--scroll {
  max-height: 180px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.qc-row {
  display: grid;
  grid-template-columns: 88px 1fr 46px;
  align-items: center;
  gap: 8px;
  color: #52667c;
  font-size: 12px;
  font-weight: 700;
}

.qc-bar {
  height: 7px;
  border-radius: 999px;
  background: #e3e9ef;
  overflow: hidden;
  display: flex;
}

.qc-bar--neg i {
  margin-left: auto;
}

.qc-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #147bd1;
}

.qc-bar--amber i {
  background: #f59e0b;
}

.qc-bar--green i {
  background: #16a34a;
}

.runtime-line {
  width: 100%;
  height: 60px;
  margin-top: 10px;
}

.runtime-line path {
  fill: none;
  stroke: #147bd1;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.algorithm-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.algorithm-pill {
  padding: 7px 9px;
  border-radius: 999px;
  background: #eaf6fd;
  color: #0f65a6;
  font-size: 12px;
  font-weight: 800;
}

@media (max-width: 1280px) {
  .dashboard-workbench {
    grid-template-columns: 300px minmax(520px, 1fr);
  }

  .inspector-panel {
    display: none;
  }
}

@media (max-width: 960px) {
  .dashboard-workbench {
    overflow: auto;
    grid-template-columns: 1fr;
  }

  .module-rail {
    display: none;
  }

  .groups-panel {
    max-height: 360px;
    border-right: 0;
    border-bottom: 1px solid #d9e1ea;
  }

  .viewer-panel {
    grid-template-rows: auto 420px auto;
  }
}
</style>
