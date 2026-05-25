<template>
	<a-layout class="app-layout">
		<a-layout-sider breakpoint="lg" collapsible v-model:collapsed="collapsed" class="sider">
			<div class="brand">scann-search</div>
			<a-menu theme="dark" mode="inline" :selectedKeys="[activeKey]" @click="onMenuClick">
				<a-menu-item key="/dashboard">仪表盘</a-menu-item>
				<a-menu-item key="/search">检索</a-menu-item>
				<a-menu-item key="/visualize">可视化</a-menu-item>
				<a-menu-item key="/datasets">数据集</a-menu-item>
			</a-menu>
		</a-layout-sider>
		<a-layout>
			<a-layout-header class="header">
				<div class="title">单细胞 ANN 检索系统</div>
				<div class="header-actions">
					<span class="user">{{ auth.user?.username || 'guest' }}</span>
					<a-button size="small" @click="auth.logout()">退出</a-button>
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
	if (path.startsWith("/search")) return "/search"
	if (path.startsWith("/visualize")) return "/visualize"
	if (path.startsWith("/datasets")) return "/datasets"
	return "/dashboard"
})

function onMenuClick({ key }: { key: string }) {
	router.push(key)
}
</script>

<style scoped>
.app-layout { min-height: 100vh; }
.sider { background: #0f172a; }
.brand { color: #fff; padding: 16px; font-weight: 700; font-size: 18px; }
.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: #fff;
	padding: 0 16px;
	border-bottom: 1px solid #e5e7eb;
}
.title { font-weight: 700; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.user { color: #475569; }
.content { padding: 16px; background: #f5f7fb; min-height: calc(100vh - 64px); }
</style>
