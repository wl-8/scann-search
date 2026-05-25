<template>
	<div ref="plotEl" class="plot-wrap"></div>
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
	const points = props.points || []
	const dim = props.dimension ?? 2
	const colorField = (props.colorBy ?? "cell_type") as keyof Point
	const categories = points.map((p) => String((p as any)[colorField] ?? "unknown"))
	const colorMap = categoryColorMap(categories)
	const colors = categories.map((c) => colorMap.get(c) ?? "#64748b")

	const baseTrace: any = {
		type: dim === 3 ? "scatter3d" : "scatter",
		mode: "markers",
		x: points.map((p) => p.umap_x),
		y: points.map((p) => p.umap_y),
		marker: {
			size: points.map((p) => (props.selectedId && p.id === props.selectedId ? 12 : 8)),
			color: colors,
			opacity: 0.9,
			line: {
				width: points.map((p) => (props.selectedId && p.id === props.selectedId ? 3 : 0)),
				color: "#111827",
			},
		},
		text: points.map((p) => p.id),
		hovertemplate: points.map((p, idx) => {
			const extra = dim === 3 ? `<br>z: ${p.umap_z ?? 0}` : ""
			return `${p.id}<br>${colorField}: ${categories[idx]}<br>x: ${p.umap_x}<br>y: ${p.umap_y}${extra}<extra></extra>`
		}),
	}

	if (dim === 3) baseTrace.z = points.map((p) => p.umap_z ?? 0)

	const layout = {
		margin: { l: 0, r: 0, t: 8, b: 0 },
		height: 520,
		paper_bgcolor: "#fff",
		plot_bgcolor: "#fff",
		showlegend: false,
		scene: dim === 3 ? { xaxis: { title: "UMAP1" }, yaxis: { title: "UMAP2" }, zaxis: { title: "UMAP3" } } : undefined,
	}

	Plotly.newPlot(plotEl.value, [baseTrace], layout as any, { responsive: true, displaylogo: false })
	;(plotEl.value as any).on?.("plotly_click", (ev: any) => {
		const idx = ev?.points?.[0]?.pointIndex
		if (typeof idx === "number") emit("point-click", points[idx])
	})
}

onMounted(render)
watch(() => [props.points, props.dimension, props.colorBy, props.selectedId], render, { deep: true })
onBeforeUnmount(() => {
	if (plotEl.value) Plotly.purge(plotEl.value)
})
</script>

<style scoped>
.plot-wrap { width: 100%; min-height: 520px; }
</style>
