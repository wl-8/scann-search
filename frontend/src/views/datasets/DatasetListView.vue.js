import { computed, ref } from "vue";
import { message } from "ant-design-vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import UploadForm from "@/components/dataset/UploadForm.vue";
import { listDatasets } from "@/api/search";
import { deleteDataset, filterDatasetCells, getDataset, listDatasetCells, switchEmbedding, } from "@/api/datasets";
import request from "@/api/request";
const datasets = ref([]);
async function loadDatasets() {
    try {
        const res = await listDatasets();
        datasets.value = res.map((d) => ({
            id: d.id,
            name: d.name,
            cells: d.n_cells,
            genes: d.n_genes,
            status: d.status,
            source: d.source_path ?? "server",
            updatedAt: new Date(d.created_at).toISOString().slice(0, 10),
        }));
    }
    catch (e) {
        // fallback to demo
        datasets.value = [
            { name: "PBMC-3k", cells: 3200, genes: 18987, status: "Ready", source: "demo", updatedAt: "2026-05-25" },
        ];
    }
}
loadDatasets();
const detailOpen = ref(false);
const activeDataset = ref(null);
const detailDataset = ref(null);
const statsData = ref(null);
const statsLoading = ref(false);
const detailTab = ref("stats");
const cellsData = ref(null);
const cellsLoading = ref(false);
const cellsPage = ref(1);
const cellsPageSize = ref(50);
const filterColumn = ref();
const filterValues = ref("");
const filterResult = ref(null);
const filterLoading = ref(false);
const embeddingKeyInput = ref("");
const embeddingLoading = ref(false);
function barWidth(counts, val) {
    const max = Math.max(...Object.values(counts));
    return max > 0 ? Math.round((val / max) * 100) : 0;
}
const columns = [
    { title: "Name", dataIndex: "name", key: "name", width: 120 },
    { title: "Cells", dataIndex: "cells", key: "cells", width: 90 },
    { title: "Genes", dataIndex: "genes", key: "genes", width: 90 },
    { title: "Status", dataIndex: "status", key: "status", width: 100 },
    { title: "Source", dataIndex: "source", key: "source", ellipsis: true, minWidth: 160 },
    { title: "Updated", dataIndex: "updatedAt", key: "updatedAt", width: 110 },
    { title: "操作", key: "action", width: 80 },
];
const cellColumns = [
    { title: "Cell ID", dataIndex: "cell_id", key: "cell_id" },
    { title: "Row", dataIndex: "row_index", key: "row_index", width: 80 },
    { title: "Cell Type", dataIndex: "cell_type", key: "cell_type", width: 120 },
];
const cellsRows = computed(() => (cellsData.value?.items ?? []).map((item) => ({
    ...item,
    cell_type: item.obs?.cell_type ?? "-",
})));
const filterRows = computed(() => (filterResult.value?.items ?? []).map((item) => ({
    ...item,
    cell_type: item.obs?.cell_type ?? "-",
})));
const cellsTotal = computed(() => cellsData.value?.total ?? 0);
const filterColumnOptions = computed(() => (statsData.value?.obs_columns ?? []).map((c) => ({ label: c, value: c })));
function statusClass(status) {
    const normalized = status.toLowerCase();
    if (normalized === "ready" || normalized === "uploaded")
        return "status-badge--ready";
    if (normalized === "indexed")
        return "status-badge--indexed";
    if (normalized === "processing" || normalized === "uploading")
        return "status-badge--processing";
    return "status-badge--default";
}
function onUploaded(file) {
    // after upload/register, refresh dataset list from backend
    loadDatasets();
}
async function viewDetail(record) {
    activeDataset.value = record;
    statsData.value = null;
    cellsData.value = null;
    filterResult.value = null;
    filterColumn.value = undefined;
    filterValues.value = "";
    cellsPage.value = 1;
    detailOpen.value = true;
    detailTab.value = "stats";
    if (!record.id)
        return;
    statsLoading.value = true;
    try {
        detailDataset.value = await getDataset(record.id);
        embeddingKeyInput.value = detailDataset.value.embedding_key;
        const res = await request.get(`/datasets/${record.id}/stats`);
        statsData.value = res;
    }
    catch {
        // stats unavailable, modal still shows basic info
    }
    finally {
        statsLoading.value = false;
    }
}
async function loadCells(page = 1) {
    if (!activeDataset.value?.id)
        return;
    cellsLoading.value = true;
    try {
        const offset = (page - 1) * cellsPageSize.value;
        cellsData.value = await listDatasetCells(activeDataset.value.id, { offset, limit: cellsPageSize.value });
        cellsPage.value = page;
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "加载细胞列表失败");
    }
    finally {
        cellsLoading.value = false;
    }
}
function onCellsPageChange(page) {
    loadCells(page);
}
function parseFilterValues(text) {
    return text
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}
async function runFilter() {
    if (!activeDataset.value?.id)
        return;
    if (!filterColumn.value)
        return message.warning("请选择过滤字段");
    const values = parseFilterValues(filterValues.value);
    if (!values.length)
        return message.warning("请输入过滤值");
    filterLoading.value = true;
    try {
        filterResult.value = await filterDatasetCells(activeDataset.value.id, {
            filters: { equals: { [filterColumn.value]: values } },
            offset: 0,
            limit: 50,
        });
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "过滤失败");
    }
    finally {
        filterLoading.value = false;
    }
}
async function submitEmbedding() {
    if (!activeDataset.value?.id)
        return;
    if (!embeddingKeyInput.value.trim())
        return message.warning("请输入 embedding key");
    embeddingLoading.value = true;
    try {
        detailDataset.value = await switchEmbedding(activeDataset.value.id, embeddingKeyInput.value.trim());
        message.success("Embedding 已切换");
        await loadDatasets();
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "切换失败");
    }
    finally {
        embeddingLoading.value = false;
    }
}
function onDetailTabChange(key) {
    if (key === "cells" && !cellsData.value)
        loadCells(1);
}
async function removeDataset(datasetId) {
    try {
        await deleteDataset(datasetId);
        // refresh list from backend
        await loadDatasets();
    }
    catch (e) {
        // optimistic fallback: remove locally
        datasets.value = datasets.value.filter((item) => item.id !== datasetId);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['dataset-page']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-page']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-page__header']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-page__header']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-table-card']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-table-card']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-table']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-table']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-table-thead']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-table']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-table']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-table-tbody']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-table']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-page__header']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-page']} */ ;
