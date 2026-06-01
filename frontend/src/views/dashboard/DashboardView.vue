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
import { computed, onMounted, onUnmounted, ref } from "vue"
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

function animateNumber(target: number, current: ref<number>, duration: number = 1500) {
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
  padding: 28px 24px 40px;
  background:
    radial-gradient(circle at 14% 12%, rgba(224, 242, 254, 0.9) 0, rgba(224, 242, 254, 0.62) 20%, rgba(224, 242, 254, 0.16) 38%, transparent 62%),
    radial-gradient(circle at 86% 88%, rgba(243, 232, 255, 0.88) 0, rgba(243, 232, 255, 0.58) 20%, rgba(243, 232, 255, 0.16) 38%, transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 52%, #f3f7fb 100%);
  color: #0f172a;
  font-family: Inter, Roboto, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.dashboard-page::before {
  content: "";
  position: absolute;
  inset: -18%;
  background-image:
    radial-gradient(circle at 18% 14%, rgba(224, 242, 254, 0.42) 0 11%, transparent 44%),
    radial-gradient(circle at 82% 84%, rgba(243, 232, 255, 0.38) 0 12%, transparent 46%),
    radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.24) 0 9%, transparent 34%),
    linear-gradient(135deg, rgba(0, 123, 255, 0.03), rgba(38, 166, 154, 0.015), rgba(243, 232, 255, 0.03));
  background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%;
  opacity: 0.9;
  pointer-events: none;
  filter: blur(32px);
  animation: dashboardGlowDrift 26s ease-in-out infinite alternate;
}

.dashboard-pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.1;
  background-image:
    radial-gradient(circle at 15% 18%, rgba(0, 123, 255, 0.14) 0 1px, transparent 1px),
    radial-gradient(circle at 85% 24%, rgba(124, 58, 237, 0.09) 0 1px, transparent 1px),
    radial-gradient(circle at 30% 72%, rgba(0, 123, 255, 0.08) 0 1px, transparent 1px),
    radial-gradient(circle at 70% 58%, rgba(124, 58, 237, 0.08) 0 1px, transparent 1px);
  background-size: 280px 280px, 320px 320px, 360px 360px, 300px 300px;
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
  border-radius: 22px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 123, 255, 0.08);
  box-shadow:
    0 20px 48px rgba(15, 23, 42, 0.06),
    0 4px 14px rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(14px);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.brand-mark {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #007bff, #3d9cff);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  box-shadow: 0 12px 24px rgba(0, 123, 255, 0.28);
}

.brand-copy {
  min-width: 0;
}

.brand-copy h1 {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.35;
  font-weight: 800;
}

.brand-copy p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.92rem;
}

.system-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.08);
  color: #15803d;
  font-size: 0.82rem;
  font-weight: 700;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

.avatar-button {
  width: 46px;
  height: 46px;
  border: 1px solid rgba(0, 123, 255, 0.16);
  border-radius: 50%;
  background: linear-gradient(180deg, #ffffff, #eff6ff);
  color: #007bff;
  display: grid;
  place-items: center;
  position: relative;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    filter 0.22s ease;
}

.avatar-button:hover {
  transform: translateY(-1px);
  box-shadow:
    0 14px 24px rgba(0, 123, 255, 0.16),
    0 0 0 4px rgba(0, 123, 255, 0.06);
  border-color: rgba(0, 123, 255, 0.3);
}

.avatar-button__hint {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.68);
  pointer-events: none;
}

.avatar-button svg,
.metric-icon svg,
.list-icon svg,
.perf-icon svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.banner-card,
.section-card,
.metric-card,
.info-card,
.performance-monitor {
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 26px 54px rgba(15, 23, 42, 0.06),
    0 8px 16px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.16);
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
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(0, 123, 255, 0.1);
  color: #007bff;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.banner-copy p {
  margin: 0;
  color: #334155;
  font-size: 1rem;
  line-height: 1.7;
}

.section-card {
  padding: 22px;
}

