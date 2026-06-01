<template>
	<a-layout class="app-layout">
		<a-layout-sider breakpoint="lg" collapsible v-model:collapsed="collapsed" class="sider">
			<div class="sider-top">
				<div class="brand">
					<span class="brand__logo" aria-hidden="true">S</span>
					<span class="brand__accent">scann</span><span class="brand__muted">-search</span>
				</div>
			</div>
			<div class="sider-body">
				<a-menu theme="light" mode="inline" :selectedKeys="[activeKey]" @click="onMenuClick">
					<a-menu-item key="/dashboard">仪表盘</a-menu-item>
					<a-menu-item key="/search">检索</a-menu-item>
					<a-menu-item key="/search/multi">批量检索</a-menu-item>
					<a-menu-item key="/visualize">可视化</a-menu-item>
					<a-menu-item key="/datasets">数据集管理</a-menu-item>
					<a-menu-item key="/indexes">索引管理</a-menu-item>
					<a-menu-item v-if="auth.isResearcher || auth.isAdmin" key="/benchmark">性能评测</a-menu-item>
					<a-menu-item v-if="auth.isResearcher || auth.isAdmin" key="/export">结果导出</a-menu-item>
					<a-menu-item v-if="auth.isAdmin" key="/admin/users">用户管理</a-menu-item>
				</a-menu>
			</div>
		</a-layout-sider>
		<a-layout class="main-layout">
			<a-layout-header class="header">
				<div class="title">
					<span class="title__accent">单细胞 ANN</span>
					<span class="title__muted">检索系统</span>
				</div>
				<div class="header-actions">
					<div class="user-chip" aria-label="当前用户">
						<span class="user-chip__avatar">{{ auth.user?.username?.charAt(0)?.toUpperCase() || '?' }}</span>
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

function onMenuClick({ key }: { key: string }) {
	router.push(key)
}
</script>

<style scoped>
.app-layout {
	display: flex;
	height: 100vh;
	overflow: hidden;
	background: var(--app-bg);
}
.sider {
	position: relative;
	z-index: 5;
	flex: 0 0 auto;
	height: 100vh;
	overflow-y: auto;
	background: rgba(245, 245, 247, 0.86);
	border-right: 1px solid var(--line);
	box-shadow: 10px 0 30px rgba(0, 0, 0, 0.035);
	backdrop-filter: saturate(180%) blur(22px);
}
.sider :deep(.ant-layout-sider-children) {
	display: flex;
	flex-direction: column;
	height: 100%;
}
.sider-top {
	flex: 0 0 auto;
	padding: 18px 16px 16px;
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(245, 245, 247, 0.72));
	border-bottom: 1px solid var(--line);
}
.sider-body {
	flex: 1;
	min-height: 0;
	padding: 10px 0;
}
.brand {
	display: flex;
	align-items: center;
	gap: 4px;
	color: var(--text);
	font-weight: 760;
	font-size: 17px;
}
.brand__logo {
	width: 30px;
	height: 30px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-right: 6px;
	border-radius: 9px;
	background: #1d1d1f;
	color: #fff;
	font-size: 0.88rem;
	font-weight: 800;
	box-shadow: 0 10px 22px rgba(0, 0, 0, 0.12);
}
.brand__accent {
	color: var(--text);
}
.brand__muted {
	color: var(--text-muted);
}
.sider.ant-layout-sider-collapsed .brand__accent,
.sider.ant-layout-sider-collapsed .brand__muted {
	display: none;
}
.sider :deep(.ant-menu) {
	background: transparent;
	border-inline-end: 0;
}
.sider :deep(.ant-menu-light .ant-menu-item) {
	height: 46px;
	line-height: 46px;
	margin: 6px 12px;
	width: calc(100% - 24px);
	border-radius: 10px;
	color: #424245;
	font-weight: 650;
	transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.sider :deep(.ant-menu-light .ant-menu-item:hover) {
	background: rgba(0, 0, 0, 0.045);
	color: #1d1d1f;
	transform: translateX(2px);
}
.sider :deep(.ant-menu-light .ant-menu-item-selected) {
	margin: 6px 12px;
	width: calc(100% - 24px);
	background: rgba(255, 255, 255, 0.86);
	box-shadow:
		inset 3px 0 0 #1d1d1f,
		0 10px 22px rgba(0, 0, 0, 0.045);
	color: #1d1d1f;
}
.sider :deep(.ant-menu-light .ant-menu-item-selected::after) {
	display: none;
}
.sider :deep(.ant-layout-sider-trigger) {
	height: 52px;
	line-height: 52px;
	background: rgba(245, 245, 247, 0.9);
	border-top: 1px solid var(--line);
	color: #6e6e73;
	transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.sider :deep(.ant-layout-sider-trigger:hover) {
	background: rgba(255, 255, 255, 0.86);
	color: #1d1d1f;
}
.sider :deep(.ant-layout-sider-trigger:hover .anticon) {
	transform: translateX(2px);
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
	background: rgba(251, 251, 253, 0.72);
	padding: 0 22px;
	border-bottom: 1px solid var(--line);
	box-shadow: 0 1px 0 rgba(0, 0, 0, 0.025);
	backdrop-filter: saturate(180%) blur(22px);
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
	color: #0071e3;
}
.title__muted {
	color: var(--text);
}
.header-actions {
	display: flex;
	align-items: center;
	gap: 12px;
}
.user-chip {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	height: 36px;
	padding: 0 12px 0 4px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.78);
	border: 1px solid var(--line);
}
.user-chip__avatar {
	min-width: 28px;
	height: 28px;
	padding: 0 8px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 999px;
	background: rgba(0, 113, 227, 0.1);
	color: #0071e3;
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
	border-radius: 999px;
	color: #475569;
	transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.logout-button:hover {
	background: rgba(239, 68, 68, 0.08);
	color: var(--red);
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
		linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(245, 245, 247, 0.96)),
		var(--app-bg);
}

@media (max-width: 992px) {
	.header {
		padding-inline: 16px;
	}

	.user-chip__name {
		display: none;
	}
}
</style>
