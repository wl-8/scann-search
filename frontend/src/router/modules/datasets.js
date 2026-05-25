export default [
    { path: "/datasets", component: () => import("@/views/datasets/DatasetListView.vue"), meta: { requiresAuth: true } },
];
