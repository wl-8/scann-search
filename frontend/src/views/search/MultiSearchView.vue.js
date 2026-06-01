import { computed, onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import { batchSearch, listDatasets, listIndexes } from "@/api/search";
import request from "@/api/request";
const activeTab = ref("batch");
const resourceLoading = ref(false);
const datasets = ref([]);
const indexes = ref([]);
const selectedDatasetId = ref();
const selectedIndexId = ref();
const obsStats = ref(null);
const batchCellIds = ref("");
const batchAggregate = ref("ranked");
const batchMetric = ref("l2");
const batchK = ref(10);
const batchFilterColumn = ref();
const batchFilterValues = ref("");
const batchResult = ref(null);
const batchLoading = ref(false);
const compareQueryType = ref("id");
const compareQuery = ref("");
const compareFilterColumn = ref();
const compareFilterValues = ref("");
const compareMetric = ref("l2");
const compareK = ref(10);
const compareOversample = ref(10);
const compareStrategies = ref(["post", "pre", "hybrid"]);
const compareResult = ref(null);
const compareLoading = ref(false);
const selectedStrategy = ref("post");
const readyDatasets = computed(() => datasets.value.filter((item) => item.status === "ready"));
const readyIndexes = computed(() => indexes.value.filter((item) => item.status === "ready"));
const datasetOptions = computed(() => readyDatasets.value.map((item) => ({
    value: item.id,
    label: `${item.name} (#${item.id}, ${item.n_cells} cells)`
})));
const indexOptions = computed(() => readyIndexes.value.map((item) => ({
    value: item.id,
    label: `#${item.id} ${item.algorithm}`
})));
const columnOptions = computed(() => (obsStats.value?.obs_columns ?? []).map((c) => ({ label: c, value: c })));
const aggregateOptions = [
    { label: "ranked", value: "ranked" },
    { label: "union", value: "union" },
    { label: "intersection", value: "intersection" },
];
const metricOptions = [
    { label: "l2", value: "l2" },
    { label: "cosine", value: "cosine" },
];
const strategyOptions = [
    { label: "post", value: "post" },
    { label: "pre", value: "pre" },
    { label: "hybrid", value: "hybrid" },
];
const batchColumns = [
    { title: "Rank", dataIndex: "rank", key: "rank", width: 80 },
    { title: "Cell ID", dataIndex: "cell_id", key: "cell_id" },
    { title: "Avg Dist", dataIndex: "avg_distance", key: "avg_distance", width: 120 },
    { title: "Hit Count", dataIndex: "hit_count", key: "hit_count", width: 110 },
    { title: "Row", dataIndex: "row_index", key: "row_index", width: 90 },
    { title: "Cell Type", dataIndex: "cell_type", key: "cell_type", width: 120 },
];
const strategyColumns = [
    { title: "策略", dataIndex: "strategy", key: "strategy", width: 90 },
    { title: "返回数", dataIndex: "n_returned", key: "n_returned", width: 90 },
    { title: "耗时(ms)", dataIndex: "latency_ms", key: "latency_ms", width: 120 },
    { title: "Recall@K", dataIndex: "recall_at_k", key: "recall_at_k", width: 110 },
    { title: "备注", dataIndex: "note", key: "note" },
];
const strategyHitColumns = [
    { title: "Rank", dataIndex: "rank", key: "rank", width: 70 },
    { title: "Cell ID", dataIndex: "cell_id", key: "cell_id" },
    { title: "Distance", dataIndex: "distance", key: "distance", width: 120 },
    { title: "Row", dataIndex: "row_index", key: "row_index", width: 90 },
    { title: "Cell Type", dataIndex: "cell_type", key: "cell_type", width: 120 },
];
const batchRows = computed(() => (batchResult.value?.hits ?? []).map((hit) => ({
    ...hit,
    cell_type: hit.obs?.cell_type ?? "-",
})));
const strategyRows = computed(() => (compareResult.value?.results ?? []).map((item) => ({
    ...item,
    note: item.extra?.skipped_reason ?? "-",
})));
const strategySelectOptions = computed(() => (compareResult.value?.results ?? []).map((r) => ({ label: r.strategy, value: r.strategy })));
const selectedStrategyHits = computed(() => {
    const result = compareResult.value?.results.find((r) => r.strategy === selectedStrategy.value);
    return (result?.hits ?? []).map((hit) => ({
        ...hit,
        cell_type: hit.obs?.cell_type ?? "-",
    }));
});
async function loadResources() {
    resourceLoading.value = true;
    try {
        datasets.value = await listDatasets();
        const initialDatasetId = selectedDatasetId.value ?? readyDatasets.value[0]?.id;
        selectedDatasetId.value = initialDatasetId;
        indexes.value = await listIndexes(initialDatasetId);
        selectedIndexId.value = readyIndexes.value[0]?.id;
        if (initialDatasetId)
            await fetchObsStats(initialDatasetId);
    }
    catch (err) {
        message.warning(err?.response?.data?.detail ?? err?.message ?? "资源加载失败");
    }
    finally {
        resourceLoading.value = false;
    }
}
async function fetchObsStats(datasetId) {
    try {
        obsStats.value = await request.get(`/datasets/${datasetId}/stats`);
    }
    catch {
        obsStats.value = null;
    }
}
async function onDatasetChange(datasetId) {
    indexes.value = await listIndexes(datasetId);
    selectedIndexId.value = readyIndexes.value[0]?.id;
    await fetchObsStats(datasetId);
}
function parseCellIds(raw) {
    return raw
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}
function buildEqualsFilter(column, valuesText) {
    const values = parseCellIds(valuesText ?? "");
    if (!column || values.length === 0)
        return undefined;
    return { equals: { [column]: values } };
}
function parseVector(raw) {
    return raw
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map(Number)
        .filter((num) => Number.isFinite(num));
}
async function runBatchSearch() {
    if (!selectedIndexId.value)
        return message.warning("请先选择索引");
    const cellIds = parseCellIds(batchCellIds.value);
    if (!cellIds.length)
        return message.warning("请输入至少一个 Cell ID");
    batchLoading.value = true;
    try {
        const filters = buildEqualsFilter(batchFilterColumn.value, batchFilterValues.value);
        batchResult.value = await batchSearch({
            indexId: selectedIndexId.value,
            cellIds,
            k: batchK.value,
            metric: batchMetric.value,
            aggregate: batchAggregate.value,
            filters,
        });
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "批量检索失败");
    }
    finally {
        batchLoading.value = false;
    }
}
async function runCompare() {
    if (!selectedIndexId.value)
        return message.warning("请先选择索引");
    if (!compareFilterColumn.value || !compareFilterValues.value.trim()) {
        return message.warning("过滤条件不能为空");
    }
    const filters = buildEqualsFilter(compareFilterColumn.value, compareFilterValues.value);
    if (!filters)
        return message.warning("过滤条件不能为空");
    compareLoading.value = true;
    try {
        const payload = {
            indexId: selectedIndexId.value,
            k: compareK.value,
            filters,
            metric: compareMetric.value,
            strategies: compareStrategies.value,
            oversample: compareOversample.value,
        };
        if (compareQueryType.value === "vector") {
            payload.vector = parseVector(compareQuery.value);
        }
        else {
            payload.cellId = compareQuery.value.trim();
        }
        if (!payload.cellId && (!payload.vector || payload.vector.length === 0)) {
            return message.warning("请输入查询内容");
        }
        compareResult.value = await compareStrategies(payload);
        selectedStrategy.value = compareResult.value.results[0]?.strategy ?? "post";
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "策略对比失败");
    }
    finally {
        compareLoading.value = false;
    }
}
onMounted(loadResources);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
// CSS variable injection 
// CSS variable injection end 
/** @type {[typeof AppLayout, typeof AppLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppLayout, new AppLayout({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "multi-search-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-crumb" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-meta" },
});
if (__VLS_ctx.resourceLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
const __VLS_4 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ class: "resource-card" },
    bordered: (false),
}));
const __VLS_6 = __VLS_5({
    ...{ class: "resource-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "resource-card__title" },
});
const __VLS_8 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    layout: "vertical",
}));
const __VLS_10 = __VLS_9({
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.ARow;
/** @type {[typeof __VLS_components.ARow, typeof __VLS_components.aRow, typeof __VLS_components.ARow, typeof __VLS_components.aRow, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    gutter: (16),
}));
const __VLS_14 = __VLS_13({
    gutter: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
const __VLS_16 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    xs: (24),
    md: (8),
}));
const __VLS_18 = __VLS_17({
    xs: (24),
    md: (8),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
const __VLS_20 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    label: "数据集",
}));
const __VLS_22 = __VLS_21({
    label: "数据集",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
const __VLS_24 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onChange': {} },
    value: (__VLS_ctx.selectedDatasetId),
    options: (__VLS_ctx.datasetOptions),
    placeholder: "选择 ready 数据集",
    loading: (__VLS_ctx.resourceLoading),
}));
const __VLS_26 = __VLS_25({
    ...{ 'onChange': {} },
    value: (__VLS_ctx.selectedDatasetId),
    options: (__VLS_ctx.datasetOptions),
    placeholder: "选择 ready 数据集",
    loading: (__VLS_ctx.resourceLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onChange: (__VLS_ctx.onDatasetChange)
};
var __VLS_27;
var __VLS_23;
var __VLS_19;
const __VLS_32 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    xs: (24),
    md: (8),
}));
const __VLS_34 = __VLS_33({
    xs: (24),
    md: (8),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
const __VLS_36 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    label: "索引",
}));
const __VLS_38 = __VLS_37({
    label: "索引",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
const __VLS_40 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    value: (__VLS_ctx.selectedIndexId),
    options: (__VLS_ctx.indexOptions),
    placeholder: "选择 ready 索引",
    loading: (__VLS_ctx.resourceLoading),
}));
const __VLS_42 = __VLS_41({
    value: (__VLS_ctx.selectedIndexId),
    options: (__VLS_ctx.indexOptions),
    placeholder: "选择 ready 索引",
    loading: (__VLS_ctx.resourceLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
var __VLS_39;
var __VLS_35;
const __VLS_44 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    xs: (24),
    md: (8),
    ...{ class: "resource-actions" },
}));
const __VLS_46 = __VLS_45({
    xs: (24),
    md: (8),
    ...{ class: "resource-actions" },
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
const __VLS_48 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    ...{ 'onClick': {} },
    block: true,
    loading: (__VLS_ctx.resourceLoading),
}));
const __VLS_50 = __VLS_49({
    ...{ 'onClick': {} },
    block: true,
    loading: (__VLS_ctx.resourceLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
let __VLS_52;
let __VLS_53;
let __VLS_54;
const __VLS_55 = {
    onClick: (__VLS_ctx.loadResources)
};
__VLS_51.slots.default;
var __VLS_51;
var __VLS_47;
var __VLS_15;
var __VLS_11;
var __VLS_7;
const __VLS_56 = {}.ATabs;
/** @type {[typeof __VLS_components.ATabs, typeof __VLS_components.aTabs, typeof __VLS_components.ATabs, typeof __VLS_components.aTabs, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    activeKey: (__VLS_ctx.activeTab),
    ...{ class: "multi-tabs" },
}));
const __VLS_58 = __VLS_57({
    activeKey: (__VLS_ctx.activeTab),
    ...{ class: "multi-tabs" },
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
const __VLS_60 = {}.ATabPane;
/** @type {[typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    key: "batch",
    tab: "批量检索",
}));
const __VLS_62 = __VLS_61({
    key: "batch",
    tab: "批量检索",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
const __VLS_64 = {}.ARow;
/** @type {[typeof __VLS_components.ARow, typeof __VLS_components.aRow, typeof __VLS_components.ARow, typeof __VLS_components.aRow, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    gutter: (16),
}));
const __VLS_66 = __VLS_65({
    gutter: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
const __VLS_68 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    xs: (24),
    lg: (10),
}));
const __VLS_70 = __VLS_69({
    xs: (24),
    lg: (10),
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
const __VLS_72 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    ...{ class: "panel-card" },
    bordered: (false),
}));
const __VLS_74 = __VLS_73({
    ...{ class: "panel-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title" },
});
const __VLS_76 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    layout: "vertical",
}));
const __VLS_78 = __VLS_77({
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
const __VLS_80 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    label: "Cell IDs（逗号或换行分隔）",
}));
const __VLS_82 = __VLS_81({
    label: "Cell IDs（逗号或换行分隔）",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
const __VLS_84 = {}.ATextarea;
/** @type {[typeof __VLS_components.ATextarea, typeof __VLS_components.aTextarea, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    value: (__VLS_ctx.batchCellIds),
    autoSize: ({ minRows: 4, maxRows: 8 }),
    placeholder: "cell_0001, cell_0002, ...",
}));
const __VLS_86 = __VLS_85({
    value: (__VLS_ctx.batchCellIds),
    autoSize: ({ minRows: 4, maxRows: 8 }),
    placeholder: "cell_0001, cell_0002, ...",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
var __VLS_83;
const __VLS_88 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    label: "聚合策略",
}));
const __VLS_90 = __VLS_89({
    label: "聚合策略",
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
__VLS_91.slots.default;
const __VLS_92 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    value: (__VLS_ctx.batchAggregate),
    options: (__VLS_ctx.aggregateOptions),
}));
const __VLS_94 = __VLS_93({
    value: (__VLS_ctx.batchAggregate),
    options: (__VLS_ctx.aggregateOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
var __VLS_91;
const __VLS_96 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    label: "Metric",
}));
const __VLS_98 = __VLS_97({
    label: "Metric",
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
__VLS_99.slots.default;
const __VLS_100 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    value: (__VLS_ctx.batchMetric),
    options: (__VLS_ctx.metricOptions),
}));
const __VLS_102 = __VLS_101({
    value: (__VLS_ctx.batchMetric),
    options: (__VLS_ctx.metricOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
var __VLS_99;
const __VLS_104 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
    label: "Top-K",
}));
const __VLS_106 = __VLS_105({
    label: "Top-K",
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
__VLS_107.slots.default;
const __VLS_108 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    value: (__VLS_ctx.batchK),
    min: (1),
    max: (100),
    ...{ class: "control-number" },
}));
const __VLS_110 = __VLS_109({
    value: (__VLS_ctx.batchK),
    min: (1),
    max: (100),
    ...{ class: "control-number" },
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
var __VLS_107;
const __VLS_112 = {}.ADivider;
/** @type {[typeof __VLS_components.ADivider, typeof __VLS_components.aDivider, ]} */ ;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({}));
const __VLS_114 = __VLS_113({}, ...__VLS_functionalComponentArgsRest(__VLS_113));
const __VLS_116 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    label: "过滤字段",
}));
const __VLS_118 = __VLS_117({
    label: "过滤字段",
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
__VLS_119.slots.default;
const __VLS_120 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
    ...{ 'onChange': {} },
    value: (__VLS_ctx.batchFilterColumn),
    options: (__VLS_ctx.columnOptions),
    allowClear: true,
    placeholder: "例如: cell_type",
}));
const __VLS_122 = __VLS_121({
    ...{ 'onChange': {} },
    value: (__VLS_ctx.batchFilterColumn),
    options: (__VLS_ctx.columnOptions),
    allowClear: true,
    placeholder: "例如: cell_type",
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
let __VLS_124;
let __VLS_125;
let __VLS_126;
const __VLS_127 = {
    onChange: (...[$event]) => {
        __VLS_ctx.batchFilterValues = '';
    }
};
var __VLS_123;
var __VLS_119;
const __VLS_128 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
    label: "过滤值（可多个）",
}));
const __VLS_130 = __VLS_129({
    label: "过滤值（可多个）",
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
__VLS_131.slots.default;
const __VLS_132 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    value: (__VLS_ctx.batchFilterValues),
    placeholder: "例如: Type0, Type1",
}));
const __VLS_134 = __VLS_133({
    value: (__VLS_ctx.batchFilterValues),
    placeholder: "例如: Type0, Type1",
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
var __VLS_131;
const __VLS_136 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.batchLoading),
}));
const __VLS_138 = __VLS_137({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.batchLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
let __VLS_140;
let __VLS_141;
let __VLS_142;
const __VLS_143 = {
    onClick: (__VLS_ctx.runBatchSearch)
};
__VLS_139.slots.default;
var __VLS_139;
var __VLS_79;
var __VLS_75;
var __VLS_71;
const __VLS_144 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
    xs: (24),
    lg: (14),
}));
const __VLS_146 = __VLS_145({
    xs: (24),
    lg: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_145));
