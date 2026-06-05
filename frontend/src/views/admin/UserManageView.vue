<template>
  <AppLayout>
    <div class="admin-page">

      <!-- 页头 -->
      <div class="page-header workbench-page__header">
        <div class="page-title">
          <span class="page-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="9" cy="7" r="4" />
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85" />
            </svg>
          </span>
          <div>
            <div class="page-crumb workbench-page__eyebrow">User Management</div>
            <h2 class="workbench-page__title">用户管理</h2>
          </div>
        </div>
        <div class="workbench-page__pill">审批注册申请，管理用户角色与账号权限</div>
      </div>

      <!-- 统计条 -->
      <div class="stat-bar">
        <div class="stat-item">
          <span class="stat-value">{{ users.length }}</span>
          <span class="stat-label">总用户</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item stat-item--warn">
          <span class="stat-value">{{ pendingUsers.length }}</span>
          <span class="stat-label">待审核</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item stat-item--danger">
          <span class="stat-value">{{ bannedUserCount }}</span>
          <span class="stat-label">已封禁</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item stat-item--blue">
          <span class="stat-value">{{ lockedUserCount }}</span>
          <span class="stat-label">已锁定</span>
        </div>
        <div class="stat-spacer"></div>
        <a-button type="primary" size="small" :loading="loading || pendingLoading" @click="reload" class="reload-btn">刷新</a-button>
      </div>

      <!-- 主体：左表 + 右侧待审核面板 -->
      <div class="admin-body">

        <!-- 左：全部用户 -->
        <div class="main-panel">
          <div class="panel-toolbar">
            <span class="panel-title">{{ isFiltered ? `搜索结果 · ${filteredUsers.length} 条` : '全部用户' }}</span>
            <a-input
              v-model:value="searchInput"
              placeholder="搜索用户名或邮箱"
              allow-clear
              size="small"
              class="search-input"
              @press-enter="applySearch"
              @clear="clearSearch"
            >
              <template #suffix>
                <svg @click="applySearch" style="width:13px;height:13px;cursor:pointer;color:#8b98a8;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </template>
            </a-input>
            <a-select v-model:value="filterRole" size="small" class="filter-select-role" allow-clear placeholder="角色" @change="applySearch">
              <a-select-option value="user">user</a-select-option>
              <a-select-option value="researcher">researcher</a-select-option>
              <a-select-option value="admin">admin</a-select-option>
            </a-select>
            <a-select v-model:value="filterStatus" size="small" class="filter-select" allow-clear placeholder="状态" @change="applySearch">
              <a-select-option value="normal">normal</a-select-option>
              <a-select-option value="banned">banned</a-select-option>
              <a-select-option value="locked">locked</a-select-option>
            </a-select>
          </div>

          <a-table
            :columns="columns"
            :data-source="filteredUsers"
            row-key="id"
            :loading="loading"
            :pagination="{ pageSize: 8, size: 'small', showTotal: (t: number) => `共 ${t} 条` }"
            :scroll="{ x: 820, y: 'calc(100vh - 430px)' }"
            size="small"
            class="user-table"
          >
            <template #bodyCell="{ column, record }">

              <template v-if="column.key === 'username'">
                <div class="user-cell">
                  <span class="user-avatar" :class="avatarClass(record.role)">{{ record.username?.charAt(0)?.toUpperCase() }}</span>
                  <div class="user-info">
                    <span class="user-name">{{ record.username }}</span>
                    <span class="user-email">{{ record.email }}</span>
                  </div>
                </div>
              </template>

              <template v-if="column.key === 'role'">
                <a-select
                  v-if="record.role !== 'admin'"
                  :value="record.role"
                  :options="roleOptions"
                  size="small"
                  class="role-select"
                  @change="(val: string) => onRoleChange(record, val)"
                />
                <span v-else class="role-badge role-badge--admin">admin</span>
              </template>

              <template v-if="column.key === 'review_status'">
                <span v-if="record.role !== 'admin'" class="status-dot-badge" :class="`status-dot-badge--${record.review_status}`">
                  <i></i>{{ record.review_status }}
                </span>
                <span v-else class="na-dash">—</span>
              </template>

              <template v-if="column.key === 'account_status'">
                <span v-if="record.role !== 'admin'" class="status-dot-badge" :class="`status-dot-badge--acct-${record.account_status}`">
                  <i></i>{{ record.account_status }}
                </span>
                <span v-else class="na-dash">—</span>
              </template>

              <template v-if="column.key === 'login_fail_count'">
                <span v-if="record.role !== 'admin'" >{{ record.login_fail_count }}</span>
                <span v-else class="na-dash">—</span>
              </template>

              <template v-if="column.key === 'actions'">
                <template v-if="record.role !== 'admin'">
                  <div class="action-group">
                    <a-button v-if="record.account_status !== 'banned'" size="small" danger @click="ban(record.id)">封禁</a-button>
                    <a-button v-else size="small" @click="unban(record.id)">解封</a-button>
                    <a-popconfirm title="确定删除该用户？" @confirm="remove(record.id)" placement="left">
                      <a-button size="small" type="primary" danger>删除</a-button>
                    </a-popconfirm>
                    <a-dropdown v-if="record.review_status === 'rejected'" :trigger="['click']">
                      <a-button size="small" class="more-btn">···</a-button>
                      <template #overlay>
                        <a-menu>
                          <a-menu-item @click="approve(record.id)">
                            <span style="color:#16a34a">重新通过审核</span>
                          </a-menu-item>
                        </a-menu>
                      </template>
                    </a-dropdown>
                  </div>
                </template>
                <span v-else class="na-dash">—</span>
              </template>

            </template>
          </a-table>
        </div>

        <!-- 右：待审核队列 -->
        <div class="pending-panel">
          <div class="panel-toolbar">
            <span class="panel-title">待审核队列</span>
            <span class="pending-count" v-if="pendingUsers.length">{{ pendingUsers.length }}</span>
          </div>

          <div v-if="!pendingUsers.length" class="pending-empty">
            <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <p>暂无待审核用户</p>
          </div>

          <div v-else class="pending-list">
            <div v-for="u in pendingUsers" :key="u.id" class="pending-card">
              <div class="pending-card__info">
                <span class="user-avatar user-avatar--sm" :class="avatarClass(u.role)">{{ u.username?.charAt(0)?.toUpperCase() }}</span>
                <div>
                  <div class="pending-card__name">{{ u.username }}</div>
                  <div class="pending-card__email">{{ u.email }}</div>
                </div>
              </div>
              <div class="pending-card__actions">
                <a-button size="small" type="primary" @click="approve(u.id)">通过</a-button>
                <a-button size="small" danger @click="reject(u.id)">拒绝</a-button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { message } from "ant-design-vue"
