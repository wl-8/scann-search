/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, ref } from "vue";
import SearchForm from "@/components/search/SearchForm.vue";
import { browseSearch, conditionalSearch, multiDatasetSearch } from "@/api/search";
import { useSearch } from "@/composables/useSearch";
const { loading, search } = useSearch();
const results = ref([]);
const lastElapsed = ref(null);
const formData = ref({
    queryType: "id",
    query: "",
    indexType: "HNSW",
    metric: "cosine",
    k: 10,
    filters: { cell_type: "" },
});
// table / pagination state
const currentPage = ref(1);
const pageSize = ref(10);
const columns = [
    { title: "Rank", dataIndex: "rank", key: "rank", width: 80 },
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Score", dataIndex: "score", key: "score", width: 120 },
    { title: "Cell Type", dataIndex: "cell_type", key: "cell_type", width: 140 },
    { title: "Dataset", dataIndex: "dataset", key: "dataset", width: 140 },
];
const total = ref(0);
const pagination = computed(() => ({
    current: currentPage.value,
    pageSize: pageSize.value,
    total: total.value,
    showSizeChanger: true,
}));
// When backend supports server-side paging, `results` should be the current page items.
const pagedData = computed(() => results.value);
async function onTableChange(pag) {
    currentPage.value = pag.current ?? 1;
    pageSize.value = pag.pageSize ?? 10;
    // request the new page from backend
    const payload = { ...formData.value, page: currentPage.value, pageSize: pageSize.value };
    const res = await search(payload);
    results.value = res.results;
    lastElapsed.value = res.elapsed;
    total.value = res.total ?? res.results.length;
}
async function onSearch(payload) {
    currentPage.value = 1;
    const res = await search({ ...payload, page: 1, pageSize: pageSize.value });
    results.value = res.results;
    lastElapsed.value = res.elapsed;
    total.value = res.total ?? res.results.length;
}
const multiDatasetsInput = ref("datasetA,datasetB");
const facets = ref(null);
async function handleConditional() {
    const payload = { ...formData.value, filters: formData.value.filters ?? {}, page: 1, pageSize: pageSize.value };
    const start = performance.now();
    const res = await conditionalSearch(payload);
    const elapsed = Math.round(performance.now() - start);
    results.value = res.items ?? res.results ?? [];
    lastElapsed.value = elapsed;
    total.value = res.total ?? results.value.length;
    facets.value = res.facets ?? null;
}
async function handleMultiDataset() {
    const datasets = multiDatasetsInput.value.split(",").map((s) => s.trim()).filter(Boolean);
    const payload = { datasets, page: 1, pageSize: pageSize.value };
    const start = performance.now();
    const res = await multiDatasetSearch(payload);
    const elapsed = Math.round(performance.now() - start);
    results.value = res.items ?? res.results ?? [];
    lastElapsed.value = elapsed;
    total.value = res.total ?? results.value.length;
    facets.value = res.facets ?? null;
}
async function handleBrowse() {
    const payload = { page: 1, pageSize: pageSize.value };
    const start = performance.now();
    const res = await browseSearch(payload);
    const elapsed = Math.round(performance.now() - start);
    results.value = res.items ?? res.results ?? [];
    lastElapsed.value = elapsed;
    total.value = res.total ?? results.value.length;
    facets.value = res.facets ?? null;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['results-table']} */ ;
