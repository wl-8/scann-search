<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-card__header">
        <p class="login-card__eyebrow">scann-search Workbench</p>
        <h2>{{ mode === 'login' ? '登录' : '注册' }}</h2>
        <p class="login-card__subtitle">{{ mode === 'login' ? '使用你的账号继续访问系统。' : '填写信息提交注册申请，审核通过后即可登录。' }}</p>
      </div>

      <div class="login-tabs">
        <button type="button" :class="['tab-button', mode === 'login' ? 'is-active' : '']" @click="mode = 'login'">登录</button>
        <button type="button" :class="['tab-button', mode === 'register' ? 'is-active' : '']" @click="mode = 'register'">注册</button>
      </div>

      <form v-if="mode === 'login'" class="login-form" @submit.prevent="onLogin">
        <div class="field">
          <label>用户名</label>
          <input v-model="username" placeholder="输入用户名" autocomplete="username" />
        </div>

        <div class="field">
          <label>密码</label>
          <div class="input-wrap">
            <input v-model="password" :type="showLoginPwd ? 'text' : 'password'" placeholder="输入密码" autocomplete="current-password" />
            <button type="button" class="eye-btn" @click="showLoginPwd = !showLoginPwd" :aria-label="showLoginPwd ? '隐藏密码' : '显示密码'">
              <svg v-if="showLoginPwd" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        <button type="submit" class="login-button" :disabled="loginLoading">
          {{ loginLoading ? '登录中…' : '登录' }}
        </button>
      </form>

      <form v-else class="login-form" @submit.prevent="onRegister">
        <div class="field">
          <label>用户名</label>
          <input v-model="registerUsername" placeholder="字母/数字/下划线，3-32 位" autocomplete="username" />
        </div>

        <div class="field">
          <label>邮箱</label>
          <input v-model="registerEmail" type="email" placeholder="name@example.com" autocomplete="email" />
        </div>

        <div class="field">
          <label>密码</label>
          <div class="input-wrap">
            <input v-model="registerPassword" :type="showRegPwd ? 'text' : 'password'" placeholder="至少 8 位，含大写字母和数字" autocomplete="new-password" />
            <button type="button" class="eye-btn" @click="showRegPwd = !showRegPwd">
              <svg v-if="showRegPwd" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        <div class="field">
          <label>确认密码</label>
          <div class="input-wrap">
            <input v-model="registerPasswordConfirm" :type="showRegPwdConfirm ? 'text' : 'password'" placeholder="再次输入密码" autocomplete="new-password" />
            <button type="button" class="eye-btn" @click="showRegPwdConfirm = !showRegPwdConfirm">
              <svg v-if="showRegPwdConfirm" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        <p class="form-hint">注册后需要管理员审核通过才能登录。</p>
        <button type="submit" class="login-button" :disabled="registerLoading">
          {{ registerLoading ? '提交中…' : '提交注册' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { message } from "ant-design-vue"
import { useAuthStore } from "@/stores/auth"
import { register } from "@/api/auth"
import { showErrMsg } from "@/utils/error"

const username = ref("")
const password = ref("")
const auth = useAuthStore()
const mode = ref<"login" | "register">("login")
const registerUsername = ref("")
const registerEmail = ref("")
const registerPassword = ref("")
const registerPasswordConfirm = ref("")
const loginLoading = ref(false)
const registerLoading = ref(false)
const showLoginPwd = ref(false)
const showRegPwd = ref(false)
const showRegPwdConfirm = ref(false)

async function onLogin() {
  loginLoading.value = true
  try {
    await auth.login(username.value, password.value)
  } catch (err: any) {
    showErrMsg(err, "登录失败，用户名或密码错误")
  } finally {
    loginLoading.value = false
  }
}

async function onRegister() {
  const uname = registerUsername.value.trim()
  const email = registerEmail.value.trim()
  const pwd = registerPassword.value
  const confirm = registerPasswordConfirm.value

  if (!uname || !email || !pwd) return message.warning("请填写完整的注册信息")
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(uname)) return message.warning("用户名需包含字母、数字、下划线，长度 3-32")
  if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return message.warning("密码至少 8 位，需包含大写字母和数字")
  if (pwd !== confirm) return message.warning("两次输入的密码不一致")

  registerLoading.value = true
  try {
    const res = await register({ username: uname, email, password: pwd }) as any
    message.success(res?.message ?? "注册成功，请等待管理员审核")
    registerUsername.value = ""
    registerEmail.value = ""
    registerPassword.value = ""
    registerPasswordConfirm.value = ""
    mode.value = "login"
  } catch (err: any) {
    showErrMsg(err, "注册失败")
  } finally {
    registerLoading.value = false
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

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrap input {
  flex: 1;
  padding-right: 40px;
}

.eye-btn {
  position: absolute;
  right: 10px;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: #8b98a8;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: color 0.18s ease;
}

.eye-btn:hover {
  color: var(--bio-blue);
}

.eye-btn svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
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
