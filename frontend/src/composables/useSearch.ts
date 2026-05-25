// 封装检索调用逻辑（当前为本地 mock 实现，后续可替换为真实 API 调用）
import { ref } from "vue"
import * as searchApi from "@/api/search"

export function useSearch() {
	const loading = ref(false)

	async function search(payload: searchApi.SearchPayload) {
		loading.value = true
		const start = performance.now()

		try {
			const resp = await searchApi.search(payload)
			const elapsed = Math.round(performance.now() - start)
			// backend expected shape: { items: [], total: number } or { results: [] }
			const results = resp?.items ?? resp?.results ?? []
			const total = resp?.total ?? results.length
			loading.value = false
			return { results, elapsed, total }
		} catch (err) {
			// fallback to local mock when backend unreachable
			console.warn("Search API failed, falling back to mock", err)
			await new Promise((r) => setTimeout(r, 300 + Math.random() * 300))
			const results = Array.from({ length: Math.max(1, payload.k) }).map((_, i) => ({
				rank: i + 1,
				id: `cell_${Math.floor(Math.random() * 100000)}`,
				score: Number((Math.random() * (1 - 0.5) + 0.5).toFixed(4)),
				cell_type: ["T-cell", "B-cell", "Monocyte", "NK-cell"][Math.floor(Math.random() * 4)],
				dataset: ["datasetA", "datasetB"][Math.floor(Math.random() * 2)],
			}))
			const elapsed = Math.round(performance.now() - start)
			loading.value = false
			return { results, elapsed, total: results.length }
		}
	}

	return { loading, search }
}

export type UseSearchReturn = ReturnType<typeof useSearch>
