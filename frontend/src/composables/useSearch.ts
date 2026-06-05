// 封装真实后端检索调用逻辑。
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
					if (hit.cell_id && (hit.x !== undefined || hit.umap_x !== undefined)) {
						return {
							rank: hit.rank ?? null,
							id: hit.cell_id,
							distance: hit.distance ?? hit.score ?? null,
							row_index: hit.row_index ?? null,
							cell_type: hit.obs?.cell_type ?? hit.label ?? "-",
							dataset: hit.dataset ?? `dataset_${resp.dataset_id}`,
							metadata: hit.obs ?? hit.metadata ?? {},
							umap_x: hit.umap_x ?? hit.x,
							umap_y: hit.umap_y ?? hit.y,
							umap_z: hit.umap_z ?? hit.z ?? null,
						}
					}
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
			const total = resp?.n_returned ?? resp?.total ?? results.length
			return { results, elapsed: Math.round(resp?.latency_ms ?? elapsed), total, raw: resp }
		} finally {
			loading.value = false
		}
	}

	return { loading, search }
}

export type UseSearchReturn = ReturnType<typeof useSearch>
