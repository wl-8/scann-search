export default [
  { path: "/search",       component: () => import("@/views/search/SearchView.vue"),      meta: { requiresAuth: true } },
  { path: "/search/multi", component: () => import("@/views/search/MultiSearchView.vue"), meta: { requiresAuth: true } },
]
