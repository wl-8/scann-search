export default [
    { path: "/benchmark", component: () => import("@/views/benchmark/BenchmarkView.vue"), meta: { requiresAuth: true } },
];
