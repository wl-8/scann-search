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
	highlightPoints?: Array<{ id: string; umap_x: number; umap_y: number; umap_z?: number }>
	autoRotate?: boolean
	opacity?: number
}>()

const emit = defineEmits<{ (e: "point-click", point: Point): void }>()

const plotEl = ref<HTMLDivElement | null>(null)

function categoryColorMap(values: string[]) {
	const palette = ["#3b1b48", "#b7f230", "#5571d9", "#f5c542", "#4aa3ff", "#ff7a1a", "#2bc7bb", "#d93b00", "#48e87e", "#9b1b10", "#8b5cf6", "#14b8a6"]
	const unique = Array.from(new Set(values.filter(Boolean)))
	return new Map(unique.map((v, i) => [v, palette[i % palette.length]]))
}

function render() {
	if (!plotEl.value) return
	try {
		const points = props.points || []
		if (!points.length) {
			Plotly.purge(plotEl.value)
			return
		}
		const dim = props.dimension ?? 2
		const colorField = props.colorBy ?? "cell_type"
		const categories = points.map((p) => String((p as any)[colorField] ?? (p as any).metadata?.[colorField] ?? "unknown"))
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
				size: dim === 3 ? 6 : 6,
				color: colors,
				opacity: props.opacity ?? 0.82,
				line: { width: dim === 3 ? 1.5 : 1, color: "rgba(255,255,255,0.35)" },
			},
			text: points.map((p) => p.id),
			hovertemplate: points.map((p, idx) => {
				const extra = dim === 3 ? `<br>z: ${(p.umap_z ?? 0).toFixed(3)}` : ""
				return `<b>${p.id}</b><br>${colorField}: ${categories[idx]}<br>x: ${p.umap_x.toFixed(3)}<br>y: ${p.umap_y.toFixed(3)}${extra}<extra></extra>`
			}),
		}
		if (dim === 3) {
			// Z 归一化：让 Z 轴范围与 X/Y 一致，避免所有点挤在同一高度
			const rawZ = points.map((p) => p.umap_z ?? 0)
			const minZ = rawZ.reduce((a, b) => Math.min(a, b), Infinity)
			const maxZ = rawZ.reduce((a, b) => Math.max(a, b), -Infinity)
			const rangeZ = maxZ - minZ || 1
			const xs = points.map((p) => p.umap_x)
			const ys = points.map((p) => p.umap_y)
			const minXY = [...xs, ...ys].reduce((a, b) => Math.min(a, b), Infinity)
			const maxXY = [...xs, ...ys].reduce((a, b) => Math.max(a, b), -Infinity)
			const rangeXY = maxXY - minXY || 1
			mainTrace.z = rawZ.map((z) => minXY + ((z - minZ) / rangeZ) * rangeXY)
		}

		// highlight trace for located points
		const extra = (props.highlightPoints ?? []).filter((p) => p && p.id)
		const highlightPointsTrace: any = extra.length
			? {
				type: dim === 3 ? "scatter3d" : "scattergl",
				mode: "markers",
				x: extra.map((p) => p.umap_x),
				y: extra.map((p) => p.umap_y),
				marker: { size: 12, color: "#111827", opacity: 1, line: { width: 2, color: "#fff" } },
				text: extra.map((p) => p.id),
			}
			: null
		if (dim === 3 && highlightPointsTrace) highlightPointsTrace.z = extra.map((p) => p.umap_z ?? 0)

		// highlight trace for selected point (single point)
		const highlight = props.selectedId ? points.find((p) => p.id === props.selectedId) ?? null : null
		const selectedTrace: any = highlight
			? {
				type: dim === 3 ? "scatter3d" : "scattergl",
				mode: "markers",
				x: [highlight.umap_x],
				y: [highlight.umap_y],
				marker: { size: 14, color: "#0f172a", opacity: 1, line: { width: 2, color: "#fff" } },
				text: [highlight.id],
			}
			: null
		if (dim === 3 && selectedTrace) selectedTrace.z = [highlight?.umap_z ?? 0]

		const traces = [mainTrace]
		if (highlightPointsTrace) traces.push(highlightPointsTrace)
		if (selectedTrace) traces.push(selectedTrace)

		const layout: any = {
			margin: { l: 36, r: 4, t: 4, b: 36 },
			autosize: true,
			paper_bgcolor: "transparent",
			plot_bgcolor: "transparent",
			showlegend: false,
			dragmode: "pan",
			hovermode: dim === 3 ? false : "closest",
			xaxis: { gridcolor: "#eff4f8", zerolinecolor: "#dce5ee", tickfont: { color: "#8b98a8", size: 11 }, linecolor: "#dce5ee" },
			yaxis: { gridcolor: "#eff4f8", zerolinecolor: "#dce5ee", tickfont: { color: "#8b98a8", size: 11 }, linecolor: "#dce5ee" },
		}
		if (dim === 3) {
			layout.paper_bgcolor = "rgba(0,0,0,0)"
			layout.margin = { l: 0, r: 0, t: 0, b: 0 }
			layout.scene = {
				bgcolor: "rgba(0,0,0,0)",
				xaxis: { visible: false },
				yaxis: { visible: false },
				zaxis: { visible: false },
				aspectmode: "auto",
				camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } },
			}
		}

		Plotly.react(plotEl.value, traces, layout as any, { responsive: true, displaylogo: false, scrollZoom: true })
		// 切换维度后容器尺寸可能刚变化，延一帧 resize 让 Plotly 感知正确尺寸
		requestAnimationFrame(() => {
			if (plotEl.value) (Plotly as any).Plots?.resize?.(plotEl.value)
		})
		if (dim === 3 && props.autoRotate) startRotate()
		else if (dim !== 3) stopRotate()

		// 清除旧 click handler，避免 re-render 时重复绑定
		;(plotEl.value as any).removeAllListeners?.("plotly_click")
		const handler = (ev: any) => {
			const hit = ev?.points?.[0]
			if (!hit) return

			// 获取点击的数据点信息
			const idx = hit.pointIndex
			const curve = hit.curveNumber
			const pointText = hit.text || (hit.data?.text?.[idx] as string) || ''

			// 优先通过curve和index定位点
			if (typeof idx === "number" && idx >= 0) {
				// 情况1：点击主轨迹（所有点）
				if (curve === 0 && idx < points.length) {
					emit("point-click", points[idx])
					return
				}

				// 情况2：点击高亮轨迹（highlightPoints）
				if (highlightPointsTrace && curve === 1 && idx < extra.length) {
					const hp = extra[idx]
					if (hp) {
						emit("point-click", {
							id: hp.id,
							umap_x: hp.umap_x,
							umap_y: hp.umap_y,
							umap_z: hp.umap_z,
						})
					}
					return
				}

				// 情况3：点击选中点轨迹（没有highlightPoints时在curve=1）
				if (!highlightPointsTrace && curve === 1 && highlight) {
					emit("point-click", highlight)
					return
				}

				// 情况4：点击选中点轨迹（有highlightPoints时在curve=2）
				if (highlightPointsTrace && curve === 2 && highlight) {
					emit("point-click", highlight)
					return
				}
			}

			// 回退：尝试通过text字段查找点（3D模式下常用）
			if (pointText && typeof pointText === "string") {
				// 在主点列表中查找
				const found = points.find(p => p.id === pointText)
				if (found) {
					emit("point-click", found)
					return
				}
				// 在高亮列表中查找
				const foundExtra = extra.find(p => p.id === pointText)
				if (foundExtra) {
					emit("point-click", {
						id: foundExtra.id,
						umap_x: foundExtra.umap_x,
						umap_y: foundExtra.umap_y,
						umap_z: foundExtra.umap_z,
					})
					return
				}
			}

			// 最后尝试：通过坐标匹配（3D模式下可能需要）
			if (typeof hit.x === "number" && typeof hit.y === "number") {
				const targetX = hit.x
				const targetY = hit.y
				const targetZ = hit.z

				// 查找最近的点
				let closestPoint: Point | null = null
				let minDist = Infinity

				for (const p of points) {
					const dx = p.umap_x - targetX
					const dy = p.umap_y - targetY
					const dz = dim === 3 ? (p.umap_z ?? 0) - (targetZ ?? 0) : 0
					const dist = dx * dx + dy * dy + dz * dz
					if (dist < minDist && dist < 0.01) { // 阈值匹配
						minDist = dist
						closestPoint = p
					}
				}

				if (closestPoint) {
					emit("point-click", closestPoint)
				}
			}
		}
		;(plotEl.value as any).on?.("plotly_click", handler)
	} catch (error) {
		console.error("Failed to render UMAP plot:", error)
	}
}

