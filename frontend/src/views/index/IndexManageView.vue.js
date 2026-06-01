/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted } from "vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import { listDatasets } from "@/api/search";
import { listIndexes } from "@/api/search";
import { buildIndex, deleteIndex, getAlgorithms } from "@/api/indexes";
import { message } from "ant-design-vue";
const datasets = ref([]);
const indexes = ref([]);
const selectedDatasetId = ref(null);
const algorithm = ref("hnsw");
const paramsText = ref("{}");
const loading = ref(false);
const building = ref(false);
const algorithms = ref([]);
const datasetOptions = computed(() => datasets.value.map((d) => ({ label: d.name, value: d.id })));
const algorithmOptions = computed(() => algorithms.value.map((a) => ({ label: a, value: a })));
const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Dataset", dataIndex: "dataset_id", key: "dataset_id" },
    { title: "Algorithm", dataIndex: "algorithm", key: "algorithm" },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "Vectors", dataIndex: "n_vectors", key: "n_vectors" },
    { title: "Action", key: "action", width: 80 },
];
async function loadResources() {
    loading.value = true;
    try {
        datasets.value = await listDatasets();
        const first = datasets.value[0];
        selectedDatasetId.value = first?.id ?? null;
        indexes.value = await listIndexes(selectedDatasetId.value ?? undefined);
        algorithms.value = await getAlgorithms();
    }
    catch (e) {
        message.error("加载资源失败，确认后端已启动");
    }
    finally {
        loading.value = false;
    }
}
async function onDatasetChange(id) {
    loading.value = true;
    try {
        indexes.value = await listIndexes(id);
    }
    catch (e) {
        message.error("加载索引失败");
    }
    finally {
        loading.value = false;
    }
}
async function onBuildIndex() {
    if (!selectedDatasetId.value)
        return message.warning("请先选择数据集");
    let params = {};
    try {
        params = JSON.parse(paramsText.value || "{}");
    }
    catch (e) {
        return message.warning("参数不是有效的 JSON");
    }
    building.value = true;
    try {
        await buildIndex({ dataset_id: selectedDatasetId.value, algorithm: algorithm.value, params });
        message.success("索引构建请求已提交，后台会异步处理");
        indexes.value = await listIndexes(selectedDatasetId.value);
    }
    catch (e) {
        message.error("构建索引失败");
    }
    finally {
        building.value = false;
    }
}
async function onDeleteIndex(id) {
    try {
        await deleteIndex(id);
        message.success("索引已删除");
        indexes.value = await listIndexes(selectedDatasetId.value ?? undefined);
    }
    catch (e) {
        message.error("删除索引失败");
    }
}
onMounted(loadResources);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
/** @type {[typeof AppLayout, typeof AppLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppLayout, new AppLayout({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "index-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
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
    md: (8),
}));
const __VLS_10 = __VLS_9({
    xs: (24),
    md: (8),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    bordered: (false),
}));
const __VLS_14 = __VLS_13({
    bordered: (false),
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
    ...{ 'onChange': {} },
    value: (__VLS_ctx.selectedDatasetId),
    options: (__VLS_ctx.datasetOptions),
}));
const __VLS_26 = __VLS_25({
    ...{ 'onChange': {} },
    value: (__VLS_ctx.selectedDatasetId),
    options: (__VLS_ctx.datasetOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onChange: (__VLS_ctx.onDatasetChange)
};
var __VLS_27;
var __VLS_23;
const __VLS_32 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    label: "算法",
}));
const __VLS_34 = __VLS_33({
    label: "算法",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
const __VLS_36 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    value: (__VLS_ctx.algorithm),
    options: (__VLS_ctx.algorithmOptions),
}));
const __VLS_38 = __VLS_37({
    value: (__VLS_ctx.algorithm),
    options: (__VLS_ctx.algorithmOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
var __VLS_35;
const __VLS_40 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    label: "参数（JSON）",
}));
const __VLS_42 = __VLS_41({
    label: "参数（JSON）",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
const __VLS_44 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    value: (__VLS_ctx.paramsText),
    placeholder: '例如: { "M": 16, "ef_construction": 200 }',
}));
const __VLS_46 = __VLS_45({
    value: (__VLS_ctx.paramsText),
    placeholder: '例如: { "M": 16, "ef_construction": 200 }',
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
var __VLS_43;
const __VLS_48 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.building),
}));
const __VLS_50 = __VLS_49({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.building),
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
let __VLS_52;
let __VLS_53;
let __VLS_54;
const __VLS_55 = {
    onClick: (__VLS_ctx.onBuildIndex)
};
__VLS_51.slots.default;
var __VLS_51;
var __VLS_19;
var __VLS_15;
var __VLS_11;
const __VLS_56 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    xs: (24),
    md: (16),
}));
const __VLS_58 = __VLS_57({
    xs: (24),
    md: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
const __VLS_60 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    bordered: (false),
    title: "索引列表",
}));
const __VLS_62 = __VLS_61({
    bordered: (false),
    title: "索引列表",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
const __VLS_64 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    columns: (__VLS_ctx.columns),
    dataSource: (__VLS_ctx.indexes),
    rowKey: ('id'),
    loading: (__VLS_ctx.loading),
    pagination: (false),
}));
const __VLS_66 = __VLS_65({
    columns: (__VLS_ctx.columns),
    dataSource: (__VLS_ctx.indexes),
    rowKey: ('id'),
    loading: (__VLS_ctx.loading),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
{
    const { bodyCell: __VLS_thisSlot } = __VLS_67.slots;
    const [{ column, record }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (column.key === 'dataset_id') {
        (__VLS_ctx.datasets.find(d => d.id === record.dataset_id)?.name ?? record.dataset_id);
    }
    if (column.key === 'action') {
        const __VLS_68 = {}.ASpace;
        /** @type {[typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, ]} */ ;
        // @ts-ignore
        const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({}));
        const __VLS_70 = __VLS_69({}, ...__VLS_functionalComponentArgsRest(__VLS_69));
        __VLS_71.slots.default;
        const __VLS_72 = {}.APopconfirm;
        /** @type {[typeof __VLS_components.APopconfirm, typeof __VLS_components.aPopconfirm, typeof __VLS_components.APopconfirm, typeof __VLS_components.aPopconfirm, ]} */ ;
        // @ts-ignore
        const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
            ...{ 'onConfirm': {} },
            title: "确定删除该索引？",
        }));
        const __VLS_74 = __VLS_73({
            ...{ 'onConfirm': {} },
            title: "确定删除该索引？",
        }, ...__VLS_functionalComponentArgsRest(__VLS_73));
        let __VLS_76;
        let __VLS_77;
        let __VLS_78;
        const __VLS_79 = {
            onConfirm: (...[$event]) => {
                if (!(column.key === 'action'))
                    return;
                __VLS_ctx.onDeleteIndex(record.id);
            }
        };
        __VLS_75.slots.default;
        const __VLS_80 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
            type: "default",
        }));
        const __VLS_82 = __VLS_81({
            type: "default",
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        __VLS_83.slots.default;
        var __VLS_83;
        var __VLS_75;
        var __VLS_71;
    }
}
var __VLS_67;
var __VLS_63;
var __VLS_59;
var __VLS_7;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['index-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            datasets: datasets,
            indexes: indexes,
            selectedDatasetId: selectedDatasetId,
            algorithm: algorithm,
            paramsText: paramsText,
            loading: loading,
            building: building,
            datasetOptions: datasetOptions,
            algorithmOptions: algorithmOptions,
            columns: columns,
            onDatasetChange: onDatasetChange,
            onBuildIndex: onBuildIndex,
            onDeleteIndex: onDeleteIndex,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
