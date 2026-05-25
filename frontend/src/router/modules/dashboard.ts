export default [
  { path: "/", component: () => import("@/views/dashboard/DashboardView.vue"), meta: { requiresAuth: true } },
  { path: "/dashboard", component: () => import("@/views/dashboard/DashboardView.vue"), meta: { requiresAuth: true } },
]

