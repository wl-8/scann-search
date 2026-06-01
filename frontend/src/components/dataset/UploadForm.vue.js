import { ref } from "vue";
import { message } from "ant-design-vue";
import * as datasetsApi from "@/api/datasets";
const emit = defineEmits();
const fileList = ref([]);
const sourcePath = ref("");
const embeddingKey = ref("X_pca");
const name = ref("");
const loading = ref(false);
const progress = ref(0);
// 文件上传状态
const fileUploading = ref(false);
const fileUploadProgress = ref(0);
const uploadedFilename = ref("");
const embeddingKeyOptions = ref([]);
async function beforeUpload(file) {
    fileList.value = [file];
    uploadedFilename.value = "";
    fileUploading.value = true;
    fileUploadProgress.value = 10;
    const formData = new FormData();
    formData.append("file", file);
    try {
        // 用 XMLHttpRequest 获取上传进度
        const result = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${import.meta.env.VITE_API_BASE ?? "/api"}/datasets/upload-file`);
            const token = localStorage.getItem("token");
            if (token)
                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable)
                    fileUploadProgress.value = Math.round((e.loaded / e.total) * 90);
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300)
                    resolve(JSON.parse(xhr.responseText));
                else
                    reject(new Error(JSON.parse(xhr.responseText)?.detail ?? `上传失败 ${xhr.status}`));
            };
            xhr.onerror = () => reject(new Error("网络错误"));
            xhr.send(formData);
        });
        fileUploadProgress.value = 100;
        sourcePath.value = result.path;
        uploadedFilename.value = result.filename ?? file.name;
        // 用后端返回的 obsm keys 填充下拉
        if (result.embedding_keys?.length) {
            embeddingKeyOptions.value = result.embedding_keys.map((k) => ({ label: k, value: k }));
            // 优先选 X_pca，否则选第一个
            embeddingKey.value = result.embedding_keys.includes("X_pca")
                ? "X_pca"
                : result.embedding_keys[0];
        }
        message.success(`文件已上传：${result.filename}，请填写信息后点注册`);
    }
    catch (err) {
        message.error(err?.message ?? "文件上传失败");
        fileList.value = [];
    }
    finally {
        fileUploading.value = false;
    }
    return false; // 阻止 antd 默认上传行为
}
async function submitRegister() {
    if (!name.value)
        return message.warning("请填写数据集名称");
    if (!sourcePath.value)
        return message.warning("请先上传文件或填写服务器路径");
    const payload = {
        name: name.value,
        source_path: sourcePath.value,
        embedding_key: embeddingKey.value || "X_pca",
    };
    loading.value = true;
    progress.value = 10;
    try {
        await datasetsApi.registerDataset(payload);
        progress.value = 100;
        message.success("数据集注册成功，正在处理中…");
        emit("uploaded", { name: payload.name, size: 0 });
        // 重置表单
        name.value = "";
        sourcePath.value = "";
        embeddingKey.value = "X_pca";
        uploadedFilename.value = "";
        embeddingKeyOptions.value = [];
        fileList.value = [];
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "注册失败");
    }
    finally {
        loading.value = false;
        setTimeout(() => (progress.value = 0), 800);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['upload-card']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-card']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-dragger']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-dragger']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-dragger__icon']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-button']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-button']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-card__body']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-dragger__content']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-button']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "upload-card" },
    bordered: (false),
    title: "上传数据集",
}));
const __VLS_2 = __VLS_1({
    ...{ class: "upload-card" },
    bordered: (false),
    title: "上传数据集",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "upload-card__body" },
});
const __VLS_5 = {}.AUploadDragger;
/** @type {[typeof __VLS_components.AUploadDragger, typeof __VLS_components.aUploadDragger, typeof __VLS_components.AUploadDragger, typeof __VLS_components.aUploadDragger, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    beforeUpload: (__VLS_ctx.beforeUpload),
    fileList: (__VLS_ctx.fileList),
    showUploadList: (false),
    maxCount: (1),
    disabled: (__VLS_ctx.fileUploading),
    ...{ class: "upload-dragger" },
}));
const __VLS_7 = __VLS_6({
    beforeUpload: (__VLS_ctx.beforeUpload),
    fileList: (__VLS_ctx.fileList),
    showUploadList: (false),
    maxCount: (1),
    disabled: (__VLS_ctx.fileUploading),
    ...{ class: "upload-dragger" },
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_8.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "upload-dragger__content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "upload-dragger__icon" },
    'aria-hidden': "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M7 18a4 4 0 010-8 5 5 0 019.7-1.2A3.5 3.5 0 1118 18H7z",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M12 8v8",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M9 11l3-3 3 3",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "upload-dragger__title" },
});
if (__VLS_ctx.fileUploading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
else if (__VLS_ctx.uploadedFilename) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.uploadedFilename);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
if (!__VLS_ctx.fileUploading && !__VLS_ctx.uploadedFilename) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "upload-dragger__subtitle" },
    });
}
if (__VLS_ctx.fileUploading) {
    const __VLS_9 = {}.AProgress;
    /** @type {[typeof __VLS_components.AProgress, typeof __VLS_components.aProgress, ]} */ ;
    // @ts-ignore
    const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
        percent: (__VLS_ctx.fileUploadProgress),
        showInfo: (false),
        ...{ style: {} },
    }));
    const __VLS_11 = __VLS_10({
        percent: (__VLS_ctx.fileUploadProgress),
        showInfo: (false),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
}
var __VLS_8;
const __VLS_13 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    layout: "vertical",
    ...{ style: {} },
}));
const __VLS_15 = __VLS_14({
    layout: "vertical",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
const __VLS_17 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    label: "服务器绝对路径（拖拽上传后自动填入，或手动输入）",
}));
const __VLS_19 = __VLS_18({
    label: "服务器绝对路径（拖拽上传后自动填入，或手动输入）",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
__VLS_20.slots.default;
const __VLS_21 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    value: (__VLS_ctx.sourcePath),
    placeholder: "例如: /home/user/scann-search/backend/data/uploads/my_dataset.h5ad",
}));
const __VLS_23 = __VLS_22({
    value: (__VLS_ctx.sourcePath),
    placeholder: "例如: /home/user/scann-search/backend/data/uploads/my_dataset.h5ad",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
var __VLS_20;
const __VLS_25 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    label: "Embedding Key",
}));
const __VLS_27 = __VLS_26({
    label: "Embedding Key",
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
__VLS_28.slots.default;
if (__VLS_ctx.embeddingKeyOptions.length) {
    const __VLS_29 = {}.ASelect;
    /** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
        value: (__VLS_ctx.embeddingKey),
        options: (__VLS_ctx.embeddingKeyOptions),
        placeholder: "选择向量 key",
        ...{ style: {} },
    }));
    const __VLS_31 = __VLS_30({
        value: (__VLS_ctx.embeddingKey),
        options: (__VLS_ctx.embeddingKeyOptions),
        placeholder: "选择向量 key",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
}
else {
    const __VLS_33 = {}.AInput;
    /** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
        value: (__VLS_ctx.embeddingKey),
        placeholder: "如 X_pca 或 X_umap（上传文件后自动检测）",
    }));
    const __VLS_35 = __VLS_34({
        value: (__VLS_ctx.embeddingKey),
        placeholder: "如 X_pca 或 X_umap（上传文件后自动检测）",
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
}
var __VLS_28;
const __VLS_37 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
    label: "数据集名称",
}));
const __VLS_39 = __VLS_38({
    label: "数据集名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
__VLS_40.slots.default;
const __VLS_41 = {}.AInput;
/** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    value: (__VLS_ctx.name),
    placeholder: "数据集显示名称",
}));
const __VLS_43 = __VLS_42({
    value: (__VLS_ctx.name),
    placeholder: "数据集显示名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
var __VLS_40;
if (__VLS_ctx.progress > 0) {
    const __VLS_45 = {}.AProgress;
    /** @type {[typeof __VLS_components.AProgress, typeof __VLS_components.aProgress, ]} */ ;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
        percent: (__VLS_ctx.progress),
        ...{ class: "upload-progress" },
    }));
    const __VLS_47 = __VLS_46({
        percent: (__VLS_ctx.progress),
        ...{ class: "upload-progress" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "upload-actions" },
});
const __VLS_49 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    ...{ 'onClick': {} },
    ...{ class: "upload-button" },
    type: "primary",
    loading: (__VLS_ctx.loading),
}));
const __VLS_51 = __VLS_50({
    ...{ 'onClick': {} },
    ...{ class: "upload-button" },
    type: "primary",
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
let __VLS_53;
let __VLS_54;
let __VLS_55;
const __VLS_56 = {
    onClick: (__VLS_ctx.submitRegister)
};
__VLS_52.slots.default;
var __VLS_52;
var __VLS_16;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['upload-card']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-card__body']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-dragger']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-dragger__content']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-dragger__icon']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-dragger__title']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-dragger__subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-progress']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-button']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            fileList: fileList,
            sourcePath: sourcePath,
            embeddingKey: embeddingKey,
            name: name,
            loading: loading,
            progress: progress,
            fileUploading: fileUploading,
            fileUploadProgress: fileUploadProgress,
            uploadedFilename: uploadedFilename,
            embeddingKeyOptions: embeddingKeyOptions,
            beforeUpload: beforeUpload,
            submitRegister: submitRegister,
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