let rotateRaf: number | null = null
let rotateAngle = 0

function startRotate() {
	if (rotateRaf) cancelAnimationFrame(rotateRaf)
	const el = plotEl.value
	if (!el) return
	const loop = () => {
		rotateAngle += 0.003
		const r = 0.9                                        // 贴近点云边缘，有穿梭感
		const z = 0.15 + Math.sin(rotateAngle * 0.4) * 0.25 // 上下缓慢起伏，像穿越其中
		Plotly.relayout(el as any, {
			'scene.camera.eye': {
				x: r * Math.sin(rotateAngle),
				y: r * Math.cos(rotateAngle),
				z,
			},
		} as any).catch(() => {})
		rotateRaf = requestAnimationFrame(loop)
	}
	rotateRaf = requestAnimationFrame(loop)
}

function stopRotate() {
	if (rotateRaf) { cancelAnimationFrame(rotateRaf); rotateRaf = null }
}

watch(() => props.autoRotate, (val) => {
	if (props.dimension === 3) {
		if (val) startRotate()
		else stopRotate()
	}
})

onMounted(render)
watch(() => [props.points, props.dimension, props.colorBy, props.selectedId, props.highlightPoints, props.opacity], render, { deep: true })
onBeforeUnmount(() => {
	stopRotate()
	if (plotEl.value) Plotly.purge(plotEl.value)
})
</script>

<style scoped>
.plot-shell {
	position: relative;
	height: 100%;
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
	height: 100%;
	background: transparent;
}

.plot-shell {
	border-radius: 0 0 9px 9px;
	background: #ffffff;
	border: none;
	overflow: hidden;
}

.plot-shell__grid {
	opacity: 0.38;
	background-image:
		linear-gradient(#eff4f8 1px, transparent 1px),
		linear-gradient(90deg, #eff4f8 1px, transparent 1px);
	background-size: 44px 44px;
	mask-image: none;
}
</style>
