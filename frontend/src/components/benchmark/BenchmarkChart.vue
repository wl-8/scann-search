<template>
	<div class="chart-shell">
		<div ref="chartEl" class="chart-canvas"></div>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import Plotly from "plotly.js-dist-min"

type BenchmarkResultItem = {
	algorithm: string
	recall_at_k: number
	avg_latency_ms: number
	p95_latency_ms: number
	qps: number
	build_time_ms: number
}

const props = defineProps<{
	results: BenchmarkResultItem[]
	k?: number
}>()

const chartEl = ref<HTMLDivElement | null>(null)

function render() {
	if (!chartEl.value) return
	const results = props.results ?? []
	const labels = results.map((r) => r.algorithm)
	const latency = results.map((r) => r.avg_latency_ms)
	const recall = results.map((r) => r.recall_at_k)

	const barTrace: any = {
		type: "bar",
		name: "Avg Latency (ms)",
		x: labels,
		y: latency,
		marker: { color: "#60a5fa" },
		yaxis: "y1",
	}

	const lineTrace: any = {
		type: "scatter",
		mode: "lines+markers",
		name: `Recall@${props.k ?? "K"}`,
		x: labels,
		y: recall,
		marker: { color: "#22c55e", size: 8 },
		line: { width: 2.5 },
		yaxis: "y2",
	}

	const layout: any = {
		margin: { l: 50, r: 50, t: 20, b: 40 },
		height: 360,
		paper_bgcolor: "#fff",
		plot_bgcolor: "#fff",
		legend: { orientation: "h", y: -0.2 },
		yaxis: { title: "Latency (ms)", rangemode: "tozero" },
		yaxis2: {
			title: "Recall",
			overlaying: "y",
			side: "right",
			range: [0, 1],
		},
	}

	Plotly.react(chartEl.value, [barTrace, lineTrace], layout, { responsive: true, displaylogo: false })
}

onMounted(render)
watch(() => [props.results, props.k], render, { deep: true })
onBeforeUnmount(() => {
	if (chartEl.value) Plotly.purge(chartEl.value)
})
</script>

<style scoped>
.chart-shell {
	border-radius: 14px;
	background: #fff;
	border: 1px solid rgba(148, 163, 184, 0.14);
	padding: 12px;
}

.chart-canvas {
	width: 100%;
}

.chart-shell {
	border-radius: 8px;
	background: #ffffff;
	border-color: var(--bio-line);
	padding: 10px;
}
</style>
