<template>
  <AppLayout>
    <div class="dataset-page">
      <div class="dataset-page__header">
        <div>
          <div class="dataset-page__eyebrow">Dataset Management</div>
          <h2>数据集管理</h2>
        </div>
        <p>上传数据、查看状态与维护索引的统一控制台。</p>
      </div>

      <a-row :gutter="16" class="dataset-grid">
        <a-col :xs="24" :lg="10">
          <UploadForm @uploaded="onUploaded" />
        </a-col>
        <a-col :xs="24" :lg="14">
          <a-card class="dataset-table-card" :bordered="false" title="数据集列表">
            <a-table
              class="dataset-table"
              :columns="columns"
              :data-source="datasets"
              row-key="id"
              :pagination="false"
              :rowClassName="() => 'dataset-row'"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <span class="status-badge" :class="statusClass(record.status)">{{ record.status }}</span>
                </template>
                <template v-if="column.key === 'action'">
                  <a-space :size="8">
                    <a-button class="icon-button icon-button--view" size="small" @click="viewDetail(record)">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.75" />
                      </svg>
                    </a-button>
                    <a-popconfirm title="确定删除该数据集？" @confirm="removeDataset(record.id)">
                      <a-button class="icon-button icon-button--delete" size="small">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M8 6V4.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5V6" />
                          <path d="M7 6l1 13h8l1-13" />
                          <path d="M10 10v6M14 10v6" />
                        </svg>
                      </a-button>
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

const datasets = ref<DatasetItem[]>([])
import { listDatasets } from "@/api/search"
import { deleteDataset } from "@/api/datasets"
import { ref as refR } from "vue"

async function loadDatasets() {
  try {
    const res = await listDatasets()
    datasets.value = res.map((d: any) => ({
      id: d.id,
      name: d.name,
      cells: d.n_cells,
      genes: d.n_genes,
      status: d.status,
      source: d.source_path ?? "server",
      updatedAt: new Date(d.created_at).toISOString().slice(0, 10),
    }))
  } catch (e) {
    // fallback to demo
    datasets.value = [
      { name: "PBMC-3k", cells: 3200, genes: 18987, status: "Ready", source: "demo", updatedAt: "2026-05-25" },
    ]
  }
}

loadDatasets()

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

function statusClass(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === "ready" || normalized === "uploaded") return "status-badge--ready"
  if (normalized === "indexed") return "status-badge--indexed"
  if (normalized === "processing" || normalized === "uploading") return "status-badge--processing"
  return "status-badge--default"
}

function onUploaded(file: { name: string; size: number }) {
  // after upload/register, refresh dataset list from backend
  loadDatasets()
}

function viewDetail(record: DatasetItem) {
  activeDataset.value = record
  detailOpen.value = true
}

async function removeDataset(datasetId: number) {
  try {
    await deleteDataset(datasetId)
    // refresh list from backend
    await loadDatasets()
  } catch (e) {
    // optimistic fallback: remove locally
    datasets.value = datasets.value.filter((item: any) => item.id !== datasetId)
  }
}
</script>

<style scoped>
.dataset-page {
  position: relative;
  isolation: isolate;
  min-height: 100%;
  display: grid;
  gap: 18px;
  padding: 20px 0 8px;
  background:
    radial-gradient(circle at 14% 12%, rgba(224, 242, 254, 0.9) 0, rgba(224, 242, 254, 0.62) 20%, rgba(224, 242, 254, 0.16) 38%, transparent 62%),
    radial-gradient(circle at 86% 88%, rgba(243, 232, 255, 0.88) 0, rgba(243, 232, 255, 0.58) 20%, rgba(243, 232, 255, 0.16) 38%, transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 52%, #f3f7fb 100%);
}

.dataset-page::before {
  content: "";
  position: absolute;
  inset: -18%;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 14%, rgba(224, 242, 254, 0.42) 0 11%, transparent 44%),
    radial-gradient(circle at 82% 84%, rgba(243, 232, 255, 0.38) 0 12%, transparent 46%),
    radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.24) 0 9%, transparent 34%),
    linear-gradient(135deg, rgba(0, 123, 255, 0.03), rgba(38, 166, 154, 0.015), rgba(243, 232, 255, 0.03));
  filter: blur(32px);
  opacity: 0.9;
  animation: datasetGlowDrift 26s ease-in-out infinite alternate;
}

.dataset-page > * {
  position: relative;
  z-index: 1;
}

.dataset-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 2px;
}

.dataset-page__eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #007bff;
}

.dataset-page__header h2 {
  margin: 6px 0 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.dataset-page__header p {
  margin: 0;
  max-width: 520px;
  color: #64748b;
  line-height: 1.6;
}

.dataset-grid {
  align-items: stretch;
}

.dataset-table-card {
  height: 100%;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 24px 54px rgba(15, 23, 42, 0.06),
    0 8px 16px rgba(15, 23, 42, 0.04);
}

.dataset-table-card :deep(.ant-card-head) {
  border-bottom: 1px solid rgba(226, 232, 240, 0.95);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.dataset-table-card :deep(.ant-card-head-title) {
  font-weight: 800;
  color: #0f172a;
}

.dataset-table :deep(.ant-table) {
  background: transparent;
}

.dataset-table :deep(.ant-table-thead > tr > th) {
  background: #f9fafb;
  color: #334155;
  font-weight: 800;
  border-bottom: 1px solid rgba(226, 232, 240, 1);
}

.dataset-table :deep(.ant-table-thead > tr > th::before) {
  display: none;
}

.dataset-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  border-left: 0;
  border-right: 0;
  color: #334155;
}

.dataset-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fafc !important;
}

.dataset-table :deep(.ant-table-container) {
  border-color: rgba(226, 232, 240, 0.9);
}

.dataset-row {
  transition: background-color 0.18s ease;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 84px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.status-badge--ready {
  color: #166534;
  background: #dcfce7;
}

.status-badge--indexed {
  color: #1d4ed8;
  background: #dbeafe;
}

.status-badge--processing {
  color: #b45309;
  background: #fef3c7;
}

.status-badge--default {
  color: #475569;
  background: #e2e8f0;
}

.icon-button {
  width: 32px;
  height: 32px;
  display: inline-grid;
  place-items: center;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #f8fafc;
  color: #64748b;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.icon-button svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
}

.icon-button--view:hover {
  color: #007bff;
  border-color: rgba(0, 123, 255, 0.24);
  background: rgba(0, 123, 255, 0.08);
}

.icon-button--delete:hover {
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.24);
  background: rgba(220, 38, 38, 0.08);
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 992px) {
  .dataset-page__header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .dataset-page {
    padding-top: 12px;
  }
}

@keyframes datasetGlowDrift {
  from {
    transform: translate3d(-1%, -0.8%, 0) scale(1);
  }

  to {
    transform: translate3d(1%, 0.8%, 0) scale(1.02);
  }
}
</style>
