export default [
  { path: "/visualize", component: () => import("@/views/visualize/VisualizeView.vue"), meta: { requiresAuth: true } },
]