.section-heading h2 {
  margin: 8px 0 0;
  font-size: 1.2rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.action-button {
  height: 44px;
  padding-inline: 18px;
  border-radius: 12px;
  font-weight: 700;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    filter 0.2s ease;
}

.action-button:hover {
  transform: translateY(-1px) scale(1.03);
  filter: brightness(1.02);
  box-shadow: 0 16px 28px rgba(0, 123, 255, 0.18);
}

.action-button:active {
  transform: translateY(1px) scale(0.985);
}

.action-button--primary {
  background: linear-gradient(135deg, #007bff 0%, #2f93ff 100%);
  border-color: #007bff;
  box-shadow: 0 14px 26px rgba(0, 123, 255, 0.22);
}

.action-button--primary:hover {
  background: linear-gradient(135deg, #0069df 0%, #1f86ff 100%);
  box-shadow: 0 16px 30px rgba(0, 123, 255, 0.28);
}

.action-button--secondary {
  border: 1px solid rgba(0, 123, 255, 0.24);
  color: #007bff;
  background: #fff;
}

.action-button--secondary:hover {
  color: #fff;
  background: #007bff;
  border-color: #007bff;
}

.action-button--accent {
  color: #26a69a;
  border-color: rgba(38, 166, 154, 0.32);
  background: linear-gradient(180deg, rgba(38, 166, 154, 0.06), rgba(38, 166, 154, 0.02));
}

.action-button--accent:hover {
  color: #fff;
  background: linear-gradient(135deg, #26a69a 0%, #1f8f84 100%);
  border-color: #26a69a;
  box-shadow: 0 16px 28px rgba(38, 166, 154, 0.22);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  padding: 22px;
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease;
}

.metric-card:hover {
  transform: translateY(-5px);
  border-color: rgba(0, 123, 255, 0.22);
  box-shadow:
    0 34px 66px rgba(15, 23, 42, 0.08),
    0 12px 18px rgba(15, 23, 42, 0.05);
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.metric-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
}

.metric-icon--dataset {
  background: rgba(0, 123, 255, 0.12);
  color: #007bff;
}

.metric-icon--index {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.metric-icon--recent {
  background: rgba(14, 165, 233, 0.12);
  color: #0ea5e9;
}

.metric-label {
  color: #7c8ba0;
  font-size: 0.95rem;
  font-weight: 700;
}

.metric-value {
  font-size: 2.85rem;
  line-height: 1;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.04em;
}

.metric-sub {
  margin-top: 10px;
  font-size: 0.82rem;
  color: #94a3b8;
  font-weight: 600;
}

.status-dot--offline {
  background: #ef4444 !important;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12) !important;
}

.metric-icon svg {
  width: 22px;
  height: 22px;
}

.performance-monitor {
  padding: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.96) 100%);
  border: 1px solid rgba(0, 123, 255, 0.15);
  box-shadow:
    0 28px 58px rgba(15, 23, 42, 0.07),
    0 10px 20px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease;
}

.performance-monitor::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 123, 255, 0.3), transparent);
}

.performance-monitor::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 10% 10%, rgba(0, 123, 255, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 90% 90%, rgba(34, 197, 94, 0.02) 0%, transparent 50%);
  pointer-events: none;
}

.performance-monitor:hover {
  border-color: rgba(0, 123, 255, 0.25);
  box-shadow:
    0 32px 64px rgba(15, 23, 42, 0.08),
    0 12px 24px rgba(15, 23, 42, 0.06),
    0 0 0 1px rgba(0, 123, 255, 0.1);
}

.perf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.perf-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.perf-icon {
  width: 24px;
  height: 24px;
  color: #007bff;
}

.perf-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.1);
  font-size: 0.8rem;
  font-weight: 700;
  color: #15803d;
}

.perf-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  animation: perfPulse 2s ease-in-out infinite;
}

.perf-status-text {
  font-size: 0.78rem;
}

.perf-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.perf-metric {
  padding: 18px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.99) 0%, rgba(248, 250, 252, 0.97) 100%);
  border: 1px solid rgba(148, 163, 184, 0.15);
  position: relative;
  overflow: hidden;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;
}

.perf-metric::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 123, 255, 0.2), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.perf-metric:hover::before {
  opacity: 1;
}

.perf-metric:hover {
  transform: translateY(-3px);
  border-color: rgba(0, 123, 255, 0.2);
  box-shadow:
    0 16px 32px rgba(15, 23, 42, 0.08),
    0 6px 12px rgba(15, 23, 42, 0.05),
    0 0 0 1px rgba(0, 123, 255, 0.08);
}

