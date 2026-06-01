<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-card__header">
        <p class="login-card__eyebrow">Welcome back</p>
        <h2>登录</h2>
        <p class="login-card__subtitle">使用你的账号继续访问系统。</p>
      </div>

      <div class="login-tabs">
        <button type="button" :class="['tab-button', mode === 'login' ? 'is-active' : '']" @click="mode = 'login'">登录</button>
        <button type="button" :class="['tab-button', mode === 'register' ? 'is-active' : '']" @click="mode = 'register'">注册</button>
      </div>

      <form v-if="mode === 'login'" class="login-form" @submit.prevent="onLogin">
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

      <form v-else class="login-form" @submit.prevent="onRegister">
        <div class="field">
          <label>用户名</label>
          <input v-model="registerUsername" placeholder="字母/数字/下划线，3-32 位" />
        </div>

        <div class="field">
          <label>邮箱</label>
          <input v-model="registerEmail" type="email" placeholder="name@example.com" />
        </div>

        <div class="field">
          <label>密码</label>
          <input v-model="registerPassword" type="password" placeholder="至少 8 位，含大写字母和数字" />
        </div>

        <div class="field">
          <label>确认密码</label>
          <input v-model="registerPasswordConfirm" type="password" placeholder="再次输入密码" />
        </div>

        <p class="form-hint">注册后需要管理员审核通过才能登录。</p>
        <button type="submit" class="login-button">提交注册</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useAuthStore } from "@/stores/auth"
import { register } from "@/api/auth"

const username = ref("")
const password = ref("")
const auth = useAuthStore()
const mode = ref<"login" | "register">("login")
const registerUsername = ref("")
const registerEmail = ref("")
const registerPassword = ref("")
const registerPasswordConfirm = ref("")

async function onLogin() {
  try {
    await auth.login(username.value, password.value)
  } catch (err: any) {
    const detail = err?.response?.data?.detail ?? err?.message ?? "用户名或密码错误"
    alert(`登录失败：${detail}`)
  }
}

async function onRegister() {
  const uname = registerUsername.value.trim()
  const email = registerEmail.value.trim()
  const pwd = registerPassword.value
  const confirm = registerPasswordConfirm.value

  if (!uname || !email || !pwd) {
    alert("请填写完整的注册信息")
    return
  }
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(uname)) {
    alert("用户名只能包含字母、数字、下划线，长度 3-32")
    return
  }
  if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
    alert("密码至少 8 位，需包含大写字母和数字")
    return
  }
  if (pwd !== confirm) {
    alert("两次输入的密码不一致")
    return
  }

  try {
    const res = await register({ username: uname, email, password: pwd }) as any
    alert(res?.message ?? "注册成功，请等待管理员审核")
    registerUsername.value = ""
    registerEmail.value = ""
    registerPassword.value = ""
    registerPasswordConfirm.value = ""
    mode.value = "login"
  } catch (err: any) {
    const detail = err?.response?.data?.detail ?? err?.message ?? "注册失败"
    alert(`注册失败：${detail}`)
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(245, 245, 247, 0.98) 100%),
    #f5f5f7;
}

.login-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.026) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.026) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.46), transparent 72%);
}

.login-page::after {
  display: none;
}

.login-card {
  width: min(100%, 440px);
  position: relative;
  z-index: 1;
  padding: 40px 34px 34px;
  border-radius: 26px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: saturate(180%) blur(28px);
  -webkit-backdrop-filter: saturate(180%) blur(28px);
  box-shadow:
    0 34px 86px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.04);
  color: #1d1d1f;
}

.login-card__header {
  margin-bottom: 24px;
}

.login-card__eyebrow {
  margin: 0 0 8px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #0071e3;
}

.login-card h2 {
  margin: 0;
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 820;
  color: #1d1d1f;
}

.login-card__subtitle {
  margin: 10px 0 0;
  color: #6e6e73;
  line-height: 1.6;
}

.login-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 18px 0 22px;
  padding: 6px;
  border-radius: 13px;
  background: rgba(120, 120, 128, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.tab-button {
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #6e6e73;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.tab-button.is-active {
  background: #ffffff;
  color: #1d1d1f;
  box-shadow:
    0 8px 18px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.login-form {
  display: grid;
  gap: 18px;
}

.form-hint {
  margin: -6px 0 0;
  color: #6e6e73;
  font-size: 0.84rem;
}

.field {
  display: grid;
  gap: 8px;
}

.field label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1d1d1f;
}

.login-page input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  color: #1d1d1f;
  box-sizing: border-box;
  outline: none;
  transition:
    border-color 0.24s ease,
    box-shadow 0.24s ease,
    transform 0.24s ease,
    background-color 0.24s ease;
}

.login-page input::placeholder {
  color: #86868b;
}

.login-page input:focus {
  border-color: rgba(0, 113, 227, 0.7);
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.12);
  background: #ffffff;
  transform: translateY(-1px);
}

.login-button {
  margin-top: 4px;
  padding: 14px 18px;
  border: none;
  border-radius: 14px;
  background: #1d1d1f;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.18);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.login-button:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 20px 38px rgba(0, 0, 0, 0.22);
}

.login-button:active {
  transform: translateY(1px) scale(0.985);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
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
