<template>
	<a-layout class="app-layout">
		<a-layout-sider breakpoint="lg" collapsible v-model:collapsed="collapsed" class="sider">
			<div class="sider-top">
				<div class="brand">
					<span class="brand__mark" aria-hidden="true">S</span>
					<span class="brand__text"><span class="brand__accent">scann</span><span class="brand__muted">-search</span></span>
				</div>
			</div>
			<div class="sider-body">
				<a-menu theme="dark" mode="inline" :selectedKeys="[activeKey]" @click="onMenuClick">
					<a-menu-item v-for="item in visibleNavItems" :key="item.key">
						<span class="nav-item">
							<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
								<path v-for="path in item.paths" :key="path" :d="path" />
							</svg>
							<span class="nav-label">{{ item.label }}</span>
						</span>
					</a-menu-item>
				</a-menu>
			</div>
			<div class="sider-foot">
				<div class="runtime-card">
					<span class="runtime-card__dot" aria-hidden="true"></span>
					<div>
						<div class="runtime-card__label">Local runtime</div>
						<div class="runtime-card__value">127.0.0.1:5173</div>
					</div>
				</div>
			</div>
		</a-layout-sider>
		<a-layout class="main-layout">
			<a-layout-header class="header">
				<div class="title">
					<span class="title__accent">单细胞 ANN</span>
					<span class="title__muted">检索系统</span>
				</div>
				<div class="header-actions">
					<div class="header-status">
						<span class="header-status__dot" aria-hidden="true"></span>
						<span>工作台在线</span>
					</div>
					<div class="user-chip" aria-label="当前用户">
						<span class="user-chip__avatar">{{ auth.user?.username || '22' }}</span>
						<span class="user-chip__name">{{ auth.user?.username || 'guest' }}</span>
					</div>
					<a-button class="logout-button" type="text" @click="auth.logout()">
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M10 17l1.4-1.4L8.8 13H20v-2H8.8l2.6-2.6L10 7l-5 5 5 5Z" />
							<path d="M4 5h6V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h6v-2H4V5Z" />
						</svg>
						<span>退出</span>
					</a-button>
				</div>
			</a-layout-header>
			<a-layout-content class="content">
				<slot />
			</a-layout-content>
		</a-layout>
	</a-layout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const collapsed = ref(false)
const navItems = [
	{ key: "/dashboard", label: "仪表盘", paths: ["M4 13h7V4H4v9Z", "M13 20h7V4h-7v16Z", "M4 20h7v-5H4v5Z"] },
	{ key: "/search", label: "检索", paths: ["M11 4a7 7 0 1 0 4.95 11.95L20 20", "M8 11h6", "M11 8v6"] },
	{ key: "/search/multi", label: "联合检索", paths: ["M5 7h6", "M5 12h10", "M5 17h14", "M15 7h4"] },
	{ key: "/search/combined", label: "联合索引", paths: ["M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z", "M4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7", "M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5", "M8 9h8"] },
	{ key: "/visualize", label: "可视化", paths: ["M4 18h16", "M7 15V8", "M12 15V5", "M17 15v-9", "M6 18l4-5 4 2 4-7"] },
	{ key: "/datasets", label: "数据集", paths: ["M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z", "M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7", "M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"] },
	{ key: "/benchmark", label: "性能评测", paths: ["M5 19V5", "M5 19h15", "M8 16l3-4 3 2 4-7"] },
	{ key: "/rag", label: "RAG 问答", paths: ["M5 5h14v10H8l-3 3V5Z", "M9 9h6", "M9 12h4", "M17 18l2 2", "M14 18a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z"] },
	{ key: "/export", label: "导出", paths: ["M12 4v10", "M8 10l4 4 4-4", "M5 20h14"] },
	{ key: "/admin/users", label: "用户管理", adminOnly: true, paths: ["M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M2 21c.7-4 3.4-6 7-6s6.3 2 7 6", "M17 8h5", "M19.5 5.5v5"] },
]

const visibleNavItems = computed(() => navItems.filter((item) => !item.adminOnly || auth.isAdmin))

const activeKey = computed(() => {
	const path = route.path
	if (path.startsWith("/search/multi")) return "/search/multi"
	if (path.startsWith("/search/combined")) return "/search/combined"
	if (path.startsWith("/search")) return "/search"
	if (path.startsWith("/visualize")) return "/visualize"
	if (path.startsWith("/datasets")) return "/datasets"
	if (path.startsWith("/benchmark")) return "/benchmark"
	if (path.startsWith("/rag")) return "/rag"
	if (path.startsWith("/export")) return "/export"
	if (path.startsWith("/admin/users")) return "/admin/users"
	return "/dashboard"
})

function onMenuClick({ key }: { key: string }) {
	router.push(key)
}
</script>