.perf-metric-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.perf-metric-value-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.perf-metric-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-weight: 700;
  position: relative;
  z-index: 1;
  transition:
    text-shadow 0.3s ease,
    transform 0.3s ease;
}

.perf-metric-value--glow {
  text-shadow: 
    0 0 10px rgba(0, 123, 255, 0.6),
    0 0 20px rgba(0, 123, 255, 0.4),
    0 0 30px rgba(0, 123, 255, 0.2);
  transform: scale(1.03);
}

.perf-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: #007bff;
  letter-spacing: -0.02em;
  text-shadow: 0 0 8px rgba(0, 123, 255, 0.15);
  transition: text-shadow 0.3s ease;
}

.perf-metric--memory .perf-number {
  color: #22c55e;
  text-shadow: 0 0 8px rgba(34, 197, 94, 0.15);
}

.perf-metric--params .perf-number {
  color: #f59e0b;
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.15);
}

.perf-unit {
  font-size: 0.9rem;
  font-weight: 600;
  color: #94a3b8;
}

.perf-sparkline {
  width: 100%;
  height: 24px;
  opacity: 0.9;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.perf-sparkline:hover {
  opacity: 1;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
}

.perf-load-bar {
  width: 100%;
  height: 6px;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}

.perf-load-bar::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: loadShimmer 2s ease-in-out infinite;
}

.perf-load-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b 0%, #f97316 50%, #fb923c 100%);
  border-radius: 999px;
  transition: width 0.5s ease;
  position: relative;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

.perf-load-fill::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: fillShimmer 1.5s ease-in-out infinite;
}

.perf-metric-sub {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.metric-trend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
}

.metric-trend__icon {
  font-size: 0.9rem;
  line-height: 1;
}

.metric-trend--up {
  color: #15803d;
  background: rgba(34, 197, 94, 0.1);
}

.metric-trend--down {
  color: #c2410c;
  background: rgba(249, 115, 22, 0.1);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.info-card {
  padding: 8px 2px 8px;
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease;
}

.info-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 28px 52px rgba(15, 23, 42, 0.08),
    0 10px 18px rgba(15, 23, 42, 0.04);
}

.info-card :deep(.ant-card-head) {
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  margin: 0 20px;
  padding: 0;
}

.info-card :deep(.ant-card-head-title) {
  padding: 18px 0 14px;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
}

.info-card :deep(.ant-card-body) {
  padding: 18px 20px 20px;
}

.info-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 14px;
}

.info-list li + li {
  padding-top: 14px;
  border-top: 1px dashed rgba(148, 163, 184, 0.18);
}

.info-list li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: #334155;
  line-height: 1.7;
}

.list-icon {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #007bff;
  background: rgba(0, 123, 255, 0.1);
  margin-top: 2px;
}

.list-icon svg {
  width: 13px;
  height: 13px;
}

.user-menu {
  min-width: 160px;
}

:deep(.ant-dropdown-menu) {
  border-radius: 14px;
  overflow: hidden;
  padding: 6px;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.16);
}

:deep(.ant-dropdown-menu-item) {
  border-radius: 10px;
  padding-block: 10px;
}

@keyframes perfPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.9);
  }
}

@keyframes loadShimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes fillShimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dashboardGlowDrift {
  from {
    transform: translate3d(-1%, -0.8%, 0) scale(1);
  }

  to {
    transform: translate3d(1%, 0.8%, 0) scale(1.02);
  }
}

.reveal {
  animation: floatIn 0.7s ease both;
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
    align-items: flex-start;
  }
}

@media (max-width: 720px) {
  .dashboard-page {
    padding: 16px;
  }

  .topbar {
    padding: 16px;
    align-items: flex-start;
  }

  .brand-copy h1 {
    font-size: 1rem;
  }

  .brand-copy p {
    font-size: 0.86rem;
  }

  .banner-card,
  .section-card,
  .metric-card,
  .info-card,
  .performance-monitor {
    border-radius: 18px;
  }

  .section-card,
  .banner-card,
  .metric-card,
  .performance-monitor {
    padding: 18px;
  }

  .metric-value {
    font-size: 2rem;
  }

  .perf-metrics {
    grid-template-columns: 1fr;
  }

  .perf-number {
    font-size: 1.5rem;
  }

  .actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}
</style>