import { defineStore } from "pinia"
import * as authApi from "@/api/auth"
import router from "@/router"
export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") ?? "",
    user: null as null | { id: number; username: string; role: string },
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin: (s) => s.user?.role === "admin",
    isResearcher: (s) => s.user?.role === "researcher",
  },
  actions: {
    async login(username: string, password: string) {
      const res = await authApi.login({ username, password })
      this.token = res.token
      this.user = res.user
      localStorage.setItem("token", res.token)
      // redirect to dashboard after login
      router.push("/dashboard")
    },

    async logout() {
      await authApi.logout()
      this.token = ""
      this.user = null
      localStorage.removeItem("token")
      router.push("/login")
    },

    fetchCurrentUser() {
      // In a real app you'd call an endpoint to get current user by token.
      // For demo, if token exists but no user, set a minimal user.
      if (this.token && !this.user) {
        this.user = { id: 1, username: "guest", role: "researcher" }
      }
    },
  },
})
