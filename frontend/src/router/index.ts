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
import ragRoutes from "./modules/rag"

const router = createRouter({
  history: createWebHistory(),
  routes: [...authRoutes, ...dashboardRoutes, ...datasetRoutes, ...indexRoutes, ...searchRoutes, ...visualizeRoutes, ...benchmarkRoutes, ...ragRoutes, ...adminRoutes, ...exportRoutes],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth) {
    if (!auth.isLoggedIn) return "/login"
    // ensure user info is loaded
    if (!auth.user) {
      await auth.fetchCurrentUser()
      if (!auth.isLoggedIn) return "/login"
    }
    if (to.meta.requiresAdmin && !auth.isAdmin) return "/dashboard"
  }
})

export default router
