<template>
  <div class="bio-workbench">
    <header class="titlebar">
      <div class="titlebar__identity">
        <div class="app-mark">S</div>
        <div>
          <h1>scann-search Workbench</h1>
          <p>Single-cell ANN analysis console</p>
        </div>
      </div>
      <div class="titlebar__menu" aria-label="应用菜单">
        <span>File</span>
        <span>Analyze</span>
        <span>View</span>
        <span>Export</span>
      </div>
      <div class="titlebar__status">
        <span class="status-pill" :class="{ 'status-pill--offline': !isOnline }">
          <span class="status-dot"></span>
          {{ isOnline ? "Backend online" : "Backend offline" }}
        </span>
        <button class="icon-button" type="button" aria-label="退出登录" @click="auth.logout()">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 17l1.4-1.4L8.8 13H20v-2H8.8l2.6-2.6L10 7l-5 5 5 5Z" />
            <path d="M4 5h6V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h6v-2H4V5Z" />
          </svg>
        </button>
      </div>
    </header>

    <section class="toolbar">
      <button class="toolbar-home" type="button" @click="go('/dashboard')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10.5V20h13v-9.5" />
        </svg>
        Home
      </button>

      <div class="toolbar-divider"></div>

      <label class="select-control">
        <span>Projection type</span>
        <select v-model="projectionType">
          <option value="spatial">Spatial</option>
          <option value="umap">UMAP</option>
          <option value="pca">PCA</option>
        </select>
      </label>

      <label class="select-control">
        <span>Dataset</span>
        <select>
          <option>{{ datasetName }}</option>
        </select>
      </label>

      <label class="opacity-control">
        <span>Spot opacity</span>
        <input v-model.number="spotOpacity" type="range" min="35" max="100" />
      </label>

      <div class="toolbar-tools">
        <button class="tool-button tool-button--active" type="button" title="Pan">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2v20M2 12h20" />
            <path d="m6 6-4 6 4 6M18 6l4 6-4 6" />
          </svg>
        </button>
        <button class="tool-button" type="button" title="Lasso">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7.5 18.5c-2.8-.8-4.5-2.3-4.5-4.2 0-3 4.4-5.4 9.8-5.4s8.2 1.6 8.2 4.2c0 2.2-2.5 3.9-6.3 4.6" />
            <path d="M12 17l-3 5" />
          </svg>
        </button>
        <button class="tool-button" type="button" title="Brush">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16 3l5 5-9.5 9.5-5-5L16 3Z" />
            <path d="M6.5 12.5 4 15c-1.4 1.4-1.4 3.6 0 5 1.2-1.7 2.9-2.6 5-2.5l2.5-2.5" />
          </svg>
        </button>
      </div>

      <button class="export-button" type="button" @click="go('/export')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M4 20h16" />
        </svg>
        Export
      </button>
    </section>

    <main class="workbench-grid">
      <nav class="module-rail" aria-label="分析模块">
        <button class="rail-item rail-item--active" type="button">
          <span class="rail-icon rail-icon--clusters"></span>
          <span>Clusters</span>
        </button>
        <button class="rail-item" type="button" @click="go('/visualize')">
          <span class="rail-icon rail-icon--features"></span>
          <span>Features</span>
        </button>
        <button class="rail-item" type="button" @click="go('/search')">
          <span class="rail-icon rail-icon--search"></span>
          <span>Search</span>
        </button>
        <button class="rail-item" type="button" @click="go('/datasets')">
          <span class="rail-icon rail-icon--datasets"></span>
          <span>Datasets</span>
        </button>
        <button class="rail-item" type="button" @click="go('/indexes')">
          <span class="rail-icon rail-icon--index"></span>
          <span>Indexes</span>
        </button>
      </nav>

      <aside class="groups-panel">
        <div class="panel-heading">
          <span>Pipeline-generated groups</span>
          <button class="ghost-icon" type="button" aria-label="下载分组">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 20h14" />
            </svg>
          </button>
        </div>

        <label class="group-source">
          <input type="radio" checked />
          <span>Graph-Based</span>
          <strong>{{ selectedCluster?.name }}</strong>
        </label>

        <div class="cluster-list">
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
            <span class="cluster-name">{{ cluster.name }}</span>
            <span class="cluster-count">{{ cluster.count.toLocaleString() }}</span>
            <button class="cluster-more" type="button" aria-label="更多操作">•••</button>
          </label>
        </div>

        <div class="group-source group-source--secondary">
          <input type="radio" />
          <span>K-Means</span>
          <strong>disabled</strong>
        </div>

        <div class="groups-panel__footer">
          <button class="link-button" type="button" @click="go('/datasets')">+ Create a new group</button>
          <button class="primary-action" type="button" @click="go('/benchmark')">Run Differential Expression</button>
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

        <div class="spatial-canvas">
          <div class="canvas-grid" aria-hidden="true"></div>
          <div class="tissue-halo" aria-hidden="true"></div>
          <button class="canvas-control canvas-control--fit" type="button" aria-label="适配窗口">
            <svg viewBox="0 0 24 24">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          </button>
          <button class="canvas-control canvas-control--zoom" type="button" aria-label="放大">
            <svg viewBox="0 0 24 24">
              <circle cx="10.5" cy="10.5" r="5.5" />
              <path d="M15 15l5 5M10.5 8v5M8 10.5h5" />
            </svg>
          </button>

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

          <div class="scale-bar">
            <span>5 mm</span>
          </div>
        </div>

        <section class="de-output">
          <div class="de-tabs">
            <button class="de-tab de-tab--active" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 4h14v16H5z" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
              Differential Expression Output
            </button>
            <button class="de-tab" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19V5M4 19h16" />
                <path d="M8 16v-5M12 16V8M16 16v-7" />
              </svg>
              Expression Distribution
            </button>
          </div>

          <div class="de-toolbar">
            <div class="segmented">
              <button class="segmented__item segmented__item--active" type="button">Feature Table</button>
              <button class="segmented__item" type="button">Heat Map</button>
            </div>
            <p>Up-regulated genes per selected cluster in group <strong>Graph-Based</strong>.</p>
            <button class="ghost-icon" type="button" aria-label="表格设置">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                <path d="M3 12h2M19 12h2M12 3v2M12 19v2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
              </svg>
            </button>
          </div>

          <div class="de-table-wrap">
            <table class="de-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Cluster 1 L2FC</th>
                  <th>P-Value</th>
                  <th>Cluster 2</th>
                  <th>Cluster 3</th>
                  <th>Cluster 4</th>
                  <th>Specificity</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="gene in geneRows" :key="gene.name">
                  <td>
                    <span class="gene-name">{{ gene.name }}</span>
                    <span class="gene-menu">•••</span>
                  </td>
                  <td>{{ gene.l2fc.toFixed(2) }}</td>
                  <td>{{ gene.p }}</td>
                  <td :class="{ negative: gene.c2 < 0 }">{{ gene.c2.toFixed(2) }}</td>
                  <td>{{ gene.c3.toFixed(2) }}</td>
                  <td :class="{ negative: gene.c4 < 0 }">{{ gene.c4.toFixed(2) }}</td>
                  <td>
                    <div class="specificity">
                      <span :style="{ width: `${gene.specificity}%` }"></span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
              <strong>{{ indexCount }}</strong>
            </div>
            <div>
              <span>Vector dim</span>
              <strong>{{ vectorDim }}</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>ANN</strong>
            </div>
          </div>
        </section>

        <section class="inspector-card">
          <div class="inspector-card__head">
            <span>Quality Control</span>
            <strong>{{ load }}%</strong>
          </div>
          <div class="qc-list">
            <div class="qc-row">
              <span>Median genes</span>
              <div class="qc-bar"><i style="width: 72%"></i></div>
              <strong>2,746</strong>
            </div>
            <div class="qc-row">
              <span>MT fraction</span>
              <div class="qc-bar qc-bar--amber"><i style="width: 28%"></i></div>
              <strong>4.8%</strong>
            </div>
            <div class="qc-row">
              <span>Doublet score</span>
              <div class="qc-bar qc-bar--green"><i style="width: 18%"></i></div>
              <strong>0.06</strong>
            </div>
          </div>
        </section>

        <section class="inspector-card">
          <div class="inspector-card__head">
            <span>Index Runtime</span>
            <strong>{{ animatedLatency }} ms</strong>
          </div>
          <div class="runtime-grid">
            <div>
              <span>QPS</span>
              <strong>{{ animatedQps }}</strong>
            </div>
            <div>
              <span>Memory</span>
              <strong>{{ animatedMemory }} MB</strong>
            </div>
          </div>
          <svg class="runtime-line" viewBox="0 0 160 52" aria-hidden="true">
            <path :d="latencySparklinePathWide" />
          </svg>
        </section>

        <section class="inspector-card">
          <div class="inspector-card__head">
            <span>Active Algorithms</span>
            <strong>Ready</strong>
          </div>
          <div class="algorithm-list">
            <span v-for="algo in algorithms" :key="algo" class="algorithm-pill">{{ algo }}</span>
          </div>
        </section>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { listDatasets, listIndexes } from "@/api/search"

