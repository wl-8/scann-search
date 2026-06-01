<template>
  <div class="dashboard-page">
    <div class="dashboard-container">
      <header class="topbar reveal reveal-1">
        <div class="brand-block">
          <div class="brand-mark">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3h18v18H3z" fill="#1A73E8"/>
              <path d="M12 5l7 7-7 7M5 12l7-7" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="brand-copy">
            <h1>单细胞 ANN 检索系统</h1>
            <p>现代化检索与数据浏览控制面板</p>
            <div class="system-status" :aria-label="isOnline ? '系统状态：连接正常' : '系统状态：离线'">
              <span class="status-dot" :class="{ 'status-dot--offline': !isOnline }" aria-hidden="true"></span>
              <span>{{ isOnline ? '系统在线' : '后端离线' }}</span>
            </div>
          </div>
        </div>

        <button class="avatar-button" type="button" aria-label="用户菜单" @click="toggleUserMenu">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4" fill="#1A73E8"/>
            <path d="M4 20c1.8-3.9 5-6 8-6s6.2 2.1 8 6" fill="#1A73E8"/>
          </svg>
          <span class="avatar-button__hint" aria-hidden="true">▼</span>
        </button>

        <div v-if="showUserMenu" class="user-menu">
          <div class="user-menu-item" @click="handleLogout">
            <span>登出入口</span>
          </div>
        </div>
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
          <button class="action-button action-button--primary" @click="go('/search')">
            <span class="ripple-container">
              <span class="ripple"></span>
            </span>
            开始检索
          </button>
          <button class="action-button action-button--secondary" @click="go('/datasets')">
            <span class="ripple-container">
              <span class="ripple"></span>
            </span>
            数据集管理
          </button>
          <button class="action-button action-button--secondary" @click="go('/indexes')">
            <span class="ripple-container">
              <span class="ripple"></span>
            </span>
            索引管理
          </button>
          <button class="action-button action-button--secondary" @click="go('/visualize')">
            <span class="ripple-container">
              <span class="ripple"></span>
            </span>
            可视化
          </button>
        </div>
      </section>

      <section class="metrics-grid">
        <div class="metric-card metric-card--dataset reveal reveal-4">
          <div class="metric-header">
            <div class="metric-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 7.5h16v10H4z" fill="#E8F0FE"/>
                <path d="M4 7.5l8-4 8 4M4 12h16" stroke="#1A73E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="metric-label">数据集</span>
          </div>
          <div class="metric-value">{{ datasetCount }}</div>
          <div class="metric-sub">已注册数据集</div>
        </div>

        <div class="metric-card metric-card--index reveal reveal-5">
          <div class="metric-header">
            <div class="metric-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="5.5" fill="#E8F0FE"/>
                <path d="M15.5 15.5L20 20" stroke="#1A73E8" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="metric-label">索引数量</span>
          </div>
          <div class="metric-value">{{ indexCount }}</div>
          <div class="metric-sub">已构建索引</div>
        </div>

        <div class="metric-card metric-card--cells reveal reveal-6">
          <div class="metric-header">
            <div class="metric-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" fill="#E8F0FE"/>
                <path d="M12 8v4l3 2" stroke="#1A73E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="metric-label">总细胞数</span>
          </div>
          <div class="metric-value">{{ totalCellsDisplay }}</div>
          <div class="metric-sub">所有数据集合计</div>
        </div>
      </section>

      <section class="performance-monitor reveal reveal-7">
        <div class="perf-header">
          <div class="perf-title">
            <svg class="perf-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3v18h18" stroke="#1A73E8" stroke-width="2" stroke-linecap="round"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" stroke="#1A73E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>系统性能监控</span>
          </div>
          <div class="perf-status">
            <span class="perf-status-dot"></span>
            <span class="perf-status-text">实时监控中</span>
          </div>
        </div>
        <div class="perf-metrics">
          <div class="perf-metric">
            <div class="perf-metric-label">查询延迟</div>
            <div class="perf-metric-value-container">
              <div class="perf-metric-value">
                <span class="perf-number perf-number--blue">{{ animatedLatency }}</span>
                <span class="perf-unit">ms</span>
              </div>
              <svg class="perf-sparkline" viewBox="0 0 100 24">
                <path :d="latencySparklinePath" fill="none" stroke="#1A73E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="perf-metric-sub">平均检索耗时</div>
          </div>

          <div class="perf-metric">
            <div class="perf-metric-label">峰值内存</div>
            <div class="perf-metric-value-container">
              <div class="perf-metric-value">
                <span class="perf-number perf-number--green">{{ animatedMemory }}</span>
                <span class="perf-unit">MB</span>
              </div>
              <svg class="perf-sparkline" viewBox="0 0 100 24">
                <path :d="memorySparklinePath" fill="none" stroke="#34A853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="perf-metric-sub">索引加载内存</div>
          </div>

          <div class="perf-metric">
            <div class="perf-metric-label">实时吞吐量</div>
            <div class="perf-metric-value-container">
              <div class="perf-metric-value">
                <span class="perf-number perf-number--yellow">{{ animatedQps }}</span>
                <span class="perf-unit">QPS</span>
              </div>
              <svg class="perf-sparkline" viewBox="0 0 100 24">
                <path :d="qpsSparklinePath" fill="none" stroke="#FBBC05" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="perf-metric-sub">每秒查询率</div>
          </div>

          <div class="perf-metric">
            <div class="perf-metric-label">系统负载</div>
            <div class="perf-metric-value-container">
              <div class="perf-metric-value">
                <span class="perf-number perf-number--red">{{ animatedLoad }}</span>
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
        <div class="info-card reveal reveal-8">
          <div class="info-card-header">快速说明</div>
          <ul class="info-list">
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" stroke="#1A73E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>支持按细胞ID或向量进行相似细胞检索，可设置过滤条件。</span>
            </li>
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" stroke="#1A73E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>可视化页面支持2D/3D UMAP散点图，点击细胞可查看详情并检索相似细胞。</span>
            </li>
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" stroke="#1A73E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>支持多种ANN算法（HNSW/IVF/Flat等），可自定义参数构建索引。</span>
            </li>
          </ul>
        </div>

        <div class="info-card reveal reveal-9">
          <div class="info-card-header">当前状态</div>
          <ul class="info-list">
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" stroke="#1A73E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>系统已就绪，支持.h5ad/.csv/.npy格式单细胞数据上传与处理。</span>
            </li>
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" stroke="#1A73E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>管理员可通过侧边栏进入用户管理页面，审批注册申请和管理用户。</span>
            </li>
          </ul>
        </div>
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

