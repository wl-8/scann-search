<template>
  <AppLayout>
    <div class="admin-page">
      <div class="page-header">
        <div>
          <div class="eyebrow">Admin</div>
          <h2>用户管理</h2>
        </div>
        <a-button type="primary" :loading="loading" @click="loadUsers">刷新</a-button>
      </div>

      <a-card :bordered="false">
        <a-table :columns="columns" :data-source="users" row-key="id" :loading="loading" :pagination="{ pageSize: 10 }">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'role'">
              <a-select
                v-model:value="record.role"
                style="width: 132px"
                :disabled="record.role === 'admin'"
                @change="(role: 'user' | 'researcher') => changeRole(record.id, role)"
              >
                <a-select-option value="user">user</a-select-option>
                <a-select-option value="researcher">researcher</a-select-option>
                <a-select-option v-if="record.role === 'admin'" value="admin">admin</a-select-option>
              </a-select>
            </template>
            <template v-else-if="column.key === 'review_status'">
              <a-tag :color="record.review_status === 'approved' ? 'green' : record.review_status === 'pending' ? 'orange' : 'red'">
                {{ record.review_status }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'account_status'">
              <a-tag :color="record.account_status === 'normal' ? 'green' : 'red'">{{ record.account_status }}</a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space wrap>
                <a-button size="small" :disabled="record.review_status === 'approved'" @click="runAction(() => approveUser(record.id))">通过</a-button>
                <a-button size="small" :disabled="record.review_status === 'rejected'" @click="runAction(() => rejectUser(record.id))">拒绝</a-button>
                <a-button v-if="record.account_status !== 'banned'" size="small" :disabled="record.role === 'admin'" @click="runAction(() => banUser(record.id))">封禁</a-button>
                <a-button v-else size="small" @click="runAction(() => unbanUser(record.id))">解封</a-button>
                <a-popconfirm title="确定删除该用户？" @confirm="runAction(() => deleteUser(record.id))">
                  <a-button danger size="small" :disabled="record.role === 'admin'">删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import {
  approveUser,
  banUser,
  deleteUser,
  listUsers,
  rejectUser,
  setUserRole,
  unbanUser,
  type UserItem,
} from "@/api/users"

const loading = ref(false)
const users = ref<UserItem[]>([])

const columns = [
  { title: "ID", dataIndex: "id", key: "id", width: 70 },
  { title: "用户名", dataIndex: "username", key: "username" },
  { title: "邮箱", dataIndex: "email", key: "email" },
  { title: "角色", dataIndex: "role", key: "role", width: 150 },
  { title: "审核", dataIndex: "review_status", key: "review_status", width: 120 },
  { title: "账号", dataIndex: "account_status", key: "account_status", width: 120 },
  { title: "失败次数", dataIndex: "login_fail_count", key: "login_fail_count", width: 100 },
  { title: "操作", key: "action", width: 280 },
]

async function loadUsers() {
  loading.value = true
  try {
    const res = await listUsers()
    users.value = res.items
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "用户列表加载失败")
  } finally {
    loading.value = false
  }
}

async function runAction(action: () => Promise<any>) {
  loading.value = true
  try {
    await action()
    await loadUsers()
    message.success("操作完成")
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "操作失败")
  } finally {
    loading.value = false
  }
}

async function changeRole(userId: number, role: "user" | "researcher") {
  await runAction(() => setUserRole(userId, role))
}

onMounted(loadUsers)
</script>

<style scoped>
.admin-page {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow {
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-header h2 {
  margin: 4px 0 0;
}
</style>
