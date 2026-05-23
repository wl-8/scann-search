import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import authRoutes from "./modules/auth"
import dashboardRoutes from "./modules/dashboard"
import datasetRoutes from "./modules/datasets"
import indexRoutes from "./modules/index"
import searchRoutes from "./modules/search"
import visualizeRoutes from "./modules/visualize"
import benchmarkRoutes from "./modules/benchmark"
import adminRoutes from "./modules/admin"
import exportRoutes from "./modules/export"

const router = createRouter({
  history: createWebHistory(),
  routes: [...authRoutes, ...dashboardRoutes, ...datasetRoutes, ...indexRoutes, ...searchRoutes, ...visualizeRoutes, ...benchmarkRoutes, ...adminRoutes, ...exportRoutes],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return "/login"
})

export default router