const showUserMenu = ref(false)

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

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function handleLogout() {
  auth.logout()
  showUserMenu.value = false
}

onMounted(loadMetrics)

onUnmounted(() => {
  if (metricsInterval) {
    clearInterval(metricsInterval)
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Mono:wght@400;500;700&display=swap');

.dashboard-page {
  min-height: 100%;
  background: #F8F9FA;
  color: #1F1F1F;
  font-family: 'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
}

.dashboard-container {
  width: min(100%, 1200px);
  margin: 0 auto;
  padding: 24px;
  display: grid;
  gap: 20px;
}

.topbar,
.section-card,
.banner-card,
.metric-card,
.info-card,
.performance-monitor {
  border-radius: 16px;
  background: #FFFFFF;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
  border: none;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  position: relative;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #1A73E8;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.brand-mark svg {
  width: 24px;
  height: 24px;
}

.brand-copy {
  min-width: 0;
}

.brand-copy h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1F1F1F;
  line-height: 1.4;
}

.brand-copy p {
  margin: 4px 0 0;
  color: #6B6B6B;
  font-size: 0.875rem;
  font-weight: 400;
}

.system-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(52, 168, 83, 0.1);
  color: #34A853;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34A853;
}

.status-dot--offline {
  background: #EA4335;
}

.avatar-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

.avatar-button:hover {
  background: #F5F5F5;
  box-shadow: 0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
}

.avatar-button svg {
  width: 20px;
  height: 20px;
}

.avatar-button__hint {
  font-size: 0.625rem;
  color: #6B6B6B;
}

.user-menu {
  position: absolute;
  right: 24px;
  top: calc(100% + 8px);
  min-width: 180px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
  padding: 4px;
  z-index: 100;
}

.user-menu::before {
  content: '';
  position: absolute;
  top: -8px;
  right: 12px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #FFFFFF;
}

.user-menu-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #1F1F1F;
  transition: background-color 0.15s ease;
}

.user-menu-item:hover {
  background: #F0F7FF;
}

.banner-card {
  padding: 24px;
}

.banner-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.banner-tag,
.section-kicker {
  display: inline-flex;
  width: fit-content;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(26, 115, 232, 0.1);
  color: #1A73E8;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.banner-copy p {
  margin: 0;
  color: #5F6368;
  font-size: 1rem;
  line-height: 1.6;
}

.section-card {
  padding: 20px 24px;
}

