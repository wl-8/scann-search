<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-card__header">
        <p class="login-card__eyebrow">Workspace Login</p>
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
    linear-gradient(#eff4f8 1px, transparent 1px),
    linear-gradient(90deg, #eff4f8 1px, transparent 1px),
    #f3f6f9;
  background-size: 44px 44px;
  color: var(--bio-text);
}

.login-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(243, 246, 249, 0.94)),
    radial-gradient(circle at 50% 20%, rgba(20, 123, 209, 0.12), transparent 34%);
}

.login-page::after {
  display: none;
}

.login-card {
  width: min(100%, 460px);
  position: relative;
  z-index: 1;
  padding: 34px;
  border: 1px solid var(--bio-line);
  border-radius: 9px;
  background: #ffffff;
  box-shadow: 0 18px 44px rgba(13, 41, 74, 0.12);
}

.login-card__header {
  margin-bottom: 24px;
}

.login-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bio-muted);
}

.login-card h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 850;
  color: var(--bio-navy);
}

.login-card__subtitle {
  margin: 10px 0 0;
  color: #52667c;
  line-height: 1.6;
}

.login-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 18px 0 22px;
  padding: 5px;
  border-radius: 9px;
  background: var(--bio-panel-muted);
  border: 1px solid var(--bio-line);
}

.tab-button {
  min-height: 38px;
  padding: 8px 12px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #52667c;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.tab-button.is-active {
  background: #ffffff;
  color: var(--bio-navy);
  box-shadow: inset 0 0 0 1px var(--bio-line);
}

.login-form {
  display: grid;
  gap: 18px;
}

.form-hint {
  margin: -6px 0 0;
  color: #52667c;
  font-size: 0.84rem;
}

.field {
  display: grid;
  gap: 8px;
}

.field label {
  font-size: 13px;
  font-weight: 800;
  color: var(--bio-navy);
}

.login-page input {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid var(--bio-line);
  border-radius: 9px;
  background: #ffffff;
  color: var(--bio-text);
  box-sizing: border-box;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.login-page input::placeholder {
  color: #8b98a8;
}

.login-page input:focus {
  border-color: var(--bio-blue);
  box-shadow: 0 0 0 3px rgba(20, 123, 209, 0.12);
}

.login-button {
  margin-top: 4px;
  min-height: 44px;
  padding: 11px 18px;
  border: none;
  border-radius: 8px;
  background: var(--bio-blue);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: none;
  transition: background 0.18s ease, transform 0.18s ease;
}

.login-button:hover {
  background: #0f65a6;
  transform: translateY(-1px);
}

.login-button:active {
  transform: translateY(0);
}

@media (max-width: 640px) {
  .login-page {
    padding: 16px;
  }

  .login-card {
    padding: 26px 20px;
  }

  .login-card h2 {
    font-size: 1.65rem;
  }

  .login-page input,
  .login-button {
    border-radius: 8px;
  }

}
</style>
