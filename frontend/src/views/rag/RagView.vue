<template>
  <AppLayout>
    <div class="rag-page">
      <section class="rag-hero">
        <div>
          <div class="rag-hero__label">RAG Assistant</div>
          <h1>自然语言查询单细胞数据库</h1>
          <p>先从本地数据集中检索证据，再用 OpenAI-compatible LLM 生成分析回答。</p>
        </div>
        <a-button :loading="loading" @click="loadDatasets">刷新数据集</a-button>
      </section>

      <section class="rag-layout">
        <a-card :bordered="false" class="query-panel">
          <template #title>问题与模型</template>
          <a-form layout="vertical">
            <a-form-item label="数据集">
              <a-select
                v-model:value="datasetIds"
                mode="multiple"
                :options="datasetOptions"
                placeholder="不选则使用前 5 个 ready 数据集"
              />
            </a-form-item>
            <a-form-item label="问题">
              <a-input
                v-model:value="question"
                placeholder="例如：查找 normal hepatocyte，并总结这些细胞来自哪些样本"
              />
            </a-form-item>
            <a-row :gutter="10">
              <a-col :span="12">
                <a-form-item label="Provider">
                  <a-select v-model:value="provider" :options="providerOptions" @change="onProviderChange" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="Top-K 证据">
                  <a-input-number v-model:value="k" :min="1" :max="100" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="Model">
              <a-input v-model:value="model" placeholder="留空使用后端默认模型" />
            </a-form-item>
            <a-form-item label="Base URL">
              <a-input v-model:value="baseUrl" placeholder="OpenAI-compatible base_url，可留空" />
            </a-form-item>
            <a-form-item label="API Key">
              <a-input v-model:value="apiKey" type="password" placeholder="可留空，使用后端 .env 中的 key" />
            </a-form-item>
            <a-button type="primary" block :loading="querying" @click="ask">开始分析</a-button>
          </a-form>
        </a-card>

        <div class="answer-stack">
          <a-card :bordered="false" class="answer-card">
            <template #title>回答</template>
            <a-empty v-if="!result" description="输入问题后显示回答" />
            <template v-else>
              <div class="answer-meta">
                <a-tag :color="result.llm_used ? 'green' : 'blue'">{{ result.llm_used ? "LLM" : "Local" }}</a-tag>
                <span>{{ result.provider }} {{ result.model || "" }}</span>
              </div>
              <p class="answer-text">{{ result.answer }}</p>
              <a-alert
                v-for="warning in result.warnings"
                :key="warning"
                type="warning"
                show-icon
                :message="warning"
                class="warning"
              />
            </template>
          </a-card>

          <a-card v-if="result" :bordered="false" title="解析条件">
            <div class="filter-json">{{ JSON.stringify(result.interpreted_filters, null, 2) }}</div>
          </a-card>

          <a-card v-if="result" :bordered="false" title="检索证据">
            <div class="evidence-list">
              <div v-for="item in result.evidence" :key="item.dataset_id" class="evidence-block">
                <div class="evidence-block__head">
                  <strong>{{ item.dataset_name }} #{{ item.dataset_id }}</strong>
                  <span>{{ item.total_matches.toLocaleString() }} / {{ item.n_cells.toLocaleString() }} cells</span>
                </div>
                <div class="distribution-grid">
                  <div v-for="(counts, col) in item.distributions" :key="col" class="distribution">
                    <span>{{ col }}</span>
                    <div v-for="(count, value) in counts" :key="value">
                      <small>{{ value }}</small>
                      <b>{{ count }}</b>
                    </div>
                  </div>
                </div>
                <a-table
                  :columns="cellColumns"
                  :data-source="item.sampled_cells"
                  row-key="cell_id"
                  size="small"
                  :pagination="false"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'cell_type'">
                      {{ record.obs?.cell_type ?? record.obs?.celltype ?? "-" }}
                    </template>
                    <template v-else-if="column.key === 'disease'">
                      {{ record.obs?.disease ?? record.obs?.condition ?? "-" }}
                    </template>
                  </template>
                </a-table>
              </div>
            </div>
          </a-card>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import { listDatasets } from "@/api/search"
import { ragQuery, type RagQueryResponse } from "@/api/rag"

const loading = ref(false)
const querying = ref(false)
const datasets = ref<any[]>([])
const datasetIds = ref<number[]>([])
const question = ref("查找 normal hepatocyte，并总结这些细胞来自哪些样本")
const provider = ref("local")
const model = ref("")
const baseUrl = ref("")
const apiKey = ref("")
const k = ref(10)
const result = ref<RagQueryResponse | null>(null)