type Cluster = {
  name: string
  count: number
  color: string
  enabled: boolean
}

type Spot = {
  id: number
  x: number
  y: number
  size: number
  color: string
  opacity: number
  enabled: boolean
}

const router = useRouter()
const auth = useAuthStore()

const datasetCount = ref<number | string>("—")
const indexCount = ref<number | string>("—")
const totalCells = ref(0)
const isOnline = ref(false)
const datasetName = ref("PBMC spatial atlas")
const vectorDim = ref<number | string>("—")
const projectionType = ref<"spatial" | "umap" | "pca">("spatial")
const spotOpacity = ref(78)

const latency = ref(16)
const memory = ref(302)
const qps = ref(121)
const load = ref(42)
const animatedLatency = ref(16)
const animatedMemory = ref(302)
const animatedQps = ref(121)
const latencyHistory = ref([18, 15, 17, 12, 19, 14, 16, 13, 15, 12, 16, 14])

const clusters = reactive<Cluster[]>([
  { name: "Cluster 1", count: 41242, color: "#3b1b48", enabled: true },
  { name: "Cluster 2", count: 39426, color: "#b7f230", enabled: true },
  { name: "Cluster 3", count: 19005, color: "#5571d9", enabled: true },
  { name: "Cluster 4", count: 14870, color: "#f5c542", enabled: true },
  { name: "Cluster 5", count: 11509, color: "#4aa3ff", enabled: true },
  { name: "Cluster 6", count: 4528, color: "#ff7a1a", enabled: true },
  { name: "Cluster 7", count: 881, color: "#2bc7bb", enabled: true },
  { name: "Cluster 8", count: 796, color: "#d93b00", enabled: true },
  { name: "Cluster 9", count: 491, color: "#48e87e", enabled: true },
  { name: "Cluster 10", count: 469, color: "#9b1b10", enabled: true },
])

