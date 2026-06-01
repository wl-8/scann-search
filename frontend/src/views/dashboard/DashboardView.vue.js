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
const hoveredMetric = ref(null);
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
function onMenuClick({ key }) {
    if (key === "logout")
        auth.logout();
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
/** @type {__VLS_StyleScopedClasses['brand-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-button']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-button']} */ ;
/** @type {__VLS_StyleScopedClasses['banner-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['performance-monitor']} */ ;
/** @type {__VLS_StyleScopedClasses['banner-card']} */ ;
/** @type {__VLS_StyleScopedClasses['banner-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--accent']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['performance-monitor']} */ ;
/** @type {__VLS_StyleScopedClasses['performance-monitor']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-list']} */ ;
/** @type {__VLS_StyleScopedClasses['info-list']} */ ;
/** @type {__VLS_StyleScopedClasses['list-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['list-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-dropdown-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['metrics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['info-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metrics']} */ ;
/** @type {__VLS_StyleScopedClasses['topbar']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-page']} */ ;
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
    ...{ class: "dashboard-pattern" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dashboard-shell" },
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
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
(__VLS_ctx.isOnline ? '系统在线（连接正常）' : '后端离线');
const __VLS_0 = {}.ADropdown;
/** @type {[typeof __VLS_components.ADropdown, typeof __VLS_components.aDropdown, typeof __VLS_components.ADropdown, typeof __VLS_components.aDropdown, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    trigger: "click",
    placement: "bottomRight",
}));
const __VLS_2 = __VLS_1({
    trigger: "click",
    placement: "bottomRight",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
{
    const { overlay: __VLS_thisSlot } = __VLS_3.slots;
    const __VLS_4 = {}.AMenu;
    /** @type {[typeof __VLS_components.AMenu, typeof __VLS_components.aMenu, typeof __VLS_components.AMenu, typeof __VLS_components.aMenu, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        ...{ 'onClick': {} },
        ...{ class: "user-menu" },
    }));
    const __VLS_6 = __VLS_5({
        ...{ 'onClick': {} },
        ...{ class: "user-menu" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    let __VLS_8;
    let __VLS_9;
    let __VLS_10;
    const __VLS_11 = {
        onClick: (__VLS_ctx.onMenuClick)
    };
    __VLS_7.slots.default;
    const __VLS_12 = {}.AMenuItem;
    /** @type {[typeof __VLS_components.AMenuItem, typeof __VLS_components.aMenuItem, typeof __VLS_components.AMenuItem, typeof __VLS_components.aMenuItem, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        key: "logout",
    }));
    const __VLS_14 = __VLS_13({
        key: "logout",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    __VLS_15.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    var __VLS_15;
    var __VLS_7;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "avatar-button" },
    type: "button",
    'aria-label': "用户菜单",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
    cx: "12",
    cy: "8",
    r: "4",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    d: "M4 20c1.8-3.9 5-6 8-6s6.2 2.1 8 6",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "avatar-button__hint" },
    'aria-hidden': "true",
});
var __VLS_3;
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
const __VLS_16 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onClick': {} },
    type: "primary",
    ...{ class: "action-button action-button--primary" },
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
    type: "primary",
    ...{ class: "action-button action-button--primary" },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onClick: (...[$event]) => {
        __VLS_ctx.go('/search');
    }
};
__VLS_19.slots.default;
var __VLS_19;
const __VLS_24 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onClick': {} },
    ...{ class: "action-button action-button--secondary action-button--accent" },
}));
const __VLS_26 = __VLS_25({
    ...{ 'onClick': {} },
    ...{ class: "action-button action-button--secondary action-button--accent" },
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onClick: (...[$event]) => {
        __VLS_ctx.go('/datasets');
    }
};
__VLS_27.slots.default;
var __VLS_27;
const __VLS_32 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    ...{ 'onClick': {} },
    ...{ class: "action-button action-button--secondary" },
}));
const __VLS_34 = __VLS_33({
    ...{ 'onClick': {} },
    ...{ class: "action-button action-button--secondary" },
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
let __VLS_36;
let __VLS_37;
let __VLS_38;
const __VLS_39 = {
    onClick: (...[$event]) => {
        __VLS_ctx.go('/indexes');
    }
};
__VLS_35.slots.default;
var __VLS_35;
const __VLS_40 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    ...{ 'onClick': {} },
    ...{ class: "action-button action-button--secondary" },
}));
const __VLS_42 = __VLS_41({
    ...{ 'onClick': {} },
    ...{ class: "action-button action-button--secondary" },
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
let __VLS_44;
let __VLS_45;
let __VLS_46;
const __VLS_47 = {
    onClick: (...[$event]) => {
        __VLS_ctx.go('/visualize');
    }
};
__VLS_43.slots.default;
var __VLS_43;
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "metrics-grid" },
});
const __VLS_48 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    ...{ class: "metric-card metric-card--1 reveal reveal-4" },
    bordered: (false),
}));
const __VLS_50 = __VLS_49({
    ...{ class: "metric-card metric-card--1 reveal reveal-4" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-icon metric-icon--dataset" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    d: "M4 7.5h16v10H4z",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    d: "M4 7.5l8-4 8 4",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    d: "M4 12h16",
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
var __VLS_51;
const __VLS_52 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    ...{ class: "metric-card metric-card--2 reveal reveal-5" },
    bordered: (false),
}));
const __VLS_54 = __VLS_53({
    ...{ class: "metric-card metric-card--2 reveal reveal-5" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-icon metric-icon--index" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
    cx: "11",
    cy: "11",
    r: "5.5",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    d: "M15.5 15.5L20 20",
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
var __VLS_55;
const __VLS_56 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    ...{ class: "metric-card metric-card--3 reveal reveal-6" },
    bordered: (false),
}));
const __VLS_58 = __VLS_57({
    ...{ class: "metric-card metric-card--3 reveal reveal-6" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "metric-icon metric-icon--recent" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
    cx: "12",
    cy: "12",
    r: "8",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    d: "M12 8v4l3 2",
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
var __VLS_59;
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
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M18.7 8l-5.1 5.2-2.8-2.7L7 14.3",
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
    ...{ class: "perf-metric perf-metric--latency" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-value-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onMouseenter: (...[$event]) => {
            __VLS_ctx.hoveredMetric = 'latency';
        } },
    ...{ onMouseleave: (...[$event]) => {
            __VLS_ctx.hoveredMetric = null;
        } },
    ...{ class: "perf-metric-value" },
    ...{ class: ({ 'perf-metric-value--glow': __VLS_ctx.hoveredMetric === 'latency' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-number" },
});
(__VLS_ctx.animatedLatency);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-unit" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ class: "perf-sparkline perf-sparkline--latency" },
    viewBox: "0 0 100 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.defs, __VLS_intrinsicElements.defs)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.linearGradient, __VLS_intrinsicElements.linearGradient)({
    id: "latencyGradient",
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "0%",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.stop)({
    offset: "0%",
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.stop)({
    offset: "100%",
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: (__VLS_ctx.latencySparklinePath),
    fill: "none",
    stroke: "url(#latencyGradient)",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric perf-metric--memory" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-value-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onMouseenter: (...[$event]) => {
            __VLS_ctx.hoveredMetric = 'memory';
        } },
    ...{ onMouseleave: (...[$event]) => {
            __VLS_ctx.hoveredMetric = null;
        } },
    ...{ class: "perf-metric-value" },
    ...{ class: ({ 'perf-metric-value--glow': __VLS_ctx.hoveredMetric === 'memory' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-number" },
});
(__VLS_ctx.animatedMemory);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-unit" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ class: "perf-sparkline perf-sparkline--memory" },
    viewBox: "0 0 100 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.defs, __VLS_intrinsicElements.defs)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.linearGradient, __VLS_intrinsicElements.linearGradient)({
    id: "memoryGradient",
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "0%",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.stop)({
    offset: "0%",
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.stop)({
    offset: "100%",
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: (__VLS_ctx.memorySparklinePath),
    fill: "none",
    stroke: "url(#memoryGradient)",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric perf-metric--qps" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-value-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onMouseenter: (...[$event]) => {
            __VLS_ctx.hoveredMetric = 'qps';
        } },
    ...{ onMouseleave: (...[$event]) => {
            __VLS_ctx.hoveredMetric = null;
        } },
    ...{ class: "perf-metric-value" },
    ...{ class: ({ 'perf-metric-value--glow': __VLS_ctx.hoveredMetric === 'qps' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-number" },
});
(__VLS_ctx.animatedQps);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-unit" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ class: "perf-sparkline perf-sparkline--qps" },
    viewBox: "0 0 100 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.defs, __VLS_intrinsicElements.defs)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.linearGradient, __VLS_intrinsicElements.linearGradient)({
    id: "qpsGradient",
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "0%",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.stop)({
    offset: "0%",
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.stop)({
    offset: "100%",
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: (__VLS_ctx.qpsSparklinePath),
    fill: "none",
    stroke: "url(#qpsGradient)",
    'stroke-width': "2",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-sub" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric perf-metric--params" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "perf-metric-value-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onMouseenter: (...[$event]) => {
            __VLS_ctx.hoveredMetric = 'params';
        } },
    ...{ onMouseleave: (...[$event]) => {
            __VLS_ctx.hoveredMetric = null;
        } },
    ...{ class: "perf-metric-value" },
    ...{ class: ({ 'perf-metric-value--glow': __VLS_ctx.hoveredMetric === 'params' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "perf-number" },
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
const __VLS_60 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    ...{ class: "info-card reveal reveal-8" },
    bordered: (false),
    title: "快速说明",
}));
const __VLS_62 = __VLS_61({
    ...{ class: "info-card reveal reveal-8" },
    bordered: (false),
    title: "快速说明",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    d: "M20 6L9 17l-5-5",
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    d: "M20 6L9 17l-5-5",
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    d: "M20 6L9 17l-5-5",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
var __VLS_63;
const __VLS_64 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    ...{ class: "info-card reveal reveal-9" },
    bordered: (false),
    title: "当前状态",
}));
const __VLS_66 = __VLS_65({
    ...{ class: "info-card reveal reveal-9" },
    bordered: (false),
    title: "当前状态",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    d: "M20 6L9 17l-5-5",
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    d: "M20 6L9 17l-5-5",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
var __VLS_67;
/** @type {__VLS_StyleScopedClasses['dashboard-page']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-pattern']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['topbar']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-1']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-block']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['system-status']} */ ;
/** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['user-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-button']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-button__hint']} */ ;
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
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--accent']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button']} */ ;
/** @type {__VLS_StyleScopedClasses['action-button--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['metrics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card--1']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-4']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon--dataset']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card--2']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-5']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon--index']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-card--3']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-6']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-header']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['metric-icon--recent']} */ ;
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
/** @type {__VLS_StyleScopedClasses['perf-metric--latency']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value-container']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-unit']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-sparkline']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-sparkline--latency']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric--memory']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value-container']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-unit']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-sparkline']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-sparkline--memory']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric--qps']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value-container']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-unit']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-sparkline']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-sparkline--qps']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric--params']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-label']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value-container']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-value']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-number']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-unit']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-load-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-load-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['perf-metric-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['info-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-8']} */ ;
/** @type {__VLS_StyleScopedClasses['info-list']} */ ;
/** @type {__VLS_StyleScopedClasses['list-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['list-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['list-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal']} */ ;
/** @type {__VLS_StyleScopedClasses['reveal-9']} */ ;
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
            hoveredMetric: hoveredMetric,
            animatedLatency: animatedLatency,
            animatedMemory: animatedMemory,
            animatedQps: animatedQps,
            animatedLoad: animatedLoad,
            totalCellsDisplay: totalCellsDisplay,
            latencySparklinePath: latencySparklinePath,
            memorySparklinePath: memorySparklinePath,
            qpsSparklinePath: qpsSparklinePath,
            go: go,
            onMenuClick: onMenuClick,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
