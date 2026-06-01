import { computed, reactive, toRefs, ref, watch } from "vue";
import { message } from "ant-design-vue";
const props = withDefaults(defineProps(), {
    modelValue: () => ({
        queryType: "id",
        query: "",
        k: 10,
        oversample: 10,
        filterColumn: undefined,
        filterValue: undefined,
        filters: { cell_type: "" },
    }),
});
const emit = defineEmits();
const state = reactive({ ...props.modelValue });
const formRef = ref();
const rules = {
    query: [
        {
            required: true,
            message: "请输入查询内容",
            validator: (_, value) => {
                if (!value || String(value).trim() === "")
                    return Promise.reject(new Error("请输入查询内容"));
                return Promise.resolve();
            },
        },
    ],
    k: [
        { required: true, message: "请设置 Top-K" },
        {
            validator: (_, value) => {
                if (!Number.isInteger(value) || value < 1)
                    return Promise.reject(new Error("Top-K 必须是正整数"));
                return Promise.resolve();
            },
        },
    ],
};
const columnOptions = computed(() => (props.obsStats?.obs_columns ?? []).map((c) => ({ label: c, value: c })));
const valueOptions = computed(() => {
    const col = state.filterColumn;
    if (!col || !props.obsStats?.value_counts?.[col])
        return [];
    return Object.keys(props.obsStats.value_counts[col]).map((v) => ({ label: v, value: v }));
});
watch(() => props.modelValue, (v) => {
    Object.assign(state, v);
}, { deep: true });
watch(state, (v) => emit("update:modelValue", { ...v }), { deep: true });
async function handleSubmit() {
    try {
        await formRef.value.validate();
        emit("submit", { ...state });
    }
    catch (err) {
        message.error("表单校验未通过，请检查输入");
    }
}
const { queryType, query, k, oversample, filterColumn, filterValue, filters } = toRefs(state);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    modelValue: () => ({
        queryType: "id",
        query: "",
        k: 10,
        oversample: 10,
        filterColumn: undefined,
        filterValue: undefined,
        filters: { cell_type: "" },
    }),
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['search-card__head']} */ ;
/** @type {__VLS_StyleScopedClasses['search-card__head']} */ ;
/** @type {__VLS_StyleScopedClasses['form-section']} */ ;
/** @type {__VLS_StyleScopedClasses['form-section']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-input']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-input']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-input-number']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-select-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-input']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-select-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-input-number-focused']} */ ;
/** @type {__VLS_StyleScopedClasses['ant-input-number-input']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['submit-button']} */ ;
/** @type {__VLS_StyleScopedClasses['submit-button']} */ ;
/** @type {__VLS_StyleScopedClasses['search-card']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['search-card__head']} */ ;
/** @type {__VLS_StyleScopedClasses['radio-group']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "search-card" },
    bordered: (false),
}));
const __VLS_2 = __VLS_1({
    ...{ class: "search-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "search-card__head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "search-card__kicker" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
const __VLS_5 = {}.AForm;
/** @type {[typeof __VLS_components.AForm, typeof __VLS_components.aForm, typeof __VLS_components.AForm, typeof __VLS_components.aForm, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ...{ 'onSubmit': {} },
    model: (__VLS_ctx.state),
    rules: (__VLS_ctx.rules),
    ref: "formRef",
    layout: "vertical",
    ...{ class: "search-form" },
}));
const __VLS_7 = __VLS_6({
    ...{ 'onSubmit': {} },
    model: (__VLS_ctx.state),
    rules: (__VLS_ctx.rules),
    ref: "formRef",
    layout: "vertical",
    ...{ class: "search-form" },
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_9;
let __VLS_10;
let __VLS_11;
const __VLS_12 = {
    onSubmit: () => { }
};
/** @type {typeof __VLS_ctx.formRef} */ ;
var __VLS_13 = {};
__VLS_8.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-section__title" },
});
const __VLS_15 = {}.ARow;
/** @type {[typeof __VLS_components.ARow, typeof __VLS_components.aRow, typeof __VLS_components.ARow, typeof __VLS_components.aRow, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
    gutter: (16),
}));
const __VLS_17 = __VLS_16({
    gutter: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
__VLS_18.slots.default;
const __VLS_19 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    span: (24),
}));
const __VLS_21 = __VLS_20({
    span: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
__VLS_22.slots.default;
const __VLS_23 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
    label: "输入类型",
    name: "queryType",
}));
const __VLS_25 = __VLS_24({
    label: "输入类型",
    name: "queryType",
}, ...__VLS_functionalComponentArgsRest(__VLS_24));
__VLS_26.slots.default;
const __VLS_27 = {}.ARadioGroup;
/** @type {[typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, typeof __VLS_components.ARadioGroup, typeof __VLS_components.aRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
    value: (__VLS_ctx.state.queryType),
    ...{ class: "radio-group" },
}));
const __VLS_29 = __VLS_28({
    value: (__VLS_ctx.state.queryType),
    ...{ class: "radio-group" },
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
__VLS_30.slots.default;
const __VLS_31 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
    value: "id",
}));
const __VLS_33 = __VLS_32({
    value: "id",
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
__VLS_34.slots.default;
var __VLS_34;
const __VLS_35 = {}.ARadio;
/** @type {[typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, typeof __VLS_components.ARadio, typeof __VLS_components.aRadio, ]} */ ;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
    value: "vector",
}));
const __VLS_37 = __VLS_36({
    value: "vector",
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
__VLS_38.slots.default;
var __VLS_38;
var __VLS_30;
var __VLS_26;
var __VLS_22;
const __VLS_39 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
    span: (24),
}));
const __VLS_41 = __VLS_40({
    span: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
__VLS_42.slots.default;
const __VLS_43 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
    label: (__VLS_ctx.state.queryType === 'id' ? '细胞ID' : '向量（逗号分隔）'),
    name: ('query'),
}));
const __VLS_45 = __VLS_44({
    label: (__VLS_ctx.state.queryType === 'id' ? '细胞ID' : '向量（逗号分隔）'),
    name: ('query'),
}, ...__VLS_functionalComponentArgsRest(__VLS_44));
__VLS_46.slots.default;
if (__VLS_ctx.state.queryType === 'id') {
    const __VLS_47 = {}.AInput;
    /** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
    // @ts-ignore
    const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
        value: (__VLS_ctx.state.query),
        ...{ class: "control-input" },
        placeholder: "例如: cell_12345",
    }));
    const __VLS_49 = __VLS_48({
        value: (__VLS_ctx.state.query),
        ...{ class: "control-input" },
        placeholder: "例如: cell_12345",
    }, ...__VLS_functionalComponentArgsRest(__VLS_48));
}
else {
    const __VLS_51 = {}.ATextarea;
    /** @type {[typeof __VLS_components.ATextarea, typeof __VLS_components.aTextarea, ]} */ ;
    // @ts-ignore
    const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
        value: (__VLS_ctx.state.query),
        ...{ class: "control-input control-input--textarea" },
        autoSize: ({ minRows: 4, maxRows: 6 }),
        placeholder: "例如: 0.12, -0.03, ...",
    }));
    const __VLS_53 = __VLS_52({
        value: (__VLS_ctx.state.query),
        ...{ class: "control-input control-input--textarea" },
        autoSize: ({ minRows: 4, maxRows: 6 }),
        placeholder: "例如: 0.12, -0.03, ...",
    }, ...__VLS_functionalComponentArgsRest(__VLS_52));
}
var __VLS_46;
var __VLS_42;
var __VLS_18;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-section__title" },
});
const __VLS_55 = {}.ARow;
/** @type {[typeof __VLS_components.ARow, typeof __VLS_components.aRow, typeof __VLS_components.ARow, typeof __VLS_components.aRow, ]} */ ;
// @ts-ignore
const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
    gutter: (16),
}));
const __VLS_57 = __VLS_56({
    gutter: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
__VLS_58.slots.default;
const __VLS_59 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
    span: (12),
}));
const __VLS_61 = __VLS_60({
    span: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_60));
