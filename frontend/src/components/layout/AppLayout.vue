<template>
	<div class="workbench-shell">
		<header class="titlebar">
			<div class="titlebar__identity">
				<div class="app-mark">S</div>
				<div>
					<h1>scann-search Workbench</h1>
					<p>Single-Cell ANN Analysis Console</p>
				</div>
			</div>

			<div class="titlebar__status">
				<span class="status-pill" :class="{ 'status-pill--offline': statusOffline }">
					<span class="status-dot"></span>
					{{ statusLabel }}
				</span>
				<span class="user-chip" aria-label="当前用户">
					<span class="user-chip__avatar">{{ auth.user?.username?.charAt(0)?.toUpperCase() || "?" }}</span>
					<span class="user-chip__name">{{ auth.user?.username || "guest" }}</span>
				</span>
				<button class="icon-button" type="button" title="Logout" aria-label="退出登录" @click="auth.logout()">
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
						<polyline points="16 17 21 12 16 7" />
						<line x1="21" y1="12" x2="9" y2="12" />
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

			<div class="toolbar-main">
				<slot name="toolbarControls">
					<div class="toolbar-chip">
						<span>Workspace</span>
						<strong>{{ activeTitle }}</strong>
					</div>

					<div class="toolbar-chip">
						<span>Section</span>
						<strong>{{ activeMode }}</strong>
					</div>
				</slot>
			</div>

			<div class="toolbar-spacer"></div>

			<div class="toolbar-tools" aria-label="快捷工具">
				<slot name="toolbarActions">
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
				</slot>
			</div>
		</section>

		<div class="workbench-body">
			<nav class="module-rail" aria-label="分析模块">
				<div ref="indicatorRef" class="rail-indicator"></div>
				<button
					v-for="item in visibleModules"
					:key="item.path"
					class="rail-item"
					:class="{ 'rail-item--active': item.path === activeKey }"
					type="button"
					@click="go(item.path)"
				>
					<svg class="rail-svg" viewBox="0 0 24 24" aria-hidden="true" v-html="item.svg"></svg>
					<span>{{ item.label }}</span>
				</button>
			</nav>

			<main class="workbench-content" :class="{ 'workbench-content--flush': flushContent }">
				<slot />
			</main>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, watchEffect } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import request from "@/api/request"

type ModuleItem = {
	path: string
	label: string
	title: string
	mode: string
	svg: string
	researcher?: boolean
	admin?: boolean
}

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const props = withDefaults(defineProps<{
	flushContent?: boolean
}>(), {
	flushContent: false,
})

const workspaceOnline = ref(false)
const statusLabel = computed(() => workspaceOnline.value ? "Workspace online" : "Workspace offline")
const statusOffline = computed(() => !workspaceOnline.value)

async function checkHealth() {
	try {
		await request.get("/health")
		workspaceOnline.value = true
	} catch {
		workspaceOnline.value = false
	}
}

onMounted(checkHealth)

