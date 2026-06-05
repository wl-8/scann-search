export default [
  { path: "/export", component: () => import("@/views/export/ExportView.vue"), meta: { requiresAuth: true } },
]
