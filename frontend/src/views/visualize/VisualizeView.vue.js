import { computed, onMounted, ref, watch } from "vue";
import { message } from "ant-design-vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import UmapPlot from "@/components/visualize/UmapPlot.vue";
import { browseSearch, listDatasets, listIndexes } from "@/api/search";
import { useSearch } from "@/composables/useSearch";
import request from "@/api/request";
const dimension = ref(2);
const colorBy = ref("cell_type");
const topK = ref(10);
const points = ref([]);
const selectedPoint = ref(null);
const neighbors = ref([]);
const facets = ref(null);
const loading = ref(false);
const neighborLoading = ref(false);
const activeIndexId = ref();
const highlightPoints = ref([]);
const locateInput = ref("");
const locateLoading = ref(false);
// 数据集选择
const allDatasets = ref([]);
const datasetsLoading = ref(false);
const selectedDatasetId = ref();
const colorOptions = ref(["cell_type"]);
const datasetOptions = computed(() => allDatasets.value.map((d) => ({ label: `${d.name} (${d.n_cells ?? "?"} cells)`, value: d.id })));
const neighborColumns = [
    { title: "Rank", dataIndex: "rank", key: "rank", width: 70 },
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Score", dataIndex: "score", key: "score", width: 100 },
    { title: "Type", dataIndex: "cell_type", key: "cell_type", width: 100 },
];
const { search } = useSearch();
async function loadAllDatasets() {
    datasetsLoading.value = true;
    try {
        allDatasets.value = await listDatasets();
        if (allDatasets.value.length > 0 && !selectedDatasetId.value) {
            selectedDatasetId.value = allDatasets.value[0].id;
            await fetchColorOptions(selectedDatasetId.value);
        }
    }
    catch {
        // ignore
    }
    finally {
        datasetsLoading.value = false;
    }
}
async function fetchColorOptions(datasetId) {
    try {
        const modes = await request.get(`/visualize/${datasetId}/modes`);
        if (modes?.color_options?.length) {
            colorOptions.value = modes.color_options;
            if (!colorOptions.value.includes(colorBy.value)) {
                colorBy.value = colorOptions.value[0];
            }
        }
    }
    catch {
        colorOptions.value = ["cell_type"];
    }
}
async function onDatasetChange(datasetId) {
    selectedDatasetId.value = datasetId;
    await fetchColorOptions(datasetId);
    highlightPoints.value = [];
}
async function loadPoints() {
    const dsId = selectedDatasetId.value ?? allDatasets.value[0]?.id;
    if (!dsId)
        return;
    loading.value = true;
    try {
        // 顺带拿第一个 ready 索引，供点击相似查询使用
        const indexes = await listIndexes(dsId);
        activeIndexId.value = indexes.find((i) => i.status === "ready")?.id;
        const res = await browseSearch({ datasetId: dsId, pageSize: 5000, queryType: dimension.value === 3 ? "vector" : "id", colorBy: colorBy.value });
        const pts = res.points ?? [];
        points.value = pts.map((item, idx) => ({
            id: item.cell_id,
            cell_type: item.obs?.[colorBy.value] ?? item.obs?.cell_type ?? item.label,
            dataset: `dataset_${res.dataset_id}`,
            umap_x: item.x,
            umap_y: item.y,
            umap_z: item.z ?? idx / 10,
            metadata: item.obs ?? {},
        }));
        facets.value = res.color_options ? { [res.color_by ?? "color_by"]: res.color_options } : null;
        highlightPoints.value = [];
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
    if (!activeIndexId.value) {
        neighbors.value = [];
        return;
    }
    neighborLoading.value = true;
    try {
        const res = await search({ queryType: "id", query: point.id, indexId: activeIndexId.value, k: topK.value, page: 1, pageSize: topK.value });
        neighbors.value = res.results;
    }
    catch (e) {
        neighbors.value = [];
    }
    finally {
        neighborLoading.value = false;
    }
}
async function locateCells() {
    const dsId = selectedDatasetId.value;
    if (!dsId)
        return message.warning("请先选择数据集");
    const ids = locateInput.value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    if (!ids.length)
        return message.warning("请输入 cell_id");
    locateLoading.value = true;
    try {
        const res = await request.post(`/visualize/${dsId}/locate`, {
            cell_ids: ids,
            mode: dimension.value === 3 ? "3d" : "2d",
        });
        highlightPoints.value = (res.points ?? []).map((p) => ({
            id: p.cell_id,
            umap_x: p.x,
            umap_y: p.y,
            umap_z: p.z,
        }));
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "定位失败");
    }
    finally {
        locateLoading.value = false;
    }
}
onMounted(async () => {
    await loadAllDatasets();
    await loadPoints();
});
watch(dimension, () => {
    highlightPoints.value = [];
});
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
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onChange': {} },
    value: (__VLS_ctx.selectedDatasetId),
    options: (__VLS_ctx.datasetOptions),
    placeholder: "选择数据集",
    ...{ class: "control-select" },
    loading: (__VLS_ctx.datasetsLoading),
}));
const __VLS_18 = __VLS_17({
    ...{ 'onChange': {} },
    value: (__VLS_ctx.selectedDatasetId),
    options: (__VLS_ctx.datasetOptions),
    placeholder: "选择数据集",
    ...{ class: "control-select" },
    loading: (__VLS_ctx.datasetsLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onChange: (__VLS_ctx.onDatasetChange)
};
var __VLS_19;
var __VLS_15;
const __VLS_24 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    xs: (24),
    md: (4),
}));
const __VLS_26 = __VLS_25({
    xs: (24),
    md: (4),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
const __VLS_28 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    value: (__VLS_ctx.dimension),
    ...{ class: "control-select" },
}));
const __VLS_30 = __VLS_29({
    value: (__VLS_ctx.dimension),
    ...{ class: "control-select" },
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
const __VLS_32 = {}.ASelectOption;
/** @type {[typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    value: (2),
}));
const __VLS_34 = __VLS_33({
    value: (2),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
var __VLS_35;
const __VLS_36 = {}.ASelectOption;
/** @type {[typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    value: (3),
}));
const __VLS_38 = __VLS_37({
    value: (3),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
var __VLS_39;
var __VLS_31;
var __VLS_27;
const __VLS_40 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    xs: (24),
    md: (6),
}));
const __VLS_42 = __VLS_41({
    xs: (24),
    md: (6),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
const __VLS_44 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    value: (__VLS_ctx.colorBy),
    ...{ class: "control-select" },
}));
const __VLS_46 = __VLS_45({
    value: (__VLS_ctx.colorBy),
    ...{ class: "control-select" },
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
for (const [col] of __VLS_getVForSourceType((__VLS_ctx.colorOptions))) {
    const __VLS_48 = {}.ASelectOption;
    /** @type {[typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, typeof __VLS_components.ASelectOption, typeof __VLS_components.aSelectOption, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        key: (col),
        value: (col),
    }));
    const __VLS_50 = __VLS_49({
        key: (col),
        value: (col),
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    __VLS_51.slots.default;
    (col);
    var __VLS_51;
}
var __VLS_47;
var __VLS_43;
const __VLS_52 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    xs: (24),
    md: (4),
}));
const __VLS_54 = __VLS_53({
    xs: (24),
    md: (4),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
const __VLS_56 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    value: (__VLS_ctx.topK),
    min: (1),
    max: (50),
    ...{ class: "control-number" },
}));
const __VLS_58 = __VLS_57({
    value: (__VLS_ctx.topK),
    min: (1),
    max: (50),
    ...{ class: "control-number" },
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
var __VLS_55;
const __VLS_60 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    xs: (24),
    md: (4),
}));
const __VLS_62 = __VLS_61({
    xs: (24),
    md: (4),
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
const __VLS_64 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    ...{ class: "refresh-button" },
    loading: (__VLS_ctx.loading),
}));
const __VLS_66 = __VLS_65({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    ...{ class: "refresh-button" },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
let __VLS_68;
let __VLS_69;
let __VLS_70;
const __VLS_71 = {
    onClick: (__VLS_ctx.loadPoints)
};
__VLS_67.slots.default;
var __VLS_67;
var __VLS_63;
var __VLS_11;
var __VLS_7;
const __VLS_72 = {}.ARow;
/** @type {[typeof __VLS_components.ARow, typeof __VLS_components.aRow, typeof __VLS_components.ARow, typeof __VLS_components.aRow, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    gutter: (16),
    ...{ class: "visualize-layout" },
}));
const __VLS_74 = __VLS_73({
    gutter: (16),
    ...{ class: "visualize-layout" },
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
const __VLS_76 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    xs: (24),
    lg: (16),
}));
const __VLS_78 = __VLS_77({
    xs: (24),
    lg: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
const __VLS_80 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    ...{ class: "chart-card" },
    bordered: (false),
}));
const __VLS_82 = __VLS_81({
    ...{ class: "chart-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
{
    const { title: __VLS_thisSlot } = __VLS_83.slots;
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
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chart-loading" },
    });
    const __VLS_84 = {}.ASpin;
    /** @type {[typeof __VLS_components.ASpin, typeof __VLS_components.aSpin, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        size: "large",
    }));
    const __VLS_86 = __VLS_85({
        size: "large",
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.allDatasets.find(d => d.id === __VLS_ctx.selectedDatasetId)?.n_cells?.toLocaleString() ?? '?');
}
else if (!__VLS_ctx.points.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chart-empty" },
    });
    const __VLS_88 = {}.AEmpty;
    /** @type {[typeof __VLS_components.AEmpty, typeof __VLS_components.aEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        description: "暂无数据，请点击「刷新图谱」",
    }));
    const __VLS_90 = __VLS_89({
        description: "暂无数据，请点击「刷新图谱」",
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
}
/** @type {[typeof UmapPlot, ]} */ ;
// @ts-ignore
const __VLS_92 = __VLS_asFunctionalComponent(UmapPlot, new UmapPlot({
    ...{ 'onPointClick': {} },
    points: (__VLS_ctx.points),
    dimension: (__VLS_ctx.dimension),
    colorBy: (__VLS_ctx.colorBy),
    selectedId: (__VLS_ctx.selectedPoint?.id ?? null),
    highlightPoints: (__VLS_ctx.highlightPoints),
}));
const __VLS_93 = __VLS_92({
    ...{ 'onPointClick': {} },
    points: (__VLS_ctx.points),
    dimension: (__VLS_ctx.dimension),
    colorBy: (__VLS_ctx.colorBy),
    selectedId: (__VLS_ctx.selectedPoint?.id ?? null),
    highlightPoints: (__VLS_ctx.highlightPoints),
}, ...__VLS_functionalComponentArgsRest(__VLS_92));
let __VLS_95;
let __VLS_96;
let __VLS_97;
const __VLS_98 = {
    onPointClick: (__VLS_ctx.onPointClick)
};
var __VLS_94;
var __VLS_83;
var __VLS_79;
const __VLS_99 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_100 = __VLS_asFunctionalComponent(__VLS_99, new __VLS_99({
    xs: (24),
    lg: (8),
}));
const __VLS_101 = __VLS_100({
    xs: (24),
    lg: (8),
}, ...__VLS_functionalComponentArgsRest(__VLS_100));
__VLS_102.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-stack" },
});
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "locate-panel" },
});
const __VLS_107 = {}.ATextarea;
/** @type {[typeof __VLS_components.ATextarea, typeof __VLS_components.aTextarea, ]} */ ;
// @ts-ignore
const __VLS_108 = __VLS_asFunctionalComponent(__VLS_107, new __VLS_107({
    value: (__VLS_ctx.locateInput),
    autoSize: ({ minRows: 3, maxRows: 5 }),
    placeholder: "输入 cell_id（逗号或换行分隔）",
}));
const __VLS_109 = __VLS_108({
    value: (__VLS_ctx.locateInput),
    autoSize: ({ minRows: 3, maxRows: 5 }),
    placeholder: "输入 cell_id（逗号或换行分隔）",
}, ...__VLS_functionalComponentArgsRest(__VLS_108));
const __VLS_111 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_112 = __VLS_asFunctionalComponent(__VLS_111, new __VLS_111({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.locateLoading),
}));
const __VLS_113 = __VLS_112({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    loading: (__VLS_ctx.locateLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_112));
let __VLS_115;
let __VLS_116;
let __VLS_117;
const __VLS_118 = {
    onClick: (__VLS_ctx.locateCells)
};
__VLS_114.slots.default;
var __VLS_114;
var __VLS_106;
const __VLS_119 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_120 = __VLS_asFunctionalComponent(__VLS_119, new __VLS_119({
    ...{ class: "info-card" },
    bordered: (false),
}));
const __VLS_121 = __VLS_120({
    ...{ class: "info-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_120));
__VLS_122.slots.default;
{
    const { title: __VLS_thisSlot } = __VLS_122.slots;
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
var __VLS_122;
const __VLS_123 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_124 = __VLS_asFunctionalComponent(__VLS_123, new __VLS_123({
    ...{ class: "info-card" },
    bordered: (false),
}));
const __VLS_125 = __VLS_124({
    ...{ class: "info-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_124));
__VLS_126.slots.default;
{
    const { title: __VLS_thisSlot } = __VLS_126.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
const __VLS_127 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_128 = __VLS_asFunctionalComponent(__VLS_127, new __VLS_127({
    ...{ class: "neighbor-table" },
    columns: (__VLS_ctx.neighborColumns),
    dataSource: (__VLS_ctx.neighbors),
    pagination: (false),
    size: "small",
    rowKey: "rank",
    loading: (__VLS_ctx.neighborLoading),
}));
const __VLS_129 = __VLS_128({
    ...{ class: "neighbor-table" },
    columns: (__VLS_ctx.neighborColumns),
    dataSource: (__VLS_ctx.neighbors),
    pagination: (false),
    size: "small",
    rowKey: "rank",
    loading: (__VLS_ctx.neighborLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_128));
var __VLS_126;
const __VLS_131 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_132 = __VLS_asFunctionalComponent(__VLS_131, new __VLS_131({
    ...{ class: "info-card" },
    bordered: (false),
}));
const __VLS_133 = __VLS_132({
    ...{ class: "info-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_132));
__VLS_134.slots.default;
{
    const { title: __VLS_thisSlot } = __VLS_134.slots;
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
var __VLS_134;
var __VLS_102;
var __VLS_75;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['visualize-page']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__inner']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__header']} */ ;
/** @type {__VLS_StyleScopedClasses['control-panel__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['control-row']} */ ;
/** @type {__VLS_StyleScopedClasses['control-select']} */ ;
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
/** @type {__VLS_StyleScopedClasses['chart-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['locate-panel']} */ ;
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
            neighborLoading: neighborLoading,
            highlightPoints: highlightPoints,
            locateInput: locateInput,
            locateLoading: locateLoading,
            allDatasets: allDatasets,
            datasetsLoading: datasetsLoading,
            selectedDatasetId: selectedDatasetId,
            colorOptions: colorOptions,
            datasetOptions: datasetOptions,
            neighborColumns: neighborColumns,
            onDatasetChange: onDatasetChange,
            loadPoints: loadPoints,
            onPointClick: onPointClick,
            locateCells: locateCells,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