// CSS variable injection 
// CSS variable injection end 
/** @type {[typeof AppLayout, typeof AppLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppLayout, new AppLayout({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dataset-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dataset-page__header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dataset-page__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
const __VLS_4 = {}.ARow;
/** @type {[typeof __VLS_components.ARow, typeof __VLS_components.aRow, typeof __VLS_components.ARow, typeof __VLS_components.aRow, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    gutter: (16),
    ...{ class: "dataset-grid" },
}));
const __VLS_6 = __VLS_5({
    gutter: (16),
    ...{ class: "dataset-grid" },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    xs: (24),
    lg: (10),
}));
const __VLS_10 = __VLS_9({
    xs: (24),
    lg: (10),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
/** @type {[typeof UploadForm, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(UploadForm, new UploadForm({
    ...{ 'onUploaded': {} },
}));
const __VLS_13 = __VLS_12({
    ...{ 'onUploaded': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
let __VLS_15;
let __VLS_16;
let __VLS_17;
const __VLS_18 = {
    onUploaded: (__VLS_ctx.onUploaded)
};
var __VLS_14;
var __VLS_11;
const __VLS_19 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    xs: (24),
    lg: (14),
}));
const __VLS_21 = __VLS_20({
    xs: (24),
    lg: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
__VLS_22.slots.default;
const __VLS_23 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
    ...{ class: "dataset-table-card" },
    bordered: (false),
    title: "数据集列表",
}));
const __VLS_25 = __VLS_24({
    ...{ class: "dataset-table-card" },
    bordered: (false),
    title: "数据集列表",
}, ...__VLS_functionalComponentArgsRest(__VLS_24));
__VLS_26.slots.default;
const __VLS_27 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
    ...{ class: "dataset-table" },
    columns: (__VLS_ctx.columns),
    dataSource: (__VLS_ctx.datasets),
    rowKey: "id",
    pagination: (false),
    rowClassName: (() => 'dataset-row'),
    scroll: ({ x: 'max-content' }),
}));
const __VLS_29 = __VLS_28({
    ...{ class: "dataset-table" },
    columns: (__VLS_ctx.columns),
    dataSource: (__VLS_ctx.datasets),
    rowKey: "id",
    pagination: (false),
    rowClassName: (() => 'dataset-row'),
    scroll: ({ x: 'max-content' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
__VLS_30.slots.default;
{
    const { bodyCell: __VLS_thisSlot } = __VLS_30.slots;
    const [{ column, record }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (column.key === 'status') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "status-badge" },
            ...{ class: (__VLS_ctx.statusClass(record.status)) },
        });
        (record.status);
    }
    if (column.key === 'action') {
        const __VLS_31 = {}.ASpace;
        /** @type {[typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, ]} */ ;
        // @ts-ignore
        const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
            size: (8),
        }));
        const __VLS_33 = __VLS_32({
            size: (8),
        }, ...__VLS_functionalComponentArgsRest(__VLS_32));
        __VLS_34.slots.default;
        const __VLS_35 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
            ...{ 'onClick': {} },
            ...{ class: "icon-button icon-button--view" },
            size: "small",
        }));
        const __VLS_37 = __VLS_36({
            ...{ 'onClick': {} },
            ...{ class: "icon-button icon-button--view" },
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_36));
        let __VLS_39;
        let __VLS_40;
        let __VLS_41;
        const __VLS_42 = {
            onClick: (...[$event]) => {
                if (!(column.key === 'action'))
                    return;
                __VLS_ctx.viewDetail(record);
            }
        };
        __VLS_38.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            'aria-hidden': "true",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
            cx: "12",
            cy: "12",
            r: "2.75",
        });
        var __VLS_38;
        const __VLS_43 = {}.APopconfirm;
        /** @type {[typeof __VLS_components.APopconfirm, typeof __VLS_components.aPopconfirm, typeof __VLS_components.APopconfirm, typeof __VLS_components.aPopconfirm, ]} */ ;
        // @ts-ignore
        const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
            ...{ 'onConfirm': {} },
            title: "确定删除该数据集？",
        }));
        const __VLS_45 = __VLS_44({
            ...{ 'onConfirm': {} },
            title: "确定删除该数据集？",
        }, ...__VLS_functionalComponentArgsRest(__VLS_44));
        let __VLS_47;
        let __VLS_48;
        let __VLS_49;
        const __VLS_50 = {
            onConfirm: (...[$event]) => {
                if (!(column.key === 'action'))
                    return;
                __VLS_ctx.removeDataset(record.id);
            }
        };
        __VLS_46.slots.default;
        const __VLS_51 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
            ...{ class: "icon-button icon-button--delete" },
            size: "small",
        }));
        const __VLS_53 = __VLS_52({
            ...{ class: "icon-button icon-button--delete" },
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_52));
        __VLS_54.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            'aria-hidden': "true",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M3 6h18",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M8 6V4.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5V6",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M7 6l1 13h8l1-13",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M10 10v6M14 10v6",
        });
        var __VLS_54;
        var __VLS_46;
        var __VLS_34;
    }
}
var __VLS_30;
var __VLS_26;
var __VLS_22;
var __VLS_7;
const __VLS_55 = {}.AModal;
/** @type {[typeof __VLS_components.AModal, typeof __VLS_components.aModal, typeof __VLS_components.AModal, typeof __VLS_components.aModal, ]} */ ;
// @ts-ignore
const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
    open: (__VLS_ctx.detailOpen),
    title: (`数据集详情：${__VLS_ctx.activeDataset?.name ?? ''}`),
    footer: (null),
    width: "720",
}));
const __VLS_57 = __VLS_56({
    open: (__VLS_ctx.detailOpen),
    title: (`数据集详情：${__VLS_ctx.activeDataset?.name ?? ''}`),
    footer: (null),
    width: "720",
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
__VLS_58.slots.default;
const __VLS_59 = {}.ATabs;
/** @type {[typeof __VLS_components.ATabs, typeof __VLS_components.aTabs, typeof __VLS_components.ATabs, typeof __VLS_components.aTabs, ]} */ ;
// @ts-ignore
const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
    ...{ 'onChange': {} },
    activeKey: (__VLS_ctx.detailTab),
}));
const __VLS_61 = __VLS_60({
    ...{ 'onChange': {} },
    activeKey: (__VLS_ctx.detailTab),
}, ...__VLS_functionalComponentArgsRest(__VLS_60));
let __VLS_63;
let __VLS_64;
let __VLS_65;
const __VLS_66 = {
    onChange: (__VLS_ctx.onDetailTabChange)
};
__VLS_62.slots.default;
const __VLS_67 = {}.ATabPane;
/** @type {[typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, ]} */ ;
// @ts-ignore
const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
    key: "stats",
    tab: "统计",
}));
const __VLS_69 = __VLS_68({
    key: "stats",
    tab: "统计",
}, ...__VLS_functionalComponentArgsRest(__VLS_68));
__VLS_70.slots.default;
if (__VLS_ctx.statsLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_71 = {}.ASpin;
    /** @type {[typeof __VLS_components.ASpin, typeof __VLS_components.aSpin, ]} */ ;
    // @ts-ignore
    const __VLS_72 = __VLS_asFunctionalComponent(__VLS_71, new __VLS_71({}));
    const __VLS_73 = __VLS_72({}, ...__VLS_functionalComponentArgsRest(__VLS_72));
}
else if (__VLS_ctx.statsData) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    const __VLS_75 = {}.ADescriptions;
    /** @type {[typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, typeof __VLS_components.ADescriptions, typeof __VLS_components.aDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
        column: (2),
        size: "small",
        bordered: true,
        ...{ style: {} },
    }));
    const __VLS_77 = __VLS_76({
        column: (2),
        size: "small",
        bordered: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_76));
    __VLS_78.slots.default;
    const __VLS_79 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_80 = __VLS_asFunctionalComponent(__VLS_79, new __VLS_79({
        label: "细胞数",
    }));
    const __VLS_81 = __VLS_80({
        label: "细胞数",
    }, ...__VLS_functionalComponentArgsRest(__VLS_80));
    __VLS_82.slots.default;
    (__VLS_ctx.detailDataset?.n_cells?.toLocaleString() ?? __VLS_ctx.activeDataset?.cells?.toLocaleString());
    var __VLS_82;
    const __VLS_83 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_84 = __VLS_asFunctionalComponent(__VLS_83, new __VLS_83({
        label: "基因数",
    }));
    const __VLS_85 = __VLS_84({
        label: "基因数",
    }, ...__VLS_functionalComponentArgsRest(__VLS_84));
    __VLS_86.slots.default;
    (__VLS_ctx.detailDataset?.n_genes?.toLocaleString() ?? __VLS_ctx.activeDataset?.genes?.toLocaleString());
    var __VLS_86;
    const __VLS_87 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_88 = __VLS_asFunctionalComponent(__VLS_87, new __VLS_87({
        label: "状态",
    }));
    const __VLS_89 = __VLS_88({
        label: "状态",
    }, ...__VLS_functionalComponentArgsRest(__VLS_88));
    __VLS_90.slots.default;
    (__VLS_ctx.detailDataset?.status ?? __VLS_ctx.activeDataset?.status);
    var __VLS_90;
    const __VLS_91 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_92 = __VLS_asFunctionalComponent(__VLS_91, new __VLS_91({
        label: "Embedding",
    }));
    const __VLS_93 = __VLS_92({
        label: "Embedding",
    }, ...__VLS_functionalComponentArgsRest(__VLS_92));
    __VLS_94.slots.default;
    (__VLS_ctx.detailDataset?.embedding_key ?? '-');
    var __VLS_94;
    const __VLS_95 = {}.ADescriptionsItem;
    /** @type {[typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, typeof __VLS_components.ADescriptionsItem, typeof __VLS_components.aDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_96 = __VLS_asFunctionalComponent(__VLS_95, new __VLS_95({
        label: "来源",
        span: (2),
    }));
    const __VLS_97 = __VLS_96({
        label: "来源",
        span: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_96));
    __VLS_98.slots.default;
    (__VLS_ctx.detailDataset?.source_path ?? __VLS_ctx.activeDataset?.source);
    var __VLS_98;
    var __VLS_78;
    for (const [col] of __VLS_getVForSourceType((__VLS_ctx.statsData.obs_columns))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (col),
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        (col);
        for (const [cnt, val] of __VLS_getVForSourceType((__VLS_ctx.statsData.value_counts[col]))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (val),
                ...{ style: {} },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ style: {} },
            });
            (val);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: ({ width: __VLS_ctx.barWidth(__VLS_ctx.statsData.value_counts[col], cnt) + '%', height: '100%', background: '#3b82f6', borderRadius: '999px' }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ style: {} },
            });
            (cnt);
        }
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
}
var __VLS_70;
const __VLS_99 = {}.ATabPane;
/** @type {[typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, ]} */ ;
// @ts-ignore
const __VLS_100 = __VLS_asFunctionalComponent(__VLS_99, new __VLS_99({
    key: "cells",
    tab: "细胞列表",
}));
const __VLS_101 = __VLS_100({
    key: "cells",
    tab: "细胞列表",
}, ...__VLS_functionalComponentArgsRest(__VLS_100));
__VLS_102.slots.default;
const __VLS_103 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_104 = __VLS_asFunctionalComponent(__VLS_103, new __VLS_103({
    columns: (__VLS_ctx.cellColumns),
    dataSource: (__VLS_ctx.cellsRows),
    rowKey: "cell_id",
    loading: (__VLS_ctx.cellsLoading),
    pagination: (false),
    size: "small",
}));
const __VLS_105 = __VLS_104({
    columns: (__VLS_ctx.cellColumns),
    dataSource: (__VLS_ctx.cellsRows),
    rowKey: "cell_id",
    loading: (__VLS_ctx.cellsLoading),
    pagination: (false),
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_104));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pager" },
});
const __VLS_107 = {}.APagination;
/** @type {[typeof __VLS_components.APagination, typeof __VLS_components.aPagination, ]} */ ;
// @ts-ignore
const __VLS_108 = __VLS_asFunctionalComponent(__VLS_107, new __VLS_107({
    ...{ 'onChange': {} },
    current: (__VLS_ctx.cellsPage),
    pageSize: (__VLS_ctx.cellsPageSize),
    total: (__VLS_ctx.cellsTotal),
    showSizeChanger: (false),
}));
const __VLS_109 = __VLS_108({
    ...{ 'onChange': {} },
    current: (__VLS_ctx.cellsPage),
    pageSize: (__VLS_ctx.cellsPageSize),
    total: (__VLS_ctx.cellsTotal),
    showSizeChanger: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_108));
