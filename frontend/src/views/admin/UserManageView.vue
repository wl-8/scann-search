<template>
  <AppLayout>
    <div class="admin-page">
      <div class="admin-page__header">
        <div>
          <div class="admin-page__eyebrow">Admin Console</div>
          <h2>用户管理</h2>
        </div>
        <p>审批注册、调整角色、封禁账号。</p>
      </div>

      <a-tabs v-model:activeKey="activeTab" class="admin-tabs">
        <a-tab-pane key="all" tab="全部用户">
          <a-card class="admin-card" :bordered="false">
            <div class="table-toolbar">
              <span class="toolbar-title">用户列表</span>
              <a-button @click="loadAllUsers" :loading="loading">刷新</a-button>
            </div>
            <a-table
              :columns="columns"
              :data-source="users"
              row-key="id"
              :loading="loading"
              :pagination="false"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'role'">
                  <a-select
                    v-model:value="record.role"
                    :options="roleOptions"
                    size="small"
                    style="min-width: 120px"
                    @change="(val: string) => onRoleChange(record, val)"
                  />
                </template>
                <template v-if="column.key === 'review_status'">
                  <a-tag :color="reviewColor(record.review_status)">{{ record.review_status }}</a-tag>
                </template>
                <template v-if="column.key === 'account_status'">
                  <a-tag :color="accountColor(record.account_status)">{{ record.account_status }}</a-tag>
                </template>
                <template v-if="column.key === 'actions'">
                  <a-space>
                    <a-button v-if="record.review_status === 'pending'" size="small" type="primary" @click="approve(record.id)">通过</a-button>
                    <a-button v-if="record.review_status === 'pending'" size="small" @click="reject(record.id)">拒绝</a-button>
                    <a-button v-if="record.account_status !== 'banned'" size="small" danger @click="ban(record.id)">封禁</a-button>
                    <a-button v-else size="small" @click="unban(record.id)">解封</a-button>
                    <a-popconfirm title="确定删除该用户？" @confirm="remove(record.id)">
                      <a-button size="small">删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="pending" tab="待审核">
          <a-card class="admin-card" :bordered="false">
            <div class="table-toolbar">
              <span class="toolbar-title">待审核用户</span>
              <a-button @click="loadPendingUsers" :loading="pendingLoading">刷新</a-button>
            </div>
            <a-table
              :columns="pendingColumns"
              :data-source="pendingUsers"
              row-key="id"
              :loading="pendingLoading"
              :pagination="false"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'actions'">
                  <a-space>
                    <a-button size="small" type="primary" @click="approve(record.id)">通过</a-button>
                    <a-button size="small" @click="reject(record.id)">拒绝</a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-tab-pane>
      </a-tabs>
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
  listPendingUsers,
  listUsers,
  rejectUser,
  setUserRole,
  unbanUser,
  type UserResponse,
} from "@/api/users"

const users = ref<UserResponse[]>([])
const pendingUsers = ref<UserResponse[]>([])
const loading = ref(false)
const pendingLoading = ref(false)
const activeTab = ref("all")

const roleOptions = [
  { label: "user", value: "user" },
  { label: "researcher", value: "researcher" },
  { label: "admin", value: "admin" },
]

const columns = [
  { title: "ID", dataIndex: "id", key: "id", width: 70 },
  { title: "用户名", dataIndex: "username", key: "username" },
  { title: "邮箱", dataIndex: "email", key: "email" },
  { title: "角色", dataIndex: "role", key: "role", width: 140 },
  { title: "审核状态", dataIndex: "review_status", key: "review_status", width: 120 },
  { title: "账号状态", dataIndex: "account_status", key: "account_status", width: 120 },
  { title: "失败次数", dataIndex: "login_fail_count", key: "login_fail_count", width: 90 },
  { title: "操作", key: "actions", width: 220 },
]