import AppLayout from "@/components/layout/AppLayout.vue"
import {
  approveUser, banUser, deleteUser,
  listPendingUsers, listUsers, rejectUser,
  setUserRole, unbanUser, type UserResponse,
} from "@/api/users"
import { showErrMsg } from "@/utils/error"

const users = ref<UserResponse[]>([])
const pendingUsers = ref<UserResponse[]>([])
const loading = ref(false)
const pendingLoading = ref(false)
const searchInput = ref("")
const searchText = ref("")
const filterRole = ref<string | undefined>(undefined)
const filterStatus = ref<string | undefined>(undefined)

function applySearch() {
  searchText.value = searchInput.value.trim()
}
function clearSearch() {
  searchInput.value = ""
  searchText.value = ""
}

const roleOptions = [
  { label: "user", value: "user" },
  { label: "researcher", value: "researcher" },
]

const columns = [
  { title: "用户", key: "username", ellipsis: true, width: 180 },
  { title: "角色", key: "role", width: 130 },
  { title: "审核", key: "review_status", width: 110 },
  { title: "账号", key: "account_status", width: 100 },
  { title: "失败", key: "login_fail_count", width: 60 },
  { title: "操作", key: "actions", width: 110 },
]

const isFiltered = computed(() => !!searchText.value || !!filterRole.value || !!filterStatus.value)
const bannedUserCount = computed(() => users.value.filter((u: UserResponse) => u.account_status === "banned").length)
const lockedUserCount = computed(() => users.value.filter((u: UserResponse) => u.account_status === "locked").length)

const filteredUsers = computed(() => {
  return users.value.filter((u: UserResponse) => {
    const q = searchText.value.toLowerCase()
    const matchText = !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchRole = !filterRole.value || u.role === filterRole.value
    const matchStatus = !filterStatus.value || u.account_status === filterStatus.value
    return matchText && matchRole && matchStatus
  })
})

function avatarClass(role: string) {
  if (role === "admin") return "user-avatar--admin"
  if (role === "researcher") return "user-avatar--researcher"
  return "user-avatar--user"
}

async function loadAllUsers(silent = false) {
  loading.value = true
  try {
    users.value = (await listUsers()).items
  } catch (err: any) {
    if (!silent) showErrMsg(err, "加载用户失败")
    throw err
  } finally {
    loading.value = false
  }
}

async function loadPendingUsers(silent = false) {
  pendingLoading.value = true
  try {
    pendingUsers.value = (await listPendingUsers()).items
  } catch (err: any) {
    if (!silent) showErrMsg(err, "加载待审核用户失败")
    throw err
  } finally {
    pendingLoading.value = false
  }
}

async function reload() {
  await Promise.all([loadAllUsers(), loadPendingUsers()])
}

async function onRoleChange(user: UserResponse, role: string) {
  if (role === user.role) return
  try {
    await setUserRole(user.id, role)
    message.success("角色已更新")
    await loadAllUsers()
  } catch (err: any) {
    showErrMsg(err, "更新角色失败")
  }
}

async function approve(userId: number) {
  try {
    await approveUser(userId)
    message.success("已通过审核")
    await Promise.all([loadAllUsers(), loadPendingUsers()])
  } catch (err: any) {
    showErrMsg(err, "审核失败")
  }
}

async function reject(userId: number) {
  try {
    await rejectUser(userId)
    message.success("已拒绝")
    await Promise.all([loadAllUsers(), loadPendingUsers()])
  } catch (err: any) {
    showErrMsg(err, "拒绝失败")
  }
}