const modules: ModuleItem[] = [
	{
		path: "/datasets", label: "Datasets", title: "Dataset Manager", mode: "Management",
		svg: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`,
	},
	{
		path: "/indexes", label: "Indexes", title: "Index Builder", mode: "Management",
		svg: `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,
	},
	{
		path: "/search", label: "Search", title: "ANN Search", mode: "Analysis",
		svg: `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
	},
	{
		path: "/search/multi", label: "Batch", title: "Batch Search", mode: "Analysis", researcher: true,
		svg: `<circle cx="5" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><line x1="9" y1="7" x2="20" y2="7"/><line x1="9" y1="17" x2="20" y2="17"/><line x1="9" y1="12" x2="20" y2="12"/>`,
	},
	{
		path: "/visualize", label: "Visualize", title: "Embedding Viewer", mode: "Analysis",
		svg: `<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="14.5" r="1.5"/><circle cx="13" cy="9" r="1.5"/><circle cx="17" cy="12.5" r="1.5"/>`,
	},
	{
		path: "/benchmark", label: "Benchmark", title: "Performance Lab", mode: "Analysis", researcher: true,
		svg: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/>`,
	},
	{
		path: "/export", label: "Export", title: "Export Center", mode: "Output", researcher: true,
		svg: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>`,
	},
	{
		path: "/admin/users", label: "Users", title: "User Console", mode: "System", admin: true,
		svg: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
	},
]

const visibleModules = computed(() =>
	modules.filter((item) => {
		if (item.admin) return auth.isAdmin
		if (item.researcher) return auth.isResearcher || auth.isAdmin
		return true
	})
)

const activeKey = computed(() => {
	const path = route.path
	if (path.startsWith("/search/multi")) return "/search/multi"
	if (path.startsWith("/search")) return "/search"
	if (path.startsWith("/visualize")) return "/visualize"
	if (path.startsWith("/datasets")) return "/datasets"
	if (path.startsWith("/indexes")) return "/indexes"
	if (path.startsWith("/benchmark")) return "/benchmark"
	if (path.startsWith("/export")) return "/export"
	if (path.startsWith("/admin")) return "/admin/users"
	return "/dashboard"
})

const activeModule = computed(() => visibleModules.value.find((item) => item.path === activeKey.value) ?? { title: "Home", mode: "Analysis", label: "Home" })
const rawActiveIndex = computed(() => visibleModules.value.findIndex((item) => item.path === activeKey.value))
const indicatorRef = ref<HTMLElement | null>(null)
let indicatorShown = false

watch(rawActiveIndex, (idx) => {
  const el = indicatorRef.value
  if (!el) return
  if (idx < 0) {
    el.style.opacity = '0'
    indicatorShown = false
    return
  }
  const y = idx * 72
  if (!indicatorShown) {
    // 首次出现：先关掉 transition、直接定位、再开 transition
    el.style.transition = 'none'
    el.style.transform = `translateY(${y}px)`
    el.style.opacity = '1'
    void el.offsetHeight        // 强制 reflow，锁住当前位置
    el.style.transition = 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)'
    indicatorShown = true
  } else {
    // 已可见：直接改 transform，transition 自动生效
    el.style.transform = `translateY(${y}px)`
  }
}, { immediate: false, flush: 'post' })

onMounted(() => {
  const idx = rawActiveIndex.value
  const el = indicatorRef.value
  if (!el || idx < 0) return
  el.style.transition = 'none'
  el.style.transform = `translateY(${idx * 72}px)`
  el.style.opacity = '1'
  void el.offsetHeight
  el.style.transition = 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)'
  indicatorShown = true
})
const activeTitle = computed(() => activeModule.value.title)
const activeMode = computed(() => activeModule.value.mode)

function go(path: string) {
	router.push(path)
}
</script>

<style scoped>
.workbench-shell {
	height: 100vh;
	display: grid;
	grid-template-rows: 42px 70px minmax(0, 1fr);
	overflow: hidden;
	background: #fbfbfd;
	color: var(--bio-text);
}

.titlebar {
	display: grid;
	grid-template-columns: minmax(260px, 1fr) auto;
	align-items: center;
	gap: 18px;
	padding: 0 18px;
	background: #f5f7fa;
	border-bottom: 1px solid #dce3ea;
}

.titlebar__identity {
	min-width: 0;
	display: flex;
	align-items: center;
	gap: 10px;
}

.app-mark {
	width: 26px;
	height: 26px;
	display: grid;
	place-items: center;
	border-radius: 7px;
	background: var(--bio-navy);
	color: #fff;
	font-weight: 800;
}

.titlebar h1 {
	margin: 0;
	color: var(--bio-navy);
	font-size: 14px;
	line-height: 1.2;
}

.titlebar p {
	margin: 1px 0 0;
	color: var(--bio-muted);
	font-size: 12px;
}

.titlebar__status {
	display: flex;
	align-items: center;
	gap: 10px;
}

.status-pill,
.user-chip {
	display: inline-flex;
	align-items: center;
	gap: 7px;
	height: 26px;
	padding: 0 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 750;
}

.status-pill {
	background: #eaf8ef;
	color: #1b7f43;
}

.status-pill--offline {
	background: #fff0ee;
	color: #c0392b;
}

.status-dot {
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: currentColor;
}

.user-chip {
	background: #eef6fc;
	color: var(--bio-navy);
}

.user-chip__avatar {
	width: 18px;
	height: 18px;
	display: inline-grid;
	place-items: center;
	border-radius: 50%;
	background: #ffffff;
	color: var(--bio-blue);
	font-size: 11px;
	font-weight: 850;
}

.toolbar {
	display: flex;
	align-items: center;
	gap: 0;
	padding: 10px 18px 10px 0;
	background: #ffffff;
	border-bottom: 1px solid var(--bio-line);
}

.toolbar-home,
.export-button,
.tool-button,
.icon-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 0;
	background: transparent;
	color: var(--bio-navy);
	cursor: pointer;
}

.icon-button {
	color: #c0392b;
	transition: color 0.18s ease, background 0.18s ease;
}

.icon-button:hover {
	color: #e74c3c;
	background: #fff0ee !important;
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
.tool-button:hover,
.icon-button:hover {
	background: #eef6fc;
}

.toolbar svg,
.titlebar svg {
	width: 20px;
	height: 20px;
	fill: none;
	stroke: currentColor;
	stroke-width: 2;
	stroke-linecap: round;
	stroke-linejoin: round;
}

.toolbar-divider {
	width: 1px;
	height: 40px;
	margin-right: 16px;
	background: var(--bio-line);
}

.toolbar-chip {
	min-width: 170px;
	display: grid;
	gap: 3px;
	margin-right: 16px;
	padding: 8px 12px;
	border-radius: 8px;
	background: var(--bio-panel-muted);
}

.toolbar-main {
	display: flex;
	align-items: center;
	gap: 0;
	min-width: 0;
}

.toolbar-chip span {
	color: #8b98a8;
	font-size: 12px;
	line-height: 1;
}

.toolbar-chip strong {
	color: var(--bio-text);
	font-size: 15px;
	line-height: 1;
}

.toolbar-spacer {
	flex: 1;
}

.toolbar-tools {
	display: flex;
	align-items: center;
	gap: 8px;
}

.tool-button,
.icon-button {
	width: 42px;
	height: 42px;
	border-radius: 8px;
}

.export-button {
	margin-left: 8px;
	background: var(--bio-panel-muted);
}

.workbench-body {
	min-height: 0;
	display: grid;
	grid-template-columns: 86px minmax(0, 1fr);
	background: #ffffff;
}

.module-rail {
	position: relative;
	min-height: 0;
	display: grid;
	align-content: start;
	overflow: visible;
	border-right: 1px solid var(--bio-line);
	background: #fbfcfd;
}

.rail-indicator {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 72px;
	background: var(--bio-ice);
	opacity: 0;
	transform: translateY(0);
	will-change: transform;
	pointer-events: none;
	z-index: 0;
}

.rail-indicator::before {
	content: '';
	position: absolute;
	left: 0;
	top: 12px;
	bottom: 12px;
	width: 3px;
	background: #007bff;
	border-radius: 0 3px 3px 0;
}

.rail-item {
	position: relative;
	z-index: 1;
	min-height: 72px;
	display: grid;
	place-items: center;
	gap: 5px;
	border: 0;
	border-bottom: 1px solid #e6edf3;
	background: transparent;
	color: #273d59;
	font-size: 12px;
	cursor: pointer;
}

.rail-item--active {
	background: transparent;
	color: var(--bio-navy);
}

.rail-svg {
	width: 22px;
	height: 22px;
	fill: none;
	stroke: currentColor;
	stroke-width: 1.8;
	stroke-linecap: round;
	stroke-linejoin: round;
}

.workbench-content {
	min-width: 0;
	min-height: 0;
	overflow-x: auto;
	overflow-y: scroll;
	padding: 18px;
	background: #f3f6f9;
}

.workbench-content--flush {
	padding: 0;
	background: #ffffff;
}

@media (max-width: 960px) {
	.workbench-shell {
		grid-template-rows: 48px auto minmax(0, 1fr);
	}

	.titlebar {
		grid-template-columns: 1fr auto;
		padding-inline: 12px;
	}

	.titlebar p,
	.status-pill,
	.user-chip__name {
		display: none;
	}

	.toolbar {
		flex-wrap: wrap;
		gap: 10px;
		padding: 10px 12px;
	}

	.toolbar-chip {
		min-width: 130px;
	}

	.workbench-body {
		grid-template-columns: 72px minmax(0, 1fr);
	}

	.workbench-content {
		padding: 12px;
	}
}
</style>
