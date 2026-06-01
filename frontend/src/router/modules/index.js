export default [
    { path: "/indexes", component: () => import("@/views/index/IndexManageView.vue"), meta: { requiresAuth: true } },
];
