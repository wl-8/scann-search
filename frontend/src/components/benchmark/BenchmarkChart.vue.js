/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Plotly from "plotly.js-dist-min";
const props = defineProps();
const chartEl = ref(null);
function render() {
    if (!chartEl.value)
        return;
    const results = props.results ?? [];
    const labels = results.map((r) => r.algorithm);
    const latency = results.map((r) => r.avg_latency_ms);
    const recall = results.map((r) => r.recall_at_k);
    const barTrace = {
        type: "bar",
        name: "Avg Latency (ms)",
        x: labels,
        y: latency,
        marker: { color: "#60a5fa" },
        yaxis: "y1",
    };
    const lineTrace = {
        type: "scatter",
        mode: "lines+markers",
        name: `Recall@${props.k ?? "K"}`,
        x: labels,
        y: recall,
        marker: { color: "#22c55e", size: 8 },
        line: { width: 2.5 },
        yaxis: "y2",
    };
    const layout = {
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
    };
    Plotly.react(chartEl.value, [barTrace, lineTrace], layout, { responsive: true, displaylogo: false });
}
onMounted(render);
watch(() => [props.results, props.k], render, { deep: true });
onBeforeUnmount(() => {
    if (chartEl.value)
        Plotly.purge(chartEl.value);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "chartEl",
    ...{ class: "chart-canvas" },
});
/** @type {typeof __VLS_ctx.chartEl} */ ;
/** @type {__VLS_StyleScopedClasses['chart-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-canvas']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            chartEl: chartEl,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
