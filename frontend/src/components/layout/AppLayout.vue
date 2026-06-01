<template>
	<a-layout class="app-layout">
		<a-layout-sider breakpoint="lg" collapsible v-model:collapsed="collapsed" class="sider">
			<div class="sider-top">
				<div class="brand">
					<span class="brand__accent">scann</span><span class="brand__muted">-search</span>
				</div>
			</div>
			<div class="sider-body">
				<a-menu theme="dark" mode="inline" :selectedKeys="[activeKey]" @click="onMenuClick">
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
	background: #F3F2F1;
}
.sider {
	position: relative;
	z-index: 5;
	flex: 0 0 auto;
	height: 100vh;
	overflow-y: auto;
	background: rgba(255, 255, 255, 0.8);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border-right: 1px solid #E1DFDD;
	box-shadow: 2px 0 8px rgba(0,0,0,0.05);
}
.sider :deep(.ant-layout-sider-children) {
	display: flex;
	flex-direction: column;
	height: 100%;
}
.sider-top {
	flex: 0 0 auto;
	padding: 16px;
	background: #FFFFFF;
	border-bottom: 1px solid #E1DFDD;
}
.sider-body {
	flex: 1;
	min-height: 0;
	padding-top: 8px;
}
.brand {
	display: flex;
	align-items: center;
	gap: 2px;
	color: #1F1F1F;
	font-weight: 600;
	font-size: 16px;
	letter-spacing: 0.02em;
	font-family: 'Segoe UI Variable', 'Segoe UI', -apple-system, sans-serif;
}
.brand__accent {
	color: #0078D4;
}
.brand__muted {
	color: #6B6B6B;
}
.sider :deep(.ant-menu) {
	background: transparent;
	border-inline-end: 0;
	font-family: 'Segoe UI Variable', 'Segoe UI', -apple-system, sans-serif;
}
.sider :deep(.ant-menu-item) {
	height: 36px;
	line-height: 36px;
	margin: 2px 8px;
	width: calc(100% - 16px);
	border-radius: 4px;
	color: #4A4A4A;
	font-size: 0.85rem;
	font-weight: 500;
	transition: background-color 0.15s ease, color 0.15s ease;
}
.sider :deep(.ant-menu-item:hover) {
	background: #F0F7FF;
	color: #0078D4;
}
.sider :deep(.ant-menu-item-selected) {
	margin: 2px 8px;
	width: calc(100% - 16px);
	background: rgba(0, 120, 212, 0.1);
	color: #0078D4;
	font-weight: 600;
}
.sider :deep(.ant-menu-item-selected::after) {
	display: none;
}
.sider :deep(.ant-layout-sider-trigger) {
	height: 44px;
	line-height: 44px;
	background: #FFFFFF;
	border-top: 1px solid #E1DFDD;
	color: #6B6B6B;
	transition: background-color 0.15s ease, color 0.15s ease;
}
.sider :deep(.ant-layout-sider-trigger:hover) {
	background: #F3F2F1;
	color: #0078D4;
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
	flex: 0 0 56px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(16px);
	-webkit-backdrop-filter: blur(16px);
	padding: 0 16px;
	border-bottom: 1px solid #E1DFDD;
	box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.title {
	display: flex;
	align-items: baseline;
	gap: 4px;
	font-size: 0.95rem;
	font-weight: 600;
	font-family: 'Segoe UI Variable', 'Segoe UI', -apple-system, sans-serif;
}
.title__accent {
	color: #0078D4;
}
.title__muted {
	color: #1F1F1F;
}
.header-actions {
	display: flex;
	align-items: center;
	gap: 8px;
}
.user-chip {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	height: 32px;
	padding: 0 10px 0 4px;
	border-radius: 4px;
	background: #FFFFFF;
	border: 1px solid #E1DFDD;
}
.user-chip__avatar {
	min-width: 24px;
	height: 24px;
	padding: 0 6px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	background: rgba(0, 120, 212, 0.1);
	color: #0078D4;
	font-size: 0.78rem;
	font-weight: 600;
}
.user-chip__name {
	color: #4A4A4A;
	font-size: 0.85rem;
	font-weight: 500;
}
.logout-button {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	height: 32px;
	padding: 0 10px;
	border-radius: 4px;
	color: #6B6B6B;
	font-size: 0.85rem;
	font-weight: 500;
	transition: background-color 0.15s ease, color 0.15s ease;
}
.logout-button:hover {
	background: rgba(239, 68, 68, 0.08);
	color: #DC2626;
}
.logout-button :deep(svg) {
	width: 14px;
	height: 14px;
	fill: currentColor;
}
.content {
	position: relative;
	z-index: 1;
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding: 0;
	background: #F3F2F1;
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
