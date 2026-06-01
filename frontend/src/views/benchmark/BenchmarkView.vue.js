import { computed, onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import BenchmarkChart from "@/components/benchmark/BenchmarkChart.vue";
import { listDatasets } from "@/api/search";
import { getAlgorithms } from "@/api/indexes";
import { deleteBenchmarkBatch, getBenchmarkBatch, listBenchmarkBatches, runBenchmark as runBenchmarkApi, } from "@/api/benchmark";
const datasets = ref([]);
const algorithms = ref([]);
const runDatasetId = ref();
const runLabel = ref("");
const runK = ref(10);
const runQueries = ref(100);
const runSeed = ref(42);
const algoConfigs = ref([
    { algorithm: "flat", paramsText: "{}" },
]);
const runLoading = ref(false);
const batches = ref([]);
const listLoading = ref(false);
const filterDatasetId = ref();
const filterLabel = ref("");
const selectedBatch = ref(null);
const datasetOptions = computed(() => datasets.value.map((d) => ({ label: d.name, value: d.id })));
const algorithmOptions = computed(() => algorithms.value.map((a) => ({ label: a, value: a })));
const batchColumns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Label", dataIndex: "label", key: "label" },
    { title: "Dataset", dataIndex: "dataset_id", key: "dataset_id" },
    { title: "K", dataIndex: "k", key: "k", width: 70 },
    { title: "Queries", dataIndex: "n_queries", key: "n_queries", width: 90 },
    { title: "Created", dataIndex: "created_at", key: "created_at", width: 140 },
    { title: "操作", key: "actions", width: 150 },
];
const resultColumns = [
    { title: "Algorithm", dataIndex: "algorithm", key: "algorithm" },
    { title: "Recall@K", dataIndex: "recall_at_k", key: "recall_at_k", width: 110 },
    { title: "Avg Latency", dataIndex: "avg_latency_ms", key: "avg_latency_ms", width: 120 },
    { title: "P95", dataIndex: "p95_latency_ms", key: "p95_latency_ms", width: 90 },
    { title: "QPS", dataIndex: "qps", key: "qps", width: 90 },
    { title: "Build (ms)", dataIndex: "build_time_ms", key: "build_time_ms", width: 110 },
];
function datasetName(id) {
    return datasets.value.find((d) => d.id === id)?.name ?? `#${id}`;
}
function rowClick(record) {
    return {
        onClick: () => selectBatch(record.id),
    };
}
function addAlgo() {
    algoConfigs.value.push({ algorithm: algorithms.value[0] ?? "flat", paramsText: "{}" });
}
function removeAlgo(idx) {
    if (algoConfigs.value.length <= 1)
        return;
    algoConfigs.value.splice(idx, 1);
}
async function loadResources() {
    try {
        const [ds, algos] = await Promise.all([listDatasets(), getAlgorithms()]);
        datasets.value = ds;
        algorithms.value = algos;
        if (!runDatasetId.value)
            runDatasetId.value = ds[0]?.id;
    }
    catch {
        message.error("加载资源失败，请确认后端已启动");
    }
}
async function loadBatches() {
    listLoading.value = true;
    try {
        batches.value = await listBenchmarkBatches({
            dataset_id: filterDatasetId.value,
            label: filterLabel.value || undefined,
        });
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "加载批次失败");
    }
    finally {
        listLoading.value = false;
    }
}
async function selectBatch(batchId) {
    try {
        selectedBatch.value = await getBenchmarkBatch(batchId);
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "获取批次详情失败");
    }
}
async function deleteBatch(batchId) {
    try {
        await deleteBenchmarkBatch(batchId);
        message.success("批次已删除");
        if (selectedBatch.value?.id === batchId)
            selectedBatch.value = null;
        await loadBatches();
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "删除失败");
    }
}
async function runBenchmark() {
    if (!runDatasetId.value)
        return message.warning("请选择数据集");
    let algorithmsPayload = [];
    try {
        algorithmsPayload = algoConfigs.value.map((cfg) => ({
            algorithm: cfg.algorithm,
            params: cfg.paramsText ? JSON.parse(cfg.paramsText) : {},
        }));
    }
    catch {
        return message.warning("算法参数必须是有效 JSON");
    }
    runLoading.value = true;
    try {
        const batch = await runBenchmarkApi({
            dataset_id: runDatasetId.value,
            label: runLabel.value,
            algorithms: algorithmsPayload,
            k: runK.value,
            n_queries: runQueries.value,
            seed: runSeed.value,
        });
        message.success("评测任务完成");
        selectedBatch.value = batch;
        await loadBatches();
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "评测失败");
    }
    finally {
        runLoading.value = false;
    }
}
onMounted(async () => {
    await loadResources();
    await loadBatches();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['benchmark-page__header']} */ ;
/** @type {__VLS_StyleScopedClasses['benchmark-page__header']} */ ;
/** @type {__VLS_StyleScopedClasses['benchmark-page__header']} */ ;
// CSS variable injection 
// CSS variable injection end 
/** @type {[typeof AppLayout, typeof AppLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppLayout, new AppLayout({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "benchmark-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "benchmark-page__header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "benchmark-page__eyebrow" },
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
    ...{ class: "panel-card" },
    bordered: (false),
    title: "运行评测",
}));
const __VLS_14 = __VLS_13({
    ...{ class: "panel-card" },
    bordered: (false),
    title: "运行评测",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
const __VLS_16 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    layout: "vertical",
}));
const __VLS_18 = __VLS_17({
    layout: "vertical",
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
    value: (__VLS_ctx.runDatasetId),
    options: (__VLS_ctx.datasetOptions),
    placeholder: "选择数据集",
}));
const __VLS_26 = __VLS_25({
    value: (__VLS_ctx.runDatasetId),
    options: (__VLS_ctx.datasetOptions),
    placeholder: "选择数据集",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
var __VLS_23;
const __VLS_28 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    label: "标签（可选）",
}));
const __VLS_30 = __VLS_29({
    label: "标签（可选）",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
const __VLS_32 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    value: (__VLS_ctx.runLabel),
    placeholder: "例如: run-A",
}));
const __VLS_34 = __VLS_33({
    value: (__VLS_ctx.runLabel),
    placeholder: "例如: run-A",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
var __VLS_31;
const __VLS_36 = {}.ARow;
/** @type {[typeof __VLS_components.ARow, typeof __VLS_components.aRow, typeof __VLS_components.ARow, typeof __VLS_components.aRow, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    gutter: (12),
}));
const __VLS_38 = __VLS_37({
    gutter: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
const __VLS_40 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    span: (12),
}));
const __VLS_42 = __VLS_41({
    span: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
const __VLS_44 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    label: "Top-K",
}));
const __VLS_46 = __VLS_45({
    label: "Top-K",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
const __VLS_48 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    value: (__VLS_ctx.runK),
    min: (1),
    max: (100),
    ...{ class: "control-number" },
}));
const __VLS_50 = __VLS_49({
    value: (__VLS_ctx.runK),
    min: (1),
    max: (100),
    ...{ class: "control-number" },
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
var __VLS_47;
var __VLS_43;
const __VLS_52 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    span: (12),
}));
const __VLS_54 = __VLS_53({
    span: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
const __VLS_56 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    label: "查询数量",
}));
const __VLS_58 = __VLS_57({
    label: "查询数量",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
const __VLS_60 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    value: (__VLS_ctx.runQueries),
    min: (1),
    max: (10000),
    ...{ class: "control-number" },
}));
const __VLS_62 = __VLS_61({
    value: (__VLS_ctx.runQueries),
    min: (1),
    max: (10000),
    ...{ class: "control-number" },
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
var __VLS_59;
var __VLS_55;
var __VLS_39;
const __VLS_64 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    label: "随机种子",
}));
const __VLS_66 = __VLS_65({
    label: "随机种子",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
const __VLS_68 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    value: (__VLS_ctx.runSeed),
    min: (1),
    max: (9999),
    ...{ class: "control-number" },
}));
const __VLS_70 = __VLS_69({
    value: (__VLS_ctx.runSeed),
    min: (1),
    max: (9999),
    ...{ class: "control-number" },
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
var __VLS_67;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "algo-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "algo-section__title" },
});
for (const [cfg, idx] of __VLS_getVForSourceType((__VLS_ctx.algoConfigs))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (idx),
        ...{ class: "algo-card" },
    });
    const __VLS_72 = {}.AFormItem;
    /** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        label: "算法",
    }));
    const __VLS_74 = __VLS_73({
        label: "算法",
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    __VLS_75.slots.default;
    const __VLS_76 = {}.ASelect;
    /** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        value: (cfg.algorithm),
        options: (__VLS_ctx.algorithmOptions),
    }));
    const __VLS_78 = __VLS_77({
        value: (cfg.algorithm),
        options: (__VLS_ctx.algorithmOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    var __VLS_75;
    const __VLS_80 = {}.AFormItem;
    /** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        label: "参数 JSON",
    }));
    const __VLS_82 = __VLS_81({
        label: "参数 JSON",
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    __VLS_83.slots.default;
    const __VLS_84 = {}.AInput;
    /** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        value: (cfg.paramsText),
        placeholder: '{ "M": 16 }',
    }));
    const __VLS_86 = __VLS_85({
        value: (cfg.paramsText),
        placeholder: '{ "M": 16 }',
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    var __VLS_83;
    const __VLS_88 = {}.AButton;
    /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        ...{ 'onClick': {} },
        danger: true,
        size: "small",
        disabled: (__VLS_ctx.algoConfigs.length <= 1),
    }));
    const __VLS_90 = __VLS_89({
        ...{ 'onClick': {} },
        danger: true,
        size: "small",
        disabled: (__VLS_ctx.algoConfigs.length <= 1),
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    let __VLS_92;
    let __VLS_93;
    let __VLS_94;
    const __VLS_95 = {
        onClick: (...[$event]) => {
            __VLS_ctx.removeAlgo(idx);
        }
    };
    __VLS_91.slots.default;
    var __VLS_91;
}
const __VLS_96 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    ...{ 'onClick': {} },
    type: "dashed",
    block: true,
}));
const __VLS_98 = __VLS_97({
    ...{ 'onClick': {} },
    type: "dashed",
    block: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
let __VLS_100;
let __VLS_101;
let __VLS_102;
const __VLS_103 = {
    onClick: (__VLS_ctx.addAlgo)
};
__VLS_99.slots.default;
var __VLS_99;
const __VLS_104 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.runLoading),
}));
const __VLS_106 = __VLS_105({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.runLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
let __VLS_108;
let __VLS_109;
let __VLS_110;
const __VLS_111 = {
    onClick: (__VLS_ctx.runBenchmark)
};
__VLS_107.slots.default;
var __VLS_107;
var __VLS_19;
var __VLS_15;
var __VLS_11;
const __VLS_112 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
    xs: (24),
    lg: (16),
}));
const __VLS_114 = __VLS_113({
    xs: (24),
    lg: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_113));
__VLS_115.slots.default;
const __VLS_116 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    ...{ class: "panel-card" },
    bordered: (false),
    title: "评测批次",
}));
const __VLS_118 = __VLS_117({
    ...{ class: "panel-card" },
    bordered: (false),
    title: "评测批次",
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
__VLS_119.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-toolbar" },
});
const __VLS_120 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
    value: (__VLS_ctx.filterDatasetId),
    options: (__VLS_ctx.datasetOptions),
    allowClear: true,
    placeholder: "按数据集过滤",
    ...{ style: {} },
}));
const __VLS_122 = __VLS_121({
    value: (__VLS_ctx.filterDatasetId),
    options: (__VLS_ctx.datasetOptions),
    allowClear: true,
    placeholder: "按数据集过滤",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
const __VLS_124 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
    value: (__VLS_ctx.filterLabel),
    placeholder: "标签关键词",
    ...{ style: {} },
}));
const __VLS_126 = __VLS_125({
    value: (__VLS_ctx.filterLabel),
    placeholder: "标签关键词",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_125));
const __VLS_128 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.listLoading),
}));
const __VLS_130 = __VLS_129({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.listLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
let __VLS_132;
let __VLS_133;
let __VLS_134;
const __VLS_135 = {
    onClick: (__VLS_ctx.loadBatches)
};
__VLS_131.slots.default;
var __VLS_131;
const __VLS_136 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
    columns: (__VLS_ctx.batchColumns),
    dataSource: (__VLS_ctx.batches),
    rowKey: "id",
    loading: (__VLS_ctx.listLoading),
    pagination: (false),
    customRow: (__VLS_ctx.rowClick),
}));
const __VLS_138 = __VLS_137({
    columns: (__VLS_ctx.batchColumns),
    dataSource: (__VLS_ctx.batches),
    rowKey: "id",
    loading: (__VLS_ctx.listLoading),
    pagination: (false),
    customRow: (__VLS_ctx.rowClick),
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
__VLS_139.slots.default;
{
    const { bodyCell: __VLS_thisSlot } = __VLS_139.slots;
    const [{ column, record }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (column.key === 'dataset_id') {
        (__VLS_ctx.datasetName(record.dataset_id));
    }
    if (column.key === 'actions') {
        const __VLS_140 = {}.ASpace;
        /** @type {[typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, ]} */ ;
        // @ts-ignore
        const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({}));
        const __VLS_142 = __VLS_141({}, ...__VLS_functionalComponentArgsRest(__VLS_141));
        __VLS_143.slots.default;
        const __VLS_144 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
            ...{ 'onClick': {} },
            size: "small",
        }));
        const __VLS_146 = __VLS_145({
            ...{ 'onClick': {} },
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_145));
        let __VLS_148;
        let __VLS_149;
        let __VLS_150;
        const __VLS_151 = {
            onClick: (...[$event]) => {
                if (!(column.key === 'actions'))
                    return;
                __VLS_ctx.selectBatch(record.id);
            }
        };
        __VLS_147.slots.default;
        var __VLS_147;
        const __VLS_152 = {}.APopconfirm;
        /** @type {[typeof __VLS_components.APopconfirm, typeof __VLS_components.aPopconfirm, typeof __VLS_components.APopconfirm, typeof __VLS_components.aPopconfirm, ]} */ ;
        // @ts-ignore
        const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
            ...{ 'onConfirm': {} },
            title: "确定删除该批次？",
        }));
        const __VLS_154 = __VLS_153({
            ...{ 'onConfirm': {} },
            title: "确定删除该批次？",
        }, ...__VLS_functionalComponentArgsRest(__VLS_153));
        let __VLS_156;
        let __VLS_157;
        let __VLS_158;
        const __VLS_159 = {
            onConfirm: (...[$event]) => {
                if (!(column.key === 'actions'))
                    return;
                __VLS_ctx.deleteBatch(record.id);
            }
        };
        __VLS_155.slots.default;
        const __VLS_160 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
            size: "small",
            danger: true,
        }));
        const __VLS_162 = __VLS_161({
            size: "small",
            danger: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_161));
        __VLS_163.slots.default;
        var __VLS_163;
        var __VLS_155;
        var __VLS_143;
    }
}
var __VLS_139;
var __VLS_119;
if (__VLS_ctx.selectedBatch) {
    const __VLS_164 = {}.ACard;
    /** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
    // @ts-ignore
    const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
        ...{ class: "panel-card detail-card" },
        bordered: (false),
        title: "批次详情",
    }));
    const __VLS_166 = __VLS_165({
        ...{ class: "panel-card detail-card" },
        bordered: (false),
        title: "批次详情",
    }, ...__VLS_functionalComponentArgsRest(__VLS_165));
    __VLS_167.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.selectedBatch.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.datasetName(__VLS_ctx.selectedBatch.dataset_id));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.selectedBatch.k);
    (__VLS_ctx.selectedBatch.n_queries);
    /** @type {[typeof BenchmarkChart, ]} */ ;
    // @ts-ignore
    const __VLS_168 = __VLS_asFunctionalComponent(BenchmarkChart, new BenchmarkChart({
        results: (__VLS_ctx.selectedBatch.results),
        k: (__VLS_ctx.selectedBatch.k),
    }));
    const __VLS_169 = __VLS_168({
        results: (__VLS_ctx.selectedBatch.results),
        k: (__VLS_ctx.selectedBatch.k),
    }, ...__VLS_functionalComponentArgsRest(__VLS_168));
    const __VLS_171 = {}.ATable;
    /** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
    // @ts-ignore
    const __VLS_172 = __VLS_asFunctionalComponent(__VLS_171, new __VLS_171({
        ...{ class: "result-table" },
        columns: (__VLS_ctx.resultColumns),
        dataSource: (__VLS_ctx.selectedBatch.results),
        rowKey: "id",
        pagination: (false),
        size: "small",
    }));
    const __VLS_173 = __VLS_172({
        ...{ class: "result-table" },
        columns: (__VLS_ctx.resultColumns),
        dataSource: (__VLS_ctx.selectedBatch.results),
        rowKey: "id",
        pagination: (false),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_172));
    var __VLS_167;
}
var __VLS_115;
var __VLS_7;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['benchmark-page']} */ ;
/** @type {__VLS_StyleScopedClasses['benchmark-page__header']} */ ;
/** @type {__VLS_StyleScopedClasses['benchmark-page__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-card']} */ ;
/** @type {__VLS_StyleScopedClasses['control-number']} */ ;
/** @type {__VLS_StyleScopedClasses['control-number']} */ ;
/** @type {__VLS_StyleScopedClasses['control-number']} */ ;
/** @type {__VLS_StyleScopedClasses['algo-section']} */ ;
/** @type {__VLS_StyleScopedClasses['algo-section__title']} */ ;
/** @type {__VLS_StyleScopedClasses['algo-card']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-card']} */ ;
/** @type {__VLS_StyleScopedClasses['table-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['result-table']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            BenchmarkChart: BenchmarkChart,
            runDatasetId: runDatasetId,
            runLabel: runLabel,
            runK: runK,
            runQueries: runQueries,
            runSeed: runSeed,
            algoConfigs: algoConfigs,
            runLoading: runLoading,
            batches: batches,
            listLoading: listLoading,
            filterDatasetId: filterDatasetId,
            filterLabel: filterLabel,
            selectedBatch: selectedBatch,
            datasetOptions: datasetOptions,
            algorithmOptions: algorithmOptions,
            batchColumns: batchColumns,
            resultColumns: resultColumns,
            datasetName: datasetName,
            rowClick: rowClick,
            addAlgo: addAlgo,
            removeAlgo: removeAlgo,
            loadBatches: loadBatches,
            selectBatch: selectBatch,
            deleteBatch: deleteBatch,
            runBenchmark: runBenchmark,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
