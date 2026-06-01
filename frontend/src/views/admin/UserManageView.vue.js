import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import { approveUser, banUser, deleteUser, listPendingUsers, listUsers, rejectUser, setUserRole, unbanUser, } from "@/api/users";
const users = ref([]);
const pendingUsers = ref([]);
const loading = ref(false);
const pendingLoading = ref(false);
const activeTab = ref("all");
const roleOptions = [
    { label: "user", value: "user" },
    { label: "researcher", value: "researcher" },
    { label: "admin", value: "admin" },
];
const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    { title: "用户名", dataIndex: "username", key: "username" },
    { title: "邮箱", dataIndex: "email", key: "email" },
    { title: "角色", dataIndex: "role", key: "role", width: 140 },
    { title: "审核状态", dataIndex: "review_status", key: "review_status", width: 120 },
    { title: "账号状态", dataIndex: "account_status", key: "account_status", width: 120 },
    { title: "失败次数", dataIndex: "login_fail_count", key: "login_fail_count", width: 90 },
    { title: "操作", key: "actions", width: 220 },
];
const pendingColumns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    { title: "用户名", dataIndex: "username", key: "username" },
    { title: "邮箱", dataIndex: "email", key: "email" },
    { title: "操作", key: "actions", width: 160 },
];
function reviewColor(status) {
    if (status === "approved")
        return "green";
    if (status === "rejected")
        return "red";
    return "orange";
}
function accountColor(status) {
    if (status === "normal")
        return "blue";
    if (status === "locked")
        return "orange";
    if (status === "banned")
        return "red";
    return "default";
}
async function loadAllUsers() {
    loading.value = true;
    try {
        const res = await listUsers();
        users.value = res.items;
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "加载用户失败");
    }
    finally {
        loading.value = false;
    }
}
async function loadPendingUsers() {
    pendingLoading.value = true;
    try {
        const res = await listPendingUsers();
        pendingUsers.value = res.items;
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "加载待审核用户失败");
    }
    finally {
        pendingLoading.value = false;
    }
}
async function onRoleChange(user, role) {
    if (role === user.role)
        return;
    try {
        await setUserRole(user.id, role);
        message.success("角色已更新");
        await loadAllUsers();
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "更新角色失败");
    }
}
async function approve(userId) {
    try {
        await approveUser(userId);
        message.success("已通过审核");
        await Promise.all([loadAllUsers(), loadPendingUsers()]);
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "审核失败");
    }
}
async function reject(userId) {
    try {
        await rejectUser(userId);
        message.success("已拒绝");
        await Promise.all([loadAllUsers(), loadPendingUsers()]);
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "拒绝失败");
    }
}
async function ban(userId) {
    try {
        await banUser(userId);
        message.success("用户已封禁");
        await loadAllUsers();
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "封禁失败");
    }
}
async function unban(userId) {
    try {
        await unbanUser(userId);
        message.success("用户已解封");
        await loadAllUsers();
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "解封失败");
    }
}
async function remove(userId) {
    try {
        await deleteUser(userId);
        message.success("用户已删除");
        await Promise.all([loadAllUsers(), loadPendingUsers()]);
    }
    catch (err) {
        message.error(err?.response?.data?.detail ?? err?.message ?? "删除失败");
    }
}
onMounted(() => {
    loadAllUsers();
    loadPendingUsers();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['admin-page__header']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-page__header']} */ ;
// CSS variable injection 
// CSS variable injection end 
/** @type {[typeof AppLayout, typeof AppLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppLayout, new AppLayout({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-page__header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-page__eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
const __VLS_4 = {}.ATabs;
/** @type {[typeof __VLS_components.ATabs, typeof __VLS_components.aTabs, typeof __VLS_components.ATabs, typeof __VLS_components.aTabs, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    activeKey: (__VLS_ctx.activeTab),
    ...{ class: "admin-tabs" },
}));
const __VLS_6 = __VLS_5({
    activeKey: (__VLS_ctx.activeTab),
    ...{ class: "admin-tabs" },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.ATabPane;
/** @type {[typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    key: "all",
    tab: "全部用户",
}));
const __VLS_10 = __VLS_9({
    key: "all",
    tab: "全部用户",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ class: "admin-card" },
    bordered: (false),
}));
const __VLS_14 = __VLS_13({
    ...{ class: "admin-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "toolbar-title" },
});
const __VLS_16 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onClick: (__VLS_ctx.loadAllUsers)
};
__VLS_19.slots.default;
var __VLS_19;
const __VLS_24 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    columns: (__VLS_ctx.columns),
    dataSource: (__VLS_ctx.users),
    rowKey: "id",
    loading: (__VLS_ctx.loading),
    pagination: (false),
}));
const __VLS_26 = __VLS_25({
    columns: (__VLS_ctx.columns),
    dataSource: (__VLS_ctx.users),
    rowKey: "id",
    loading: (__VLS_ctx.loading),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
{
    const { bodyCell: __VLS_thisSlot } = __VLS_27.slots;
    const [{ column, record }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (column.key === 'role') {
        const __VLS_28 = {}.ASelect;
        /** @type {[typeof __VLS_components.ASelect, typeof __VLS_components.aSelect, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            ...{ 'onChange': {} },
            value: (record.role),
            options: (__VLS_ctx.roleOptions),
            size: "small",
            ...{ style: {} },
        }));
        const __VLS_30 = __VLS_29({
            ...{ 'onChange': {} },
            value: (record.role),
            options: (__VLS_ctx.roleOptions),
            size: "small",
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        let __VLS_32;
        let __VLS_33;
        let __VLS_34;
        const __VLS_35 = {
            onChange: ((val) => __VLS_ctx.onRoleChange(record, val))
        };
        var __VLS_31;
    }
    if (column.key === 'review_status') {
        const __VLS_36 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            color: (__VLS_ctx.reviewColor(record.review_status)),
        }));
        const __VLS_38 = __VLS_37({
            color: (__VLS_ctx.reviewColor(record.review_status)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        __VLS_39.slots.default;
        (record.review_status);
        var __VLS_39;
    }
    if (column.key === 'account_status') {
        const __VLS_40 = {}.ATag;
        /** @type {[typeof __VLS_components.ATag, typeof __VLS_components.aTag, typeof __VLS_components.ATag, typeof __VLS_components.aTag, ]} */ ;
        // @ts-ignore
        const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
            color: (__VLS_ctx.accountColor(record.account_status)),
        }));
        const __VLS_42 = __VLS_41({
            color: (__VLS_ctx.accountColor(record.account_status)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
        __VLS_43.slots.default;
        (record.account_status);
        var __VLS_43;
    }
    if (column.key === 'actions') {
        const __VLS_44 = {}.ASpace;
        /** @type {[typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, ]} */ ;
        // @ts-ignore
        const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({}));
        const __VLS_46 = __VLS_45({}, ...__VLS_functionalComponentArgsRest(__VLS_45));
        __VLS_47.slots.default;
        if (record.review_status === 'pending') {
            const __VLS_48 = {}.AButton;
            /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
            // @ts-ignore
            const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
                ...{ 'onClick': {} },
                size: "small",
                type: "primary",
            }));
            const __VLS_50 = __VLS_49({
                ...{ 'onClick': {} },
                size: "small",
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_49));
            let __VLS_52;
            let __VLS_53;
            let __VLS_54;
            const __VLS_55 = {
                onClick: (...[$event]) => {
                    if (!(column.key === 'actions'))
                        return;
                    if (!(record.review_status === 'pending'))
                        return;
                    __VLS_ctx.approve(record.id);
                }
            };
            __VLS_51.slots.default;
            var __VLS_51;
        }
        if (record.review_status === 'pending') {
            const __VLS_56 = {}.AButton;
            /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
            // @ts-ignore
            const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
                ...{ 'onClick': {} },
                size: "small",
            }));
            const __VLS_58 = __VLS_57({
                ...{ 'onClick': {} },
                size: "small",
            }, ...__VLS_functionalComponentArgsRest(__VLS_57));
            let __VLS_60;
            let __VLS_61;
            let __VLS_62;
            const __VLS_63 = {
                onClick: (...[$event]) => {
                    if (!(column.key === 'actions'))
                        return;
                    if (!(record.review_status === 'pending'))
                        return;
                    __VLS_ctx.reject(record.id);
                }
            };
            __VLS_59.slots.default;
            var __VLS_59;
        }
        if (record.account_status !== 'banned') {
            const __VLS_64 = {}.AButton;
            /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
            // @ts-ignore
            const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
                ...{ 'onClick': {} },
                size: "small",
                danger: true,
            }));
            const __VLS_66 = __VLS_65({
                ...{ 'onClick': {} },
                size: "small",
                danger: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_65));
            let __VLS_68;
            let __VLS_69;
            let __VLS_70;
            const __VLS_71 = {
                onClick: (...[$event]) => {
                    if (!(column.key === 'actions'))
                        return;
                    if (!(record.account_status !== 'banned'))
                        return;
                    __VLS_ctx.ban(record.id);
                }
            };
            __VLS_67.slots.default;
            var __VLS_67;
        }
        else {
            const __VLS_72 = {}.AButton;
            /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
            // @ts-ignore
            const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
                ...{ 'onClick': {} },
                size: "small",
            }));
            const __VLS_74 = __VLS_73({
                ...{ 'onClick': {} },
                size: "small",
            }, ...__VLS_functionalComponentArgsRest(__VLS_73));
            let __VLS_76;
            let __VLS_77;
            let __VLS_78;
            const __VLS_79 = {
                onClick: (...[$event]) => {
                    if (!(column.key === 'actions'))
                        return;
                    if (!!(record.account_status !== 'banned'))
                        return;
                    __VLS_ctx.unban(record.id);
                }
            };
            __VLS_75.slots.default;
            var __VLS_75;
        }
        const __VLS_80 = {}.APopconfirm;
        /** @type {[typeof __VLS_components.APopconfirm, typeof __VLS_components.aPopconfirm, typeof __VLS_components.APopconfirm, typeof __VLS_components.aPopconfirm, ]} */ ;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
            ...{ 'onConfirm': {} },
            title: "确定删除该用户？",
        }));
        const __VLS_82 = __VLS_81({
            ...{ 'onConfirm': {} },
            title: "确定删除该用户？",
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        let __VLS_84;
        let __VLS_85;
        let __VLS_86;
        const __VLS_87 = {
            onConfirm: (...[$event]) => {
                if (!(column.key === 'actions'))
                    return;
                __VLS_ctx.remove(record.id);
            }
        };
        __VLS_83.slots.default;
        const __VLS_88 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
            size: "small",
        }));
        const __VLS_90 = __VLS_89({
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_89));
        __VLS_91.slots.default;
        var __VLS_91;
        var __VLS_83;
        var __VLS_47;
    }
}
var __VLS_27;
var __VLS_15;
var __VLS_11;
const __VLS_92 = {}.ATabPane;
/** @type {[typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, typeof __VLS_components.ATabPane, typeof __VLS_components.aTabPane, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    key: "pending",
    tab: "待审核",
}));
const __VLS_94 = __VLS_93({
    key: "pending",
    tab: "待审核",
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
__VLS_95.slots.default;
const __VLS_96 = {}.ACard;
/** @type {[typeof __VLS_components.ACard, typeof __VLS_components.aCard, typeof __VLS_components.ACard, typeof __VLS_components.aCard, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    ...{ class: "admin-card" },
    bordered: (false),
}));
const __VLS_98 = __VLS_97({
    ...{ class: "admin-card" },
    bordered: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
__VLS_99.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "toolbar-title" },
});
const __VLS_100 = {}.AButton;
/** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.pendingLoading),
}));
const __VLS_102 = __VLS_101({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.pendingLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
let __VLS_104;
let __VLS_105;
let __VLS_106;
const __VLS_107 = {
    onClick: (__VLS_ctx.loadPendingUsers)
};
__VLS_103.slots.default;
var __VLS_103;
const __VLS_108 = {}.ATable;
/** @type {[typeof __VLS_components.ATable, typeof __VLS_components.aTable, typeof __VLS_components.ATable, typeof __VLS_components.aTable, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    columns: (__VLS_ctx.pendingColumns),
    dataSource: (__VLS_ctx.pendingUsers),
    rowKey: "id",
    loading: (__VLS_ctx.pendingLoading),
    pagination: (false),
}));
const __VLS_110 = __VLS_109({
    columns: (__VLS_ctx.pendingColumns),
    dataSource: (__VLS_ctx.pendingUsers),
    rowKey: "id",
    loading: (__VLS_ctx.pendingLoading),
    pagination: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
__VLS_111.slots.default;
{
    const { bodyCell: __VLS_thisSlot } = __VLS_111.slots;
    const [{ column, record }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (column.key === 'actions') {
        const __VLS_112 = {}.ASpace;
        /** @type {[typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, typeof __VLS_components.ASpace, typeof __VLS_components.aSpace, ]} */ ;
        // @ts-ignore
        const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({}));
        const __VLS_114 = __VLS_113({}, ...__VLS_functionalComponentArgsRest(__VLS_113));
        __VLS_115.slots.default;
        const __VLS_116 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
            ...{ 'onClick': {} },
            size: "small",
            type: "primary",
        }));
        const __VLS_118 = __VLS_117({
            ...{ 'onClick': {} },
            size: "small",
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_117));
        let __VLS_120;
        let __VLS_121;
        let __VLS_122;
        const __VLS_123 = {
            onClick: (...[$event]) => {
                if (!(column.key === 'actions'))
                    return;
                __VLS_ctx.approve(record.id);
            }
        };
        __VLS_119.slots.default;
        var __VLS_119;
        const __VLS_124 = {}.AButton;
        /** @type {[typeof __VLS_components.AButton, typeof __VLS_components.aButton, typeof __VLS_components.AButton, typeof __VLS_components.aButton, ]} */ ;
        // @ts-ignore
        const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
            ...{ 'onClick': {} },
            size: "small",
        }));
        const __VLS_126 = __VLS_125({
            ...{ 'onClick': {} },
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_125));
        let __VLS_128;
        let __VLS_129;
        let __VLS_130;
        const __VLS_131 = {
            onClick: (...[$event]) => {
                if (!(column.key === 'actions'))
                    return;
                __VLS_ctx.reject(record.id);
            }
        };
        __VLS_127.slots.default;
        var __VLS_127;
        var __VLS_115;
    }
}
var __VLS_111;
var __VLS_99;
var __VLS_95;
var __VLS_7;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['admin-page']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-page__header']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-page__eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
/** @type {__VLS_StyleScopedClasses['table-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-title']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
/** @type {__VLS_StyleScopedClasses['table-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-title']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            users: users,
            pendingUsers: pendingUsers,
            loading: loading,
            pendingLoading: pendingLoading,
            activeTab: activeTab,
            roleOptions: roleOptions,
            columns: columns,
            pendingColumns: pendingColumns,
            reviewColor: reviewColor,
            accountColor: accountColor,
            loadAllUsers: loadAllUsers,
            loadPendingUsers: loadPendingUsers,
            onRoleChange: onRoleChange,
            approve: approve,
            reject: reject,
            ban: ban,
            unban: unban,
            remove: remove,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