/** @type {__VLS_StyleScopedClasses['results-table']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "search-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
/** @type {[typeof SearchForm, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(SearchForm, new SearchForm({
    ...{ 'onSubmit': {} },
    modelValue: (__VLS_ctx.formData),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onSubmit': {} },
    modelValue: (__VLS_ctx.formData),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onSubmit: (__VLS_ctx.onSearch)
};
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_7 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
__VLS_10.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "meta" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
else if (__VLS_ctx.lastElapsed !== null) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.lastElapsed);
    (__VLS_ctx.results.length);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_11 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
    value: (__VLS_ctx.multiDatasetsInput),
    ...{ style: {} },
    placeholder: "datasetA,datasetB",
}));
const __VLS_13 = __VLS_12({
    value: (__VLS_ctx.multiDatasetsInput),
    ...{ style: {} },
    placeholder: "datasetA,datasetB",
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
const __VLS_15 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
    ...{ 'onClick': {} },
    size: "small",
}));
const __VLS_17 = __VLS_16({
    ...{ 'onClick': {} },
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
let __VLS_19;
let __VLS_20;
let __VLS_21;
const __VLS_22 = {
    onClick: (__VLS_ctx.handleConditional)
};
__VLS_18.slots.default;
var __VLS_18;
const __VLS_23 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
    ...{ 'onClick': {} },
    size: "small",
}));
const __VLS_25 = __VLS_24({
    ...{ 'onClick': {} },
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_24));
let __VLS_27;
let __VLS_28;
let __VLS_29;
const __VLS_30 = {
    onClick: (__VLS_ctx.handleMultiDataset)
};
__VLS_26.slots.default;
var __VLS_26;
const __VLS_31 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
    ...{ 'onClick': {} },
    size: "small",
}));
const __VLS_33 = __VLS_32({
    ...{ 'onClick': {} },
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
let __VLS_35;
let __VLS_36;
let __VLS_37;
const __VLS_38 = {
    onClick: (__VLS_ctx.handleBrowse)
};
__VLS_34.slots.default;
var __VLS_34;
const __VLS_39 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
    ...{ 'onChange': {} },
    columns: (__VLS_ctx.columns),
    dataSource: (__VLS_ctx.pagedData),
    loading: (__VLS_ctx.loading),
    pagination: (__VLS_ctx.pagination),
    rowKey: "rank",
    bordered: true,
}));
const __VLS_41 = __VLS_40({
    ...{ 'onChange': {} },
    columns: (__VLS_ctx.columns),
    dataSource: (__VLS_ctx.pagedData),
    loading: (__VLS_ctx.loading),
    pagination: (__VLS_ctx.pagination),
    rowKey: "rank",
    bordered: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
let __VLS_43;
let __VLS_44;
let __VLS_45;
const __VLS_46 = {
    onChange: (__VLS_ctx.onTableChange)
};
__VLS_42.slots.default;
{
    const { expandedRowRender: __VLS_thisSlot } = __VLS_42.slots;
    const [{ record }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_47 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
        bordered: true,
        column: "2",
        size: "small",
    }));
    const __VLS_49 = __VLS_48({
        bordered: true,
        column: "2",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_48));
    __VLS_50.slots.default;
    const __VLS_51 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
        label: "Cell ID",
    }));
    const __VLS_53 = __VLS_52({
        label: "Cell ID",
    }, ...__VLS_functionalComponentArgsRest(__VLS_52));
    __VLS_54.slots.default;
    (record.id);
    var __VLS_54;
    const __VLS_55 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
        label: "Score",
    }));
    const __VLS_57 = __VLS_56({
        label: "Score",
    }, ...__VLS_functionalComponentArgsRest(__VLS_56));
    __VLS_58.slots.default;
    (record.score);
    var __VLS_58;
    const __VLS_59 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
        label: "Cell Type",
    }));
    const __VLS_61 = __VLS_60({
        label: "Cell Type",
    }, ...__VLS_functionalComponentArgsRest(__VLS_60));
    __VLS_62.slots.default;
    (record.cell_type);
    var __VLS_62;
    const __VLS_63 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({
        label: "Dataset",
    }));
    const __VLS_65 = __VLS_64({
        label: "Dataset",
    }, ...__VLS_functionalComponentArgsRest(__VLS_64));
    __VLS_66.slots.default;
    (record.dataset);
    var __VLS_66;
    const __VLS_67 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
        label: "UMAP X",
    }));
    const __VLS_69 = __VLS_68({
        label: "UMAP X",
    }, ...__VLS_functionalComponentArgsRest(__VLS_68));
    __VLS_70.slots.default;
    (record.umap_x);
    var __VLS_70;
    const __VLS_71 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_72 = __VLS_asFunctionalComponent(__VLS_71, new __VLS_71({
        label: "UMAP Y",
    }));
    const __VLS_73 = __VLS_72({
        label: "UMAP Y",
    }, ...__VLS_functionalComponentArgsRest(__VLS_72));
    __VLS_74.slots.default;
    (record.umap_y);
    var __VLS_74;
    const __VLS_75 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
        label: "Metadata",
        span: (2),
    }));
    const __VLS_77 = __VLS_76({
        label: "Metadata",
        span: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_76));
    __VLS_78.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        ...{ style: {} },
    });
    (JSON.stringify(record.metadata, null, 2));
    var __VLS_78;
    const __VLS_79 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_80 = __VLS_asFunctionalComponent(__VLS_79, new __VLS_79({
        label: "Gene Expr",
        span: (2),
    }));
    const __VLS_81 = __VLS_80({
        label: "Gene Expr",
        span: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_80));
    __VLS_82.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    for (const [v, k] of __VLS_getVForSourceType((record.gene_expr))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (k),
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (k);
        (v);
    }
    var __VLS_82;
    var __VLS_50;
}
var __VLS_42;
if (!__VLS_ctx.results.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
        ...{ style: {} },
    });
}
if (__VLS_ctx.facets) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    for (const [vals, key] of __VLS_getVForSourceType((__VLS_ctx.facets))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (key),
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (key);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
            ...{ style: {} },
        });
        for (const [count, name] of __VLS_getVForSourceType((vals))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (name),
            });
            (name);
            (count);
        }
    }
}
var __VLS_10;
/** @type {__VLS_StyleScopedClasses['search-page']} */ ;
/** @type {__VLS_StyleScopedClasses['meta']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SearchForm: SearchForm,
            loading: loading,
            results: results,
            lastElapsed: lastElapsed,
            formData: formData,
            columns: columns,
            pagination: pagination,
            pagedData: pagedData,
            onTableChange: onTableChange,
            onSearch: onSearch,
            multiDatasetsInput: multiDatasetsInput,
            facets: facets,
            handleConditional: handleConditional,
            handleMultiDataset: handleMultiDataset,
            handleBrowse: handleBrowse,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
