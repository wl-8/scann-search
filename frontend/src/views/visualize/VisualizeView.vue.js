/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { onMounted, ref } from "vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import UmapPlot from "@/components/visualize/UmapPlot.vue";
import { browseSearch } from "@/api/search";
import { useSearch } from "@/composables/useSearch";
const dimension = ref(2);
const colorBy = ref("cell_type");
const topK = ref(10);
const points = ref([]);
const selectedPoint = ref(null);
const neighbors = ref([]);
const facets = ref(null);
const loading = ref(false);
const neighborColumns = [
    { title: "Rank", dataIndex: "rank", key: "rank", width: 70 },
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Score", dataIndex: "score", key: "score", width: 100 },
    { title: "Type", dataIndex: "cell_type", key: "cell_type", width: 100 },
];
const { search } = useSearch();
async function loadPoints() {
    loading.value = true;
    try {
        const res = await browseSearch({ page: 1, pageSize: 64 });
        points.value = (res.items ?? []).map((item, idx) => ({
            id: item.id,
            cell_type: item.cell_type,
            dataset: item.dataset,
            umap_x: item.umap_x,
            umap_y: item.umap_y,
            umap_z: item.umap_z ?? idx / 10,
            metadata: item.metadata,
        }));
        facets.value = res.facets ?? null;
    }
    catch (error) {
        console.error("Failed to load visualize points:", error);
        points.value = [];
        facets.value = null;
    }
    finally {
        loading.value = false;
    }
}
async function onPointClick(point) {
    selectedPoint.value = point;
    const res = await search({ queryType: "id", query: point.id, k: topK.value, page: 1, pageSize: topK.value });
    neighbors.value = res.results;
}
onMounted(loadPoints);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['visualize-page']} */ ;
/** @type {__VLS_StyleScopedClasses['visualize-page']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__header']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__header']} */ ;
/** @type {__VLS_StyleScopedClasses['control-row']} */ ;
/** @type {__VLS_StyleScopedClasses['control-row']} */ ;
/** @type {__VLS_StyleScopedClasses['control-row']} */ ;
/** @type {__VLS_StyleScopedClasses['control-row']} */ ;
/** @type {__VLS_StyleScopedClasses['control-row']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-select-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['control-row']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-input-number']} */ ;
/** @type {__VLS_StyleScopedClasses['control-row']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-select-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['control-row']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-button']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-card-head']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-card-head-title']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['js-plotly-plot']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-waiting__icon']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-waiting__box']} */ ;
/** @type {__VLS_StyleScopedClasses['neighbor-table']} */ ;
/** @type {__VLS_StyleScopedClasses['neighbor-table']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-table-thead']} */ ;
/** @type {__VLS_StyleScopedClasses['neighbor-table']} */ ;
/** @type {__VLS_StyleScopedClasses['neighbor-table']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-table-tbody']} */ ;
/** @type {__VLS_StyleScopedClasses['neighbor-table']} */ ;
/** @type {__VLS_StyleScopedClasses['neighbor-table']} */ ;
/** @type {__VLS_StyleScopedClasses['facet-block']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__header']} */ ;
/** @type {__VLS_StyleScopedClasses['visualize-page']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__inner']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card__body']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card__body']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['plot-wrap']} */ ;
// CSS variable injection 
// CSS variable injection end 
/** @type {[typeof AppLayout, typeof AppLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppLayout, new AppLayout({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "visualize-page" },
});
const __VLS_4 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ class: "control-panel" },
    bordered: (false),
}));
const __VLS_6 = __VLS_5({
    ...{ class: "control-panel" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-panel__inner" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-panel__header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "control-panel__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
const __VLS_8 = {}.ARow;
/** @type {[typeof __VLS_components.ARow, typeof __VLS_components.aRow, typeof __VLS_components.ARow, typeof __VLS_components.aRow, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    gutter: (16),
    align: "middle",
    ...{ class: "control-row" },
}));
const __VLS_10 = __VLS_9({
    gutter: (16),
    align: "middle",
    ...{ class: "control-row" },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    xs: (24),
    md: (6),
}));
const __VLS_14 = __VLS_13({
    xs: (24),
    md: (6),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
const __VLS_16 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    value: (__VLS_ctx.dimension),
    ...{ class: "control-select" },
}));
const __VLS_18 = __VLS_17({
    value: (__VLS_ctx.dimension),
    ...{ class: "control-select" },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
const __VLS_20 = {}.ASelectOption;
/** @type {[typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    value: (2),
}));
const __VLS_22 = __VLS_21({
    value: (2),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
var __VLS_23;
const __VLS_24 = {}.ASelectOption;
/** @type {[typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    value: (3),
}));
const __VLS_26 = __VLS_25({
    value: (3),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
var __VLS_27;
var __VLS_19;
var __VLS_15;
const __VLS_28 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    xs: (24),
    md: (6),
}));
const __VLS_30 = __VLS_29({
    xs: (24),
    md: (6),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
const __VLS_32 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    value: (__VLS_ctx.colorBy),
    ...{ class: "control-select" },
}));
const __VLS_34 = __VLS_33({
    value: (__VLS_ctx.colorBy),
    ...{ class: "control-select" },
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
const __VLS_36 = {}.ASelectOption;
/** @type {[typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    value: "cell_type",
}));
const __VLS_38 = __VLS_37({
    value: "cell_type",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
var __VLS_39;
const __VLS_40 = {}.ASelectOption;
/** @type {[typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    value: "dataset",
}));
const __VLS_42 = __VLS_41({
    value: "dataset",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
var __VLS_43;
const __VLS_44 = {}.ASelectOption;
/** @type {[typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    value: "disease",
}));
const __VLS_46 = __VLS_45({
    value: "disease",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
var __VLS_47;
var __VLS_35;
var __VLS_31;
const __VLS_48 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    xs: (24),
    md: (6),
}));
const __VLS_50 = __VLS_49({
    xs: (24),
    md: (6),
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
const __VLS_52 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    value: (__VLS_ctx.topK),
    min: (1),
    max: (50),
    ...{ class: "control-number" },
}));
const __VLS_54 = __VLS_53({
    value: (__VLS_ctx.topK),
    min: (1),
    max: (50),
    ...{ class: "control-number" },
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
var __VLS_51;
const __VLS_56 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    xs: (24),
    md: (6),
}));
const __VLS_58 = __VLS_57({
    xs: (24),
    md: (6),
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
const __VLS_60 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    ...{ class: "refresh-button" },
    loading: (__VLS_ctx.loading),
}));
const __VLS_62 = __VLS_61({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    ...{ class: "refresh-button" },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
let __VLS_64;
let __VLS_65;
let __VLS_66;
const __VLS_67 = {
    onClick: (__VLS_ctx.loadPoints)
};
__VLS_63.slots.default;
var __VLS_63;
var __VLS_59;
var __VLS_11;
var __VLS_7;
const __VLS_68 = {}.ARow;
/** @type {[typeof __VLS_components.ARow, typeof __VLS_components.aRow, typeof __VLS_components.ARow, typeof __VLS_components.aRow, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    gutter: (16),
    ...{ class: "visualize-layout" },
}));
const __VLS_70 = __VLS_69({
    gutter: (16),
    ...{ class: "visualize-layout" },
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
const __VLS_72 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    xs: (24),
    lg: (16),
}));
const __VLS_74 = __VLS_73({
    xs: (24),
    lg: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
const __VLS_76 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    ...{ class: "chart-card" },
    bordered: (false),
}));
const __VLS_78 = __VLS_77({
    ...{ class: "chart-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
{
    const { title: __VLS_thisSlot } = __VLS_79.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title card-title--accent" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "card-title__bar" },
        'aria-hidden': "true",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-card__body" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-skeleton" },
    'aria-hidden': "true",
});
for (const [n] of __VLS_getVForSourceType((42))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        key: (n),
        ...{ class: "chart-skeleton__dot" },
        ...{ style: ({ '--delay': `${n * 0.03}s` }) },
    });
}
/** @type {[typeof UmapPlot, ]} */ ;
// @ts-ignore
const __VLS_80 = __VLS_asFunctionalComponent(UmapPlot, new UmapPlot({
    ...{ 'onPointClick': {} },
    points: (__VLS_ctx.points),
    dimension: (__VLS_ctx.dimension),
    colorBy: (__VLS_ctx.colorBy),
    selectedId: (__VLS_ctx.selectedPoint?.id ?? null),
}));
const __VLS_81 = __VLS_80({
    ...{ 'onPointClick': {} },
    points: (__VLS_ctx.points),
    dimension: (__VLS_ctx.dimension),
    colorBy: (__VLS_ctx.colorBy),
    selectedId: (__VLS_ctx.selectedPoint?.id ?? null),
}, ...__VLS_functionalComponentArgsRest(__VLS_80));
let __VLS_83;
let __VLS_84;
let __VLS_85;
const __VLS_86 = {
    onPointClick: (__VLS_ctx.onPointClick)
};
var __VLS_82;
var __VLS_79;
var __VLS_75;
const __VLS_87 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_88 = __VLS_asFunctionalComponent(__VLS_87, new __VLS_87({
    xs: (24),
    lg: (8),
}));
const __VLS_89 = __VLS_88({
    xs: (24),
    lg: (8),
}, ...__VLS_functionalComponentArgsRest(__VLS_88));
__VLS_90.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-stack" },
});
const __VLS_91 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_92 = __VLS_asFunctionalComponent(__VLS_91, new __VLS_91({
    ...{ class: "info-card" },
    bordered: (false),
}));
const __VLS_93 = __VLS_92({
    ...{ class: "info-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_92));
__VLS_94.slots.default;
{
    const { title: __VLS_thisSlot } = __VLS_94.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
if (__VLS_ctx.selectedPoint) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "selected-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.selectedPoint.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.selectedPoint.cell_type);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.selectedPoint.dataset);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({});
    (JSON.stringify(__VLS_ctx.selectedPoint.metadata, null, 2));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-waiting" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-waiting__box" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-waiting__icon" },
        'aria-hidden': "true",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 24 24",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M4 18h16",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M6 18V7",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M10 18V11",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M14 18V5",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M18 18V9",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
}
var __VLS_94;
const __VLS_95 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_96 = __VLS_asFunctionalComponent(__VLS_95, new __VLS_95({
    ...{ class: "info-card" },
    bordered: (false),
}));
const __VLS_97 = __VLS_96({
    ...{ class: "info-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_96));
__VLS_98.slots.default;
{
    const { title: __VLS_thisSlot } = __VLS_98.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
const __VLS_99 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_100 = __VLS_asFunctionalComponent(__VLS_99, new __VLS_99({
    ...{ class: "neighbor-table" },
    columns: (__VLS_ctx.neighborColumns),
    dataSource: (__VLS_ctx.neighbors),
    pagination: (false),
    size: "small",
    rowKey: "rank",
}));
const __VLS_101 = __VLS_100({
    ...{ class: "neighbor-table" },
    columns: (__VLS_ctx.neighborColumns),
    dataSource: (__VLS_ctx.neighbors),
    pagination: (false),
    size: "small",
    rowKey: "rank",
}, ...__VLS_functionalComponentArgsRest(__VLS_100));
var __VLS_98;
const __VLS_103 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_104 = __VLS_asFunctionalComponent(__VLS_103, new __VLS_103({
    ...{ class: "info-card" },
    bordered: (false),
}));
const __VLS_105 = __VLS_104({
    ...{ class: "info-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_104));
__VLS_106.slots.default;
{
    const { title: __VLS_thisSlot } = __VLS_106.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
if (__VLS_ctx.facets) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "facets-visual" },
    });
    for (const [vals, key] of __VLS_getVForSourceType((__VLS_ctx.facets))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (key),
            ...{ class: "facet-block" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (key);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "facet-list" },
        });
        for (const [count, name] of __VLS_getVForSourceType((vals))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (name),
                ...{ class: "facet-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "facet-row__name" },
            });
            (name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "facet-row__value" },
            });
            (count);
        }
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stats-empty" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stats-skeleton" },
        'aria-hidden': "true",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stats-skeleton__bar stats-skeleton__bar--1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stats-skeleton__bar stats-skeleton__bar--2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stats-skeleton__bar stats-skeleton__bar--3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stats-empty__text" },
    });
}
var __VLS_106;
var __VLS_90;
var __VLS_71;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['visualize-page']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__inner']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__header']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['control-row']} */ ;
/** @type {__VLS_StyleScopedClasses['control-select']} */ ;
/** @type {__VLS_StyleScopedClasses['control-select']} */ ;
/** @type {__VLS_StyleScopedClasses['control-number']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-button']} */ ;
/** @type {__VLS_StyleScopedClasses['visualize-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title--accent']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title__bar']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card__body']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-skeleton']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-skeleton__dot']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-waiting']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-waiting__box']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-waiting__icon']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['neighbor-table']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['facets-visual']} */ ;
/** @type {__VLS_StyleScopedClasses['facet-block']} */ ;
/** @type {__VLS_StyleScopedClasses['facet-list']} */ ;
/** @type {__VLS_StyleScopedClasses['facet-row']} */ ;
/** @type {__VLS_StyleScopedClasses['facet-row__name']} */ ;
/** @type {__VLS_StyleScopedClasses['facet-row__value']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-skeleton']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-skeleton__bar']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-skeleton__bar--1']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-skeleton__bar']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-skeleton__bar--2']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-skeleton__bar']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-skeleton__bar--3']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-empty__text']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            UmapPlot: UmapPlot,
            dimension: dimension,
            colorBy: colorBy,
            topK: topK,
            points: points,
            selectedPoint: selectedPoint,
            neighbors: neighbors,
            facets: facets,
            loading: loading,
            neighborColumns: neighborColumns,
            loadPoints: loadPoints,
            onPointClick: onPointClick,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