let __VLS_111;
let __VLS_112;
let __VLS_113;
const __VLS_114 = {
    onChange: (__VLS_ctx.onCellsPageChange)
};
var __VLS_110;
var __VLS_102;
const __VLS_115 = {}.ATabPane;
/** @type {[typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, ]} */ ;
// @ts-ignore
const __VLS_116 = __VLS_asFunctionalComponent(__VLS_115, new __VLS_115({
    key: "filter",
    tab: "条件过滤",
}));
const __VLS_117 = __VLS_116({
    key: "filter",
    tab: "条件过滤",
}, ...__VLS_functionalComponentArgsRest(__VLS_116));
__VLS_118.slots.default;
const __VLS_119 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_120 = __VLS_asFunctionalComponent(__VLS_119, new __VLS_119({
    layout: "vertical",
}));
const __VLS_121 = __VLS_120({
    layout: "vertical",
}, ...__VLS_functionalComponentArgsRest(__VLS_120));
__VLS_122.slots.default;
const __VLS_123 = {}.ARow;
/** @type {[typeof __VLS_components.ARow, typeof __VLS_components.aRow, typeof __VLS_components.ARow, typeof __VLS_components.aRow, ]} */ ;
// @ts-ignore
const __VLS_124 = __VLS_asFunctionalComponent(__VLS_123, new __VLS_123({
    gutter: (12),
}));
const __VLS_125 = __VLS_124({
    gutter: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_124));
