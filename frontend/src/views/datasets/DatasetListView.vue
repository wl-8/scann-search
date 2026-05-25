<template>
  <AppLayout>
    <div class="dataset-page">
      <a-row :gutter="16">
        <a-col :xs="24" :lg="10">
          <UploadForm @uploaded="onUploaded" />
        </a-col>
        <a-col :xs="24" :lg="14">
          <a-card title="数据集列表">
            <a-table :columns="columns" :data-source="datasets" row-key="name" :pagination="false">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-button size="small" @click="viewDetail(record)">详情</a-button>
                    <a-popconfirm title="确定删除该数据集？" @confirm="removeDataset(record.name)">
                      <a-button size="small" danger>删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>

      <a-modal v-model:open="detailOpen" title="数据集详情" :footer="null">
        <pre>{{ JSON.stringify(activeDataset, null, 2) }}</pre>
      </a-modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from "vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import UploadForm from "@/components/dataset/UploadForm.vue"

type DatasetItem = {
  name: string
  cells: number
  genes: number
  status: string
  source: string
  updatedAt: string
}

const datasets = ref<DatasetItem[]>([
  { name: "PBMC-3k", cells: 3200, genes: 18987, status: "Ready", source: "demo", updatedAt: "2026-05-25" },
  { name: "Mouse-brain", cells: 1450, genes: 21456, status: "Indexed", source: "demo", updatedAt: "2026-05-25" },
  { name: "Tumor-Atlas", cells: 8721, genes: 20500, status: "Processing", source: "upload", updatedAt: "2026-05-25" },
])

const detailOpen = ref(false)
const activeDataset = ref<DatasetItem | null>(null)

const columns = [
  { title: "Name", dataIndex: "name", key: "name" },
  { title: "Cells", dataIndex: "cells", key: "cells" },
  { title: "Genes", dataIndex: "genes", key: "genes" },
  { title: "Status", dataIndex: "status", key: "status" },
  { title: "Source", dataIndex: "source", key: "source" },
  { title: "Updated", dataIndex: "updatedAt", key: "updatedAt" },
  { title: "Action", key: "action", slots: { customRender: "action" } },
]

function onUploaded(file: { name: string; size: number }) {
  datasets.value.unshift({
    name: file.name,
    cells: Math.max(100, Math.round(file.size / 120)),
    genes: 20000,
    status: "Uploaded",
    source: "local",
    updatedAt: new Date().toISOString().slice(0, 10),
  })
}

function viewDetail(record: DatasetItem) {
  activeDataset.value = record
  detailOpen.value = true
}

function removeDataset(name: string) {
  datasets.value = datasets.value.filter((item) => item.name !== name)
}
</script>

<style scoped>
.dataset-page { display: grid; gap: 16px; }
pre { white-space: pre-wrap; word-break: break-word; }
</style>
