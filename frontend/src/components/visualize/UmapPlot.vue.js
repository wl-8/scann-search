/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Plotly from "plotly.js-dist-min";
const props = defineProps();
const emit = defineEmits();
const plotEl = ref(null);
function categoryColorMap(values) {
    const palette = ["#2563eb", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#14b8a6"];
    const unique = Array.from(new Set(values.filter(Boolean)));
    return new Map(unique.map((v, i) => [v, palette[i % palette.length]]));
}
function render() {
    if (!plotEl.value)
        return;
    try {
        const points = props.points || [];
        const dim = props.dimension ?? 2;
        const colorField = (props.colorBy ?? "cell_type");
        const categories = points.map((p) => String(p[colorField] ?? "unknown"));
        const colorMap = categoryColorMap(categories);
        const colors = categories.map((c) => colorMap.get(c) ?? "#64748b");
        const useWebGL2D = dim === 2 && points.length > 2000;
        // main trace (all points)
        const mainTrace = {
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
                const extra = dim === 3 ? `<br>z: ${p.umap_z ?? 0}` : "";
                return `${p.id}<br>${colorField}: ${categories[idx]}<br>x: ${p.umap_x}<br>y: ${p.umap_y}${extra}<extra></extra>`;
            }),
        };
        if (dim === 3)
            mainTrace.z = points.map((p) => p.umap_z ?? 0);
        // highlight trace for located points
        const extra = (props.highlightPoints ?? []).filter((p) => p && p.id);
        const highlightPointsTrace = extra.length
            ? {
                type: dim === 3 ? "scatter3d" : "scattergl",
                mode: "markers",
                x: extra.map((p) => p.umap_x),
                y: extra.map((p) => p.umap_y),
                marker: { size: 12, color: "#111827", opacity: 1, line: { width: 2, color: "#fff" } },
                text: extra.map((p) => p.id),
            }
            : null;
        if (dim === 3 && highlightPointsTrace)
            highlightPointsTrace.z = extra.map((p) => p.umap_z ?? 0);
        // highlight trace for selected point (single point)
        const highlight = props.selectedId ? points.find((p) => p.id === props.selectedId) ?? null : null;
        const selectedTrace = highlight
            ? {
                type: dim === 3 ? "scatter3d" : "scattergl",
                mode: "markers",
                x: [highlight.umap_x],
                y: [highlight.umap_y],
                marker: { size: 14, color: "#0f172a", opacity: 1, line: { width: 2, color: "#fff" } },
                text: [highlight.id],
            }
            : null;
        if (dim === 3 && selectedTrace)
            selectedTrace.z = [highlight?.umap_z ?? 0];
        const traces = [mainTrace];
        if (highlightPointsTrace)
            traces.push(highlightPointsTrace);
        if (selectedTrace)
            traces.push(selectedTrace);
        const layout = {
            margin: { l: 0, r: 0, t: 8, b: 0 },
            height: 520,
            paper_bgcolor: "#fff",
            plot_bgcolor: "#fff",
            showlegend: false,
        };
        if (dim === 3) {
            layout.scene = { xaxis: { title: "UMAP1" }, yaxis: { title: "UMAP2" }, zaxis: { title: "UMAP3" } };
        }
        Plotly.react(plotEl.value, traces, layout, { responsive: true, displaylogo: false });
        plotEl.value.removeAllListeners?.("plotly_click");
        const handler = (ev) => {
            const hit = ev?.points?.[0];
            if (!hit)
                return;
            // 获取点击的数据点信息
            const idx = hit.pointIndex;
            const curve = hit.curveNumber;
            const pointText = hit.text || hit.data?.text?.[idx] || '';
            // 调试：输出点击信息
            console.log("Plot click event:", { idx, curve, pointText, traces: traces.length, hit });
            // 优先通过curve和index定位点
            if (typeof idx === "number" && idx >= 0) {
                // 情况1：点击主轨迹（所有点）
                if (curve === 0 && idx < points.length) {
                    emit("point-click", points[idx]);
                    return;
                }
                // 情况2：点击高亮轨迹（highlightPoints）
                if (highlightPointsTrace && curve === 1 && idx < extra.length) {
                    const hp = extra[idx];
                    if (hp) {
                        emit("point-click", {
                            id: hp.id,
                            umap_x: hp.umap_x,
                            umap_y: hp.umap_y,
                            umap_z: hp.umap_z,
                        });
                    }
                    return;
                }
                // 情况3：点击选中点轨迹（没有highlightPoints时在curve=1）
                if (!highlightPointsTrace && curve === 1 && highlight) {
                    emit("point-click", highlight);
                    return;
                }
                // 情况4：点击选中点轨迹（有highlightPoints时在curve=2）
                if (highlightPointsTrace && curve === 2 && highlight) {
                    emit("point-click", highlight);
                    return;
                }
            }
            // 回退：尝试通过text字段查找点（3D模式下常用）
            if (pointText && typeof pointText === "string") {
                // 在主点列表中查找
                const found = points.find(p => p.id === pointText);
                if (found) {
                    emit("point-click", found);
                    return;
                }
                // 在高亮列表中查找
                const foundExtra = extra.find(p => p.id === pointText);
                if (foundExtra) {
                    emit("point-click", {
                        id: foundExtra.id,
                        umap_x: foundExtra.umap_x,
                        umap_y: foundExtra.umap_y,
                        umap_z: foundExtra.umap_z,
                    });
                    return;
                }
            }
            // 最后尝试：通过坐标匹配（3D模式下可能需要）
            if (typeof hit.x === "number" && typeof hit.y === "number") {
                const targetX = hit.x;
                const targetY = hit.y;
                const targetZ = hit.z;
                // 查找最近的点
                let closestPoint = null;
                let minDist = Infinity;
                for (const p of points) {
                    const dx = p.umap_x - targetX;
                    const dy = p.umap_y - targetY;
                    const dz = dim === 3 ? (p.umap_z ?? 0) - (targetZ ?? 0) : 0;
                    const dist = dx * dx + dy * dy + dz * dz;
                    if (dist < minDist && dist < 0.01) { // 阈值匹配
                        minDist = dist;
                        closestPoint = p;
                    }
                }
                if (closestPoint) {
                    emit("point-click", closestPoint);
                }
            }
        };
        plotEl.value.on?.("plotly_click", handler);
    }
    catch (error) {
        console.error("Failed to render UMAP plot:", error);
    }
}
onMounted(render);
watch(() => [props.points, props.dimension, props.colorBy, props.selectedId, props.highlightPoints], render, { deep: true });
onBeforeUnmount(() => {
    if (plotEl.value)
        Plotly.purge(plotEl.value);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "plot-shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "plot-shell__grid" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "plotEl",
    ...{ class: "plot-wrap" },
});
/** @type {typeof __VLS_ctx.plotEl} */ ;
/** @type {__VLS_StyleScopedClasses['plot-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['plot-shell__grid']} */ ;
/** @type {__VLS_StyleScopedClasses['plot-wrap']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            plotEl: plotEl,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