const selectedCluster = ref<Cluster | null>(clusters[1])
const algorithms = ["Flat", "HNSW", "IVF", "PQ"]
const geneRows = [
  { name: "TMCC2", l2fc: 0.93, p: "2.81e-17", c2: -0.55, c3: 0.73, c4: -1.29, specificity: 86 },
  { name: "ACSL6", l2fc: 0.86, p: "3.93e-14", c2: -0.76, c3: 0.46, c4: -0.60, specificity: 76 },
  { name: "SLC7A5", l2fc: 0.84, p: "4.92e-14", c2: -0.83, c3: 0.26, c4: -0.39, specificity: 72 },
  { name: "MALAT1", l2fc: 0.71, p: "7.15e-12", c2: -0.18, c3: 0.33, c4: -0.21, specificity: 64 },
  { name: "CXCL8", l2fc: 0.68, p: "1.08e-10", c2: 0.42, c3: -0.28, c4: -0.44, specificity: 59 },
]

const projectionTypeLabel = computed(() => {
  if (projectionType.value === "umap") return "UMAP projection"
  if (projectionType.value === "pca") return "PCA projection"
  return "Spatial projection"
})

const totalCellsDisplay = computed(() => {
  if (!totalCells.value) return "—"
  return totalCells.value >= 10000 ? `${(totalCells.value / 10000).toFixed(1)}万` : String(totalCells.value)
})

const allClustersEnabled = computed(() => clusters.every((cluster) => cluster.enabled))

