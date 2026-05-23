export default [
  { path: "/admin/users", component: () => import("@/views/admin/UserManageView.vue"), meta: { requiresAuth: true, requiresAdmin: true } },
]
