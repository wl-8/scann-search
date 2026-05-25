<template>
  <div class="login-page">
    <h2>登录</h2>
    <form @submit.prevent="onSubmit">
      <div>
        <label>用户名</label>
        <input v-model="username" placeholder="输入用户名" />
      </div>
      <div>
        <label>密码</label>
        <input v-model="password" type="password" placeholder="输入密码" />
      </div>
      <div style="margin-top:12px">
        <button type="submit">登录（任意输入均可）</button>
      </div>
    </form>
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
  } catch (err) {
    // 简易错误提示
    alert("登录失败（这里只是本地演示）")
  }
}
</script>

<style scoped>
.login-page {
  max-width: 420px;
  margin: 40px auto;
  padding: 16px;
}
.login-page input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
button {
  padding: 8px 16px;
}
</style>
