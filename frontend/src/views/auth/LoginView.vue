<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-card__header">
        <p class="login-card__eyebrow">Welcome back</p>
        <h2>登录</h2>
        <p class="login-card__subtitle">使用你的账号继续访问系统。</p>
      </div>

      <form class="login-form" @submit.prevent="onSubmit">
        <div class="field">
          <label>用户名</label>
          <input v-model="username" placeholder="输入用户名" />
        </div>

        <div class="field">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="输入密码" />
        </div>

        <button type="submit" class="login-button">登录</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useAuthStore } from "@/stores/auth"

const username = ref("")
const password = ref("")
const auth = useAuthStore()

async function onSubmit() {
  try {
    await auth.login(username.value, password.value)
  } catch (err: any) {
    const detail = err?.response?.data?.detail ?? err?.message ?? "用户名或密码错误"
    alert(`登录失败：${detail}`)
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(59, 130, 246, 0.28), transparent 36%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.18), transparent 32%),
    linear-gradient(135deg, #0f172a 0%, #111827 48%, #1f2937 100%);
}

.login-card {
  width: min(100%, 440px);
  padding: 40px 32px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(15, 23, 42, 0.56);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.45);
  color: #f8fafc;
}

.login-card__header {
  margin-bottom: 28px;
}

.login-card__eyebrow {
  margin: 0 0 8px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #93c5fd;
}

.login-card h2 {
  margin: 0;
  font-size: 1.9rem;
  line-height: 1.2;
}

.login-card__subtitle {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.82);
  line-height: 1.6;
}

.login-form {
  display: grid;
  gap: 18px;
}

.field {
  display: grid;
  gap: 8px;
}

.field label {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(241, 245, 249, 0.92);
}

.login-page input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.72);
  color: #f8fafc;
  box-sizing: border-box;
  outline: none;
  transition:
    border-color 0.24s ease,
    box-shadow 0.24s ease,
    transform 0.24s ease,
    background-color 0.24s ease;
}

.login-page input::placeholder {
  color: rgba(148, 163, 184, 0.78);
}

.login-page input:focus {
  border-color: rgba(96, 165, 250, 0.95);
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.16);
  background: rgba(15, 23, 42, 0.86);
  transform: translateY(-1px);
}

.login-button {
  margin-top: 4px;
  padding: 14px 18px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #38bdf8 0%, #2563eb 100%);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 16px 28px rgba(37, 99, 235, 0.28);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.login-button:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
  box-shadow: 0 18px 32px rgba(37, 99, 235, 0.35);
}

.login-button:active {
  transform: translateY(1px) scale(0.985);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.24);
}

@media (max-width: 640px) {
  .login-page {
    padding: 16px;
  }

  .login-card {
    padding: 28px 20px;
    border-radius: 20px;
  }

  .login-card h2 {
    font-size: 1.65rem;
  }

  .login-page input,
  .login-button {
    border-radius: 12px;
  }
}
</style>