__VLS_147.slots.default;
const __VLS_148 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
    ...{ class: "panel-card" },
    bordered: (false),
}));
const __VLS_150 = __VLS_149({
    ...{ class: "panel-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_149));
__VLS_151.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title" },
});
if (__VLS_ctx.batchResult) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-bar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.batchResult.n_queries);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.batchResult.n_returned);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (Number(__VLS_ctx.batchResult.total_latency_ms).toFixed(2));
}
const __VLS_152 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
    columns: (__VLS_ctx.batchColumns),
    dataSource: (__VLS_ctx.batchRows),
    rowKey: "cell_id",
    loading: (__VLS_ctx.batchLoading),
    pagination: (false),
}));
const __VLS_154 = __VLS_153({
    columns: (__VLS_ctx.batchColumns),
    dataSource: (__VLS_ctx.batchRows),
    rowKey: "cell_id",
    loading: (__VLS_ctx.batchLoading),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_153));
if (!__VLS_ctx.batchRows.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
    const __VLS_156 = {}.AEmpty;
    /** @type {[typeof __VLS_components.AEmpty, typeof __VLS_components.aEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
        description: "尚无结果",
    }));
    const __VLS_158 = __VLS_157({
        description: "尚无结果",
    }, ...__VLS_functionalComponentArgsRest(__VLS_157));
}
var __VLS_151;
var __VLS_147;
var __VLS_67;
var __VLS_63;
const __VLS_160 = {}.ATabPane;
/** @type {[typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, ]} */ ;
// @ts-ignore
const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
    key: "compare",
    tab: "过滤策略对比",
}));
const __VLS_162 = __VLS_161({
    key: "compare",
    tab: "过滤策略对比",
}, ...__VLS_functionalComponentArgsRest(__VLS_161));
__VLS_163.slots.default;
const __VLS_164 = {}.ARow;
/** @type {[typeof __VLS_components.ARow, typeof __VLS_components.aRow, typeof __VLS_components.ARow, typeof __VLS_components.aRow, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    gutter: (16),
}));
const __VLS_166 = __VLS_165({
    gutter: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
__VLS_167.slots.default;
const __VLS_168 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
    xs: (24),
    lg: (10),
}));
const __VLS_170 = __VLS_169({
    xs: (24),
    lg: (10),
}, ...__VLS_functionalComponentArgsRest(__VLS_169));
__VLS_171.slots.default;
const __VLS_172 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
    ...{ class: "panel-card" },
    bordered: (false),
}));
const __VLS_174 = __VLS_173({
    ...{ class: "panel-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_173));
__VLS_175.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title" },
});
const __VLS_176 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
    layout: "vertical",
}));
const __VLS_178 = __VLS_177({
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_177));
__VLS_179.slots.default;
const __VLS_180 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
    label: "查询类型",
}));
const __VLS_182 = __VLS_181({
    label: "查询类型",
}, ...__VLS_functionalComponentArgsRest(__VLS_181));
__VLS_183.slots.default;
const __VLS_184 = {}.ARadioGroup;
/** @type {[typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
    value: (__VLS_ctx.compareQueryType),
}));
const __VLS_186 = __VLS_185({
    value: (__VLS_ctx.compareQueryType),
}, ...__VLS_functionalComponentArgsRest(__VLS_185));
__VLS_187.slots.default;
const __VLS_188 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
    value: "id",
}));
const __VLS_190 = __VLS_189({
    value: "id",
}, ...__VLS_functionalComponentArgsRest(__VLS_189));
__VLS_191.slots.default;
var __VLS_191;
const __VLS_192 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_193 = __VLS_asFunctionalComponent(__VLS_192, new __VLS_192({
    value: "vector",
}));
const __VLS_194 = __VLS_193({
    value: "vector",
}, ...__VLS_functionalComponentArgsRest(__VLS_193));
__VLS_195.slots.default;
var __VLS_195;
var __VLS_187;
var __VLS_183;
const __VLS_196 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
    label: (__VLS_ctx.compareQueryType === 'id' ? '细胞ID' : '向量（逗号分隔）'),
}));
const __VLS_198 = __VLS_197({
    label: (__VLS_ctx.compareQueryType === 'id' ? '细胞ID' : '向量（逗号分隔）'),
}, ...__VLS_functionalComponentArgsRest(__VLS_197));
__VLS_199.slots.default;
if (__VLS_ctx.compareQueryType === 'vector') {
    const __VLS_200 = {}.ATextarea;
    /** @type {[typeof __VLS_components.ATextarea, typeof __VLS_components.aTextarea, ]} */ ;
    // @ts-ignore
    const __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({
        value: (__VLS_ctx.compareQuery),
        autoSize: ({ minRows: 3, maxRows: 5 }),
        placeholder: "例如: 0.12, -0.03, ...",
    }));
    const __VLS_202 = __VLS_201({
        value: (__VLS_ctx.compareQuery),
        autoSize: ({ minRows: 3, maxRows: 5 }),
        placeholder: "例如: 0.12, -0.03, ...",
    }, ...__VLS_functionalComponentArgsRest(__VLS_201));
}
else {
    const __VLS_204 = {}.AInput;
    /** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
    // @ts-ignore
    const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
        value: (__VLS_ctx.compareQuery),
        placeholder: "例如: cell_0042",
    }));
    const __VLS_206 = __VLS_205({
        value: (__VLS_ctx.compareQuery),
        placeholder: "例如: cell_0042",
    }, ...__VLS_functionalComponentArgsRest(__VLS_205));
}
var __VLS_199;
const __VLS_208 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
    label: "过滤字段",
}));
const __VLS_210 = __VLS_209({
    label: "过滤字段",
}, ...__VLS_functionalComponentArgsRest(__VLS_209));
__VLS_211.slots.default;
const __VLS_212 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
    ...{ 'onChange': {} },
    value: (__VLS_ctx.compareFilterColumn),
    options: (__VLS_ctx.columnOptions),
}));
const __VLS_214 = __VLS_213({
    ...{ 'onChange': {} },
    value: (__VLS_ctx.compareFilterColumn),
    options: (__VLS_ctx.columnOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_213));
let __VLS_216;
let __VLS_217;
let __VLS_218;
const __VLS_219 = {
    onChange: (...[$event]) => {
        __VLS_ctx.compareFilterValues = '';
    }
};
var __VLS_215;
var __VLS_211;
const __VLS_220 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({
    label: "过滤值（必填，可多个）",
}));
const __VLS_222 = __VLS_221({
    label: "过滤值（必填，可多个）",
}, ...__VLS_functionalComponentArgsRest(__VLS_221));
__VLS_223.slots.default;
const __VLS_224 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_225 = __VLS_asFunctionalComponent(__VLS_224, new __VLS_224({
    value: (__VLS_ctx.compareFilterValues),
    placeholder: "例如: Type0",
}));
const __VLS_226 = __VLS_225({
    value: (__VLS_ctx.compareFilterValues),
    placeholder: "例如: Type0",
}, ...__VLS_functionalComponentArgsRest(__VLS_225));
var __VLS_223;
const __VLS_228 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_229 = __VLS_asFunctionalComponent(__VLS_228, new __VLS_228({
    label: "Metric",
}));
const __VLS_230 = __VLS_229({
    label: "Metric",
}, ...__VLS_functionalComponentArgsRest(__VLS_229));
__VLS_231.slots.default;
const __VLS_232 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_233 = __VLS_asFunctionalComponent(__VLS_232, new __VLS_232({
    value: (__VLS_ctx.compareMetric),
    options: (__VLS_ctx.metricOptions),
}));
const __VLS_234 = __VLS_233({
    value: (__VLS_ctx.compareMetric),
    options: (__VLS_ctx.metricOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_233));
var __VLS_231;
const __VLS_236 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_237 = __VLS_asFunctionalComponent(__VLS_236, new __VLS_236({
    label: "Top-K",
}));
const __VLS_238 = __VLS_237({
    label: "Top-K",
}, ...__VLS_functionalComponentArgsRest(__VLS_237));
__VLS_239.slots.default;
const __VLS_240 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_241 = __VLS_asFunctionalComponent(__VLS_240, new __VLS_240({
    value: (__VLS_ctx.compareK),
    min: (1),
    max: (100),
    ...{ class: "control-number" },
}));
const __VLS_242 = __VLS_241({
    value: (__VLS_ctx.compareK),
    min: (1),
    max: (100),
    ...{ class: "control-number" },
}, ...__VLS_functionalComponentArgsRest(__VLS_241));
var __VLS_239;
const __VLS_244 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_245 = __VLS_asFunctionalComponent(__VLS_244, new __VLS_244({
    label: "Oversample",
}));
const __VLS_246 = __VLS_245({
    label: "Oversample",
}, ...__VLS_functionalComponentArgsRest(__VLS_245));
__VLS_247.slots.default;
const __VLS_248 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_249 = __VLS_asFunctionalComponent(__VLS_248, new __VLS_248({
    value: (__VLS_ctx.compareOversample),
    min: (1),
    max: (100),
    ...{ class: "control-number" },
}));
const __VLS_250 = __VLS_249({
    value: (__VLS_ctx.compareOversample),
    min: (1),
    max: (100),
    ...{ class: "control-number" },
}, ...__VLS_functionalComponentArgsRest(__VLS_249));
var __VLS_247;
const __VLS_252 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_253 = __VLS_asFunctionalComponent(__VLS_252, new __VLS_252({
    label: "策略",
}));
const __VLS_254 = __VLS_253({
    label: "策略",
}, ...__VLS_functionalComponentArgsRest(__VLS_253));
__VLS_255.slots.default;
const __VLS_256 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_257 = __VLS_asFunctionalComponent(__VLS_256, new __VLS_256({
    value: (__VLS_ctx.compareStrategies),
    mode: "multiple",
    options: (__VLS_ctx.strategyOptions),
}));
const __VLS_258 = __VLS_257({
    value: (__VLS_ctx.compareStrategies),
    mode: "multiple",
    options: (__VLS_ctx.strategyOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_257));
var __VLS_255;
const __VLS_260 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_261 = __VLS_asFunctionalComponent(__VLS_260, new __VLS_260({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.compareLoading),
}));
const __VLS_262 = __VLS_261({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.compareLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_261));
let __VLS_264;
let __VLS_265;
let __VLS_266;
const __VLS_267 = {
    onClick: (__VLS_ctx.runCompare)
};
__VLS_263.slots.default;
var __VLS_263;
var __VLS_179;
var __VLS_175;
var __VLS_171;
const __VLS_268 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_269 = __VLS_asFunctionalComponent(__VLS_268, new __VLS_268({
    xs: (24),
    lg: (14),
}));
const __VLS_270 = __VLS_269({
    xs: (24),
    lg: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_269));
__VLS_271.slots.default;
const __VLS_272 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_273 = __VLS_asFunctionalComponent(__VLS_272, new __VLS_272({
    ...{ class: "panel-card" },
    bordered: (false),
}));
const __VLS_274 = __VLS_273({
    ...{ class: "panel-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_273));
__VLS_275.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title" },
});
if (__VLS_ctx.compareResult) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-bar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.compareResult.n_total_cells);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.compareResult.n_matching_filter);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    ((__VLS_ctx.compareResult.filter_selectivity * 100).toFixed(2));
}
const __VLS_276 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_277 = __VLS_asFunctionalComponent(__VLS_276, new __VLS_276({
    columns: (__VLS_ctx.strategyColumns),
    dataSource: (__VLS_ctx.strategyRows),
    rowKey: "strategy",
    pagination: (false),
    loading: (__VLS_ctx.compareLoading),
}));
const __VLS_278 = __VLS_277({
    columns: (__VLS_ctx.strategyColumns),
    dataSource: (__VLS_ctx.strategyRows),
    rowKey: "strategy",
    pagination: (false),
    loading: (__VLS_ctx.compareLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_277));
if (__VLS_ctx.selectedStrategyHits.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "strategy-detail" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "strategy-detail__head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    const __VLS_280 = {}.ASelect;
    /** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
    // @ts-ignore
    const __VLS_281 = __VLS_asFunctionalComponent(__VLS_280, new __VLS_280({
        value: (__VLS_ctx.selectedStrategy),
        options: (__VLS_ctx.strategySelectOptions),
        size: "small",
        ...{ style: {} },
    }));
    const __VLS_282 = __VLS_281({
        value: (__VLS_ctx.selectedStrategy),
        options: (__VLS_ctx.strategySelectOptions),
        size: "small",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_281));
    const __VLS_284 = {}.ATable;
    /** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
    // @ts-ignore
    const __VLS_285 = __VLS_asFunctionalComponent(__VLS_284, new __VLS_284({
        columns: (__VLS_ctx.strategyHitColumns),
        dataSource: (__VLS_ctx.selectedStrategyHits),
        rowKey: "cell_id",
        size: "small",
        pagination: (false),
    }));
    const __VLS_286 = __VLS_285({
        columns: (__VLS_ctx.strategyHitColumns),
        dataSource: (__VLS_ctx.selectedStrategyHits),
        rowKey: "cell_id",
        size: "small",
        pagination: (false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_285));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
    const __VLS_288 = {}.AEmpty;
    /** @type {[typeof __VLS_components.AEmpty, typeof __VLS_components.aEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_289 = __VLS_asFunctionalComponent(__VLS_288, new __VLS_288({
        description: "尚无策略结果",
    }));
    const __VLS_290 = __VLS_289({
        description: "尚无策略结果",
    }, ...__VLS_functionalComponentArgsRest(__VLS_289));
}
var __VLS_275;
var __VLS_271;
var __VLS_167;
var __VLS_163;
var __VLS_59;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['multi-search-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-crumb']} */ ;
/** @type {__VLS_StyleScopedClasses['page-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['resource-card']} */ ;
/** @type {__VLS_StyleScopedClasses['resource-card__title']} */ ;
/** @type {__VLS_StyleScopedClasses['resource-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['multi-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-card']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['control-number']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-card']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-card']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['control-number']} */ ;
/** @type {__VLS_StyleScopedClasses['control-number']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-card']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['strategy-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['strategy-detail__head']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            compareStrategies: compareStrategies,
            activeTab: activeTab,
            resourceLoading: resourceLoading,
            selectedDatasetId: selectedDatasetId,
            selectedIndexId: selectedIndexId,
            batchCellIds: batchCellIds,
            batchAggregate: batchAggregate,
            batchMetric: batchMetric,
            batchK: batchK,
            batchFilterColumn: batchFilterColumn,
            batchFilterValues: batchFilterValues,
            batchResult: batchResult,
            batchLoading: batchLoading,
            compareQueryType: compareQueryType,
            compareQuery: compareQuery,
            compareFilterColumn: compareFilterColumn,
            compareFilterValues: compareFilterValues,
            compareMetric: compareMetric,
            compareK: compareK,
            compareOversample: compareOversample,
            compareStrategies: compareStrategies,
            compareResult: compareResult,
            compareLoading: compareLoading,
            selectedStrategy: selectedStrategy,
            datasetOptions: datasetOptions,
            indexOptions: indexOptions,
            columnOptions: columnOptions,
            aggregateOptions: aggregateOptions,
            metricOptions: metricOptions,
            strategyOptions: strategyOptions,
            batchColumns: batchColumns,
            strategyColumns: strategyColumns,
            strategyHitColumns: strategyHitColumns,
            batchRows: batchRows,
            strategyRows: strategyRows,
            strategySelectOptions: strategySelectOptions,
            selectedStrategyHits: selectedStrategyHits,
            loadResources: loadResources,
            onDatasetChange: onDatasetChange,
            runBatchSearch: runBatchSearch,
            runCompare: runCompare,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
