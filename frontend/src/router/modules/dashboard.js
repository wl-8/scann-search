export default [
    { path: "/", redirect: "/login" },
    { path: "/dashboard", component: () => import("@/views/dashboard/DashboardView.vue"), meta: { requiresAuth: true } },
];