const providerOptions = [
  { label: "Local rules", value: "local" },
  { label: "OpenAI", value: "openai" },
  { label: "DeepSeek", value: "deepseek" },
  { label: "Qwen / DashScope", value: "dashscope" },
  { label: "Moonshot / Kimi", value: "moonshot" },
  { label: "Zhipu GLM", value: "zhipuai" },
  { label: "SiliconFlow", value: "siliconflow" },
  { label: "Custom", value: "custom" },
]

const defaults: Record<string, { model: string; baseUrl: string }> = {
  local: { model: "", baseUrl: "" },
  openai: { model: "gpt-4o-mini", baseUrl: "https://api.openai.com/v1" },
  deepseek: { model: "deepseek-chat", baseUrl: "https://api.deepseek.com/v1" },
  dashscope: { model: "qwen-plus", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  moonshot: { model: "moonshot-v1-8k", baseUrl: "https://api.moonshot.cn/v1" },
  zhipuai: { model: "glm-4-flash", baseUrl: "https://open.bigmodel.cn/api/paas/v4" },
  siliconflow: { model: "Qwen/Qwen2.5-7B-Instruct", baseUrl: "https://api.siliconflow.cn/v1" },
}

const datasetOptions = computed(() =>
  datasets.value
    .filter((item) => item.status === "ready")
    .map((item) => ({ value: item.id, label: `${item.name} (#${item.id})` }))
)

const cellColumns = [
  { title: "Cell ID", dataIndex: "cell_id", key: "cell_id" },
  { title: "Row", dataIndex: "row_index", key: "row_index", width: 90 },
  { title: "Type", key: "cell_type", width: 140 },
  { title: "Condition", key: "disease", width: 140 },
]

async function loadDatasets() {
  loading.value = true
  try {
    datasets.value = await listDatasets()
    if (!datasetIds.value.length) datasetIds.value = datasetOptions.value.slice(0, 2).map((item) => item.value)
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "加载数据集失败")
  } finally {
    loading.value = false
  }
}

function onProviderChange(value: string) {
  const item = defaults[value]
  model.value = item?.model ?? ""
  baseUrl.value = item?.baseUrl ?? ""
}

async function ask() {
  if (!question.value.trim()) return message.warning("请输入问题")
  querying.value = true
  try {
    result.value = await ragQuery({
      question: question.value,
      dataset_ids: datasetIds.value,
      k: k.value,
      llm: {
        provider: provider.value,
        model: model.value,
        base_url: baseUrl.value,
        api_key: apiKey.value,
        temperature: 0.2,
      },
    })
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "RAG 查询失败")
  } finally {
    querying.value = false
  }
}

onMounted(loadDatasets)
</script>

<style scoped>
.rag-page {
  min-height: 100%;
  padding: 20px;
  display: grid;
  gap: 16px;
  background: #f3f6fa;
}

.rag-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 22px;
  border-radius: 8px;
  color: #fff;
  background: linear-gradient(135deg, #111827, #2563eb 56%, #0f766e);
}

.rag-hero__label {
  color: #bfdbfe;
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.rag-hero h1 {
  margin: 6px 0;
  color: #fff;
  font-size: 1.75rem;
}

.rag-hero p {
  margin: 0;
  color: rgba(239, 246, 255, 0.86);
}

.rag-layout {
  display: grid;
  grid-template-columns: minmax(330px, 0.8fr) minmax(0, 1.5fr);
  gap: 16px;
}

.rag-page :deep(.ant-card) {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.query-panel :deep(.ant-input-number) {
  width: 100%;
}

.answer-stack {
  display: grid;
  gap: 16px;
  align-content: start;
}

.answer-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #64748b;
  font-weight: 750;
}

.answer-text {
  margin: 0;
  color: #0f172a;
  line-height: 1.7;
  white-space: pre-wrap;
}

.warning {
  margin-top: 12px;
}

.filter-json {
  padding: 12px;
  border-radius: 8px;
  color: #1e293b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  white-space: pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
}

.evidence-list {
  display: grid;
  gap: 14px;
}

.evidence-block {
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.evidence-block__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.evidence-block__head strong {
  color: #0f172a;
}

.evidence-block__head span {
  color: #64748b;
  font-weight: 750;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.distribution {
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.distribution > span {
  display: block;
  margin-bottom: 6px;
  color: #2563eb;
  font-weight: 850;
}

.distribution div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #334155;
}

.distribution small {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1040px) {
  .rag-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .rag-page {
    padding: 12px;
  }

  .rag-hero,
  .evidence-block__head {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
