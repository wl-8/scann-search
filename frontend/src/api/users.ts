import request from "./request"

export type UserItem = {
  id: number
  username: string
  email: string
  role: string
  review_status: string
  account_status: string
  login_fail_count: number
}

export type UserResponse = UserItem
export type UserListResponse = {
  total: number
  items: UserResponse[]
}

export function listUsers() {
  return request.get("/users") as Promise<UserListResponse>
}

export function listPendingUsers() {
  return request.get("/users", { params: { review_status: "pending" } }) as Promise<UserListResponse>
}

export function setUserRole(userId: number, role: string) {
  return request.put(`/users/${userId}/role`, null, { params: { role } }) as Promise<UserItem>
}

export function approveUser(userId: number) {
  return request.post(`/users/${userId}/approve`) as Promise<UserItem>
}

export function rejectUser(userId: number) {
  return request.post(`/users/${userId}/reject`) as Promise<UserItem>
}

export function banUser(userId: number) {
  return request.post(`/users/${userId}/ban`) as Promise<UserItem>
}

export function unbanUser(userId: number) {
  return request.post(`/users/${userId}/unban`) as Promise<UserItem>
}

export function deleteUser(userId: number) {
  return request.delete(`/users/${userId}`)
}

export default {
  listUsers,
  listPendingUsers,
  setUserRole,
  approveUser,
  rejectUser,
  banUser,
  unbanUser,
  deleteUser,
}
