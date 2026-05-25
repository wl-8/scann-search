/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import SearchForm from "@/components/search/SearchForm.vue";
import { listDatasets, listIndexes } from "@/api/search";
import { useSearch } from "@/composables/useSearch";
const { loading, search } = useSearch();
const results = ref([]);
const lastElapsed = ref(null);
const resourceLoading = ref(false);
const datasets = ref([]);
const indexes = ref([]);
const selectedDatasetId = ref();
const selectedIndexId = ref();
const formData = ref({
    queryType: "id",
    query: "",
    k: 10,
    oversample: 10,
    filterColumn: "",
    filterValue: "",
    filters: { cell_type: "" },
});
const columns = [
    { title: "Rank", dataIndex: "rank", key: "rank", width: 80 },
    { title: "Cell ID", dataIndex: "id", key: "id" },
    { title: "Distance", dataIndex: "distance", key: "distance", width: 120 },
    { title: "Cell Type", dataIndex: "cell_type", key: "cell_type", width: 140 },
    { title: "Row", dataIndex: "row_index", key: "row_index", width: 100 },
];
const readyDatasets = computed(() => datasets.value.filter((item) => item.status === "ready"));
const readyIndexes = computed(() => indexes.value.filter((item) => item.status === "ready"));
const datasetOptions = computed(() => readyDatasets.value.map((item) => ({
    value: item.id,
    label: `${item.name} (#${item.id}, ${item.n_cells} cells, dim=${item.vector_dim})`,
})));
const indexOptions = computed(() => readyIndexes.value.map((item) => ({
    value: item.id,
    label: `#${item.id} ${item.algorithm} (${item.n_vectors} vectors, dim=${item.vector_dim})`,
})));
async function onSearch(payload) {
    if (!selectedIndexId.value) {
        message.warning("请先选择索引");
        return;
    }
    const res = await search({
        ...payload,
        datasetId: selectedDatasetId.value,
        indexId: selectedIndexId.value,
    });
    results.value = res.results;
    lastElapsed.value = res.elapsed;
}
async function loadResources() {
    resourceLoading.value = true;
    try {
        datasets.value = await listDatasets();
        const initialDatasetId = selectedDatasetId.value ?? readyDatasets.value[0]?.id;
        selectedDatasetId.value = initialDatasetId;
        indexes.value = await listIndexes(initialDatasetId);
        selectedIndexId.value = readyIndexes.value[0]?.id;
    }
    catch (err) {
        message.warning("后端资源加载失败，请确认 FastAPI 服务已启动");
    }
    finally {
        resourceLoading.value = false;
    }
}
async function onDatasetChange(datasetId) {
    indexes.value = await listIndexes(datasetId);
    selectedIndexId.value = readyIndexes.value[0]?.id;
}
onMounted(loadResources);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['search-page']} */ ;
/** @type {__VLS_StyleScopedClasses['search-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-button']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-button__icon']} */ ;
/** @type {__VLS_StyleScopedClasses['results-table']} */ ;
/** @type {__VLS_StyleScopedClasses['results-table']} */ ;
/** @type {__VLS_StyleScopedClasses['results-table']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-table-thead']} */ ;
/** @type {__VLS_StyleScopedClasses['results-table']} */ ;
/** @type {__VLS_StyleScopedClasses['results-table']} */ ;
/** @type {__VLS_StyleScopedClasses['results-table']} */ ;
/** @type {__VLS_StyleScopedClasses['results-table']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['facets-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['facet-group']} */ ;
/** @type {__VLS_StyleScopedClasses['search-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['search-column--form']} */ ;
/** @type {__VLS_StyleScopedClasses['results-card']} */ ;
/** @type {__VLS_StyleScopedClasses['search-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-band']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-input']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-button']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "search-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "page-icon" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M11 4a7 7 0 105.196 11.688L20 20.5",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-crumb" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-meta" },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
else if (__VLS_ctx.lastElapsed !== null) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.lastElapsed);
    (__VLS_ctx.results.length);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "search-layout" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "search-column search-column--form" },
});
const __VLS_0 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "resource-card" },
    bordered: (false),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "resource-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "resource-card__title" },
});
const __VLS_4 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    layout: "vertical",
}));
const __VLS_6 = __VLS_5({
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    label: "数据集",
}));
const __VLS_10 = __VLS_9({
    label: "数据集",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onChange': {} },
    value: (__VLS_ctx.selectedDatasetId),
    options: (__VLS_ctx.datasetOptions),
    placeholder: "选择 ready 数据集",
    loading: (__VLS_ctx.resourceLoading),
}));
const __VLS_14 = __VLS_13({
    ...{ 'onChange': {} },
    value: (__VLS_ctx.selectedDatasetId),
    options: (__VLS_ctx.datasetOptions),
    placeholder: "选择 ready 数据集",
    loading: (__VLS_ctx.resourceLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onChange: (__VLS_ctx.onDatasetChange)
};
var __VLS_15;
var __VLS_11;
const __VLS_20 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    label: "索引",
}));
const __VLS_22 = __VLS_21({
    label: "索引",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
const __VLS_24 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    value: (__VLS_ctx.selectedIndexId),
    options: (__VLS_ctx.indexOptions),
    placeholder: "选择 ready 索引",
    loading: (__VLS_ctx.resourceLoading),
}));
const __VLS_26 = __VLS_25({
    value: (__VLS_ctx.selectedIndexId),
    options: (__VLS_ctx.indexOptions),
    placeholder: "选择 ready 索引",
    loading: (__VLS_ctx.resourceLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
var __VLS_23;
const __VLS_28 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onClick': {} },
    block: true,
    loading: (__VLS_ctx.resourceLoading),
}));
const __VLS_30 = __VLS_29({
    ...{ 'onClick': {} },
    block: true,
    loading: (__VLS_ctx.resourceLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onClick: (__VLS_ctx.loadResources)
};
__VLS_31.slots.default;
var __VLS_31;
var __VLS_7;
var __VLS_3;
/** @type {[typeof SearchForm, ]} */ ;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent(SearchForm, new SearchForm({
    ...{ 'onSubmit': {} },
    modelValue: (__VLS_ctx.formData),
}));
const __VLS_37 = __VLS_36({
    ...{ 'onSubmit': {} },
    modelValue: (__VLS_ctx.formData),
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
let __VLS_39;
let __VLS_40;
let __VLS_41;
const __VLS_42 = {
    onSubmit: (__VLS_ctx.onSearch)
};
var __VLS_38;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "search-column search-column--results" },
});
const __VLS_43 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
    ...{ class: "results-card" },
    bordered: (false),
}));
const __VLS_45 = __VLS_44({
    ...{ class: "results-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_44));
__VLS_46.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "results-card__toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar-band" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar-band__group toolbar-band__group--meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "toolbar-label" },
});
if (__VLS_ctx.selectedIndexId) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "toolbar-value" },
    });
    (__VLS_ctx.selectedIndexId);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "toolbar-value" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "results-card__body" },
});
if (!__VLS_ctx.selectedIndexId) {
    const __VLS_47 = {}.AAlert;
    /** @type {[typeof __VLS_components.AAlert, typeof __VLS_components.aAlert, ]} */ ;
    // @ts-ignore
    const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
        type: "info",
        showIcon: true,
        message: "请先选择已构建完成的索引；如列表为空，请先通过后端脚本或索引接口构建索引。",
        ...{ style: {} },
    }));
    const __VLS_49 = __VLS_48({
        type: "info",
        showIcon: true,
        message: "请先选择已构建完成的索引；如列表为空，请先通过后端脚本或索引接口构建索引。",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_48));
}
const __VLS_51 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
    ...{ class: "results-table" },
    columns: (__VLS_ctx.columns),
    dataSource: (__VLS_ctx.results),
    loading: (__VLS_ctx.loading),
    pagination: (false),
    rowKey: "rank",
    bordered: true,
}));
const __VLS_53 = __VLS_52({
    ...{ class: "results-table" },
    columns: (__VLS_ctx.columns),
    dataSource: (__VLS_ctx.results),
    loading: (__VLS_ctx.loading),
    pagination: (false),
    rowKey: "rank",
    bordered: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_52));
