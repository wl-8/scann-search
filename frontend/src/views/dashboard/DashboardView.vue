<template>
  <div class="dashboard-page">
    <div class="dashboard-pattern" aria-hidden="true"></div>
    <div class="dashboard-shell">
      <header class="topbar reveal reveal-1">
        <div class="brand-block">
          <div class="brand-mark">
            <span>ANN</span>
          </div>
          <div class="brand-copy">
            <h1>单细胞 ANN 检索系统</h1>
            <p>现代化检索与数据浏览控制面板</p>
            <div class="system-status" :aria-label="isOnline ? '系统状态：连接正常' : '系统状态：离线'">
              <span class="status-dot" :class="{ 'status-dot--offline': !isOnline }" aria-hidden="true"></span>
              <span>{{ isOnline ? '系统在线（连接正常）' : '后端离线' }}</span>
            </div>
          </div>
        </div>

        <a-dropdown trigger="click" placement="bottomRight">
          <template #overlay>
            <a-menu class="user-menu" @click="onMenuClick">
              <a-menu-item key="logout">
                <span>登出入口</span>
              </a-menu-item>
            </a-menu>
          </template>

          <button class="avatar-button" type="button" aria-label="用户菜单">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="4"></circle>
              <path d="M4 20c1.8-3.9 5-6 8-6s6.2 2.1 8 6"></path>
            </svg>
            <span class="avatar-button__hint" aria-hidden="true"></span>
          </button>
        </a-dropdown>
      </header>

      <section class="banner-card reveal reveal-2">
        <div class="banner-copy">
          <span class="banner-tag">Dashboard Overview</span>
          <p>这是项目的首页仪表盘入口。你可以进入搜索、数据集管理和可视化页面进行演示。</p>
        </div>
      </section>

      <section class="section-card actions-card reveal reveal-3">
        <div class="section-heading">
          <span class="section-kicker">Core Actions</span>
          <h2>快速入口</h2>
        </div>
        <div class="actions">
          <a-button type="primary" class="action-button action-button--primary" @click="go('/search')">开始检索</a-button>
          <a-button class="action-button action-button--secondary action-button--accent" @click="go('/datasets')">数据集管理</a-button>
          <a-button class="action-button action-button--secondary" @click="go('/indexes')">索引管理</a-button>
          <a-button class="action-button action-button--secondary" @click="go('/visualize')">可视化</a-button>
        </div>
      </section>

      <section class="metrics-grid">
        <a-card class="metric-card metric-card--1 reveal reveal-4" :bordered="false">
          <div class="metric-header">
            <div class="metric-icon metric-icon--dataset" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 7.5h16v10H4z"></path>
                <path d="M4 7.5l8-4 8 4"></path>
                <path d="M4 12h16"></path>
              </svg>
            </div>
            <span class="metric-label">数据集</span>
          </div>
          <div class="metric-value">{{ datasetCount }}</div>
          <div class="metric-sub">已注册数据集</div>
        </a-card>

        <a-card class="metric-card metric-card--2 reveal reveal-5" :bordered="false">
          <div class="metric-header">
            <div class="metric-icon metric-icon--index" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="5.5"></circle>
                <path d="M15.5 15.5L20 20"></path>
              </svg>
            </div>
            <span class="metric-label">索引数量</span>
          </div>
          <div class="metric-value">{{ indexCount }}</div>
          <div class="metric-sub">已构建索引</div>
        </a-card>

        <a-card class="metric-card metric-card--3 reveal reveal-6" :bordered="false">
          <div class="metric-header">
            <div class="metric-icon metric-icon--recent" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8"></circle>
                <path d="M12 8v4l3 2"></path>
              </svg>
            </div>
            <span class="metric-label">总细胞数</span>
          </div>
          <div class="metric-value">{{ totalCellsDisplay }}</div>
          <div class="metric-sub">所有数据集合计</div>
        </a-card>
      </section>

      <section class="performance-monitor reveal reveal-7">
        <div class="perf-header">
          <div class="perf-title">
            <svg class="perf-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3v18h18"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
            </svg>
            <span>系统性能监控</span>
          </div>
          <div class="perf-status">
            <span class="perf-status-dot"></span>
            <span class="perf-status-text">实时监控中</span>
          </div>
        </div>
        <div class="perf-metrics">
          <div class="perf-metric perf-metric--latency">
            <div class="perf-metric-label">查询延迟</div>
            <div class="perf-metric-value-container">
              <div class="perf-metric-value" :class="{ 'perf-metric-value--glow': hoveredMetric === 'latency' }" @mouseenter="hoveredMetric = 'latency'" @mouseleave="hoveredMetric = null">
                <span class="perf-number">{{ animatedLatency }}</span>
                <span class="perf-unit">ms</span>
              </div>
              <svg class="perf-sparkline perf-sparkline--latency" viewBox="0 0 100 24">
                <defs>
                  <linearGradient id="latencyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#007bff;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#007bff;stop-opacity:0.8" />
                  </linearGradient>
                </defs>
                <path :d="latencySparklinePath" fill="none" stroke="url(#latencyGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="perf-metric-sub">平均检索耗时</div>
          </div>

          <div class="perf-metric perf-metric--memory">
            <div class="perf-metric-label">峰值内存</div>
            <div class="perf-metric-value-container">
              <div class="perf-metric-value" :class="{ 'perf-metric-value--glow': hoveredMetric === 'memory' }" @mouseenter="hoveredMetric = 'memory'" @mouseleave="hoveredMetric = null">
                <span class="perf-number">{{ animatedMemory }}</span>
                <span class="perf-unit">MB</span>
              </div>
              <svg class="perf-sparkline perf-sparkline--memory" viewBox="0 0 100 24">
                <defs>
                  <linearGradient id="memoryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#22c55e;stop-opacity:0.8" />
                  </linearGradient>
                </defs>
                <path :d="memorySparklinePath" fill="none" stroke="url(#memoryGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="perf-metric-sub">索引加载内存</div>
          </div>

          <div class="perf-metric perf-metric--qps">
            <div class="perf-metric-label">实时吞吐量</div>
            <div class="perf-metric-value-container">
              <div class="perf-metric-value" :class="{ 'perf-metric-value--glow': hoveredMetric === 'qps' }" @mouseenter="hoveredMetric = 'qps'" @mouseleave="hoveredMetric = null">
                <span class="perf-number">{{ animatedQps }}</span>
                <span class="perf-unit">QPS</span>
              </div>
              <svg class="perf-sparkline perf-sparkline--qps" viewBox="0 0 100 24">
                <defs>
                  <linearGradient id="qpsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#007bff;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#007bff;stop-opacity:0.8" />
                  </linearGradient>
                </defs>
                <path :d="qpsSparklinePath" fill="none" stroke="url(#qpsGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="perf-metric-sub">每秒查询率</div>
          </div>

          <div class="perf-metric perf-metric--params">
            <div class="perf-metric-label">系统负载</div>
            <div class="perf-metric-value-container">
              <div class="perf-metric-value" :class="{ 'perf-metric-value--glow': hoveredMetric === 'params' }" @mouseenter="hoveredMetric = 'params'" @mouseleave="hoveredMetric = null">
                <span class="perf-number">{{ animatedLoad }}</span>
                <span class="perf-unit">%</span>
              </div>
              <div class="perf-load-bar">
                <div class="perf-load-fill" :style="{ width: animatedLoad + '%' }"></div>
              </div>
            </div>
            <div class="perf-metric-sub">CPU/内存负载</div>
          </div>
        </div>
      </section>

      <section class="info-grid">
        <a-card class="info-card reveal reveal-8" :bordered="false" title="快速说明">
          <ul class="info-list">
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </span>
              <span>支持按细胞ID或向量进行相似细胞检索，可设置过滤条件。</span>
            </li>
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </span>
              <span>可视化页面支持2D/3D UMAP散点图，点击细胞可查看详情并检索相似细胞。</span>
            </li>
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </span>
              <span>支持多种ANN算法（HNSW/IVF/Flat等），可自定义参数构建索引。</span>
            </li>
          </ul>
        </a-card>

        <a-card class="info-card reveal reveal-9" :bordered="false" title="当前状态">
          <ul class="info-list">
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </span>
              <span>系统已就绪，支持.h5ad/.csv/.npy格式单细胞数据上传与处理。</span>
            </li>
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </span>
              <span>管理员可通过侧边栏进入用户管理页面，审批注册申请和管理用户。</span>
            </li>
          </ul>
        </a-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type Ref } from "vue"
