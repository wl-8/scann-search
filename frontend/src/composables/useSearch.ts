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
			const hits = resp?.hits ?? resp?.items ?? resp?.points ?? []
			const results = Array.isArray(hits) && hits.length
				? hits.map((hit: any) => {
					// normalize embedding point vs search hit
					if (hit.cell_id && (hit.x !== undefined || hit.umap_x !== undefined)) {
						return {
							rank: hit.rank ?? null,
							id: hit.cell_id,
							distance: hit.distance ?? hit.score ?? null,
							row_index: hit.row_index ?? hit.row_index ?? null,
							cell_type: hit.obs?.cell_type ?? hit.label ?? "-",
							dataset: hit.dataset ?? `dataset_${resp.dataset_id}`,
							metadata: hit.obs ?? hit.metadata ?? {},
							umap_x: hit.umap_x ?? hit.x,
							umap_y: hit.umap_y ?? hit.y,
							umap_z: hit.umap_z ?? hit.z ?? null,
						}
					}
					// default fallback
					return {
						rank: hit.rank ?? null,
						id: hit.cell_id ?? hit.id,
						distance: hit.distance ?? hit.score ?? null,
						row_index: hit.row_index ?? hit.rowIndex ?? null,
						cell_type: hit.obs?.cell_type ?? hit.cell_type ?? hit.cellType ?? "-",
						dataset: hit.dataset ?? `dataset_${resp.dataset_id}`,
						metadata: hit.obs ?? hit.metadata ?? {},
					}
				})
				: []
			const total = resp?.n_returned ?? resp?.total ?? resp?.n_returned ?? results.length
			loading.value = false
			return { results, elapsed: Math.round(resp?.latency_ms ?? elapsed), total, raw: resp }
		} catch (err) {
			// fallback to local mock when backend unreachable
			console.warn("Search API failed, falling back to mock", err)
			await new Promise((r) => setTimeout(r, 300 + Math.random() * 300))
			const k = Math.max(1, payload.k ?? 10)
			const results = Array.from({ length: k }).map((_, i) => ({
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
