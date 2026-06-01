<template>
	<div class="workbench-shell">
		<header class="titlebar">
			<div class="titlebar__identity">
				<div class="app-mark">S</div>
				<div>
					<h1>scann-search Workbench</h1>
					<p>Single-cell ANN analysis console</p>
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

			<div class="toolbar-main">
				<slot name="toolbarControls">
					<div class="toolbar-chip">
						<span>Workspace</span>
						<strong>{{ activeTitle }}</strong>
					</div>

					<div class="toolbar-chip">
						<span>Analysis mode</span>
						<strong>{{ activeMode }}</strong>
					</div>
				</slot>
			</div>

			<div class="toolbar-spacer"></div>

			<div class="toolbar-tools" aria-label="快捷工具">
				<slot name="toolbarActions">
					<button class="tool-button" type="button" title="ANN Search" @click="go('/search')">
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<circle cx="10.5" cy="10.5" r="5.5" />
							<path d="M15 15l5 5" />
						</svg>
					</button>
					<button class="tool-button" type="button" title="Visualization" @click="go('/visualize')">
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M4 19V5M4 19h16" />
							<path d="M8 16v-5M12 16V8M16 16v-7" />
						</svg>
					</button>
					<button class="export-button" type="button" @click="go('/export')">
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M12 3v12" />
							<path d="m7 10 5 5 5-5" />
							<path d="M4 20h16" />
						</svg>
						Export
					</button>
				</slot>
			</div>
		</section>

		<div class="workbench-body">
			<nav class="module-rail" aria-label="分析模块">
				<button
					v-for="item in visibleModules"
					:key="item.path"
					class="rail-item"
					:class="{ 'rail-item--active': item.path === activeKey }"
					type="button"
					@click="go(item.path)"
				>
					<span class="rail-icon" :class="`rail-icon--${item.icon}`" aria-hidden="true"></span>
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
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"

type ModuleItem = {
	path: string
	label: string
	title: string
	mode: string
	icon: string
	researcher?: boolean
	admin?: boolean
}

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

withDefaults(defineProps<{
	statusLabel?: string
	statusOffline?: boolean
	flushContent?: boolean
}>(), {
	statusLabel: "Workspace ready",
	statusOffline: false,
	flushContent: false,
})

const modules: ModuleItem[] = [
	{ path: "/dashboard", label: "Clusters", title: "Spatial Projection", mode: "Workbench", icon: "clusters" },
	{ path: "/search", label: "Search", title: "ANN Search", mode: "Query", icon: "search" },
	{ path: "/search/multi", label: "Batch", title: "Batch Search", mode: "Strategy", icon: "multi" },
	{ path: "/visualize", label: "Features", title: "UMAP Viewer", mode: "Projection", icon: "features" },
	{ path: "/datasets", label: "Datasets", title: "Dataset Manager", mode: "Data", icon: "datasets" },
	{ path: "/indexes", label: "Indexes", title: "Index Builder", mode: "ANN", icon: "index" },
	{ path: "/benchmark", label: "Benchmark", title: "Performance Lab", mode: "Evaluation", icon: "benchmark", researcher: true },
	{ path: "/export", label: "Export", title: "Export Center", mode: "CSV", icon: "export", researcher: true },
	{ path: "/admin/users", label: "Users", title: "User Console", mode: "Admin", icon: "users", admin: true },
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

const activeModule = computed(() => visibleModules.value.find((item) => item.path === activeKey.value) ?? modules[0])
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
	box-shadow: inset 0 4px 0 #1b6f86;
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
	background: #fff4e5;
	color: #9a5a00;
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
	min-height: 0;
	display: grid;
	align-content: start;
	overflow-y: auto;
	border-right: 1px solid var(--bio-line);
	background: #fbfcfd;
}

.rail-item {
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
	background: var(--bio-ice);
	color: var(--bio-navy);
}

.rail-icon {
	position: relative;
	width: 28px;
	height: 28px;
}

.rail-icon::before,
.rail-icon::after {
	content: "";
	position: absolute;
	inset: 6px;
	border: 2px solid var(--bio-navy);
	border-radius: 50%;
}

.rail-icon--clusters::after {
	inset: 2px 16px 16px 2px;
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
	background: var(--bio-navy);
	transform: rotate(45deg);
}

.rail-icon--multi::before {
	inset: 4px 14px 12px 4px;
}

.rail-icon--multi::after {
	inset: 12px 4px 4px 14px;
}

.rail-icon--features::before {
	border-radius: 2px;
	transform: rotate(45deg);
}

.rail-icon--datasets::before {
	border-radius: 4px;
}

.rail-icon--datasets::after {
	inset: 10px 5px;
	border: 0;
	border-top: 2px solid var(--bio-navy);
	border-bottom: 2px solid var(--bio-navy);
}

.rail-icon--index::before {
	inset: 5px;
	border-radius: 5px;
}

.rail-icon--index::after {
	inset: 12px 6px;
	border: 0;
	border-top: 2px solid var(--bio-navy);
}

.rail-icon--benchmark::before {
	inset: 5px 18px 5px 5px;
	border-radius: 2px;
}

.rail-icon--benchmark::after {
	inset: 9px 5px 5px 15px;
	border-radius: 2px;
}

.rail-icon--export::before {
	inset: 15px 4px 5px;
	border-radius: 0;
	border-width: 0 0 2px;
}

.rail-icon--export::after {
	inset: 4px 9px 8px;
	border: 0;
	border-left: 2px solid var(--bio-navy);
	border-bottom: 2px solid var(--bio-navy);
	transform: rotate(-45deg);
}

.rail-icon--users::before {
	inset: 4px 13px 12px 5px;
}

.rail-icon--users::after {
	inset: 11px 5px 4px 13px;
}

.workbench-content {
	min-width: 0;
	min-height: 0;
	overflow: auto;
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
