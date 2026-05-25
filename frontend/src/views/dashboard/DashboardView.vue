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
            <div class="system-status" aria-label="系统状态：连接正常">
              <span class="status-dot" aria-hidden="true"></span>
              <span>系统在线（连接正常）</span>
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
          <div class="metric-value">3</div>
          <div class="metric-trend metric-trend--up">
            <span class="metric-trend__icon" aria-hidden="true">↗</span>
            <span>+20% 较上周</span>
          </div>
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
          <div class="metric-value">5</div>
          <div class="metric-trend metric-trend--up">
            <span class="metric-trend__icon" aria-hidden="true">↗</span>
            <span>+12% 较上周</span>
          </div>
        </a-card>

        <a-card class="metric-card metric-card--3 reveal reveal-6" :bordered="false">
          <div class="metric-header">
            <div class="metric-icon metric-icon--recent" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8"></circle>
                <path d="M12 8v4l3 2"></path>
              </svg>
            </div>
            <span class="metric-label">最近检索</span>
          </div>
          <div class="metric-value">18</div>
          <div class="metric-trend metric-trend--down">
            <span class="metric-trend__icon" aria-hidden="true">↘</span>
            <span>-3% 较上周</span>
          </div>
        </a-card>
      </section>

      <section class="info-grid">
        <a-card class="info-card reveal reveal-7" :bordered="false" title="快速说明">
          <ul class="info-list">
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </span>
              <span>登录后可进入 `/dashboard`。</span>
            </li>
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </span>
              <span>搜索页支持普通检索、条件检索、多数据集检索与数据浏览。</span>
            </li>
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </span>
              <span>展开结果行可查看 metadata 与 gene_expr 详情。</span>
            </li>
          </ul>
        </a-card>

        <a-card class="info-card reveal reveal-8" :bordered="false" title="当前状态">
          <ul class="info-list">
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </span>
              <span>当前前端已支持 mock 数据联调，后端未准备好时仍可演示完整流程。</span>
            </li>
            <li>
              <span class="list-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </span>
              <span>若要退出，可使用页面中的登出入口（后续可加到顶部导航）。</span>
            </li>
          </ul>
        </a-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/auth"
import { useRouter } from "vue-router"

const router = useRouter()
const auth = useAuthStore()

function go(path: string) {
  router.push(path)
}

function onMenuClick({ key }: { key: string }) {
  if (key === "logout") {
    auth.logout()
  }
}
</script>

<style scoped>
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
.info-card {
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
.list-icon svg {
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
.info-card {
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

.metric-icon svg {
  width: 22px;
  height: 22px;
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

@media (max-width: 960px) {
  .metrics-grid,
  .info-grid {
    grid-template-columns: 1fr;
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
  .info-card {
    border-radius: 18px;
  }

  .section-card,
  .banner-card,
  .metric-card {
    padding: 18px;
  }

  .metric-value {
    font-size: 2rem;
  }

  .actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
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
</style>