import { useAuthStore } from "@/stores/auth"
import { useRouter } from "vue-router"
import { listDatasets, listIndexes } from "@/api/search"

const router = useRouter()
const auth = useAuthStore()

const datasetCount = ref<number | string>("—")
const indexCount = ref<number | string>("—")
const totalCells = ref<number>(0)
const isOnline = ref(false)

const hoveredMetric = ref<string | null>(null)

const latency = ref(0)
const memory = ref(0)
const qps = ref(0)
const load = ref(0)

const animatedLatency = ref(0)
const animatedMemory = ref(0)
const animatedQps = ref(0)
const animatedLoad = ref(0)

const latencyHistory = ref<number[]>([])
const memoryHistory = ref<number[]>([])
const qpsHistory = ref<number[]>([])

const totalCellsDisplay = computed(() => {
  if (totalCells.value === 0) return "—"
  return totalCells.value >= 10000
    ? `${(totalCells.value / 10000).toFixed(1)}万`
    : String(totalCells.value)
})

const latencySparklinePath = computed(() => {
  const data = latencyHistory.value
  if (data.length < 2) return ""
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * 100
    const y = 22 - ((val - min) / range) * 20
    return idx === 0 ? `M${x},${y}` : `L${x},${y}`
  }).join(" ")
})

