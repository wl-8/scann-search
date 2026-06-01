import { ref } from "vue";
import { message } from "ant-design-vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import { exportBenchmarkCsv, exportFilterCsv, exportSearchCsv } from "@/api/export";
const searchLoading = ref(false);
const filterLoading = ref(false);
const benchmarkLoading = ref(false);
const batchIdsText = ref("");
function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
}
async function exportSearch() {
    searchLoading.value = true;
    try {
        const blob = await exportSearchCsv();
        downloadBlob(blob, "search_export.csv");
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "导出失败");
    }
    finally {
        searchLoading.value = false;
    }
}
async function exportFilter() {
    filterLoading.value = true;
    try {
        const blob = await exportFilterCsv();
        downloadBlob(blob, "filter_export.csv");
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "导出失败");
    }
    finally {
        filterLoading.value = false;
    }
}
function parseBatchIds(text) {
    return text
        .split(/[\s,]+/)
        .map((item) => Number(item.trim()))
        .filter((num) => Number.isFinite(num));
}
async function exportBenchmark() {
    const ids = parseBatchIds(batchIdsText.value);
    if (!ids.length)
        return message.warning("请输入至少一个批次 ID");
    benchmarkLoading.value = true;
    try {
        const blob = await exportBenchmarkCsv(ids);
        downloadBlob(blob, `benchmark_${ids.join("_")}.csv`);
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "导出失败");
    }
    finally {
        benchmarkLoading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['export-page__header']} */ ;
/** @type {__VLS_StyleScopedClasses['export-page__header']} */ ;
/** @type {__VLS_StyleScopedClasses['export-page__header']} */ ;
// CSS variable injection 
// CSS variable injection end 
/** @type {[typeof AppLayout, typeof AppLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppLayout, new AppLayout({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "export-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "export-page__header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "export-page__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
const __VLS_4 = {}.ARow;
/** @type {[typeof __VLS_components.ARow, typeof __VLS_components.aRow, typeof __VLS_components.ARow, typeof __VLS_components.aRow, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    gutter: (16),
}));
const __VLS_6 = __VLS_5({
    gutter: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    xs: (24),
    lg: (8),
}));
const __VLS_10 = __VLS_9({
    xs: (24),
    lg: (8),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ class: "export-card" },
    bordered: (false),
}));
const __VLS_14 = __VLS_13({
    ...{ class: "export-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "export-card__title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "export-card__desc" },
});
const __VLS_16 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.searchLoading),
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.searchLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onClick: (__VLS_ctx.exportSearch)
};
__VLS_19.slots.default;
var __VLS_19;
var __VLS_15;
var __VLS_11;
const __VLS_24 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    xs: (24),
    lg: (8),
}));
const __VLS_26 = __VLS_25({
    xs: (24),
    lg: (8),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
const __VLS_28 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ class: "export-card" },
    bordered: (false),
}));
const __VLS_30 = __VLS_29({
    ...{ class: "export-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "export-card__title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "export-card__desc" },
});
const __VLS_32 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.filterLoading),
}));
const __VLS_34 = __VLS_33({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.filterLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
let __VLS_36;
let __VLS_37;
let __VLS_38;
const __VLS_39 = {
    onClick: (__VLS_ctx.exportFilter)
};
__VLS_35.slots.default;
var __VLS_35;
var __VLS_31;
var __VLS_27;
const __VLS_40 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    xs: (24),
    lg: (8),
}));
const __VLS_42 = __VLS_41({
    xs: (24),
    lg: (8),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
const __VLS_44 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    ...{ class: "export-card" },
    bordered: (false),
}));
const __VLS_46 = __VLS_45({
    ...{ class: "export-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "export-card__title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "export-card__desc" },
});
const __VLS_48 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    value: (__VLS_ctx.batchIdsText),
    placeholder: "例如: 12, 15",
    ...{ style: {} },
}));
const __VLS_50 = __VLS_49({
    value: (__VLS_ctx.batchIdsText),
    placeholder: "例如: 12, 15",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
const __VLS_52 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.benchmarkLoading),
}));
const __VLS_54 = __VLS_53({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.benchmarkLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
let __VLS_56;
let __VLS_57;
let __VLS_58;
const __VLS_59 = {
    onClick: (__VLS_ctx.exportBenchmark)
};
__VLS_55.slots.default;
var __VLS_55;
var __VLS_47;
var __VLS_43;
var __VLS_7;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['export-page']} */ ;
/** @type {__VLS_StyleScopedClasses['export-page__header']} */ ;
/** @type {__VLS_StyleScopedClasses['export-page__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['export-card']} */ ;
/** @type {__VLS_StyleScopedClasses['export-card__title']} */ ;
/** @type {__VLS_StyleScopedClasses['export-card__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['export-card']} */ ;
/** @type {__VLS_StyleScopedClasses['export-card__title']} */ ;
/** @type {__VLS_StyleScopedClasses['export-card__desc']} */ ;
/** @type {__VLS_StyleScopedClasses['export-card']} */ ;
/** @type {__VLS_StyleScopedClasses['export-card__title']} */ ;
/** @type {__VLS_StyleScopedClasses['export-card__desc']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            searchLoading: searchLoading,
            filterLoading: filterLoading,
            benchmarkLoading: benchmarkLoading,
            batchIdsText: batchIdsText,
            exportSearch: exportSearch,
            exportFilter: exportFilter,
            exportBenchmark: exportBenchmark,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
