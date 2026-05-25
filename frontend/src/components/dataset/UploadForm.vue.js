/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref } from "vue";
import { message } from "ant-design-vue";
const emit = defineEmits();
const fileList = ref([]);
const selectedFile = ref(null);
const progress = ref(0);
function beforeUpload(file) {
    selectedFile.value = file;
    fileList.value = [file];
    return false;
}
function onChange(info) {
    if (info.file?.originFileObj)
        selectedFile.value = info.file.originFileObj;
}
function simulateUpload() {
    if (!selectedFile.value)
        return;
    progress.value = 0;
    const timer = setInterval(() => {
        progress.value = Math.min(100, progress.value + 20);
        if (progress.value >= 100) {
            clearInterval(timer);
            const file = selectedFile.value;
            if (!file)
                return;
            message.success(`已模拟上传：${file.name}`);
            emit("uploaded", { name: file.name, size: file.size });
        }
    }, 200);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    title: "上传数据集",
}));
const __VLS_2 = __VLS_1({
    title: "上传数据集",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
const __VLS_5 = {}.AUploadDragger;
/** @type {[typeof __VLS_components.AUploadDragger, typeof __VLS_components.aUploadDragger, typeof __VLS_components.AUploadDragger, typeof __VLS_components.aUploadDragger, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ...{ 'onChange': {} },
    beforeUpload: (__VLS_ctx.beforeUpload),
    fileList: (__VLS_ctx.fileList),
    showUploadList: (true),
    maxCount: (1),
}));
const __VLS_7 = __VLS_6({
    ...{ 'onChange': {} },
    beforeUpload: (__VLS_ctx.beforeUpload),
    fileList: (__VLS_ctx.fileList),
    showUploadList: (true),
    maxCount: (1),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_9;
let __VLS_10;
let __VLS_11;
const __VLS_12 = {
    onChange: (__VLS_ctx.onChange)
};
__VLS_8.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "ant-upload-drag-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "ant-upload-text" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "ant-upload-hint" },
});
var __VLS_8;
if (__VLS_ctx.progress > 0) {
    const __VLS_13 = {}.AProgress;
    /** @type {[typeof __VLS_components.AProgress, typeof __VLS_components.aProgress, ]} */ ;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
        percent: (__VLS_ctx.progress),
        ...{ style: {} },
    }));
    const __VLS_15 = __VLS_14({
        percent: (__VLS_ctx.progress),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_17 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.selectedFile),
}));
const __VLS_19 = __VLS_18({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.selectedFile),
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
let __VLS_21;
let __VLS_22;
let __VLS_23;
const __VLS_24 = {
    onClick: (__VLS_ctx.simulateUpload)
};
__VLS_20.slots.default;
var __VLS_20;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['ant-upload-drag-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-upload-text']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-upload-hint']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            fileList: fileList,
            selectedFile: selectedFile,
            progress: progress,
            beforeUpload: beforeUpload,
            onChange: onChange,
            simulateUpload: simulateUpload,
        };
    },
    __typeEmits: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
});
; /* PartiallyEnd: #4569/main.vue */