__VLS_126.slots.default;
const __VLS_127 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_128 = __VLS_asFunctionalComponent(__VLS_127, new __VLS_127({
    span: (12),
}));
const __VLS_129 = __VLS_128({
    span: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_128));
__VLS_130.slots.default;
const __VLS_131 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_132 = __VLS_asFunctionalComponent(__VLS_131, new __VLS_131({
    label: "过滤字段",
}));
const __VLS_133 = __VLS_132({
    label: "过滤字段",
}, ...__VLS_functionalComponentArgsRest(__VLS_132));
__VLS_134.slots.default;
const __VLS_135 = {}.ASelect;
/** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
// @ts-ignore
const __VLS_136 = __VLS_asFunctionalComponent(__VLS_135, new __VLS_135({
    value: (__VLS_ctx.filterColumn),
    options: (__VLS_ctx.filterColumnOptions),
    allowClear: true,
    placeholder: "选择 obs 字段",
}));
const __VLS_137 = __VLS_136({
    value: (__VLS_ctx.filterColumn),
    options: (__VLS_ctx.filterColumnOptions),
    allowClear: true,
    placeholder: "选择 obs 字段",
}, ...__VLS_functionalComponentArgsRest(__VLS_136));
var __VLS_134;
var __VLS_130;
const __VLS_139 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_140 = __VLS_asFunctionalComponent(__VLS_139, new __VLS_139({
    span: (12),
}));
const __VLS_141 = __VLS_140({
    span: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_140));
__VLS_142.slots.default;
const __VLS_143 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_144 = __VLS_asFunctionalComponent(__VLS_143, new __VLS_143({
    label: "过滤值（可多个）",
}));
const __VLS_145 = __VLS_144({
    label: "过滤值（可多个）",
}, ...__VLS_functionalComponentArgsRest(__VLS_144));
__VLS_146.slots.default;
const __VLS_147 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_148 = __VLS_asFunctionalComponent(__VLS_147, new __VLS_147({
    value: (__VLS_ctx.filterValues),
    placeholder: "例如: Type0, Type1",
}));
const __VLS_149 = __VLS_148({
    value: (__VLS_ctx.filterValues),
    placeholder: "例如: Type0, Type1",
}, ...__VLS_functionalComponentArgsRest(__VLS_148));
var __VLS_146;
var __VLS_142;
var __VLS_126;
const __VLS_151 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_152 = __VLS_asFunctionalComponent(__VLS_151, new __VLS_151({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.filterLoading),
}));
const __VLS_153 = __VLS_152({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.filterLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_152));
let __VLS_155;
let __VLS_156;
let __VLS_157;
const __VLS_158 = {
    onClick: (__VLS_ctx.runFilter)
};
__VLS_154.slots.default;
var __VLS_154;
var __VLS_122;
if (__VLS_ctx.filterResult) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "filter-summary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.filterResult.total_matched);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.filterResult.items.length);
}
const __VLS_159 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_160 = __VLS_asFunctionalComponent(__VLS_159, new __VLS_159({
    columns: (__VLS_ctx.cellColumns),
    dataSource: (__VLS_ctx.filterRows),
    rowKey: "cell_id",
    loading: (__VLS_ctx.filterLoading),
    pagination: (false),
    size: "small",
}));
const __VLS_161 = __VLS_160({
    columns: (__VLS_ctx.cellColumns),
    dataSource: (__VLS_ctx.filterRows),
    rowKey: "cell_id",
    loading: (__VLS_ctx.filterLoading),
    pagination: (false),
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_160));
var __VLS_118;
const __VLS_163 = {}.ATabPane;
/** @type {[typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, ]} */ ;
// @ts-ignore
const __VLS_164 = __VLS_asFunctionalComponent(__VLS_163, new __VLS_163({
    key: "embedding",
    tab: "Embedding",
}));
const __VLS_165 = __VLS_164({
    key: "embedding",
    tab: "Embedding",
}, ...__VLS_functionalComponentArgsRest(__VLS_164));
__VLS_166.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "embedding-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.detailDataset?.embedding_key ?? "-");
const __VLS_167 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_168 = __VLS_asFunctionalComponent(__VLS_167, new __VLS_167({
    value: (__VLS_ctx.embeddingKeyInput),
    placeholder: "如 X_umap",
    ...{ style: {} },
}));
const __VLS_169 = __VLS_168({
    value: (__VLS_ctx.embeddingKeyInput),
    placeholder: "如 X_umap",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_168));
