<template>
  <div class="search-page">
    <h2>检索（Search）</h2>
    <div style="display:flex; gap:16px; align-items:flex-start">
      <div style="flex:0 0 420px">
        <SearchForm v-model:modelValue="formData" @submit="onSearch" />
      </div>

      <div style="flex:1">
        <div class="meta">
          <span v-if="loading">检索中...</span>
          <span v-else-if="lastElapsed !== null">耗时：{{ lastElapsed }} ms，返回 {{ results.length }} 条</span>
        </div>

        <table class="results-table" v-if="results.length">
          <thead>
            <tr><th>Rank</th><th>ID</th><th>Score</th><th>Cell Type</th><th>Dataset</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in results" :key="r.rank">
              <td>{{ r.rank }}</td>
              <td>{{ r.id }}</td>
              <td>{{ r.score }}</td>
              <td>{{ r.cell_type }}</td>
              <td>{{ r.dataset }}</td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty">尚无结果。请先发起检索。</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SearchForm from "@/components/search/SearchForm.vue"
import { ref } from "vue"
import { useSearch } from "@/composables/useSearch"

const { loading, search } = useSearch()
const results = ref<Array<any>>([])
const lastElapsed = ref<number | null>(null)

const formData = ref({
  queryType: "id",
  query: "",
  indexType: "HNSW",
  metric: "cosine",
  k: 10,
  filters: { cell_type: "" },
})

async function onSearch(payload: any) {
  const res = await search(payload)
  results.value = res.results
  lastElapsed.value = res.elapsed
}
</script>

<style scoped>
.results-table { width:100%; border-collapse: collapse; }
.results-table th, .results-table td { border:1px solid #ddd; padding:6px }
.empty { color:#888; padding:12px }
.meta { margin-bottom:8px }
</style>