__VLS_62.slots.default;
const __VLS_63 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({
    label: "过滤字段",
}));
const __VLS_65 = __VLS_64({
    label: "过滤字段",
}, ...__VLS_functionalComponentArgsRest(__VLS_64));
__VLS_66.slots.default;
if (__VLS_ctx.columnOptions.length) {
    const __VLS_67 = {}.ASelect;
    /** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
    // @ts-ignore
    const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
        ...{ 'onChange': {} },
        value: (__VLS_ctx.state.filterColumn),
        options: (__VLS_ctx.columnOptions),
        placeholder: "选择 obs 字段",
        allowClear: true,
        ...{ class: "control-input" },
    }));
    const __VLS_69 = __VLS_68({
        ...{ 'onChange': {} },
        value: (__VLS_ctx.state.filterColumn),
        options: (__VLS_ctx.columnOptions),
        placeholder: "选择 obs 字段",
        allowClear: true,
        ...{ class: "control-input" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_68));
    let __VLS_71;
    let __VLS_72;
    let __VLS_73;
    const __VLS_74 = {
        onChange: (...[$event]) => {
            if (!(__VLS_ctx.columnOptions.length))
                return;
            __VLS_ctx.state.filterValue = undefined;
        }
    };
    var __VLS_70;
}
else {
    const __VLS_75 = {}.AInput;
    /** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
    // @ts-ignore
    const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
        value: (__VLS_ctx.state.filterColumn),
        ...{ class: "control-input" },
        placeholder: "例如: cell_type / disease",
    }));
    const __VLS_77 = __VLS_76({
        value: (__VLS_ctx.state.filterColumn),
        ...{ class: "control-input" },
        placeholder: "例如: cell_type / disease",
    }, ...__VLS_functionalComponentArgsRest(__VLS_76));
}
var __VLS_66;
var __VLS_62;
const __VLS_79 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_80 = __VLS_asFunctionalComponent(__VLS_79, new __VLS_79({
    span: (12),
}));
const __VLS_81 = __VLS_80({
    span: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_80));
__VLS_82.slots.default;
const __VLS_83 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_84 = __VLS_asFunctionalComponent(__VLS_83, new __VLS_83({
    label: "过滤值",
}));
const __VLS_85 = __VLS_84({
    label: "过滤值",
}, ...__VLS_functionalComponentArgsRest(__VLS_84));
__VLS_86.slots.default;
if (__VLS_ctx.valueOptions.length) {
    const __VLS_87 = {}.ASelect;
    /** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
    // @ts-ignore
    const __VLS_88 = __VLS_asFunctionalComponent(__VLS_87, new __VLS_87({
        value: (__VLS_ctx.state.filterValue),
        options: (__VLS_ctx.valueOptions),
        placeholder: "选择值",
        allowClear: true,
        ...{ class: "control-input" },
    }));
    const __VLS_89 = __VLS_88({
        value: (__VLS_ctx.state.filterValue),
        options: (__VLS_ctx.valueOptions),
        placeholder: "选择值",
        allowClear: true,
        ...{ class: "control-input" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_88));
}
else {
    const __VLS_91 = {}.AInput;
    /** @type {[typeof __VLS_components.AInput, typeof __VLS_components.aInput, ]} */ ;
    // @ts-ignore
    const __VLS_92 = __VLS_asFunctionalComponent(__VLS_91, new __VLS_91({
        value: (__VLS_ctx.state.filterValue),
        ...{ class: "control-input" },
        placeholder: "例如: T-cell / normal",
    }));
    const __VLS_93 = __VLS_92({
        value: (__VLS_ctx.state.filterValue),
        ...{ class: "control-input" },
        placeholder: "例如: T-cell / normal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_92));
}
var __VLS_86;
var __VLS_82;
const __VLS_95 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_96 = __VLS_asFunctionalComponent(__VLS_95, new __VLS_95({
    span: (12),
}));
const __VLS_97 = __VLS_96({
    span: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_96));
__VLS_98.slots.default;
const __VLS_99 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_100 = __VLS_asFunctionalComponent(__VLS_99, new __VLS_99({
    label: "Top-K",
    name: "k",
}));
const __VLS_101 = __VLS_100({
    label: "Top-K",
    name: "k",
}, ...__VLS_functionalComponentArgsRest(__VLS_100));
__VLS_102.slots.default;
const __VLS_103 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_104 = __VLS_asFunctionalComponent(__VLS_103, new __VLS_103({
    value: (__VLS_ctx.state.k),
    min: (1),
    max: (100),
    ...{ class: "control-number" },
}));
const __VLS_105 = __VLS_104({
    value: (__VLS_ctx.state.k),
    min: (1),
    max: (100),
    ...{ class: "control-number" },
}, ...__VLS_functionalComponentArgsRest(__VLS_104));
var __VLS_102;
var __VLS_98;
const __VLS_107 = {}.ACol;
/** @type {[typeof __VLS_components.ACol, typeof __VLS_components.aCol, typeof __VLS_components.ACol, typeof __VLS_components.aCol, ]} */ ;
// @ts-ignore
const __VLS_108 = __VLS_asFunctionalComponent(__VLS_107, new __VLS_107({
    span: (12),
}));
const __VLS_109 = __VLS_108({
    span: (12),
}, ...__VLS_functionalComponentArgsRest(__VLS_108));
__VLS_110.slots.default;
const __VLS_111 = {}.AFormItem;
/** @type {[typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, typeof __VLS_components.AFormItem, typeof __VLS_components.aFormItem, ]} */ ;
// @ts-ignore
const __VLS_112 = __VLS_asFunctionalComponent(__VLS_111, new __VLS_111({
    label: "过滤召回倍数",
    name: "oversample",
}));
const __VLS_113 = __VLS_112({
    label: "过滤召回倍数",
    name: "oversample",
}, ...__VLS_functionalComponentArgsRest(__VLS_112));
__VLS_114.slots.default;
const __VLS_115 = {}.AInputNumber;
/** @type {[typeof __VLS_components.AInputNumber, typeof __VLS_components.aInputNumber, ]} */ ;
// @ts-ignore
const __VLS_116 = __VLS_asFunctionalComponent(__VLS_115, new __VLS_115({
    value: (__VLS_ctx.state.oversample),
    min: (1),
    max: (100),
    ...{ class: "control-number" },
}));
const __VLS_117 = __VLS_116({
    value: (__VLS_ctx.state.oversample),
    min: (1),
    max: (100),
    ...{ class: "control-number" },
}, ...__VLS_functionalComponentArgsRest(__VLS_116));
var __VLS_114;
var __VLS_110;
var __VLS_58;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "search-card__footer" },
});
const __VLS_119 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_120 = __VLS_asFunctionalComponent(__VLS_119, new __VLS_119({
    ...{ 'onClick': {} },
    type: "primary",
    ...{ class: "submit-button" },
}));
const __VLS_121 = __VLS_120({
    ...{ 'onClick': {} },
    type: "primary",
    ...{ class: "submit-button" },
}, ...__VLS_functionalComponentArgsRest(__VLS_120));
let __VLS_123;
let __VLS_124;
let __VLS_125;
const __VLS_126 = {
    onClick: (__VLS_ctx.handleSubmit)
};
__VLS_122.slots.default;
var __VLS_122;
var __VLS_8;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['search-card']} */ ;
/** @type {__VLS_StyleScopedClasses['search-card__head']} */ ;
/** @type {__VLS_StyleScopedClasses['search-card__kicker']} */ ;
/** @type {__VLS_StyleScopedClasses['search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-section']} */ ;
/** @type {__VLS_StyleScopedClasses['form-section__title']} */ ;
/** @type {__VLS_StyleScopedClasses['radio-group']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input--textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['form-section']} */ ;
/** @type {__VLS_StyleScopedClasses['form-section__title']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-input']} */ ;
/** @type {__VLS_StyleScopedClasses['control-number']} */ ;
/** @type {__VLS_StyleScopedClasses['control-number']} */ ;
/** @type {__VLS_StyleScopedClasses['search-card__footer']} */ ;
/** @type {__VLS_StyleScopedClasses['submit-button']} */ ;
// @ts-ignore
var __VLS_14 = __VLS_13;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            state: state,
            formRef: formRef,
            rules: rules,
            columnOptions: columnOptions,
            valueOptions: valueOptions,
            handleSubmit: handleSubmit,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
