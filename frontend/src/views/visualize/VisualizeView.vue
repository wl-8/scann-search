<template>
  <AppLayout>
    <div class="visualize-page">
      <a-card>
        <a-row :gutter="16" align="middle">
          <a-col :xs="24" :md="6">
            <a-select v-model:value="dimension" style="width: 100%">
              <a-select-option :value="2">2D</a-select-option>
              <a-select-option :value="3">3D</a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :md="6">
            <a-select v-model:value="colorBy" style="width: 100%">
              <a-select-option value="cell_type">按 cell_type</a-select-option>
              <a-select-option value="dataset">按 dataset</a-select-option>
              <a-select-option value="disease">按 disease</a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :md="6">
            <a-input-number v-model:value="topK" :min="1" :max="50" style="width: 100%" />
          </a-col>
          <a-col :xs="24" :md="6">
            <a-button type="primary" block :loading="loading" @click="loadPoints">刷新图谱</a-button>
          </a-col>
        </a-row>
      </a-card>

      <a-row :gutter="16">
        <a-col :xs="24" :lg="16">
          <a-card title="UMAP 可视化">
            <UmapPlot
              :points="points"
              :dimension="dimension"
              :colorBy="colorBy"
              :selectedId="selectedPoint?.id ?? null"
              @point-click="onPointClick"
            />
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="8">
          <a-card title="选中细胞">
            <div v-if="selectedPoint">
              <p><strong>ID：</strong>{{ selectedPoint.id }}</p>
              <p><strong>cell_type：</strong>{{ selectedPoint.cell_type }}</p>
              <p><strong>dataset：</strong>{{ selectedPoint.dataset }}</p>
              <p><strong>metadata：</strong></p>
              <pre>{{ JSON.stringify(selectedPoint.metadata, null, 2) }}</pre>
            </div>
            <div v-else>点击左侧散点图中的任一点查看详情，并自动发起相似性查询。</div>
          </a-card>

          <a-card title="相似细胞结果" style="margin-top: 16px">
            <a-table
              :columns="neighborColumns"
              :data-source="neighbors"
              :pagination="false"
              size="small"
              row-key="rank"
            />
          </a-card>

          <a-card title="数据分布统计" style="margin-top: 16px">
            <div v-if="facets">
              <div v-for="(vals, key) in facets" :key="key" style="margin-bottom: 12px">
                <strong>{{ key }}</strong>
                <div v-for="(count, name) in vals" :key="name">
                  {{ name }}: {{ count }}
                </div>
              </div>
            </div>
            <div v-else>暂无统计信息</div>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import UmapPlot from "@/components/visualize/UmapPlot.vue"
import { browseSearch } from "@/api/search"
import { useSearch } from "@/composables/useSearch"

type Point = {
  id: string
  cell_type?: string
  dataset?: string
  umap_x: number
  umap_y: number
  umap_z?: number
  metadata?: Record<string, any>
}

const dimension = ref<2 | 3>(2)
const colorBy = ref("cell_type")
const topK = ref(10)
const points = ref<Point[]>([])
const selectedPoint = ref<Point | null>(null)
const neighbors = ref<any[]>([])
const facets = ref<any>(null)
const loading = ref(false)

const neighborColumns = [
  { title: "Rank", dataIndex: "rank", key: "rank", width: 70 },
  { title: "ID", dataIndex: "id", key: "id" },
  { title: "Score", dataIndex: "score", key: "score", width: 100 },
  { title: "Type", dataIndex: "cell_type", key: "cell_type", width: 100 },
]

const { search } = useSearch()

async function loadPoints() {
  loading.value = true
  const res = await browseSearch({ page: 1, pageSize: 64 })
  points.value = (res.items ?? []).map((item: any, idx: number) => ({
    id: item.id,
    cell_type: item.cell_type,
    dataset: item.dataset,
    umap_x: item.umap_x,
    umap_y: item.umap_y,
    umap_z: item.umap_z ?? idx / 10,
    metadata: item.metadata,
  }))
  facets.value = res.facets ?? null
  loading.value = false
}

async function onPointClick(point: Point) {
  selectedPoint.value = point
  const res = await search({ queryType: "id", query: point.id, k: topK.value, page: 1, pageSize: topK.value })
  neighbors.value = res.results
}

onMounted(loadPoints)
</script>

<style scoped>
.visualize-page { display: grid; gap: 16px; }
pre { white-space: pre-wrap; word-break: break-word; margin: 0; }
</style>