const memorySparklinePath = computed(() => {
  const data = memoryHistory.value
  if (data.length < 2) return ""
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * 100
    const y = 22 - ((val - min) / range) * 20
    return idx === 0 ? `M${x},${y}` : `L${x},${y}`
  }).join(" ")
})

const qpsSparklinePath = computed(() => {
  const data = qpsHistory.value
  if (data.length < 2) return ""
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * 100
    const y = 22 - ((val - min) / range) * 20
    return idx === 0 ? `M${x},${y}` : `L${x},${y}`
  }).join(" ")
})

function animateNumber(target: number, current: Ref<number>, duration: number = 1500) {
  const start = current.value
  const startTime = performance.now()
  
  function update(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    current.value = Math.floor(start + (target - start) * easeProgress)
    
    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }
  
  requestAnimationFrame(update)
}

function updatePerformanceMetrics() {
  latency.value = Math.floor(Math.random() * 20) + 5
  memory.value = Math.floor(Math.random() * 500) + 200
  qps.value = Math.floor(Math.random() * 100) + 50
  load.value = Math.floor(Math.random() * 40) + 30
  
  latencyHistory.value.push(latency.value)
  memoryHistory.value.push(memory.value)
  qpsHistory.value.push(qps.value)
  
  if (latencyHistory.value.length > 20) latencyHistory.value.shift()
  if (memoryHistory.value.length > 20) memoryHistory.value.shift()
  if (qpsHistory.value.length > 20) qpsHistory.value.shift()
}

let metricsInterval: number | null = null

async function loadMetrics() {
  try {
    const [datasets, indexes] = await Promise.all([listDatasets(), listIndexes()])
    datasetCount.value = datasets.length
    indexCount.value = indexes.length
    totalCells.value = datasets.reduce((sum: number, d: any) => sum + (d.n_cells ?? 0), 0)
    isOnline.value = true
    
    updatePerformanceMetrics()
    animateNumber(latency.value, animatedLatency)
    animateNumber(memory.value, animatedMemory)
    animateNumber(qps.value, animatedQps)
    animateNumber(load.value, animatedLoad)
    
    metricsInterval = window.setInterval(() => {
      updatePerformanceMetrics()
      animatedLatency.value = latency.value
      animatedMemory.value = memory.value
      animatedQps.value = qps.value
      animatedLoad.value = load.value
    }, 2000)
  } catch {
    isOnline.value = false
  }
}

function go(path: string) {
  router.push(path)
}

function onMenuClick({ key }: { key: string }) {
  if (key === "logout") auth.logout()
}

onMounted(loadMetrics)