async function ban(userId: number) {
  try {
    await banUser(userId)
    message.success("用户已封禁")
    await loadAllUsers()
  } catch (err: any) {
    showErrMsg(err, "封禁失败")
  }
}

async function unban(userId: number) {
  try {
    await unbanUser(userId)
    message.success("用户已解封")
    await loadAllUsers()
  } catch (err: any) {
    showErrMsg(err, "解封失败")
  }
}

async function remove(userId: number) {
  try {
    await deleteUser(userId)
    message.success("用户已删除")
    await Promise.all([loadAllUsers(), loadPendingUsers()])
  } catch (err: any) {
    showErrMsg(err, "删除失败")
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadAllUsers(true), loadPendingUsers(true)])
  } catch (err: any) {
    showErrMsg(err, "加载用户失败")
  }
})
</script>

<style scoped>
.admin-page {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 18px;
  background: #ffffff;
  border: 1px solid var(--bio-line);
  gap: 12px;
}

/* 页头 */
.page-header h2 { margin: 3px 0 0; font-size: 1.3rem; font-weight: 800; color: var(--bio-navy); }

/* 统计条 */

/* 主体 */
.admin-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 12px;
}

/* 面板通用 */
.main-panel,
.pending-panel {
  display: flex;
  flex-direction: column;
  border-radius: 9px;
  border: 1px solid var(--bio-line);
  background: var(--bio-panel);
  overflow: hidden;
}

.panel-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--bio-line);
  background: #fafbfc;
}
.panel-title { font-size: 13px; font-weight: 800; color: var(--bio-navy); margin-right: 4px; }
.search-input { width: 180px; }
.filter-select { width: 90px; }
.filter-select-role { width: 120px; }

/* 表格 */
.user-table { flex: 1; min-height: 0; }
.main-panel :deep(.ant-table-wrapper) { flex: 1; min-height: 0; overflow: hidden; }
.main-panel :deep(.ant-table-body) { overflow-y: auto !important; }
.main-panel :deep(.ant-table-thead > tr > th) { background: #f8fafc; font-size: 12px; font-weight: 700; color: #64748b; padding: 8px 10px; }
.main-panel :deep(.ant-table-tbody > tr > td) { padding: 7px 10px; }
.main-panel :deep(.ant-table-tbody > tr:hover > td) { background: #f0f7ff; }

/* 用户列 */
.user-cell { display: flex; align-items: center; gap: 9px; }
.user-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.user-name { font-size: 13px; font-weight: 700; color: var(--bio-navy); }
.user-email { font-size: 11px; color: #8b98a8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }

/* 头像 */
.user-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  display: inline-grid; place-items: center;
  font-size: 12px; font-weight: 800;
  flex-shrink: 0;
}
.user-avatar--sm { width: 32px; height: 32px; font-size: 13px; }
.user-avatar--admin      { background: #fee2e2; color: #dc2626; }
.user-avatar--researcher { background: #dbeafe; color: #1d4ed8; }
.user-avatar--user       { background: #f1f5f9; color: #475569; }

/* 角色 */
.role-select { width: 110px; }
.role-badge--admin { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

/* 状态徽章 */
.status-dot-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; }
.status-dot-badge i { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.status-dot-badge--approved i    { background: #22c55e; }
.status-dot-badge--approved      { color: #166534; }
.status-dot-badge--pending i     { background: #f59e0b; }
.status-dot-badge--pending       { color: #92400e; }
.status-dot-badge--rejected i    { background: #ef4444; }
.status-dot-badge--rejected      { color: #991b1b; }
.status-dot-badge--acct-normal i { background: #22c55e; }
.status-dot-badge--acct-normal   { color: #166534; }
.status-dot-badge--acct-banned i { background: #ef4444; }
.status-dot-badge--acct-banned   { color: #991b1b; }
.status-dot-badge--acct-locked i { background: #f59e0b; }
.status-dot-badge--acct-locked   { color: #92400e; }

/* 操作列 */
.action-group { display: flex; align-items: center; gap: 4px; flex-wrap: nowrap; }
.more-btn { font-weight: 800; letter-spacing: 1px; padding: 0 8px; color: #64748b; }
.na-dash { color: #cbd5e1; font-weight: 600; }

/* 待审核面板 */
.pending-count { font-size: 11px; font-weight: 800; background: #fef3c7; color: #d97706; border: 1px solid #fde68a; border-radius: 999px; padding: 1px 8px; }
.pending-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.pending-card {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--bio-line);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: border-color 0.15s;
}
.pending-card:hover { border-color: #b6d0f5; }
.pending-card__info { display: flex; align-items: center; gap: 9px; min-width: 0; }
.pending-card__name { font-size: 13px; font-weight: 700; color: var(--bio-navy); }
.pending-card__email { font-size: 11px; color: #8b98a8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
.pending-card__actions { display: flex; gap: 5px; flex-shrink: 0; }

.pending-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #94a3b8; padding: 24px; }
.pending-empty svg { width: 36px; height: 36px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; opacity: 0.5; }
.pending-empty p { font-size: 13px; margin: 0; }
</style>
