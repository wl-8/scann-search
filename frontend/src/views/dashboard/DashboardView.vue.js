/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { listDatasets, listIndexes } from "@/api/search";
const router = useRouter();
const auth = useAuthStore();
const datasetCount = ref("—");
const indexCount = ref("—");
const totalCells = ref(0);
const isOnline = ref(false);
const showUserMenu = ref(false);
const latency = ref(0);
const memory = ref(0);
const qps = ref(0);
const load = ref(0);
const animatedLatency = ref(0);
const animatedMemory = ref(0);
const animatedQps = ref(0);
const animatedLoad = ref(0);
const latencyHistory = ref([]);
const memoryHistory = ref([]);
const qpsHistory = ref([]);
const totalCellsDisplay = computed(() => {
    if (totalCells.value === 0)
        return "—";
    return totalCells.value >= 10000
        ? `${(totalCells.value / 10000).toFixed(1)}万`
        : String(totalCells.value);
});
const latencySparklinePath = computed(() => {
    const data = latencyHistory.value;
    if (data.length < 2)
        return "";
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    return data.map((val, idx) => {
        const x = (idx / (data.length - 1)) * 100;
        const y = 22 - ((val - min) / range) * 20;
        return idx === 0 ? `M${x},${y}` : `L${x},${y}`;
    }).join(" ");
});
const memorySparklinePath = computed(() => {
    const data = memoryHistory.value;
    if (data.length < 2)
        return "";
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    return data.map((val, idx) => {
        const x = (idx / (data.length - 1)) * 100;
        const y = 22 - ((val - min) / range) * 20;
        return idx === 0 ? `M${x},${y}` : `L${x},${y}`;
    }).join(" ");
});
const qpsSparklinePath = computed(() => {
    const data = qpsHistory.value;
    if (data.length < 2)
        return "";
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    return data.map((val, idx) => {
        const x = (idx / (data.length - 1)) * 100;
        const y = 22 - ((val - min) / range) * 20;
        return idx === 0 ? `M${x},${y}` : `L${x},${y}`;
    }).join(" ");
});
function animateNumber(target, current, duration = 1500) {
    const start = current.value;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        current.value = Math.floor(start + (target - start) * easeProgress);
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}
function updatePerformanceMetrics() {
    latency.value = Math.floor(Math.random() * 20) + 5;
    memory.value = Math.floor(Math.random() * 500) + 200;
    qps.value = Math.floor(Math.random() * 100) + 50;
    load.value = Math.floor(Math.random() * 40) + 30;
    latencyHistory.value.push(latency.value);
    memoryHistory.value.push(memory.value);
    qpsHistory.value.push(qps.value);
    if (latencyHistory.value.length > 20)
        latencyHistory.value.shift();
    if (memoryHistory.value.length > 20)
        memoryHistory.value.shift();
    if (qpsHistory.value.length > 20)
        qpsHistory.value.shift();
}
let metricsInterval = null;
async function loadMetrics() {
    try {
        const [datasets, indexes] = await Promise.all([listDatasets(), listIndexes()]);
        datasetCount.value = datasets.length;
        indexCount.value = indexes.length;
        totalCells.value = datasets.reduce((sum, d) => sum + (d.n_cells ?? 0), 0);
        isOnline.value = true;
        updatePerformanceMetrics();
        animateNumber(latency.value, animatedLatency);
        animateNumber(memory.value, animatedMemory);
        animateNumber(qps.value, animatedQps);
        animateNumber(load.value, animatedLoad);
        metricsInterval = window.setInterval(() => {
            updatePerformanceMetrics();
            animatedLatency.value = latency.value;
            animatedMemory.value = memory.value;
            animatedQps.value = qps.value;
            animatedLoad.value = load.value;
        }, 2000);
    }
    catch {
        isOnline.value = false;
    }
}
function go(path) {
    router.push(path);
}
function toggleUserMenu() {
    showUserMenu.value = !showUserMenu.value;
}
function handleLogout() {
    auth.logout();
    showUserMenu.value = false;
}
onMounted(loadMetrics);
onUnmounted(() => {
    if (metricsInterval) {
        clearInterval(metricsInterval);
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['topbar']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-button']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-button']} */ ;
/** @type {__VLS_StyleScopedClasses['user-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['user-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['banner-card']} */ ;
/** @type {__VLS_StyleScopedClasses['banner-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['ripple']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['ripple']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['ripple']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['performance-monitor']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-list']} */ ;
/** @type {__VLS_StyleScopedClasses['info-list']} */ ;
/** @type {__VLS_StyleScopedClasses['list-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['metrics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['info-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metrics']} */ ;
/** @type {__VLS_StyleScopedClasses['topbar']} */ ;
/** @type {__VLS_StyleScopedClasses['user-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-container']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metrics']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dashboard-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dashboard-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "topbar reveal reveal-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-block" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-mark" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M3 3h18v18H3z",
    fill: "#1A73E8",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M12 5l7 7-7 7M5 12l7-7",
    stroke: "#fff",
    'stroke-width': "2",
    'stroke-linecap': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-copy" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "system-status" },
    'aria-label': (__VLS_ctx.isOnline ? '系统状态：连接正常' : '系统状态：离线'),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "status-dot" },
    ...{ class: ({ 'status-dot--offline': !__VLS_ctx.isOnline }) },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.isOnline ? '系统在线' : '后端离线');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toggleUserMenu) },
    ...{ class: "avatar-button" },
    type: "button",
    'aria-label': "用户菜单",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "12",
    cy: "8",
    r: "4",
    fill: "#1A73E8",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M4 20c1.8-3.9 5-6 8-6s6.2 2.1 8 6",
    fill: "#1A73E8",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "avatar-button__hint" },
    'aria-hidden': "true",
});
if (__VLS_ctx.showUserMenu) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "user-menu" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.handleLogout) },
        ...{ class: "user-menu-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "banner-card reveal reveal-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "banner-copy" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "banner-tag" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "section-card actions-card reveal reveal-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-heading" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "section-kicker" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.go('/search');
        } },
    ...{ class: "action-button action-button--primary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ripple-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ripple" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.go('/datasets');
        } },
    ...{ class: "action-button action-button--secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ripple-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ripple" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.go('/indexes');
        } },
    ...{ class: "action-button action-button--secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ripple-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ripple" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.go('/visualize');
        } },
    ...{ class: "action-button action-button--secondary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ripple-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ripple" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "metrics-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-card metric-card--dataset reveal reveal-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-icon" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M4 7.5h16v10H4z",
    fill: "#E8F0FE",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M4 7.5l8-4 8 4M4 12h16",
    stroke: "#1A73E8",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "metric-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-value" },
});
(__VLS_ctx.datasetCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-card metric-card--index reveal reveal-5" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-icon" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "11",
    cy: "11",
    r: "5.5",
    fill: "#E8F0FE",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M15.5 15.5L20 20",
    stroke: "#1A73E8",
    'stroke-width': "2",
    'stroke-linecap': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "metric-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-value" },
});
(__VLS_ctx.indexCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-card metric-card--cells reveal reveal-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-icon" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "12",
    cy: "12",
    r: "8",
    fill: "#E8F0FE",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M12 8v4l3 2",
    stroke: "#1A73E8",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "metric-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-value" },
});
(__VLS_ctx.totalCellsDisplay);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "performance-monitor reveal reveal-7" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ class: "perf-icon" },
    viewBox: "0 0 24 24",
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M3 3v18h18",
    stroke: "#1A73E8",
    'stroke-width': "2",
    'stroke-linecap': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M18.7 8l-5.1 5.2-2.8-2.7L7 14.3",
    stroke: "#1A73E8",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-status" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-status-dot" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-status-text" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metrics" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-value-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-value" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-number perf-number--blue" },
});
(__VLS_ctx.animatedLatency);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-unit" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ class: "perf-sparkline" },
    viewBox: "0 0 100 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: (__VLS_ctx.latencySparklinePath),
    fill: "none",
    stroke: "#1A73E8",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-value-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-value" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-number perf-number--green" },
});
(__VLS_ctx.animatedMemory);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-unit" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ class: "perf-sparkline" },
    viewBox: "0 0 100 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: (__VLS_ctx.memorySparklinePath),
    fill: "none",
    stroke: "#34A853",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-value-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-value" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-number perf-number--yellow" },
});
(__VLS_ctx.animatedQps);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-unit" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ class: "perf-sparkline" },
    viewBox: "0 0 100 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: (__VLS_ctx.qpsSparklinePath),
    fill: "none",
    stroke: "#FBBC05",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-value-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-value" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-number perf-number--red" },
});
(__VLS_ctx.animatedLoad);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-unit" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-load-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-load-fill" },
    ...{ style: ({ width: __VLS_ctx.animatedLoad + '%' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "info-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-card reveal reveal-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-card-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ class: "info-list" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "list-icon" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M20 6L9 17l-5-5",
    stroke: "#1A73E8",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "list-icon" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M20 6L9 17l-5-5",
    stroke: "#1A73E8",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "list-icon" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M20 6L9 17l-5-5",
    stroke: "#1A73E8",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-card reveal reveal-9" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-card-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ class: "info-list" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "list-icon" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M20 6L9 17l-5-5",
    stroke: "#1A73E8",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "list-icon" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M20 6L9 17l-5-5",
    stroke: "#1A73E8",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
/** @type {__VLS_StyleScopedClasses['dashboard-page']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-container']} */ ;
/** @type {__VLS_StyleScopedClasses['topbar']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-1']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-block']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['system-status']} */ ;
/** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-button']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-button__hint']} */ ;
/** @type {__VLS_StyleScopedClasses['user-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['user-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['banner-card']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-2']} */ ;
/** @type {__VLS_StyleScopedClasses['banner-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['banner-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-card']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-3']} */ ;
/** @type {__VLS_StyleScopedClasses['section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['section-kicker']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['ripple-container']} */ ;
/** @type {__VLS_StyleScopedClasses['ripple']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['ripple-container']} */ ;
/** @type {__VLS_StyleScopedClasses['ripple']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['ripple-container']} */ ;
/** @type {__VLS_StyleScopedClasses['ripple']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['ripple-container']} */ ;
/** @type {__VLS_StyleScopedClasses['ripple']} */ ;
/** @type {__VLS_StyleScopedClasses['metrics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card--dataset']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-4']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card--index']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-5']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card--cells']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-6']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['performance-monitor']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-7']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-header']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-title']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-status']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-status-text']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metrics']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value-container']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number--blue']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-unit']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-sparkline']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value-container']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number--green']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-unit']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-sparkline']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value-container']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number--yellow']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-unit']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-sparkline']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value-container']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number--red']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-unit']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-load-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-load-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['info-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-8']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['info-list']} */ ;
/** @type {__VLS_StyleScopedClasses['list-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['list-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['list-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-9']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['info-list']} */ ;
/** @type {__VLS_StyleScopedClasses['list-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['list-icon']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            datasetCount: datasetCount,
            indexCount: indexCount,
            isOnline: isOnline,
            showUserMenu: showUserMenu,
            animatedLatency: animatedLatency,
            animatedMemory: animatedMemory,
            animatedQps: animatedQps,
            animatedLoad: animatedLoad,
            totalCellsDisplay: totalCellsDisplay,
            latencySparklinePath: latencySparklinePath,
            memorySparklinePath: memorySparklinePath,
            qpsSparklinePath: qpsSparklinePath,
            go: go,
            toggleUserMenu: toggleUserMenu,
            handleLogout: handleLogout,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