const spots = computed<Spot[]>(() => {
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
      id: index,
      x,
      y,
      size: 4 + seeded(index, 11) * 5,
      color: cluster.color,
      opacity: spotOpacity.value / 100,
      enabled: cluster.enabled,
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

  animatedLatency.value = latency.value
  animatedMemory.value = memory.value
  animatedQps.value = qps.value
  latencyHistory.value.push(latency.value)
  if (latencyHistory.value.length > 18) latencyHistory.value.shift()
}

let metricsInterval: number | null = null

async function loadMetrics() {
  try {
    const [datasets, indexes] = await Promise.all([listDatasets(), listIndexes()])
    datasetCount.value = datasets.length
    indexCount.value = indexes.length
    totalCells.value = datasets.reduce((sum: number, item: any) => sum + (item.n_cells ?? 0), 0)
    datasetName.value = datasets[0]?.name ?? "PBMC spatial atlas"
    vectorDim.value = datasets[0]?.vector_dim ?? indexes[0]?.vector_dim ?? "—"
    isOnline.value = true
  } catch {
    datasetCount.value = 1
    indexCount.value = 4
    totalCells.value = 145_217
    vectorDim.value = 50
    isOnline.value = false
  } finally {
    updatePerformanceMetrics()
    metricsInterval = window.setInterval(updatePerformanceMetrics, 2400)
  }
}

function go(path: string) {
  router.push(path)
}

onMounted(loadMetrics)

onUnmounted(() => {
  if (metricsInterval) clearInterval(metricsInterval)
})
</script>

<style scoped>
.bio-workbench {
  min-height: 100vh;
  display: grid;
  grid-template-rows: 42px 70px minmax(0, 1fr);
  background: #fbfbfd;
  color: #10233f;
  overflow: hidden;
}

.titlebar {
  display: grid;
  grid-template-columns: 300px 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 0 18px;
  background: #f5f7fa;
  border-bottom: 1px solid #dce3ea;
  box-shadow: inset 0 4px 0 #1b6f86;
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

.titlebar__menu {
  display: flex;
  align-items: center;
  gap: 24px;
  color: #243a57;
  font-size: 14px;
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
  gap: 16px;
  padding: 10px 18px;
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

.toolbar-home:hover,
.export-button:hover,
.tool-button:hover {
  background: #eef6fc;
}

.toolbar svg,
.titlebar svg,
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
  background: #d9e1ea;
}

.select-control,
.opacity-control {
  min-width: 170px;
  display: grid;
  gap: 3px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f7fafc;
}

.select-control span,
.opacity-control span {
  color: #8b98a8;
  font-size: 12px;
  line-height: 1;
}

.select-control select {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #10233f;
  font-size: 15px;
  font-weight: 750;
}

.opacity-control input {
  width: 140px;
  accent-color: #147bd1;
}

.toolbar-tools {
  display: flex;
  align-items: center;
  gap: 8px;
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
  background: #f7fafc;
}

.workbench-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: 86px 330px minmax(520px, 1fr) 310px;
  background: #ffffff;
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

.group-source {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  color: #0d294a;
  font-size: 17px;
  font-weight: 750;
}

.group-source strong {
  color: #8a97a7;
  font-size: 12px;
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
  grid-template-columns: 18px 20px minmax(0, 1fr) auto 24px;
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
  grid-template-rows: 76px minmax(330px, 1fr) 310px;
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

.canvas-control {
  position: absolute;
  z-index: 3;
  bottom: 20px;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid #d9e1ea;
  background: rgba(255, 255, 255, 0.92);
  color: #0d294a;
  cursor: pointer;
}

.canvas-control svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.canvas-control--fit {
  left: 22px;
  border-radius: 8px 0 0 8px;
}

.canvas-control--zoom {
  left: 63px;
  border-radius: 0 8px 8px 0;
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
  display: grid;
  grid-template-columns: auto 1fr auto;
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
  min-width: 900px;
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

.gene-menu {
  float: right;
  color: #9aa5b1;
}

.negative {
  color: #a8b0bb !important;
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
  .workbench-grid {
    grid-template-columns: 76px 300px minmax(520px, 1fr);
  }

  .inspector-panel {
    display: none;
  }
}

@media (max-width: 960px) {
  .bio-workbench {
    overflow: auto;
  }

  .toolbar {
    flex-wrap: wrap;
    height: auto;
  }

  .workbench-grid {
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