__VLS_54.slots.default;
{
    const { expandedRowRender: __VLS_thisSlot } = __VLS_54.slots;
    const [{ record }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_55 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
        bordered: true,
        column: "2",
        size: "small",
        ...{ class: "result-details" },
    }));
    const __VLS_57 = __VLS_56({
        bordered: true,
        column: "2",
        size: "small",
        ...{ class: "result-details" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_56));
    __VLS_58.slots.default;
    const __VLS_59 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
        label: "Cell ID",
    }));
    const __VLS_61 = __VLS_60({
        label: "Cell ID",
    }, ...__VLS_functionalComponentArgsRest(__VLS_60));
    __VLS_62.slots.default;
    (record.id);
    var __VLS_62;
    const __VLS_63 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({
        label: "Row Index",
    }));
    const __VLS_65 = __VLS_64({
        label: "Row Index",
    }, ...__VLS_functionalComponentArgsRest(__VLS_64));
    __VLS_66.slots.default;
    (record.row_index);
    var __VLS_66;
    const __VLS_67 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
        label: "Distance",
    }));
    const __VLS_69 = __VLS_68({
        label: "Distance",
    }, ...__VLS_functionalComponentArgsRest(__VLS_68));
    __VLS_70.slots.default;
    (record.distance);
    var __VLS_70;
    const __VLS_71 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_72 = __VLS_asFunctionalComponent(__VLS_71, new __VLS_71({
        label: "Cell Type",
    }));
    const __VLS_73 = __VLS_72({
        label: "Cell Type",
    }, ...__VLS_functionalComponentArgsRest(__VLS_72));
    __VLS_74.slots.default;
    (record.cell_type);
    var __VLS_74;
    const __VLS_75 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
        label: "Obs",
        span: (2),
    }));
    const __VLS_77 = __VLS_76({
        label: "Obs",
        span: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_76));
    __VLS_78.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        ...{ class: "details-pre" },
    });
    (JSON.stringify(record.obs ?? record.metadata, null, 2));
    var __VLS_78;
    var __VLS_58;
}
var __VLS_54;
if (!__VLS_ctx.results.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
    const __VLS_79 = {}.AEmpty;
    /** @type {[typeof __VLS_components.AEmpty, typeof __VLS_components.aEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_80 = __VLS_asFunctionalComponent(__VLS_79, new __VLS_79({
        description: "尚无结果。请先发起检索。",
    }));
    const __VLS_81 = __VLS_80({
        description: "尚无结果。请先发起检索。",
    }, ...__VLS_functionalComponentArgsRest(__VLS_80));
}
var __VLS_46;
/** @type {__VLS_StyleScopedClasses['search-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['page-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['page-crumb']} */ ;
/** @type {__VLS_StyleScopedClasses['page-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['search-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['search-column']} */ ;
/** @type {__VLS_StyleScopedClasses['search-column--form']} */ ;
/** @type {__VLS_StyleScopedClasses['resource-card']} */ ;
/** @type {__VLS_StyleScopedClasses['resource-card__title']} */ ;
/** @type {__VLS_StyleScopedClasses['search-column']} */ ;
/** @type {__VLS_StyleScopedClasses['search-column--results']} */ ;
/** @type {__VLS_StyleScopedClasses['results-card']} */ ;
/** @type {__VLS_StyleScopedClasses['results-card__toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-band']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-band__group']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-band__group--meta']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-label']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-value']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-value']} */ ;
/** @type {__VLS_StyleScopedClasses['results-card__body']} */ ;
/** @type {__VLS_StyleScopedClasses['results-table']} */ ;
/** @type {__VLS_StyleScopedClasses['result-details']} */ ;
/** @type {__VLS_StyleScopedClasses['details-pre']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SearchForm: SearchForm,
            loading: loading,
            results: results,
            lastElapsed: lastElapsed,
            resourceLoading: resourceLoading,
            selectedDatasetId: selectedDatasetId,
            selectedIndexId: selectedIndexId,
            formData: formData,
            columns: columns,
            datasetOptions: datasetOptions,
            indexOptions: indexOptions,
            onSearch: onSearch,
            loadResources: loadResources,
            onDatasetChange: onDatasetChange,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
