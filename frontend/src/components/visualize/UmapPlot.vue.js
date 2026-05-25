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
        const baseTrace = {
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
                const extra = dim === 3 ? `<br>z: ${p.umap_z ?? 0}` : "";
                return `${p.id}<br>${colorField}: ${categories[idx]}<br>x: ${p.umap_x}<br>y: ${p.umap_y}${extra}<extra></extra>`;
            }),
        };
        if (dim === 3)
            baseTrace.z = points.map((p) => p.umap_z ?? 0);
        const layout = {
            margin: { l: 0, r: 0, t: 8, b: 0 },
            height: 520,
            paper_bgcolor: "#fff",
            plot_bgcolor: "#fff",
            showlegend: false,
            scene: dim === 3 ? { xaxis: { title: "UMAP1" }, yaxis: { title: "UMAP2" }, zaxis: { title: "UMAP3" } } : undefined,
        };
        Plotly.newPlot(plotEl.value, [baseTrace], layout, { responsive: true, displaylogo: false });
        plotEl.value.on?.("plotly_click", (ev) => {
            const idx = ev?.points?.[0]?.pointIndex;
            if (typeof idx === "number")
                emit("point-click", points[idx]);
        });
    }
    catch (error) {
        console.error("Failed to render UMAP plot:", error);
    }
}
onMounted(render);
watch(() => [props.points, props.dimension, props.colorBy, props.selectedId], render, { deep: true });
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
