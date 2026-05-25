<template>
  <div class="dashboard-page">
    <a-card class="hero-card">
      <h1>单细胞 ANN 检索系统</h1>
      <p>这是项目的首页仪表盘入口。你可以进入搜索、数据集管理和可视化页面进行演示。</p>
      <div class="actions">
        <a-button type="primary" @click="go('/search')">开始检索</a-button>
        <a-button @click="go('/datasets')">数据集管理</a-button>
        <a-button @click="go('/visualize')">可视化</a-button>
      </div>
    </a-card>

    <a-row :gutter="16" class="stats-row">
      <a-col :xs="24" :md="8">
        <a-card>
          <a-statistic title="数据集" :value="3" />
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card>
          <a-statistic title="索引数量" :value="5" />
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card>
          <a-statistic title="最近检索" :value="18" />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <a-col :xs="24" :md="12">
        <a-card title="快速说明">
          <ul>
            <li>登录后可进入 `/dashboard`。</li>
            <li>搜索页支持普通检索、条件检索、多数据集检索与数据浏览。</li>
            <li>展开结果行可查看 metadata 与 gene_expr 详情。</li>
          </ul>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="12">
        <a-card title="当前状态">
          <p>当前前端已支持 mock 数据联调，后端未准备好时仍可演示完整流程。</p>
          <p>若要退出，可使用页面中的登出入口（后续可加到顶部导航）。</p>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router"

const router = useRouter()

function go(path: string) {
  router.push(path)
}
</script>

<style scoped>
.dashboard-page {
  padding: 16px;
  display: grid;
  gap: 16px;
}
.hero-card {
  background: linear-gradient(135deg, #eef7ff 0%, #ffffff 60%);
}
.hero-card h1 {
  margin: 0 0 8px;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.stats-row {
  margin-bottom: 0;
}
</style>