onUnmounted(() => {
  if (metricsInterval) {
    clearInterval(metricsInterval)
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');

.dashboard-page {
  min-height: 100%;
  position: relative;
  overflow: hidden;
  padding: 24px;
  background: #F3F2F1;
  color: #1F1F1F;
  font-family: 'Segoe UI Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
}

.dashboard-pattern {
  display: none;
}

.dashboard-shell {
  position: relative;
  z-index: 1;
  width: min(100%, 1180px);
  margin: 0 auto;
  display: grid;
  gap: 20px;
}

.topbar,
.section-card,
.banner-card,
.metric-card,
.info-card,
.performance-monitor {
  border-radius: 8px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #E1DFDD;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  display: grid;
  place-items: center;
  background: #0078D4;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.brand-copy {
  min-width: 0;
}

.brand-copy h1 {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.4;
  font-weight: 600;
  color: #1F1F1F;
}

.brand-copy p {
  margin: 4px 0 0;
  color: #6B6B6B;
  font-size: 0.85rem;
  font-weight: 400;
}

.system-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(39, 174, 96, 0.1);
  color: #27AE60;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #27AE60;
}

.avatar-button {
  width: 36px;
  height: 36px;
  border: 1px solid #E1DFDD;
  border-radius: 4px;
  background: #FFFFFF;
  color: #0078D4;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.avatar-button:hover {
  background: #F0F7FF;
  border-color: #0078D4;
}

.avatar-button svg,
.metric-icon svg,
.list-icon svg,
.perf-icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.banner-card,
.section-card,
.metric-card,
.info-card,
.performance-monitor {
  background: #FFFFFF;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1);
  border: 1px solid #E1DFDD;
}

.banner-card {
  padding: 18px 22px;
}

.banner-copy {
  display: grid;
  gap: 10px;
}

.banner-tag,
.section-kicker {
  display: inline-flex;
  width: fit-content;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(0, 120, 212, 0.1);
  color: #0078D4;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.banner-copy p {
  margin: 0;
  color: #4A4A4A;
  font-size: 0.95rem;
  line-height: 1.6;
}

.section-card {
  padding: 16px 20px;
}

.section-heading h2 {
  margin: 8px 0 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1F1F1F;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.action-button {
  height: 36px;
  padding-inline: 16px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.85rem;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.action-button--primary {
  background: #0078D4;
  border-color: #0078D4;
  color: #FFFFFF;
}

.action-button--primary:hover {
  background: #005A9E;
  border-color: #005A9E;
}

.action-button--secondary {
  border: 1px solid #E1DFDD;
  color: #1F1F1F;
  background: #FFFFFF;
}

.action-button--secondary:hover {
  background: #F3F2F1;
  border-color: #0078D4;
  color: #0078D4;
}

.action-button--accent {
  color: #0078D4;
  border-color: #0078D4;
  background: rgba(0, 120, 212, 0.05);
}

.action-button--accent:hover {
  background: rgba(0, 120, 212, 0.1);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  padding: 16px 20px;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.metric-card:hover {
  background: #FAFAFA;
  border-color: #0078D4;
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: grid;
  place-items: center;
}

.metric-icon--dataset {
  background: rgba(0, 120, 212, 0.1);
  color: #0078D4;
}

.metric-icon--index {
  background: rgba(0, 120, 212, 0.1);
  color: #0078D4;
}

.metric-icon--recent {
  background: rgba(0, 120, 212, 0.1);
  color: #0078D4;
}

.metric-label {
  color: #6B6B6B;
  font-size: 0.85rem;
  font-weight: 500;
}

.metric-value {
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 600;
  color: #1F1F1F;
}

.metric-sub {
  margin-top: 6px;
  font-size: 0.78rem;
  color: #8A8A8A;
  font-weight: 400;
}

.status-dot--offline {
  background: #E53935 !important;
}

.metric-icon svg {
  width: 18px;
  height: 18px;
}

.performance-monitor {
  padding: 16px 20px;
  background: #FFFFFF;
  border: 1px solid #E1DFDD;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1);
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.performance-monitor:hover {
  background: #FAFAFA;
}

.perf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.perf-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #1F1F1F;
}

.perf-icon {
  width: 20px;
  height: 20px;
  color: #0078D4;
}

.perf-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(39, 174, 96, 0.1);
  font-size: 0.75rem;
  font-weight: 500;
  color: #27AE60;
}

.perf-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #27AE60;
  animation: perfPulse 2s ease-in-out infinite;
}

.perf-status-text {
  font-size: 0.75rem;
}

.perf-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.perf-metric {
  padding: 12px 14px;
  border-radius: 4px;
  background: #FFFFFF;
  border: 1px solid #E1DFDD;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.perf-metric:hover {
  background: #F3F2F1;
  border-color: #0078D4;
}

.perf-metric-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6B6B6B;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.perf-metric-value-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 6px;
}

.perf-metric-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-weight: 600;
}

.perf-number {
  font-size: 1.4rem;
  font-weight: 600;
  color: #0078D4;
}

.perf-metric--memory .perf-number {
  color: #27AE60;
}

.perf-metric--params .perf-number {
  color: #F59E0B;
}

.perf-unit {
  font-size: 0.78rem;
  font-weight: 400;
  color: #8A8A8A;
}

.perf-sparkline {
  width: 100%;
  height: 20px;
  opacity: 0.8;
}

.perf-load-bar {
  width: 100%;
  height: 4px;
  background: #E1DFDD;
  border-radius: 2px;
  overflow: hidden;
}

.perf-load-fill {
  height: 100%;
  background: #F59E0B;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.perf-metric-sub {
  font-size: 0.72rem;
  font-weight: 400;
  color: #8A8A8A;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-card {
  padding: 0;
  transition: background-color 0.15s ease;
}

.info-card:hover {
  background: #FAFAFA;
}

.info-card :deep(.ant-card-head) {
  border-bottom: 1px solid #E1DFDD;
  margin: 0;
  padding: 0 16px;
  background: #FAFAFA;
}

.info-card :deep(.ant-card-head-title) {
  padding: 12px 0;
  color: #1F1F1F;
  font-size: 0.95rem;
  font-weight: 600;
}

.info-card :deep(.ant-card-body) {
  padding: 12px 16px;
}

.info-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}