<style scoped>
.app-layout {
	display: flex;
	height: 100vh;
	overflow: hidden;
	background: #f3f6fa;
}
.sider {
	position: relative;
	z-index: 5;
	flex: 0 0 auto;
	height: 100vh;
	overflow-y: auto;
	background: linear-gradient(180deg, #07111f 0%, #0d1727 58%, #101927 100%);
	border-right: 1px solid rgba(148, 163, 184, 0.16);
	box-shadow: 12px 0 34px rgba(15, 23, 42, 0.12);
}
.sider :deep(.ant-layout-sider-children) {
	display: flex;
	flex-direction: column;
	height: 100%;
}
.sider-top {
	flex: 0 0 auto;
	padding: 16px 14px 14px;
	background: rgba(255, 255, 255, 0.015);
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.sider-body {
	flex: 1;
	min-height: 0;
	padding-top: 8px;
}
.brand {
	display: flex;
	align-items: center;
	gap: 10px;
	color: #fff;
	font-weight: 800;
	font-size: 18px;
	letter-spacing: 0.02em;
}
.brand__mark {
	width: 34px;
	height: 34px;
	display: inline-grid;
	place-items: center;
	border-radius: 8px;
	background: linear-gradient(135deg, #38bdf8, #2563eb 58%, #14b8a6);
	color: #fff;
	font-size: 16px;
	box-shadow: 0 12px 24px rgba(37, 99, 235, 0.24);
}
.brand__text {
	display: inline-flex;
	align-items: baseline;
	gap: 1px;
}
.brand__accent {
	color: #93c5fd;
}
.brand__muted {
	color: rgba(255, 255, 255, 0.92);
}
.sider :deep(.ant-menu) {
	background: transparent;
	border-inline-end: 0;
}
.sider :deep(.ant-menu-dark .ant-menu-item) {
	height: 42px;
	line-height: 42px;
	margin: 4px 10px;
	width: calc(100% - 24px);
	border-radius: 8px;
	color: rgba(226, 232, 240, 0.8);
	font-weight: 650;
	transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.sider :deep(.ant-menu-dark .ant-menu-item:hover) {
	background: rgba(255, 255, 255, 0.09);
	color: #fff;
	transform: translateX(2px);
}
.sider :deep(.ant-menu-dark .ant-menu-item-selected) {
	margin: 4px 10px;
	width: calc(100% - 24px);
	background: linear-gradient(135deg, rgba(37, 99, 235, 0.98), rgba(20, 184, 166, 0.86));
	box-shadow: 0 12px 22px rgba(37, 99, 235, 0.22);
	color: #fff;
}
.sider :deep(.ant-menu-dark .ant-menu-item-selected::after) {
	display: none;
}
.sider :deep(.ant-layout-sider-trigger) {
	height: 52px;
	line-height: 52px;
	background: rgba(255, 255, 255, 0.03);
	border-top: 1px solid rgba(255, 255, 255, 0.06);
	color: rgba(226, 232, 240, 0.9);
	transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.sider :deep(.ant-layout-sider-trigger:hover) {
	background: rgba(255, 255, 255, 0.08);
	color: #fff;
}
.sider :deep(.ant-layout-sider-trigger:hover .anticon) {
	transform: translateX(2px);
}
.nav-item {
	display: inline-flex;
	align-items: center;
	gap: 11px;
}
.nav-icon {
	width: 17px;
	height: 17px;
	fill: none;
	stroke: currentColor;
	stroke-width: 1.8;
	stroke-linecap: round;
	stroke-linejoin: round;
	opacity: 0.92;
}
.nav-label {
	letter-spacing: 0;
}
.sider-foot {
	padding: 12px 12px 64px;
}
.runtime-card {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px;
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.045);
	border: 1px solid rgba(148, 163, 184, 0.14);
	color: rgba(226, 232, 240, 0.86);
}
.runtime-card__dot,
.header-status__dot {
	width: 8px;
	height: 8px;
	flex: 0 0 auto;
	border-radius: 50%;
	background: #22c55e;
	box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.13);
}
.runtime-card__label {
	font-size: 0.72rem;
	font-weight: 800;
	color: rgba(255, 255, 255, 0.92);
}
.runtime-card__value {
	margin-top: 2px;
	font-size: 0.72rem;
	color: rgba(203, 213, 225, 0.76);
}
.main-layout {
	position: relative;
	z-index: 1;
	flex: 1;
	min-width: 0;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}
.header {
	flex: 0 0 64px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: rgba(255, 255, 255, 0.94);
	backdrop-filter: blur(14px);
	padding: 0 22px 0 20px;
	border-bottom: 1px solid #e5edf5;
	box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);
}
.title {
	display: flex;
	align-items: baseline;
	gap: 6px;
	font-size: 1.02rem;
	font-weight: 800;
	letter-spacing: 0.01em;
}
.title__accent {
	color: #2563eb;
}
.title__muted {
	color: #0f172a;
}
.header-actions {
	display: flex;
	align-items: center;
	gap: 12px;
}
.header-status {
	height: 34px;
	display: inline-flex;
	align-items: center;
	gap: 9px;
	padding: 0 12px;
	border-radius: 8px;
	color: #0f172a;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	font-size: 0.84rem;
	font-weight: 750;
}
.user-chip {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	height: 36px;
	padding: 0 12px 0 4px;
	border-radius: 8px;
	background: #f8fbff;
	border: 1px solid #dbeafe;
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.user-chip__avatar {
	min-width: 28px;
	height: 28px;
	padding: 0 8px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 6px;
	background: linear-gradient(135deg, #dbeafe, #bfdbfe);
	color: #1d4ed8;
	font-size: 0.82rem;
	font-weight: 800;
	letter-spacing: 0.02em;
}
.user-chip__name {
	color: #334155;
	font-size: 0.92rem;
	font-weight: 600;
}
.logout-button {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 36px;
	padding: 0 12px;
	border-radius: 8px;
	color: #475569;
	transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.logout-button:hover {
	background: rgba(239, 68, 68, 0.08);
	color: #dc2626;
	transform: translateY(-1px);
}
.logout-button :deep(svg) {
	width: 15px;
	height: 15px;
	fill: currentColor;
}
.logout-button :deep(span) {
	font-weight: 600;
}
.content {
	position: relative;
	z-index: 1;
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding: 18px;
	background:
		linear-gradient(180deg, #f6f8fb 0%, #eef3f8 100%);
}

@media (max-width: 992px) {
	.header {
		padding-inline: 16px;
	}

	.user-chip__name {
		display: none;
	}

	.header-status {
		display: none;
	}
}
</style>
