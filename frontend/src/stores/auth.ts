import { defineStore } from "pinia"
import * as authApi from "@/api/auth"
import router from "@/router"

type UserInfo = { id: number; username: string; role: string; email?: string }

function loadStoredUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistUser(user: UserInfo | null) {
  if (user) localStorage.setItem("user", JSON.stringify(user))
  else localStorage.removeItem("user")
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") ?? "",
    user: loadStoredUser(),
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin: (s) => s.user?.role === "admin",
    isResearcher: (s) => s.user?.role === "researcher",
    canResearch: (s) => s.user?.role === "researcher" || s.user?.role === "admin",
  },
  actions: {
    async login(username: string, password: string) {
      const tokenRes = (await authApi.login({ username, password })) as any
      const accessToken = tokenRes.access_token ?? tokenRes.token
      if (!accessToken) throw new Error("登录未返回 access_token")
      this.token = accessToken
      localStorage.setItem("token", accessToken)

      try {
        const user = (await authApi.me()) as any as UserInfo
        this.user = user
        persistUser(user)
      } catch {
        this.user = null
        persistUser(null)
      }

      router.push("/dashboard")
    },

    async logout() {
      try {
        await authApi.logout()
      } catch {
        // ignore
      }
      this.token = ""
      this.user = null
      localStorage.removeItem("token")
      persistUser(null)
      router.push("/login")
    },

    async fetchCurrentUser() {
      if (!this.token) return null
      // If already loaded from localStorage, refresh in background and return immediately
      if (this.user) {
        authApi.me().then((u) => {
          const user = u as any as UserInfo
          this.user = user
          persistUser(user)
        }).catch(() => {
          this.token = ""
          this.user = null
          localStorage.removeItem("token")
          persistUser(null)
          router.push("/login")
        })
        return this.user
      }
      // No cached user — must await
      try {
        const user = (await authApi.me()) as any as UserInfo
        this.user = user
        persistUser(user)
        return user
      } catch {
        this.token = ""
        this.user = null
        localStorage.removeItem("token")
        persistUser(null)
        return null
      }
    },
  },
})
