/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref } from "vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import UploadForm from "@/components/dataset/UploadForm.vue";
const datasets = ref([
    { name: "PBMC-3k", cells: 3200, genes: 18987, status: "Ready", source: "demo", updatedAt: "2026-05-25" },
    { name: "Mouse-brain", cells: 1450, genes: 21456, status: "Indexed", source: "demo", updatedAt: "2026-05-25" },
    { name: "Tumor-Atlas", cells: 8721, genes: 20500, status: "Processing", source: "upload", updatedAt: "2026-05-25" },
]);
const detailOpen = ref(false);
const activeDataset = ref(null);
const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Cells", dataIndex: "cells", key: "cells" },
    { title: "Genes", dataIndex: "genes", key: "genes" },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "Source", dataIndex: "source", key: "source" },
    { title: "Updated", dataIndex: "updatedAt", key: "updatedAt" },
    { title: "Action", key: "action", slots: { customRender: "action" } },
];
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
    datasets.value.unshift({
        name: file.name,
        cells: Math.max(100, Math.round(file.size / 120)),
        genes: 20000,
        status: "Uploaded",
        source: "local",
        updatedAt: new Date().toISOString().slice(0, 10),
    });
}
function viewDetail(record) {
    activeDataset.value = record;
    detailOpen.value = true;
}
function removeDataset(name) {
    datasets.value = datasets.value.filter((item) => item.name !== name);
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
    rowKey: "name",
    pagination: (false),
    rowClassName: (() => 'dataset-row'),
}));
const __VLS_29 = __VLS_28({
    ...{ class: "dataset-table" },
    columns: (__VLS_ctx.columns),
    dataSource: (__VLS_ctx.datasets),
    rowKey: "name",
    pagination: (false),
    rowClassName: (() => 'dataset-row'),
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
                __VLS_ctx.removeDataset(record.name);
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
    title: "数据集详情",
    footer: (null),
}));
const __VLS_57 = __VLS_56({
    open: (__VLS_ctx.detailOpen),
    title: "数据集详情",
    footer: (null),
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
__VLS_58.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({});
(JSON.stringify(__VLS_ctx.activeDataset, null, 2));
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
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            UploadForm: UploadForm,
            datasets: datasets,
            detailOpen: detailOpen,
            activeDataset: activeDataset,
            columns: columns,
            statusClass: statusClass,
            onUploaded: onUploaded,
            viewDetail: viewDetail,
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
