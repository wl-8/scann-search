import { defineStore } from "pinia";
import * as authApi from "@/api/auth";
import router from "@/router";
export const useAuthStore = defineStore("auth", {
    state: () => ({
        token: localStorage.getItem("token") ?? "",
        user: null,
    }),
    getters: {
        isLoggedIn: (s) => !!s.token,
        isAdmin: (s) => s.user?.role === "admin",
        isResearcher: (s) => s.user?.role === "researcher",
    },
    actions: {
        async login(username, password) {
            try {
                const tokenRes = await authApi.login({ username, password });
                const accessToken = tokenRes.access_token ?? tokenRes.token;
                if (!accessToken)
                    throw new Error("登录未返回 access_token");
                this.token = accessToken;
                localStorage.setItem("token", accessToken);
                // 拉取用户信息
                try {
                    const user = await authApi.me();
                    this.user = user;
                }
                catch (e) {
                    // 即使获取用户失败，也允许登录成功，跳转到 dashboard
                    this.user = null;
                }
                router.push("/dashboard");
            }
            catch (err) {
                throw err;
            }
        },
        async logout() {
            try {
                await authApi.logout();
            }
            catch (e) {
                // ignore logout errors
            }
            this.token = "";
            this.user = null;
            localStorage.removeItem("token");
            router.push("/login");
        },
        async fetchCurrentUser() {
            if (this.token && !this.user) {
                try {
                    const user = await authApi.me();
                    this.user = user;
                    return user;
                }
                catch (e) {
                    this.token = "";
                    localStorage.removeItem("token");
                    this.user = null;
                    return null;
                }
            }
            return this.user;
        },
    },
});