const __VLS_171 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_172 = __VLS_asFunctionalComponent(__VLS_171, new __VLS_171({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.embeddingLoading),
}));
const __VLS_173 = __VLS_172({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.embeddingLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_172));
let __VLS_175;
let __VLS_176;
let __VLS_177;
const __VLS_178 = {
    onClick: (__VLS_ctx.submitEmbedding)
};
__VLS_174.slots.default;
var __VLS_174;
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "embedding-hint" },
});
var __VLS_166;
var __VLS_62;
var __VLS_58;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['dataset-page']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-page__header']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-page__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-table-card']} */ ;
/** @type {__VLS_StyleScopedClasses['dataset-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button--view']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-button--delete']} */ ;
/** @type {__VLS_StyleScopedClasses['pager']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['embedding-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['embedding-hint']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            UploadForm: UploadForm,
            datasets: datasets,
            detailOpen: detailOpen,
            activeDataset: activeDataset,
            detailDataset: detailDataset,
            statsData: statsData,
            statsLoading: statsLoading,
            detailTab: detailTab,
            cellsLoading: cellsLoading,
            cellsPage: cellsPage,
            cellsPageSize: cellsPageSize,
            filterColumn: filterColumn,
            filterValues: filterValues,
            filterResult: filterResult,
            filterLoading: filterLoading,
            embeddingKeyInput: embeddingKeyInput,
            embeddingLoading: embeddingLoading,
            barWidth: barWidth,
            columns: columns,
            cellColumns: cellColumns,
            cellsRows: cellsRows,
            filterRows: filterRows,
            cellsTotal: cellsTotal,
            filterColumnOptions: filterColumnOptions,
            statusClass: statusClass,
            onUploaded: onUploaded,
            viewDetail: viewDetail,
            onCellsPageChange: onCellsPageChange,
            runFilter: runFilter,
            submitEmbedding: submitEmbedding,
            onDetailTabChange: onDetailTabChange,
            removeDataset: removeDataset,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
