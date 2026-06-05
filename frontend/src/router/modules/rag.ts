export default [
  { path: "/rag", component: () => import("@/views/rag/RagView.vue"), meta: { requiresAuth: true } },
]