const pendingColumns = [
  { title: "ID", dataIndex: "id", key: "id", width: 70 },
  { title: "用户名", dataIndex: "username", key: "username" },
  { title: "邮箱", dataIndex: "email", key: "email" },
  { title: "操作", key: "actions", width: 160 },
]

function reviewColor(status: string) {
  if (status === "approved") return "green"
  if (status === "rejected") return "red"
  return "orange"
}

function accountColor(status: string) {
  if (status === "normal") return "blue"
  if (status === "locked") return "orange"
  if (status === "banned") return "red"
  return "default"
}

async function loadAllUsers() {
  loading.value = true
  try {
    const res = await listUsers()
    users.value = res.items
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "加载用户失败")
  } finally {
    loading.value = false
  }
}

async function loadPendingUsers() {
  pendingLoading.value = true
  try {
    const res = await listPendingUsers()
    pendingUsers.value = res.items
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "加载待审核用户失败")
  } finally {
    pendingLoading.value = false
  }
}

async function onRoleChange(user: UserResponse, role: string) {
  if (role === user.role) return
  try {
    await setUserRole(user.id, role)
    message.success("角色已更新")
    await loadAllUsers()
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "更新角色失败")
  }
}

async function approve(userId: number) {
  try {
    await approveUser(userId)
    message.success("已通过审核")
    await Promise.all([loadAllUsers(), loadPendingUsers()])
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "审核失败")
  }
}

async function reject(userId: number) {
  try {
    await rejectUser(userId)
    message.success("已拒绝")
    await Promise.all([loadAllUsers(), loadPendingUsers()])
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "拒绝失败")
  }
}

async function ban(userId: number) {
  try {
    await banUser(userId)
    message.success("用户已封禁")
    await loadAllUsers()
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "封禁失败")
  }
}

async function unban(userId: number) {
  try {
    await unbanUser(userId)
    message.success("用户已解封")
    await loadAllUsers()
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "解封失败")
  }
}

async function remove(userId: number) {
  try {
    await deleteUser(userId)
    message.success("用户已删除")
    await Promise.all([loadAllUsers(), loadPendingUsers()])
  } catch (err: any) {
    message.error(err?.response?.data?.detail ?? err?.message ?? "删除失败")
  }
}

onMounted(() => {
  loadAllUsers()
  loadPendingUsers()
})
</script>

<style scoped>
.admin-page {
  position: relative;
  min-height: 100%;
  display: grid;
  gap: 16px;
  padding: 18px 0 8px;
}

.admin-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 2px;
}

.admin-page__eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #007bff;
}

.admin-page__header h2 {
  margin: 6px 0 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.admin-page__header p {
  margin: 0;
  max-width: 520px;
  color: #64748b;
  line-height: 1.6;
}

.admin-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}

.admin-card {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 24px 54px rgba(15, 23, 42, 0.06),
    0 8px 16px rgba(15, 23, 42, 0.04);
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.toolbar-title {
  font-weight: 800;
  color: #0f172a;
}

.admin-page {
  min-height: 100%;
  align-content: start;
  padding: 18px;
  background: #ffffff;
  border: 1px solid var(--bio-line);
}

.admin-page__header {
  min-height: 68px;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px 14px;
  border-bottom: 1px solid var(--bio-line);
}

.admin-page__eyebrow {
  color: var(--bio-muted);
  font-size: 12px;
  letter-spacing: 0.06em;
}

.admin-page__header h2 {
  color: var(--bio-navy);
  font-size: 21px;
  font-weight: 850;
}

.admin-page__header p {
  color: #52667c;
  font-size: 13px;
}

.admin-card {
  border-radius: 9px;
  border: 1px solid var(--bio-line);
  background: var(--bio-panel);
  box-shadow: none;
}

.table-toolbar {
  padding-bottom: 10px;
  border-bottom: 1px solid #edf2f6;
}

.toolbar-title {
  color: var(--bio-navy);
  font-weight: 850;
}
</style>