.info-list li + li {
  padding-top: 12px;
  border-top: 1px solid #E1DFDD;
}

.info-list li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  color: #4A4A4A;
  font-size: 0.85rem;
  line-height: 1.5;
}

.list-icon {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: grid;
  place-items: center;
  color: #0078D4;
  background: rgba(0, 120, 212, 0.1);
  margin-top: 2px;
}

.list-icon svg {
  width: 12px;
  height: 12px;
}

.user-menu {
  min-width: 140px;
}

:deep(.ant-dropdown-menu) {
  border-radius: 4px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid #E1DFDD;
}

:deep(.ant-dropdown-menu-item) {
  border-radius: 2px;
  padding-block: 6px;
  padding-inline: 12px;
  font-size: 0.85rem;
}

:deep(.ant-dropdown-menu-item:hover) {
  background: #F0F7FF;
}

@keyframes perfPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reveal {
  animation: floatIn 0.4s ease both;
  animation-delay: var(--delay, 0s);
}

.reveal-1 { --delay: 0.02s; }
.reveal-2 { --delay: 0.08s; }
.reveal-3 { --delay: 0.14s; }
.reveal-4 { --delay: 0.2s; }
.reveal-5 { --delay: 0.26s; }
.reveal-6 { --delay: 0.32s; }
.reveal-7 { --delay: 0.38s; }
.reveal-8 { --delay: 0.44s; }
.reveal-9 { --delay: 0.5s; }

@media (max-width: 960px) {
  .metrics-grid,
  .info-grid {
    grid-template-columns: 1fr;
  }

  .perf-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 720px) {
  .dashboard-page {
    padding: 12px;
  }

  .brand-copy h1 {
    font-size: 1rem;
  }

  .brand-copy p {
    font-size: 0.8rem;
  }

  .metric-value {
    font-size: 1.6rem;
  }

  .perf-metrics {
    grid-template-columns: 1fr;
  }

  .perf-number {
    font-size: 1.2rem;
  }

  .actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}
</style>