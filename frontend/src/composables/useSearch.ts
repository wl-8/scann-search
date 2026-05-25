// 封装检索调用逻辑（当前为本地 mock 实现，后续可替换为真实 API 调用）
import { ref } from "vue"

export function useSearch() {
	const loading = ref(false)

	async function search(payload: {
		queryType: "id" | "vector"
		query: string
		indexType: string
		metric: string
		k: number
		filters?: Record<string, string>
	}) {
		loading.value = true
		const start = performance.now()
		// simulate network / compute latency
		await new Promise((r) => setTimeout(r, 300 + Math.random() * 300))

		// produce mock results
		const results = Array.from({ length: Math.max(1, payload.k) }).map((_, i) => ({
			rank: i + 1,
			id: `cell_${Math.floor(Math.random() * 100000)}`,
			score: Number((Math.random() * (1 - 0.5) + 0.5).toFixed(4)),
			cell_type: ["T-cell", "B-cell", "Monocyte", "NK-cell"][Math.floor(Math.random() * 4)],
			dataset: ["datasetA", "datasetB"][Math.floor(Math.random() * 2)],
		}))

		const elapsed = Math.round(performance.now() - start)
		loading.value = false
		return { results, elapsed }
	}

	return { loading, search }
}

export type UseSearchReturn = ReturnType<typeof useSearch>
