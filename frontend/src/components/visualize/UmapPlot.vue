<template>
	<div class="plot-shell">
		<div class="plot-shell__grid" aria-hidden="true"></div>
		<div ref="plotEl" class="plot-wrap"></div>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import Plotly from "plotly.js-dist-min"

type Point = {
	id: string
	umap_x: number
	umap_y: number
	umap_z?: number
	cell_type?: string
	dataset?: string
	metadata?: Record<string, any>
}

const props = defineProps<{
	points: Point[]
	dimension?: 2 | 3
	colorBy?: string
	selectedId?: string | null
}>()

const emit = defineEmits<{ (e: "point-click", point: Point): void }>()

const plotEl = ref<HTMLDivElement | null>(null)

function categoryColorMap(values: string[]) {
	const palette = ["#2563eb", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#14b8a6"]
	const unique = Array.from(new Set(values.filter(Boolean)))
	return new Map(unique.map((v, i) => [v, palette[i % palette.length]]))
}

function render() {
	if (!plotEl.value) return
	try {
		const points = props.points || []
		const dim = props.dimension ?? 2
		const colorField = (props.colorBy ?? "cell_type") as keyof Point
		const categories = points.map((p) => String((p as any)[colorField] ?? "unknown"))
		const colorMap = categoryColorMap(categories)
		const colors = categories.map((c) => colorMap.get(c) ?? "#64748b")

		const useWebGL2D = dim === 2 && points.length > 2000

		// main trace (all points)
		const mainTrace: any = {
			type: useWebGL2D ? "scattergl" : dim === 3 ? "scatter3d" : "scatter",
			mode: "markers",
			x: points.map((p) => p.umap_x),
			y: points.map((p) => p.umap_y),
			marker: {
				size: 8,
				color: colors,
				opacity: 0.8,
				line: { width: 0 },
			},
			text: points.map((p) => p.id),
			hovertemplate: points.map((p, idx) => {
				const extra = dim === 3 ? `<br>z: ${p.umap_z ?? 0}` : ""
				return `${p.id}<br>${colorField}: ${categories[idx]}<br>x: ${p.umap_x}<br>y: ${p.umap_y}${extra}<extra></extra>`
			}),
		}
		if (dim === 3) mainTrace.z = points.map((p) => p.umap_z ?? 0)

		// highlight trace for selected point (single point)
		const highlight = props.selectedId ? points.find((p) => p.id === props.selectedId) ?? null : null
		const highlightTrace: any = highlight
			? {
				type: dim === 3 ? "scatter3d" : "scattergl",
				mode: "markers",
				x: [highlight.umap_x],
				y: [highlight.umap_y],
				marker: { size: 14, color: "#111827", opacity: 1, line: { width: 2, color: "#fff" } },
				text: [highlight.id],
			}
			: null

		const traces = highlightTrace ? [mainTrace, highlightTrace] : [mainTrace]

		const layout: any = {
			margin: { l: 0, r: 0, t: 8, b: 0 },
			height: 520,
			paper_bgcolor: "#fff",
			plot_bgcolor: "#fff",
			showlegend: false,
		}
		if (dim === 3) {
			layout.scene = { xaxis: { title: "UMAP1" }, yaxis: { title: "UMAP2" }, zaxis: { title: "UMAP3" } }
		}

		Plotly.react(plotEl.value, traces, layout as any, { responsive: true, displaylogo: false })

		// 清除旧 click handler，避免 re-render 时重复绑定
		;(plotEl.value as any).removeAllListeners?.("plotly_click")
		const handler = (ev: any) => {
			const idx = ev?.points?.[0]?.pointIndex
			if (typeof idx === "number") emit("point-click", points[idx])
		}
		;(plotEl.value as any).on?.("plotly_click", handler)
	} catch (error) {
		console.error("Failed to render UMAP plot:", error)
	}
}

onMounted(render)
watch(() => [props.points, props.dimension, props.colorBy, props.selectedId], render, { deep: true })
onBeforeUnmount(() => {
	if (plotEl.value) Plotly.purge(plotEl.value)
})
</script>

<style scoped>
.plot-shell {
	position: relative;
	min-height: 520px;
	border-radius: 14px;
	overflow: hidden;
	background:
		radial-gradient(circle at 20% 20%, rgba(0, 123, 255, 0.04) 0 1px, transparent 1px),
		radial-gradient(circle at 80% 70%, rgba(0, 123, 255, 0.035) 0 1px, transparent 1px),
		linear-gradient(180deg, rgba(248, 250, 252, 0.9), rgba(255, 255, 255, 0.96));
}

.plot-shell__grid {
	position: absolute;
	inset: 0;
	pointer-events: none;
	opacity: 0.9;
	background-image:
		linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
		linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
	background-size: 56px 56px;
	mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.12));
}

.plot-wrap {
	position: relative;
	z-index: 1;
	width: 100%;
	min-height: 520px;
	background: transparent;
}
</style>
