import { defineStore } from "pinia"
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
    // TODO: login(), logout(), fetchCurrentUser()
  },
})