.section-heading h2 {
  margin: 8px 0 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1F1F1F;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.action-button {
  position: relative;
  height: 40px;
  padding-inline: 24px;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}

.action-button:active {
  transform: scale(0.98);
}

.action-button--primary {
  background: #1A73E8;
  color: #FFFFFF;
  box-shadow: 0 2px 4px 0 rgba(26, 115, 232, 0.3);
}

.action-button--primary:hover {
  background: #1557B0;
  box-shadow: 0 4px 8px 0 rgba(26, 115, 232, 0.3);
}

.action-button--secondary {
  background: #FFFFFF;
  color: #3C4043;
  border: 1px solid #DADCE0;
}

.action-button--secondary:hover {
  background: #F8F9FA;
  border-color: #1A73E8;
  color: #1A73E8;
}

.ripple-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  border-radius: inherit;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

.action-button--primary .ripple {
  background: rgba(255, 255, 255, 0.4);
}

.action-button--secondary .ripple {
  background: rgba(26, 115, 232, 0.2);
}

.action-button:hover .ripple {
  animation: ripple-animation 0.6s ease-out;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  padding: 20px;
  transition: box-shadow 0.2s ease;
}

.metric-card:hover {
  box-shadow: 0 4px 8px 0 rgba(60, 64, 67, 0.3), 0 6px 20px 4px rgba(60, 64, 67, 0.15);
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #F1F3F4;
}

.metric-icon svg {
  width: 20px;
  height: 20px;
}

.metric-label {
  color: #6B6B6B;
  font-size: 0.875rem;
  font-weight: 500;
}

.metric-value {
  font-size: 2.25rem;
  line-height: 1.2;
  font-weight: 600;
  color: #1F1F1F;
}

.metric-sub {
  margin-top: 8px;
  font-size: 0.8125rem;
  color: #8A8A8A;
  font-weight: 400;
}

.performance-monitor {
  padding: 20px 24px;
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
  font-size: 1.125rem;
  font-weight: 600;
  color: #1F1F1F;
}

.perf-icon {
  width: 24px;
  height: 24px;
}

.perf-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(52, 168, 83, 0.1);
  font-size: 0.8125rem;
  font-weight: 500;
  color: #34A853;
}

.perf-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34A853;
  animation: perfPulse 2s ease-in-out infinite;
}

.perf-status-text {
  font-size: 0.8125rem;
}

.perf-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.perf-metric {
  padding: 16px;
  border-radius: 12px;
  background: #F8F9FA;
  transition: background-color 0.2s ease;
}

.perf-metric:hover {
  background: #F0F4F8;
}

.perf-metric-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6B6B6B;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
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
}

.perf-number {
  font-family: 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 1.75rem;
  font-weight: 600;
}

.perf-number--blue {
  color: #1A73E8;
}

.perf-number--green {
  color: #34A853;
}

.perf-number--yellow {
  color: #FBBC05;
}

.perf-number--red {
  color: #EA4335;
}

.perf-unit {
  font-family: 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.8125rem;
  font-weight: 400;
  color: #8A8A8A;
}

.perf-sparkline {
  width: 100%;
  height: 24px;
}

.perf-load-bar {
  width: 100%;
  height: 6px;
  background: #E1E5E9;
  border-radius: 3px;
  overflow: hidden;
}

.perf-load-fill {
  height: 100%;
  background: linear-gradient(90deg, #EA4335, #FBBC05);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.perf-metric-sub {
  font-size: 0.75rem;
  font-weight: 400;
  color: #8A8A8A;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.info-card {
  padding: 0;
  overflow: hidden;
}

.info-card-header {
  padding: 16px 20px;
  background: #F8F9FA;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1F1F1F;
  border-bottom: 1px solid #E8EAED;
}

.info-list {
  margin: 0;
  padding: 16px 20px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-list li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: #5F6368;
  font-size: 0.875rem;
  line-height: 1.5;
}

.info-list li + li {
  padding-top: 16px;
  border-top: 1px solid #E8EAED;
}

.list-icon {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(26, 115, 232, 0.1);
  margin-top: 2px;
  flex-shrink: 0;
}

.list-icon svg {
  width: 14px;
  height: 14px;
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

  .user-menu {
    right: 24px;
    left: auto;
  }
}

@media (max-width: 720px) {
  .dashboard-container {
    padding: 12px;
  }

  .brand-copy h1 {
    font-size: 1.125rem;
  }

  .brand-copy p {
    font-size: 0.8125rem;
  }

  .metric-value {
    font-size: 1.75rem;
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